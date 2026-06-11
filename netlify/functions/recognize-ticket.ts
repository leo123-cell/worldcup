import OpenAI from "openai";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const form = await req.formData();
    const file = form.get("image");
    if (!(file instanceof File)) {
      return json({ error: "缺少图片文件。" }, 400);
    }

    const provider = (getEnv("AI_PROVIDER") || "qwen").toLowerCase();
    const apiKey = getApiKey(provider);
    if (!apiKey) {
      return json({ error: `未配置 ${provider.toUpperCase()} API key，无法调用大模型识别。` }, 400);
    }

    const client = new OpenAI({
      apiKey,
      baseURL: getBaseUrl(provider),
      timeout: 120000,
      maxRetries: 0,
    });

    const imageUrl = `data:${file.type || "image/jpeg"};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
    const output = provider === "openai"
      ? await recognizeWithOpenAI(client, imageUrl)
      : await recognizeWithChatCompletions(client, imageUrl, provider);
    const parsed = parseModelJson(output);
    return json({ raw: output, parsed });
  } catch (error: any) {
    console.error(error);
    const message = error?.message || "大模型识别失败。";
    return json({ error: message }, 500);
  }
};

export const config = {
  path: "/api/recognize-ticket",
  method: ["POST"],
};

const prompt = `
You are a Chinese sports lottery football ticket OCR assistant.
Return JSON only. No Markdown.
Top-level fields: ticketNo, issueNo, purchaseTime, playType, stakeAmount, multiplier, estimatedPrize, matchHints, betItems, selectionText, rawText, confidence, warnings.
Rules:
- stakeAmount must be the ticket total amount, such as 合计30元 => 30. Do not confuse odds like 平@3.280 with stake amount.
- estimatedPrize must be 本票最高可能固定奖金 / 最高奖金, not stake amount.
- multiplier is 倍数, such as 15倍 => 15.
- betItems is an array. Each item must include: matchNo, homeTeam, awayTeam, market, selection, odds, handicap.
- market must be one of: 胜平负, 让球胜平负, 比分, 总进球, 半全场, 其他.
- For 胜平负: selection must be 胜, 平, or 负 from the home-team perspective.
- For 让球胜平负: selection must still be 胜, 平, or 负 after applying handicap to the home team. handicap is the home-team handicap number, e.g. 主队让一球 => -1, 主队受让一球 => 1.
- If the ticket line says 主队让2球 / 主队让 2 球, market must be 让球胜平负 and handicap must be -2.
- If the ticket line says 主队受让2球, market must be 让球胜平负 and handicap must be 2.
- Example: 周三201 主队让2球 葡萄牙 vs 尼日利亚 平@3.550 => market=让球胜平负, selection=平, handicap=-2, odds=3.550.
- For 比分: selection must be exact full-time score like 2:1.
- For 总进球: selection must be the total-goals number as a string or number, e.g. 3.
- For 半全场: keep the printed selection text, but do not invent half-time scores.
- selectionText should summarize match, teams, market, selection, odds and multiplier.
- rawText should transcribe important visible ticket text.
- Use empty string or null for unreadable fields. Do not invent.
`;

async function recognizeWithOpenAI(client: OpenAI, imageUrl: string) {
  const response = await client.responses.create({
    model: getModel("openai"),
    temperature: 0,
    max_output_tokens: 1000,
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: prompt },
          { type: "input_image", image_url: imageUrl },
        ],
      },
    ],
    text: {
      format: {
        type: "json_object",
      },
    },
  });
  return response.output_text || "";
}

async function recognizeWithChatCompletions(client: OpenAI, imageUrl: string, provider: string) {
  const response = await client.chat.completions.create({
    model: getModel(provider),
    response_format: { type: "json_object" },
    temperature: 0,
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
  });
  return response.choices?.[0]?.message?.content || "";
}

function getEnv(name: string) {
  return Netlify.env.get(name) || "";
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
  const clean = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try {
    return normalizeTicket(JSON.parse(clean));
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("模型没有返回有效 JSON。");
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

function normalizeBetItems(items: any[]) {
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
  const score = text.match(/(\d+)\s*[:：-]\s*(\d+)/);
  if (score) return `${Number(score[1])}:${Number(score[2])}`;
  if (/^\d+$/.test(text)) return text;
  if (text.includes("平")) return "平";
  if (text.includes("负")) return "负";
  if (text.includes("胜")) return "胜";
  return text;
}

function normalizeMarketText(value: unknown, selection = "") {
  const text = `${toStringValue(value)} ${toStringValue(selection)}`;
  const lower = text.toLowerCase();
  if (text.includes("半全场") || lower.includes("half")) return "半全场";
  if (text.includes("总进球") || lower.includes("total")) return "总进球";
  if (text.includes("比分") || lower.includes("score")) return "比分";
  if (text.includes("让球") || text.includes("让胜") || text.includes("让平") || text.includes("让负") || lower.includes("handicap") || lower.includes("let")) return "让球胜平负";
  if (text.includes("胜") || text.includes("平") || text.includes("负")) return "胜平负";
  return toStringValue(value) || "胜平负";
}

function toHandicapNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return "";
  const text = String(value).replace("＋", "+").replace("－", "-");
  const number = Number(text.match(/[+-]?\d+(?:\.\d+)?/)?.[0]);
  return Number.isFinite(number) ? number : "";
}

function toConfidence(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function extractSingleOutcomeSelection(text: string) {
  const matches = [...String(text || "").matchAll(/([胜平负])\s*@\s*(\d+(?:\.\d+)?)/g)];
  const unique = [...new Set(matches.map((match) => match[1]))];
  return unique.length === 1 ? unique[0] : "";
}

function parseHandicapBetItems(text: string) {
  const normalized = String(text || "").replace(/\r/g, "").replace(/[ \t]+/g, " ");
  const pattern = /(?:第\d+场\s*)?(周[一二三四五六日天]\s*\d{3})\s*主队\s*(让|受让|计|[+-])?\s*([+-]?\d+(?:\.\d+)?)\s*球[\s\S]*?主队[:：]\s*([^\sVv]+)\s*[Vv][Ss]\s*客队[:：]\s*([^\s胜平负]+)[\s\S]*?([胜平负])\s*@\s*(\d+(?:\.\d+)?)/g;
  return [...normalized.matchAll(pattern)].map((match) => {
    const marker = match[2] || "让";
    const rawLine = Number(match[3]);
    const absLine = Math.abs(rawLine);
    const handicap = marker.includes("受") || marker === "+" || rawLine > 0 && String(match[3]).startsWith("+")
      ? absLine
      : -absLine;
    return {
      matchNo: match[1].replace(/\s+/g, ""),
      homeTeam: match[4],
      awayTeam: match[5],
      selection: match[6],
      odds: Number(match[7]),
      handicap,
      market: "让球胜平负",
    };
  });
}

function deriveTicketFields(ticket: any) {
  const raw = ticket.rawText || "";
  const sourceText = `${raw}\n${ticket.selectionText || ""}`;
  const handicapItems = parseHandicapBetItems(sourceText);
  const selectionMatch = sourceText.match(/([胜平负])\s*@\s*(\d+(?:\.\d+)?)/);
  const explicitOutcomeSelection = extractSingleOutcomeSelection(sourceText);
  const stakeMatch =
    raw.match(/(?:合计|投注金额|票款|金额)\s*[:：]?\s*(\d+(?:\.\d{1,2})?)\s*元/) ||
    raw.match(/合\s*计\s*(\d+(?:\.\d{1,2})?)\s*元/);
  if (stakeMatch) ticket.stakeAmount = Number(stakeMatch[1]);

  const prizeMatch =
    raw.match(/(?:本票)?最高可能固定奖金\s*[:：]?\s*(\d+(?:\.\d{1,2})?)\s*元/) ||
    raw.match(/最高奖金\s*[:：]?\s*(\d+(?:\.\d{1,2})?)\s*元/);
  if (prizeMatch) ticket.estimatedPrize = Number(prizeMatch[1]);

  const multiplierMatch = raw.match(/(\d+)\s*倍/);
  if (multiplierMatch) ticket.multiplier = Number(multiplierMatch[1]);

  if (!ticket.ticketNo) {
    const ticketNoMatch = raw.match(/\b([A-Z0-9]{16,}(?:\s+[A-Z0-9]{6,})*)\b/);
    if (ticketNoMatch) ticket.ticketNo = ticketNoMatch[1].replace(/\s+/g, " ");
  }

  if (handicapItems.length) {
    ticket.playType = "让球胜平负";
    ticket.betItems = handicapItems;
    ticket.selectionText = handicapItems
      .map((item: any) => `${item.matchNo} ${item.homeTeam} vs ${item.awayTeam} 让球胜平负(${item.handicap}) ${item.selection} @${item.odds}`)
      .join("；");
  }

  if (explicitOutcomeSelection && ticket.betItems.length) {
    ticket.betItems = ticket.betItems.map((item: any) => {
      const market = normalizeMarketText(item.market, item.selection);
      if (market !== "胜平负" && market !== "让球胜平负") return item;
      return {
        ...item,
        selection: explicitOutcomeSelection,
        market,
        odds: item.odds || toNumberOrEmpty(selectionMatch?.[2]),
      };
    });
  }

  if (!ticket.selectionText && ticket.betItems.length) {
    ticket.selectionText = ticket.betItems
      .map((item: any) => `${item.matchNo || ""} ${item.homeTeam || ""} vs ${item.awayTeam || ""} ${item.market || ""} ${item.selection || ""}${item.odds ? ` @${item.odds}` : ""}`)
      .join("；");
  }

  return ticket;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
