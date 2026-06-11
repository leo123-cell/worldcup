import OpenAI from "openai";

type BetItem = {
  matchNo: string;
  homeTeam: string;
  awayTeam: string;
  selection: string;
  odds: number | "";
  handicap: number | "";
  market: string;
};

const ZH = {
  missingImage: "\u7f3a\u5c11\u56fe\u7247\u6587\u4ef6\u3002",
  imageTooLarge: "\u56fe\u7247\u592a\u5927\uff0c\u8bf7\u538b\u7f29\u5230 5MB \u5de6\u53f3\u540e\u518d\u4e0a\u4f20\u3002",
  noApiKey: "\u672a\u914d\u7f6e API key\uff0c\u65e0\u6cd5\u8c03\u7528\u5927\u6a21\u578b\u8bc6\u522b\u3002",
  fail: "\u5927\u6a21\u578b\u8bc6\u522b\u5931\u8d25",
  invalidJson: "\u6a21\u578b\u6ca1\u6709\u8fd4\u56de\u6709\u6548 JSON\u3002",
  unknown: "\u672a\u77e5\u9519\u8bef\uff0c\u8bf7\u67e5\u770b Netlify Function \u65e5\u5fd7\u3002",
  win: "\u80dc",
  draw: "\u5e73",
  lose: "\u8d1f",
  spf: "\u80dc\u5e73\u8d1f",
  handicapSpf: "\u8ba9\u7403\u80dc\u5e73\u8d1f",
  score: "\u6bd4\u5206",
  totalGoals: "\u603b\u8fdb\u7403",
  halfFull: "\u534a\u5168\u573a",
};

export default async (req: Request) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const form = await req.formData();
    const file = form.get("image");
    if (!(file instanceof File)) {
      return json({ error: ZH.missingImage }, 400);
    }
    if (file.size > 5.5 * 1024 * 1024) {
      return json({ error: ZH.imageTooLarge }, 413);
    }

    const provider = (getEnv("AI_PROVIDER") || "qwen").toLowerCase();
    const model = getModel(provider);
    const apiKey = getApiKey(provider);
    if (!apiKey) {
      return json({ error: `${provider.toUpperCase()} ${ZH.noApiKey}` }, 400);
    }

    const client = new OpenAI({
      apiKey,
      baseURL: getBaseUrl(provider),
      timeout: 120000,
      maxRetries: 0,
    });

    const imageUrl = `data:${file.type || "image/jpeg"};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
    const output = provider === "openai"
      ? await recognizeWithOpenAI(client, imageUrl, model)
      : await recognizeWithChatCompletions(client, imageUrl, model);
    const parsed = parseModelJson(output);
    return json({ raw: output, parsed });
  } catch (error: any) {
    console.error(error);
    const provider = (getEnv("AI_PROVIDER") || "qwen").toLowerCase();
    const model = getModel(provider);
    const detail = normalizeErrorMessage(error);
    return json({
      error: detail.startsWith(ZH.fail) ? detail : `${ZH.fail}: ${detail}`,
      provider,
      model,
    }, 500);
  }
};

export const config = {
  path: "/api/recognize-ticket",
  method: ["POST"],
};

const prompt = `
You are a Chinese sports lottery football ticket OCR assistant.
Return JSON only. No Markdown.

Top-level fields:
ticketNo, issueNo, purchaseTime, playType, stakeAmount, multiplier, estimatedPrize, matchHints, betItems, selectionText, rawText, confidence, warnings.

betItems is an array. Each item must include:
matchNo, homeTeam, awayTeam, market, selection, odds, handicap.

Rules:
- stakeAmount is ticket total amount, e.g. "\u5408\u8ba120\u5143" => 20.
- estimatedPrize is "\u672c\u7968\u6700\u9ad8\u53ef\u80fd\u56fa\u5b9a\u5956\u91d1" or "\u6700\u9ad8\u5956\u91d1".
- multiplier is "\u500d\u6570", e.g. "10\u500d" => 10.
- market must be one of: \u80dc\u5e73\u8d1f, \u8ba9\u7403\u80dc\u5e73\u8d1f, \u6bd4\u5206, \u603b\u8fdb\u7403, \u534a\u5168\u573a, \u5176\u4ed6.
- \u80dc\u5e73\u8d1f selection must be \u80dc, \u5e73, or \u8d1f from the home-team perspective.
- \u8ba9\u7403\u80dc\u5e73\u8d1f selection must be \u80dc, \u5e73, or \u8d1f after applying handicap to the home team.
- "\u4e3b\u961f\u8ba92\u7403" means market=\u8ba9\u7403\u80dc\u5e73\u8d1f and handicap=-2.
- "\u4e3b\u961f\u53d7\u8ba92\u7403" means market=\u8ba9\u7403\u80dc\u5e73\u8d1f and handicap=2.
- Example: "\u5468\u4e09201 \u4e3b\u961f\u8ba92\u7403 \u4e3b\u961f:\u8461\u8404\u7259 Vs \u5ba2\u961f:\u5c3c\u65e5\u5229\u4e9a \u5e73@3.550" => market=\u8ba9\u7403\u80dc\u5e73\u8d1f, selection=\u5e73, handicap=-2, odds=3.550.
- \u6bd4\u5206 selection must be exact full-time score like 2:1.
- \u603b\u8fdb\u7403 selection must be the total goals number like 3.
- If the ticket title says \u7ade\u5f69\u8db3\u7403\u603b\u8fdb\u7403\u6570 and the line says "(3)@3.400", market=\u603b\u8fdb\u7403, selection=3, odds=3.400.
- rawText should transcribe important visible ticket text.
- rawText is required. Transcribe the visible ticket text as much as possible.
- matchNo must look like "\u5468\u4e00201" / "\u5468\u4e09202". Never use the long ticket number, barcode number, issue number, or store number as matchNo.
- matchHints should be match numbers or team names only. Do not use "\u4e2d\u56fd\u4f53\u80b2\u5f69\u7968" as matchHints.
- Use empty string or null for unreadable fields. Do not invent.
`;

async function recognizeWithOpenAI(client: OpenAI, imageUrl: string, model: string) {
  const response = await client.responses.create({
    model,
    temperature: 0,
    max_output_tokens: 1400,
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: prompt },
          { type: "input_image", image_url: imageUrl },
        ],
      },
    ],
    text: { format: { type: "json_object" } },
  });
  return response.output_text || "";
}

async function recognizeWithChatCompletions(client: OpenAI, imageUrl: string, model: string) {
  const messages: any[] = [
    {
      role: "user",
      content: [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: imageUrl } },
      ],
    },
  ];

  try {
    const response = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 1400,
      messages,
    });
    return response.choices?.[0]?.message?.content || "";
  } catch (error: any) {
    const message = error?.message || "";
    if (!message.includes("response_format") && !message.includes("json_object")) throw error;
    const response = await client.chat.completions.create({
      model,
      temperature: 0,
      max_tokens: 1400,
      messages,
    });
    return response.choices?.[0]?.message?.content || "";
  }
}

function getEnv(name: string) {
  const netlifyValue = typeof Netlify !== "undefined" ? Netlify.env.get(name) : "";
  return netlifyValue || process.env[name] || "";
}

function normalizeErrorMessage(error: any) {
  const detail =
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.error?.message ||
    error?.message ||
    "";
  if (detail) return String(detail);
  try {
    return JSON.stringify(error);
  } catch {
    return ZH.unknown;
  }
}

function getApiKey(provider: string) {
  if (provider === "qwen") return getEnv("DASHSCOPE_API_KEY") || getEnv("QWEN_API_KEY");
  if (provider === "deepseek") return getEnv("DEEPSEEK_API_KEY") || getEnv("OPENAI_API_KEY");
  return getEnv("OPENAI_API_KEY");
}

function getBaseUrl(provider: string) {
  if (provider === "qwen") return getEnv("DASHSCOPE_BASE_URL") || "https://dashscope.aliyuncs.com/compatible-mode/v1";
  if (provider === "deepseek") return getEnv("DEEPSEEK_BASE_URL") || "https://api.deepseek.com";
  return getEnv("OPENAI_BASE_URL") || undefined;
}

function getModel(provider: string) {
  if (provider === "qwen") return getEnv("QWEN_MODEL") || getEnv("DASHSCOPE_MODEL") || "qwen-vl-ocr-latest";
  if (provider === "deepseek") return getEnv("DEEPSEEK_MODEL") || getEnv("OPENAI_MODEL") || "deepseek-v4-flash";
  return getEnv("OPENAI_MODEL") || "gpt-4o";
}

function parseModelJson(text: string) {
  const clean = String(text || "").trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try {
    return normalizeTicket(JSON.parse(clean));
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(ZH.invalidJson);
    return normalizeTicket(JSON.parse(match[0]));
  }
}

function normalizeTicket(ticket: any) {
  const normalized = {
    ticketNo: toStringValue(ticket.ticketNo),
    issueNo: toStringValue(ticket.issueNo),
    purchaseTime: toStringValue(ticket.purchaseTime),
    playType: toStringValue(ticket.playType),
    stakeAmount: toNumberOrEmpty(ticket.stakeAmount),
    multiplier: toNumberOrEmpty(ticket.multiplier),
    estimatedPrize: toNumberOrEmpty(ticket.estimatedPrize),
    matchHints: Array.isArray(ticket.matchHints) ? ticket.matchHints.map(String) : [],
    betItems: normalizeBetItems(ticket.betItems),
    selectionText: toStringValue(ticket.selectionText),
    rawText: toStringValue(ticket.rawText),
    confidence: toConfidence(ticket.confidence),
    warnings: Array.isArray(ticket.warnings) ? ticket.warnings.map(String) : [],
  };
  return deriveTicketFields(normalized);
}

function toStringValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function toNumberOrEmpty(value: unknown) {
  if (value === null || value === undefined || value === "") return "";
  const number = Number(String(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(number) ? number : "";
}

function normalizeBetItems(items: any[]): BetItem[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    matchNo: toStringValue(item.matchNo),
    homeTeam: toStringValue(item.homeTeam),
    awayTeam: toStringValue(item.awayTeam),
    selection: normalizeSelectionText(item.selection),
    odds: toNumberOrEmpty(item.odds),
    handicap: toHandicapNumber(item.handicap ?? item.letBall ?? item.line),
    market: normalizeMarketText(item.market || item.playType, item.selection),
  })).filter((item) => item.matchNo || item.homeTeam || item.awayTeam || item.selection);
}

function normalizeSelectionText(value: unknown) {
  const text = toStringValue(value);
  const score = text.match(/(\d+)\s*[:\uFF1A-]\s*(\d+)/);
  if (score) return `${Number(score[1])}:${Number(score[2])}`;
  if (/^\d+$/.test(text)) return text;
  if (text.includes(ZH.draw)) return ZH.draw;
  if (text.includes(ZH.lose)) return ZH.lose;
  if (text.includes(ZH.win)) return ZH.win;
  return text;
}

function normalizeMarketText(value: unknown, selection = "") {
  const text = `${toStringValue(value)} ${toStringValue(selection)}`;
  const lower = text.toLowerCase();
  if (text.includes(ZH.halfFull) || lower.includes("half")) return ZH.halfFull;
  if (text.includes(ZH.totalGoals) || lower.includes("total")) return ZH.totalGoals;
  if (text.includes(ZH.score) || lower.includes("score")) return ZH.score;
  if (text.includes("\u8ba9\u7403") || text.includes("\u8ba9\u80dc") || text.includes("\u8ba9\u5e73") || text.includes("\u8ba9\u8d1f") || lower.includes("handicap") || lower.includes("let")) return ZH.handicapSpf;
  if (text.includes(ZH.win) || text.includes(ZH.draw) || text.includes(ZH.lose)) return ZH.spf;
  return toStringValue(value) || ZH.spf;
}

function toHandicapNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return "";
  const text = String(value).replace("\uFF0B", "+").replace("\uFF0D", "-");
  const number = Number(text.match(/[+-]?\d+(?:\.\d+)?/)?.[0]);
  return Number.isFinite(number) ? number : "";
}

function toConfidence(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function extractSingleOutcomeSelection(text: string) {
  const matches = [...String(text || "").matchAll(/([\u80dc\u5e73\u8d1f])\s*@\s*(\d+(?:\.\d+)?)/g)];
  const unique = [...new Set(matches.map((match) => match[1]))];
  return unique.length === 1 ? unique[0] : "";
}

function parseHandicapBetItems(text: string): BetItem[] {
  const normalized = String(text || "").replace(/\r/g, "").replace(/[ \t]+/g, " ");
  const pattern = /(?:\u7b2c\d+\u573a\s*)?(\u5468[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u65e5\u5929]\s*\d{3})\s*\u4e3b\u961f\s*(\u8ba9|\u53d7\u8ba9|\u8ba1|[+-])?\s*([+-]?\d+(?:\.\d+)?)\s*\u7403[\s\S]*?\u4e3b\u961f[:\uFF1A]\s*([^\sVv]+)\s*[Vv][Ss]\s*\u5ba2\u961f[:\uFF1A]\s*([^\s\u80dc\u5e73\u8d1f]+)[\s\S]*?([\u80dc\u5e73\u8d1f])\s*@\s*(\d+(?:\.\d+)?)/g;
  return [...normalized.matchAll(pattern)].map((match) => {
    const marker = match[2] || "\u8ba9";
    const rawLine = Number(match[3]);
    const absLine = Math.abs(rawLine);
    const handicap = marker.includes("\u53d7") || marker === "+" || rawLine > 0 && String(match[3]).startsWith("+") ? absLine : -absLine;
    return {
      matchNo: match[1].replace(/\s+/g, ""),
      homeTeam: match[4],
      awayTeam: match[5],
      selection: match[6],
      odds: Number(match[7]),
      handicap,
      market: ZH.handicapSpf,
    };
  });
}

function deriveTicketFields(ticket: any) {
  const raw = ticket.rawText || "";
  const sourceText = `${raw}\n${ticket.selectionText || ""}`;
  const textFields = parseTicketText(sourceText);
  const handicapItems = parseHandicapBetItems(sourceText);
  const selectionMatch = sourceText.match(/([\u80dc\u5e73\u8d1f])\s*@\s*(\d+(?:\.\d+)?)/);
  const scoreMatch = raw.match(/(\d+)\s*[:\uFF1A-]\s*(\d+)\s*@\s*(\d+(?:\.\d+)?)/);
  const totalGoalsMatch = raw.match(/\u603b\u8fdb\u7403\s*(\d+)\s*@?(\d+(?:\.\d+)?)?/);
  const parenthesizedTotalGoalsMatch = raw.match(/\((\d+)\)\s*@\s*(\d+(?:\.\d+)?)/);
  const realMatchNo = (raw.match(/\u5468[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u65e5\u5929]\s*\d{3}/)?.[0] || "").replace(/\s+/g, "");
  const explicitOutcomeSelection = extractSingleOutcomeSelection(sourceText);

  const stakeMatch = raw.match(/(?:\u5408\u8ba1|\u6295\u6ce8\u91d1\u989d|\u7968\u6b3e|\u91d1\u989d)\s*[:\uFF1A]?\s*(\d+(?:\.\d{1,2})?)\s*\u5143/) || raw.match(/\u5408\s*\u8ba1\s*(\d+(?:\.\d{1,2})?)\s*\u5143/);
  if (stakeMatch) ticket.stakeAmount = Number(stakeMatch[1]);
  if (!ticket.stakeAmount && textFields.stakeAmount) ticket.stakeAmount = textFields.stakeAmount;

  const prizeMatch = raw.match(/(?:\u672c\u7968)?\u6700\u9ad8\u53ef\u80fd\u56fa\u5b9a\u5956\u91d1\s*[:\uFF1A]?\s*(\d+(?:\.\d{1,2})?)\s*\u5143/) || raw.match(/\u6700\u9ad8\u5956\u91d1\s*[:\uFF1A]?\s*(\d+(?:\.\d{1,2})?)\s*\u5143/);
  if (prizeMatch) ticket.estimatedPrize = Number(prizeMatch[1]);
  if (!ticket.estimatedPrize && textFields.estimatedPrize) ticket.estimatedPrize = textFields.estimatedPrize;

  const multiplierMatch = raw.match(/(\d+)\s*\u500d/);
  if (multiplierMatch) ticket.multiplier = Number(multiplierMatch[1]);
  if (!ticket.multiplier && textFields.multiplier) ticket.multiplier = textFields.multiplier;

  ticket.betItems = inferMissingBetValues(ticket);

  if (!ticket.ticketNo) {
    const ticketNoMatch = raw.match(/\b([A-Z0-9]{16,}(?:\s+[A-Z0-9]{6,})*)\b/);
    if (ticketNoMatch) ticket.ticketNo = ticketNoMatch[1].replace(/\s+/g, " ");
  }

  if (handicapItems.length) {
    ticket.playType = ZH.handicapSpf;
    ticket.betItems = handicapItems;
    ticket.selectionText = handicapItems.map((item) => `${item.matchNo} ${item.homeTeam} vs ${item.awayTeam} ${ZH.handicapSpf}(${item.handicap}) ${item.selection} @${item.odds}`).join("\uFF1B");
  }

  if (textFields.betItems.length) {
    ticket.betItems = textFields.betItems;
    ticket.playType = textFields.playType || ticket.playType;
  }

  if (realMatchNo && ticket.betItems.length) {
    ticket.betItems = ticket.betItems.map((item: BetItem) => ({
      ...item,
      matchNo: item.matchNo || realMatchNo,
      market: normalizeMarketText(item.market, item.selection),
    }));
  }

  if (!ticket.betItems.length) {
    const teams = raw.match(/\u4e3b\u961f[:\uFF1A]?\s*([^\sVv]+)\s*[Vv][Ss]\s*\u5ba2\u961f[:\uFF1A]?\s*([^\s\u80dc\u5e73\u8d1f]+)/);
    if (realMatchNo || teams || selectionMatch || scoreMatch || totalGoalsMatch || parenthesizedTotalGoalsMatch) {
      const selection = scoreMatch
        ? `${Number(scoreMatch[1])}:${Number(scoreMatch[2])}`
        : totalGoalsMatch?.[1] || parenthesizedTotalGoalsMatch?.[1] || selectionMatch?.[1] || "";
      ticket.betItems = [{
        matchNo: realMatchNo,
        homeTeam: teams?.[1] || "",
        awayTeam: teams?.[2] || "",
        selection,
        odds: scoreMatch ? Number(scoreMatch[3]) : parenthesizedTotalGoalsMatch ? Number(parenthesizedTotalGoalsMatch[2]) : selectionMatch ? Number(selectionMatch[2]) : toNumberOrEmpty(totalGoalsMatch?.[2]),
        handicap: "",
        market: scoreMatch ? ZH.score : totalGoalsMatch || parenthesizedTotalGoalsMatch || raw.includes("\u603b\u8fdb\u7403\u6570") ? ZH.totalGoals : ZH.spf,
      }];
    }
  }

  if (explicitOutcomeSelection && ticket.betItems.length) {
    ticket.betItems = ticket.betItems.map((item: BetItem) => {
      const market = normalizeMarketText(item.market, item.selection);
      if (market !== ZH.spf && market !== ZH.handicapSpf) return item;
      return {
        ...item,
        selection: explicitOutcomeSelection,
        market,
        odds: item.odds || toNumberOrEmpty(selectionMatch?.[2]),
      };
    });
  }

  if (!ticket.selectionText && ticket.betItems.length) {
    ticket.selectionText = ticket.betItems.map((item: BetItem) => `${item.matchNo || ""} ${item.homeTeam || ""} vs ${item.awayTeam || ""} ${item.market || ""} ${item.selection || ""}${item.odds ? ` @${item.odds}` : ""}`).join("\uFF1B");
  }
  if (ticket.selectionText.includes("\u4e2d\u56fd\u4f53\u80b2\u5f69\u7968") && ticket.betItems.length) {
    ticket.selectionText = ticket.betItems.map((item: BetItem) => `${item.matchNo || ""} ${item.homeTeam || ""} vs ${item.awayTeam || ""} ${item.market || ""} ${item.selection || ""}${item.odds ? ` @${item.odds}` : ""}`).join("\uFF1B");
  }

  return ticket;
}

function parseTicketText(text: string) {
  const raw = String(text || "").replace(/\r/g, "");
  const compact = raw.replace(/[ \t]+/g, " ");
  const titleMarket = compact.includes("\u603b\u8fdb\u7403\u6570") ? ZH.totalGoals
    : compact.includes("\u6bd4\u5206") ? ZH.score
      : compact.includes("\u8ba9\u7403") ? ZH.handicapSpf
        : compact.includes("\u80dc\u5e73\u8d1f") ? ZH.spf
          : "";
  const stakeAmount = toNumberOrEmpty((compact.match(/\u5408\s*\u8ba1\s*(\d+(?:\.\d{1,2})?)\s*\u5143/) || [])[1]);
  const multiplier = toNumberOrEmpty((compact.match(/(\d+)\s*\u500d/) || [])[1]);
  const estimatedPrize = toNumberOrEmpty((compact.match(/\u6700\u9ad8\u53ef\u80fd\u56fa\u5b9a\u5956\u91d1\s*[:\uFF1A]?\s*(\d+(?:\.\d{1,2})?)\s*\u5143/) || [])[1]);
  const betItems = parseVisibleBetItems(compact, titleMarket);
  return { playType: titleMarket, stakeAmount, multiplier, estimatedPrize, betItems };
}

function parseVisibleBetItems(text: string, titleMarket = ""): BetItem[] {
  const items: BetItem[] = [];
  const pattern = /(?:\u7b2c\d+\u573a\s*)?(\u5468[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u65e5\u5929]\s*\d{3})\s*(?:\u4e3b\u961f\s*(\u8ba9|\u53d7\u8ba9)?\s*([+-]?\d+(?:\.\d+)?)\s*\u7403)?[\s\S]*?\u4e3b\u961f[:\uFF1A]\s*([^\sVv]+)\s*[Vv][Ss]\s*\u5ba2\u961f[:\uFF1A]\s*([^\s\u80dc\u5e73\u8d1f]+?)\s+((?:\d+\s*[:\uFF1A-]\s*\d+|\(\d+\)|[\u80dc\u5e73\u8d1f])\s*@\s*\d+(?:\.\d+)?)/g;
  for (const match of text.matchAll(pattern)) {
    const pick = match[6];
    const score = pick.match(/(\d+)\s*[:\uFF1A-]\s*(\d+)\s*@\s*(\d+(?:\.\d+)?)/);
    const total = pick.match(/\((\d+)\)\s*@\s*(\d+(?:\.\d+)?)/);
    const outcome = pick.match(/([\u80dc\u5e73\u8d1f])\s*@\s*(\d+(?:\.\d+)?)/);
    const hasHandicap = Boolean(match[2] || match[3]);
    const rawLine = Number(match[3] || 0);
    const handicap = hasHandicap ? (match[2]?.includes("\u53d7") ? Math.abs(rawLine) : -Math.abs(rawLine)) : "";
    const market = score ? ZH.score : total || titleMarket === ZH.totalGoals ? ZH.totalGoals : hasHandicap ? ZH.handicapSpf : ZH.spf;
    const selection = score ? `${Number(score[1])}:${Number(score[2])}` : total ? total[1] : outcome?.[1] || "";
    const odds = Number((score?.[3] || total?.[2] || outcome?.[2] || ""));
    items.push({
      matchNo: match[1].replace(/\s+/g, ""),
      homeTeam: match[4],
      awayTeam: match[5],
      selection,
      odds: Number.isFinite(odds) ? odds : "",
      handicap,
      market,
    });
  }
  return items;
}

function inferMissingBetValues(ticket: any) {
  if (!Array.isArray(ticket.betItems)) return [];
  const items = ticket.betItems.map((item: BetItem) => {
    const matchNo = /^\u5468[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u65e5\u5929]\d{3}$/.test(String(item.matchNo || ""))
      ? item.matchNo
      : "";
    return { ...item, matchNo };
  });
  if (items.length !== 1) return items;
  const item = items[0];
  if (Number(item.odds) > 0) return items;
  const stakeAmount = Number(ticket.stakeAmount || 0);
  const estimatedPrize = Number(ticket.estimatedPrize || 0);
  if (stakeAmount > 0 && estimatedPrize > 0) {
    const odds = estimatedPrize / stakeAmount;
    if (Number.isFinite(odds) && odds > 1) {
      return [{ ...item, odds: Number(odds.toFixed(3)) }];
    }
  }
  return items;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
