import "dotenv/config";
import express from "express";
import multer from "multer";
import OpenAI from "openai";
import { createServer as createViteServer } from "vite";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.argv.includes("--prod") || process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || 5174);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
const stateFile = path.join(__dirname, "data", "shared-state.json");

const app = express();
app.use(express.json({ limit: "20mb" }));

function mergeState(current, incoming) {
  return {
    ...current,
    ...incoming,
    participants: mergeById(current.participants, incoming.participants),
    matches: mergeById(current.matches, incoming.matches),
    tickets: mergeById(current.tickets, incoming.tickets),
    locked: typeof incoming.locked === "boolean" ? incoming.locked : Boolean(current.locked),
    lockedAt: incoming.lockedAt || current.lockedAt,
  };
}

function mergeById(currentItems, incomingItems) {
  const currentList = Array.isArray(currentItems) ? currentItems : [];
  const incomingList = Array.isArray(incomingItems) ? incomingItems : [];
  const currentMap = new Map(currentList.filter((item) => item?.id).map((item) => [item.id, item]));
  const incomingMap = new Map(incomingList.filter((item) => item?.id).map((item) => [item.id, item]));
  const ids = [
    ...incomingList.filter((item) => item?.id).map((item) => item.id),
    ...currentList.filter((item) => item?.id && !incomingMap.has(item.id)).map((item) => item.id),
  ];
  return ids.map((id) => {
    const current = currentMap.get(id);
    const incoming = incomingMap.get(id);
    if (!current) return incoming;
    if (!incoming) return current;
    const selected = itemTime(incoming) >= itemTime(current) ? incoming : current;
    if (current?.imageUrl && !selected?.imageUrl) return { ...selected, imageUrl: current.imageUrl };
    return selected;
  });
}

function itemTime(item) {
  const value = Date.parse(item?.updatedAt || item?.createdAt || "");
  return Number.isFinite(value) ? value : 0;
}

function stripImages(data) {
  if (!data || typeof data !== "object") return data || null;
  return {
    ...data,
    tickets: Array.isArray(data.tickets)
      ? data.tickets.map((ticket) => ticket?.imageUrl ? { ...ticket, imageUrl: "" } : ticket)
      : [],
  };
}

app.get("/api/state", async (req, res) => {
  try {
    if (!existsSync(stateFile)) {
      return res.json({ data: null });
    }
    const data = JSON.parse(await readFile(stateFile, "utf8"));
    res.json({ data: req.query.omitImages === "1" ? stripImages(data) : data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "读取共享数据失败。" });
  }
});

app.post("/api/state", async (req, res) => {
  try {
    await mkdir(path.dirname(stateFile), { recursive: true });
    let current = null;
    if (existsSync(stateFile)) {
      current = JSON.parse(await readFile(stateFile, "utf8"));
    }
    if (req.query.delete === "ticket") {
      const ticketId = req.body?.ticketId;
      if (!ticketId) {
        return res.status(400).json({ error: "缺少票据 ID。" });
      }
      const existing = current || { participants: [], matches: [], tickets: [], locked: false };
      if (existing.locked) {
        return res.status(409).json({ error: "榜单已锁定，不能删除票据。" });
      }
      const tickets = Array.isArray(existing.tickets) ? existing.tickets : [];
      const next = {
        ...existing,
        tickets: tickets.filter((ticket) => ticket.id !== ticketId),
      };
      if (current) {
        const backupFile = path.join(path.dirname(stateFile), `shared-state-backup-${Date.now()}.json`);
        await writeFile(backupFile, JSON.stringify(current, null, 2), "utf8");
      }
      await writeFile(stateFile, JSON.stringify(next, null, 2), "utf8");
      return res.json({ ok: true, savedAt: new Date().toISOString(), ticketCount: next.tickets.length });
    }
    if (req.query.append === "ticket") {
      const ticket = req.body?.ticket;
      if (!ticket?.id) {
        return res.status(400).json({ error: "缺少票据数据。" });
      }
      const existing = current || { participants: req.body?.participants || [], matches: [], tickets: [], locked: false };
      if (existing.locked) {
        return res.status(409).json({ error: "榜单已锁定，不能新增票据。" });
      }
      const matchMap = new Map((existing.matches || []).map((match) => [match.id, match]));
      for (const match of Array.isArray(req.body?.matches) ? req.body.matches : []) {
        if (match?.id && !matchMap.has(match.id)) matchMap.set(match.id, match);
      }
      const tickets = Array.isArray(existing.tickets) ? existing.tickets : [];
      const next = {
        ...existing,
        participants: Array.isArray(existing.participants) && existing.participants.length ? existing.participants : (req.body?.participants || []),
        matches: Array.from(matchMap.values()),
        tickets: tickets.some((item) => item.id === ticket.id) ? tickets : [ticket, ...tickets],
      };
      if (current) {
        const backupFile = path.join(path.dirname(stateFile), `shared-state-backup-${Date.now()}.json`);
        await writeFile(backupFile, JSON.stringify(current, null, 2), "utf8");
      }
      await writeFile(stateFile, JSON.stringify(next, null, 2), "utf8");
      return res.json({ ok: true, savedAt: new Date().toISOString(), ticketCount: next.tickets.length });
    }
    const currentTickets = Array.isArray(current?.tickets) ? current.tickets.length : 0;
    const nextTickets = Array.isArray(req.body?.tickets) ? req.body.tickets.length : 0;
    const allowTicketShrink = req.query.allowTicketShrink === "1";
    if (currentTickets > 0 && nextTickets < currentTickets && !allowTicketShrink) {
      return res.status(409).json({
        error: `已拦截票据数据减少覆盖。当前线上 ${currentTickets} 张，本次保存 ${nextTickets} 张。请先同步共享数据再操作。`,
        currentTickets,
        nextTickets,
      });
    }
    const nextState = current && !allowTicketShrink ? mergeState(current, req.body) : req.body;
    if (current) {
      const backupFile = path.join(path.dirname(stateFile), `shared-state-backup-${Date.now()}.json`);
      await writeFile(backupFile, JSON.stringify(current, null, 2), "utf8");
    }
    await writeFile(stateFile, JSON.stringify(nextState, null, 2), "utf8");
    res.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "保存共享数据失败。" });
  }
});

app.post("/api/recognize-ticket", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "缺少图片文件。" });
    }
    const provider = (process.env.AI_PROVIDER || "qwen").toLowerCase();
    const apiKey = getApiKey(provider);
    if (!apiKey) {
      return res.status(400).json({ error: `未配置 ${provider.toUpperCase()} API key，无法调用大模型识别。` });
    }

    const client = new OpenAI({
      apiKey,
      baseURL: getBaseUrl(provider),
      timeout: 120000,
      maxRetries: 0,
    });
    const imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
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
- If the ticket title says 竞彩足球总进球数 and the line says "(3)@3.400", market=总进球, selection=3, odds=3.400.
- For 半全场: keep the printed selection text, but do not invent half-time scores.
- selectionText should summarize match, teams, market, selection, odds and multiplier.
- rawText is required. Transcribe the visible ticket text as much as possible.
- matchNo must look like "周一201" / "周三202". Never use the long ticket number, barcode number, issue number, or store number as matchNo.
- matchHints should be match numbers or team names only. Do not use "中国体育彩票" as matchHints.
- Use empty string or null for unreadable fields. Do not invent.
`;

    const output =
      provider === "openai"
        ? await recognizeWithOpenAI(client, imageUrl, prompt)
        : await recognizeWithChatCompletions(client, imageUrl, prompt, provider);
    const parsed = parseModelJson(output);
    res.json({ raw: output, parsed });
  } catch (error) {
    console.error(error);
    const message = error.message || "大模型识别失败。";
    if (message.includes("unknown variant") && message.includes("image_url")) {
      return res.status(422).json({
        error:
          "当前 DeepSeek API 端点没有接受图片输入。请换成支持视觉输入的 DeepSeek 兼容端点/模型，或把 AI_PROVIDER 改为 openai/qwen。",
      });
    }
    const provider = (process.env.AI_PROVIDER || "qwen").toLowerCase();
    res.status(500).json({ error: message, provider, model: getModel(provider) });
  }
});

if (isProd) {
  const distPath = path.join(__dirname, "dist");
  if (!existsSync(distPath)) {
    console.warn("dist 目录不存在，请先运行 npm run build。");
  }
  app.use(express.static(distPath));
  app.use(async (_req, res) => {
    res.type("html").send(await readFile(path.join(distPath, "index.html"), "utf8"));
  });
} else {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

app.listen(port, "0.0.0.0", () => {
  console.log(`World Cup tracker running at http://localhost:${port}`);
});

async function recognizeWithOpenAI(client, imageUrl, prompt) {
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

async function recognizeWithChatCompletions(client, imageUrl, prompt, provider) {
  const messages = [
    {
      role: "user",
      content: [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: imageUrl } },
      ],
    },
  ];
  let response;
  try {
    response = await client.chat.completions.create({
      model: getModel(provider),
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 1400,
      messages,
    });
  } catch (error) {
    const message = error.message || "";
    if (!message.includes("response_format") && !message.includes("json_object")) throw error;
    response = await client.chat.completions.create({
      model: getModel(provider),
      temperature: 0,
      max_tokens: 1400,
      messages,
    });
  }
  return response.choices?.[0]?.message?.content || "";
}

function getApiKey(provider) {
  if (provider === "qwen") return process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY;
  if (provider === "deepseek") return process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
  return process.env.OPENAI_API_KEY;
}

function getBaseUrl(provider) {
  if (provider === "qwen") return process.env.DASHSCOPE_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1";
  if (provider === "deepseek") return process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
  return process.env.OPENAI_BASE_URL || undefined;
}

function getModel(provider) {
  if (provider === "qwen") return process.env.QWEN_MODEL || process.env.DASHSCOPE_MODEL || "qwen-vl-ocr-latest";
  if (provider === "deepseek") return process.env.DEEPSEEK_MODEL || process.env.OPENAI_MODEL || "deepseek-v4-flash";
  return process.env.OPENAI_MODEL || "gpt-4o";
}

function parseModelJson(text) {
  const clean = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try {
    return normalizeTicket(JSON.parse(clean));
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("模型没有返回有效 JSON。");
    return normalizeTicket(JSON.parse(match[0]));
  }
}

function normalizeTicket(ticket) {
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

function toStringValue(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function toNumberOrEmpty(value) {
  if (value === null || value === undefined || value === "") return "";
  const number = Number(String(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(number) ? number : "";
}

function normalizeBetItems(items) {
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

function normalizeSelectionText(value) {
  const text = toStringValue(value);
  const score = text.match(/(\d+)\s*[:：-]\s*(\d+)/);
  if (score) return `${Number(score[1])}:${Number(score[2])}`;
  if (/^\d+$/.test(text)) return text;
  if (text.includes("平")) return "平";
  if (text.includes("负")) return "负";
  if (text.includes("胜")) return "胜";
  return text;
}

function normalizeMarketText(value, selection = "") {
  const text = `${toStringValue(value)} ${toStringValue(selection)}`;
  const lower = text.toLowerCase();
  if (text.includes("半全场") || lower.includes("half")) return "半全场";
  if (text.includes("总进球") || lower.includes("total")) return "总进球";
  if (text.includes("比分") || lower.includes("score")) return "比分";
  if (text.includes("让球") || text.includes("让胜") || text.includes("让平") || text.includes("让负") || lower.includes("handicap") || lower.includes("let")) return "让球胜平负";
  if (text.includes("胜") || text.includes("平") || text.includes("负")) return "胜平负";
  return toStringValue(value) || "胜平负";
}

function toHandicapNumber(value) {
  if (value === null || value === undefined || value === "") return "";
  const text = String(value).replace("＋", "+").replace("－", "-");
  const number = Number(text.match(/[+-]?\d+(?:\.\d+)?/)?.[0]);
  return Number.isFinite(number) ? number : "";
}

function toConfidence(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function extractSingleOutcomeSelection(text) {
  const matches = [...String(text || "").matchAll(/([胜平负])\s*@\s*(\d+(?:\.\d+)?)/g)];
  const unique = [...new Set(matches.map((match) => match[1]))];
  return unique.length === 1 ? unique[0] : "";
}

function parseHandicapBetItems(text) {
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

function deriveTicketFields(ticket) {
  const raw = ticket.rawText || "";
  const sourceText = `${raw}\n${ticket.selectionText || ""}`;
  const textFields = parseTicketText(sourceText);
  const handicapItems = parseHandicapBetItems(sourceText);
  const stakeMatch =
    raw.match(/(?:合计|投注金额|票款|金额)\s*[:：]?\s*(\d+(?:\.\d{1,2})?)\s*元/) ||
    raw.match(/合\s*计\s*(\d+(?:\.\d{1,2})?)\s*元/);
  if (stakeMatch) ticket.stakeAmount = Number(stakeMatch[1]);
  if (!ticket.stakeAmount && textFields.stakeAmount) ticket.stakeAmount = textFields.stakeAmount;

  const prizeMatch =
    raw.match(/(?:本票)?最高可能固定奖金\s*[:：]?\s*(\d+(?:\.\d{1,2})?)\s*元/) ||
    raw.match(/最高奖金\s*[:：]?\s*(\d+(?:\.\d{1,2})?)\s*元/);
  if (prizeMatch) ticket.estimatedPrize = Number(prizeMatch[1]);
  if (!ticket.estimatedPrize && textFields.estimatedPrize) ticket.estimatedPrize = textFields.estimatedPrize;

  const multiplierMatch = raw.match(/(\d+)\s*倍/);
  if (multiplierMatch) ticket.multiplier = Number(multiplierMatch[1]);
  if (!ticket.multiplier && textFields.multiplier) ticket.multiplier = textFields.multiplier;

  ticket.betItems = inferMissingBetValues(ticket);

  if (!ticket.ticketNo) {
    const ticketNoMatch = raw.match(/\b([A-Z0-9]{16,}(?:\s+[A-Z0-9]{6,})*)\b/);
    if (ticketNoMatch) ticket.ticketNo = ticketNoMatch[1].replace(/\s+/g, " ");
  }

  const selectionMatch = sourceText.match(/([胜平负])\s*@\s*(\d+(?:\.\d+)?)/);
  const scoreMatch = raw.match(/(\d+)\s*[:：-]\s*(\d+)\s*@(\d+(?:\.\d+)?)/);
  const totalGoalsMatch = raw.match(/总进球\s*(\d+)\s*@?(\d+(?:\.\d+)?)?/);
  const parenthesizedTotalGoalsMatch = raw.match(/\((\d+)\)\s*@\s*(\d+(?:\.\d+)?)/);
  const realMatchNo = (raw.match(/周[一二三四五六日天]\s*\d{3}/)?.[0] || "").replace(/\s+/g, "");
  const explicitOutcomeSelection = extractSingleOutcomeSelection(sourceText);

  if (handicapItems.length) {
    ticket.playType = "让球胜平负";
    ticket.betItems = handicapItems;
    ticket.selectionText = handicapItems
      .map((item) => `${item.matchNo} ${item.homeTeam} vs ${item.awayTeam} 让球胜平负(${item.handicap}) ${item.selection} @${item.odds}`)
      .join("；");
  }

  if (textFields.betItems.length) {
    ticket.betItems = textFields.betItems;
    ticket.playType = textFields.playType || ticket.playType;
  }

  if (realMatchNo && ticket.betItems.length) {
    ticket.betItems = ticket.betItems.map((item) => ({
      ...item,
      matchNo: item.matchNo || realMatchNo,
      market: normalizeMarketText(item.market, item.selection),
    }));
  }

  if (!ticket.betItems.length) {
    const teams = raw.match(/主队[:：]?\s*([^Vv\s]+)\s*[Vv][Ss]\s*客队[:：]?\s*([^\s胜平负]+)/);
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
        market: scoreMatch ? "比分" : totalGoalsMatch || parenthesizedTotalGoalsMatch || raw.includes("总进球数") ? "总进球" : "胜平负",
      }];
    }
  }

  if (explicitOutcomeSelection && ticket.betItems.length) {
    ticket.betItems = ticket.betItems.map((item) => {
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
      .map((item) => `${item.matchNo || ""} ${item.homeTeam || ""} vs ${item.awayTeam || ""} ${item.market || ""} ${item.selection || ""}${item.odds ? ` @${item.odds}` : ""}`)
      .join("；");
  }
  if (ticket.selectionText.includes("中国体育彩票") && ticket.betItems.length) {
    ticket.selectionText = ticket.betItems
      .map((item) => `${item.matchNo || ""} ${item.homeTeam || ""} vs ${item.awayTeam || ""} ${item.market || ""} ${item.selection || ""}${item.odds ? ` @${item.odds}` : ""}`)
      .join("；");
  }

  return ticket;
}

function parseTicketText(text) {
  const raw = String(text || "").replace(/\r/g, "");
  const compact = raw.replace(/[ \t]+/g, " ");
  const titleMarket = compact.includes("总进球数") ? "总进球"
    : compact.includes("比分") ? "比分"
      : compact.includes("让球") ? "让球胜平负"
        : compact.includes("胜平负") ? "胜平负"
          : "";
  const stakeAmount = toNumberOrEmpty((compact.match(/合\s*计\s*(\d+(?:\.\d{1,2})?)\s*元/) || [])[1]);
  const multiplier = toNumberOrEmpty((compact.match(/(\d+)\s*倍/) || [])[1]);
  const estimatedPrize = toNumberOrEmpty((compact.match(/最高可能固定奖金\s*[:：]?\s*(\d+(?:\.\d{1,2})?)\s*元/) || [])[1]);
  const betItems = parseVisibleBetItems(compact, titleMarket);
  return { playType: titleMarket, stakeAmount, multiplier, estimatedPrize, betItems };
}

function parseVisibleBetItems(text, titleMarket = "") {
  const items = [];
  const pattern = /(?:第\d+场\s*)?(周[一二三四五六日天]\s*\d{3})\s*(?:主队\s*(让|受让)?\s*([+-]?\d+(?:\.\d+)?)\s*球)?[\s\S]*?主队[:：]\s*([^\sVv]+)\s*[Vv][Ss]\s*客队[:：]\s*([^\s胜平负]+?)\s+((?:\d+\s*[:：-]\s*\d+|\(\d+\)|[胜平负])\s*@\s*\d+(?:\.\d+)?)/g;
  for (const match of text.matchAll(pattern)) {
    const pick = match[6];
    const score = pick.match(/(\d+)\s*[:：-]\s*(\d+)\s*@\s*(\d+(?:\.\d+)?)/);
    const total = pick.match(/\((\d+)\)\s*@\s*(\d+(?:\.\d+)?)/);
    const outcome = pick.match(/([胜平负])\s*@\s*(\d+(?:\.\d+)?)/);
    const hasHandicap = Boolean(match[2] || match[3]);
    const rawLine = Number(match[3] || 0);
    const handicap = hasHandicap ? (match[2]?.includes("受") ? Math.abs(rawLine) : -Math.abs(rawLine)) : "";
    const market = score ? "比分" : total || titleMarket === "总进球" ? "总进球" : hasHandicap ? "让球胜平负" : "胜平负";
    const selection = score ? `${Number(score[1])}:${Number(score[2])}` : total ? total[1] : outcome?.[1] || "";
    const odds = Number(score?.[3] || total?.[2] || outcome?.[2] || "");
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

function inferMissingBetValues(ticket) {
  if (!Array.isArray(ticket.betItems)) return [];
  const items = ticket.betItems.map((item) => {
    const matchNo = /^周[一二三四五六日天]\d{3}$/.test(String(item.matchNo || ""))
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
