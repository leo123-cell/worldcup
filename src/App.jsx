import React, { useMemo, useState } from "react";
import {
  Award,
  BarChart3,
  CalendarClock,
  Check,
  CircleDollarSign,
  Clock3,
  FileImage,
  ListChecks,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
  Upload,
  Users,
} from "lucide-react";

const STORAGE_KEY = "worldcup-betting-tracker-v1";
const SCORE_DRAFT_KEY = "worldcup-score-drafts-v1";
const BASE_AMOUNT = 100;
const CLOSE_MINUTES = 5;

const statusLabels = {
  draft: "待确认",
  pending_match: "待定",
  pending_settle: "待比分",
  won: "红单",
  lost: "黑单",
  void: "作废",
};

const statusClass = {
  draft: "badge neutral",
  pending_match: "badge blue",
  pending_settle: "badge amber",
  won: "badge green",
  lost: "badge red",
  void: "badge gray",
};

const defaultParticipants = [
  "新田",
  "老嘟",
  "小双",
  "大双",
  "白爷",
  "dick",
  "国森",
].map((name, index) => ({
  id: `p${index + 1}`,
  name,
  avatar: "",
  createdAt: new Date().toISOString(),
}));

const starterData = {
  participants: defaultParticipants,
  matches: [
    ...worldCup2026GroupMatches(),
  ],
  tickets: [],
  locked: false,
};

function nextIso(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(22, 0, 0, 0);
  return formatDateTimeInput(date);
}

function formatDateTimeInput(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function worldCup2026GroupMatches() {
  const rows = [
    [1, "A", "Mexico", "South Africa", "2026-06-11", "15:00"],
    [2, "A", "South Korea", "Czechia", "2026-06-11", "22:00"],
    [3, "B", "Canada", "Bosnia and Herzegovina", "2026-06-12", "15:00"],
    [4, "D", "United States", "Paraguay", "2026-06-12", "21:00"],
    [5, "C", "Haiti", "Scotland", "2026-06-13", "21:00"],
    [6, "D", "Australia", "Türkiye", "2026-06-13", "00:00"],
    [7, "C", "Brazil", "Morocco", "2026-06-13", "18:00"],
    [8, "B", "Qatar", "Switzerland", "2026-06-13", "15:00"],
    [9, "E", "Ivory Coast", "Ecuador", "2026-06-14", "19:00"],
    [10, "E", "Germany", "Curaçao", "2026-06-14", "13:00"],
    [11, "F", "Netherlands", "Japan", "2026-06-14", "16:00"],
    [12, "F", "Sweden", "Tunisia", "2026-06-14", "22:00"],
    [13, "H", "Saudi Arabia", "Uruguay", "2026-06-15", "18:00"],
    [14, "H", "Spain", "Cape Verde", "2026-06-15", "12:00"],
    [15, "G", "Iran", "New Zealand", "2026-06-15", "21:00"],
    [16, "G", "Belgium", "Egypt", "2026-06-15", "15:00"],
    [17, "I", "France", "Senegal", "2026-06-16", "15:00"],
    [18, "I", "Iraq", "Norway", "2026-06-16", "18:00"],
    [19, "J", "Argentina", "Algeria", "2026-06-16", "21:00"],
    [20, "J", "Austria", "Jordan", "2026-06-16", "00:00"],
    [21, "L", "Ghana", "Panama", "2026-06-17", "19:00"],
    [22, "L", "England", "Croatia", "2026-06-17", "16:00"],
    [23, "K", "Portugal", "Congo DR", "2026-06-17", "13:00"],
    [24, "K", "Uzbekistan", "Colombia", "2026-06-17", "22:00"],
    [25, "A", "Czechia", "South Africa", "2026-06-18", "12:00"],
    [26, "B", "Switzerland", "Bosnia and Herzegovina", "2026-06-18", "15:00"],
    [27, "B", "Canada", "Qatar", "2026-06-18", "18:00"],
    [28, "A", "Mexico", "South Korea", "2026-06-18", "21:00"],
    [29, "C", "Brazil", "Haiti", "2026-06-19", "21:00"],
    [30, "C", "Scotland", "Morocco", "2026-06-19", "18:00"],
    [31, "D", "Türkiye", "Paraguay", "2026-06-19", "23:00"],
    [32, "D", "United States", "Australia", "2026-06-19", "15:00"],
    [33, "E", "Germany", "Ivory Coast", "2026-06-20", "16:00"],
    [34, "E", "Ecuador", "Curaçao", "2026-06-20", "20:00"],
    [35, "F", "Netherlands", "Sweden", "2026-06-20", "13:00"],
    [36, "F", "Tunisia", "Japan", "2026-06-20", "00:00"],
    [37, "H", "Uruguay", "Cape Verde", "2026-06-21", "18:00"],
    [38, "H", "Spain", "Saudi Arabia", "2026-06-21", "12:00"],
    [39, "G", "Belgium", "Iran", "2026-06-21", "15:00"],
    [40, "G", "New Zealand", "Egypt", "2026-06-21", "21:00"],
    [41, "I", "Norway", "Senegal", "2026-06-22", "20:00"],
    [42, "I", "France", "Iraq", "2026-06-22", "17:00"],
    [43, "J", "Argentina", "Austria", "2026-06-22", "13:00"],
    [44, "J", "Jordan", "Algeria", "2026-06-22", "23:00"],
    [45, "L", "England", "Ghana", "2026-06-23", "16:00"],
    [46, "L", "Panama", "Croatia", "2026-06-23", "19:00"],
    [47, "K", "Portugal", "Uzbekistan", "2026-06-23", "13:00"],
    [48, "K", "Colombia", "Congo DR", "2026-06-23", "22:00"],
    [49, "C", "Scotland", "Brazil", "2026-06-24", "18:00"],
    [50, "C", "Morocco", "Haiti", "2026-06-24", "18:00"],
    [51, "B", "Switzerland", "Canada", "2026-06-24", "15:00"],
    [52, "B", "Bosnia and Herzegovina", "Qatar", "2026-06-24", "15:00"],
    [53, "A", "Czechia", "Mexico", "2026-06-24", "21:00"],
    [54, "A", "South Africa", "South Korea", "2026-06-24", "21:00"],
    [55, "E", "Curaçao", "Ivory Coast", "2026-06-25", "16:00"],
    [56, "E", "Ecuador", "Germany", "2026-06-25", "16:00"],
    [57, "F", "Japan", "Sweden", "2026-06-25", "19:00"],
    [58, "F", "Tunisia", "Netherlands", "2026-06-25", "19:00"],
    [59, "D", "Türkiye", "United States", "2026-06-25", "22:00"],
    [60, "D", "Paraguay", "Australia", "2026-06-25", "22:00"],
    [61, "I", "Norway", "France", "2026-06-26", "15:00"],
    [62, "I", "Senegal", "Iraq", "2026-06-26", "15:00"],
    [63, "G", "Egypt", "Iran", "2026-06-26", "23:00"],
    [64, "G", "New Zealand", "Belgium", "2026-06-26", "23:00"],
    [65, "H", "Cape Verde", "Saudi Arabia", "2026-06-26", "20:00"],
    [66, "H", "Uruguay", "Spain", "2026-06-26", "20:00"],
    [67, "L", "Panama", "England", "2026-06-27", "17:00"],
    [68, "L", "Croatia", "Ghana", "2026-06-27", "17:00"],
    [69, "J", "Algeria", "Austria", "2026-06-27", "22:00"],
    [70, "J", "Jordan", "Argentina", "2026-06-27", "22:00"],
    [71, "K", "Colombia", "Portugal", "2026-06-27", "19:30"],
    [72, "K", "Congo DR", "Uzbekistan", "2026-06-27", "19:30"],
  ];

  return rows.map(([number, group, homeTeam, awayTeam, easternDate, easternTime], index) => ({
    id: `wc26_m${String(number).padStart(3, "0")}`,
    matchUid: `WC26-G${group}-M${String(number).padStart(3, "0")}`,
    matchNo: `M${String(number).padStart(3, "0")}`,
    stage: "group",
    group,
    homeTeam: zhTeam(homeTeam),
    awayTeam: zhTeam(awayTeam),
    kickoffTime: easternToBeijing(easternDate, easternTime),
    status: "scheduled",
    homeScore: "",
    awayScore: "",
    source: "FIFA schedule",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sortOrder: index + 1,
  }));
}

function zhTeam(name) {
  const names = {
    Mexico: "墨西哥",
    "South Africa": "南非",
    "South Korea": "韩国",
    Czechia: "捷克",
    Ukraine: "乌克兰",
    Canada: "加拿大",
    "Bosnia and Herzegovina": "波黑",
    Qatar: "卡塔尔",
    Switzerland: "瑞士",
    TBD: "待定",
    Haiti: "海地",
    Scotland: "苏格兰",
    Brazil: "巴西",
    Morocco: "摩洛哥",
    Spain: "西班牙",
    "Cape Verde": "佛得角",
    "Saudi Arabia": "沙特阿拉伯",
    Uruguay: "乌拉圭",
    "United States": "美国",
    Paraguay: "巴拉圭",
    Australia: "澳大利亚",
    "Türkiye": "土耳其",
    Germany: "德国",
    "Curaçao": "库拉索",
    "Ivory Coast": "科特迪瓦",
    Ecuador: "厄瓜多尔",
    Netherlands: "荷兰",
    Japan: "日本",
    Sweden: "瑞典",
    Tunisia: "突尼斯",
    Belgium: "比利时",
    Egypt: "埃及",
    Iran: "伊朗",
    "New Zealand": "新西兰",
    Panama: "巴拿马",
    Austria: "奥地利",
    France: "法国",
    Senegal: "塞内加尔",
    Iraq: "伊拉克",
    Norway: "挪威",
    Argentina: "阿根廷",
    Algeria: "阿尔及利亚",
    Jordan: "约旦",
    Portugal: "葡萄牙",
    "Congo DR": "刚果民主共和国",
    Uzbekistan: "乌兹别克斯坦",
    Colombia: "哥伦比亚",
    England: "英格兰",
    Croatia: "克罗地亚",
    Ghana: "加纳",
  };
  return names[name] || name;
}

function easternToBeijing(dateText, timeText) {
  const [year, month, day] = dateText.split("-").map(Number);
  const [hour, minute] = timeText.split(":").map(Number);
  const utc = Date.UTC(year, month - 1, day, hour + 4, minute);
  const beijing = new Date(utc + 8 * 60 * 60 * 1000);
  return `${beijing.getUTCFullYear()}-${String(beijing.getUTCMonth() + 1).padStart(2, "0")}-${String(beijing.getUTCDate()).padStart(2, "0")}T${String(beijing.getUTCHours()).padStart(2, "0")}:${String(beijing.getUTCMinutes()).padStart(2, "0")}`;
}

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? migrateData(JSON.parse(raw)) : starterData;
  } catch {
    return starterData;
  }
}

function migrateData(data) {
  const schedule = worldCup2026GroupMatches();
  const existing = (data.matches || []).filter((match) =>
    !String(match.matchNo || "").startsWith("示例")
  );
  const merged = [...existing];
  schedule.forEach((match) => {
    const current = merged.find((item) => item.id === match.id || item.matchUid === match.matchUid);
    if (current) {
      Object.assign(current, {
        matchUid: match.matchUid,
        matchNo: match.matchNo,
        stage: match.stage,
        group: match.group,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        kickoffTime: match.kickoffTime,
        source: match.source,
        sortOrder: match.sortOrder,
      });
    } else {
      merged.push(match);
    }
  });
  return { ...starterData, ...data, participants: defaultParticipants, matches: merged };
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadScoreDrafts() {
  try {
    return JSON.parse(localStorage.getItem(SCORE_DRAFT_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveScoreDrafts(drafts) {
  localStorage.setItem(SCORE_DRAFT_KEY, JSON.stringify(drafts));
}

async function loadSharedData() {
  const response = await fetch("/api/state", { cache: "no-store" });
  if (!response.ok) throw new Error("共享数据读取失败");
  const result = await response.json();
  return result.data ? migrateData(result.data) : null;
}

async function saveSharedData(data) {
  const response = await fetch("/api/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || "共享数据保存失败");
  }
}

function compressImageFile(file, maxSide = 1100, quality = 0.74) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => resolve(reader.result);
      image.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

function percent(value) {
  if (!Number.isFinite(value)) return "0.00%";
  return `${(value * 100).toFixed(2)}%`;
}

function getMatchStatus(match) {
  if (matchOutcome(match)) return "settled";
  const kickoff = new Date(match.kickoffTime).getTime();
  return Date.now() >= kickoff ? "finished" : "scheduled";
}

function canSubmitTicket(matches, purchaseTime) {
  if (!matches.length) return { ok: false, reason: "至少选择一场比赛。" };
  const purchaseAt = new Date(purchaseTime).getTime();
  if (!Number.isFinite(purchaseAt)) return { ok: false, reason: "请填写有效的购买时间。" };
  const closeAt = purchaseAt + CLOSE_MINUTES * 60 * 1000;
  const closed = matches.find((match) => new Date(match.kickoffTime).getTime() <= closeAt);
  if (closed) {
    return {
      ok: false,
      reason: `${closed.matchNo} ${closed.homeTeam} vs ${closed.awayTeam} 在票据购买时间前已开赛，或购买时间距离开赛不足 ${CLOSE_MINUTES} 分钟。`,
    };
  }
  return { ok: true, reason: "" };
}

function makeTicketUid(participantName) {
  const safeName = String(participantName || "user").trim().replace(/\s+/g, "");
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 17);
  return `${safeName}-${stamp}`;
}

function normalizeSelection(value) {
  const text = String(value || "");
  const score = text.match(/(\d+)\s*[:：-]\s*(\d+)/);
  if (score) return `${Number(score[1])}:${Number(score[2])}`;
  if (/^\d+$/.test(text.trim())) return text.trim();
  if (text.includes("平")) return "平";
  if (text.includes("负")) return "负";
  if (text.includes("胜")) return "胜";
  return text;
}

function normalizeMarket(value, selection = "") {
  const text = `${value || ""} ${selection || ""}`;
  const lower = text.toLowerCase();
  if (text.includes("半全场") || lower.includes("half")) return "半全场";
  if (text.includes("总进球") || lower.includes("total")) return "总进球";
  if (text.includes("比分") || lower.includes("score")) return "比分";
  if (text.includes("让球") || text.includes("让胜") || text.includes("让平") || text.includes("让负") || lower.includes("handicap") || lower.includes("let")) return "让球胜平负";
  return "胜平负";
}

function scorePair(match) {
  if (match.homeScore === "" || match.homeScore === null || match.homeScore === undefined) return null;
  if (match.awayScore === "" || match.awayScore === null || match.awayScore === undefined) return null;
  const home = Number(match.homeScore);
  const away = Number(match.awayScore);
  if (!Number.isFinite(home) || !Number.isFinite(away)) return null;
  return { home, away };
}

function matchOutcome(match) {
  const scores = scorePair(match);
  if (!scores) return "";
  const { home, away } = scores;
  if (home > away) return "胜";
  if (home < away) return "负";
  return "平";
}

function outcomeFromScores(home, away) {
  if (home > away) return "胜";
  if (home < away) return "负";
  return "平";
}

function judgeBetItem(item, match) {
  const scores = scorePair(match);
  if (!scores) return null;
  const market = normalizeMarket(item.market || item.playType, item.selection);
  const selection = normalizeSelection(item.selection);

  if (market === "胜平负") {
    return selection === outcomeFromScores(scores.home, scores.away);
  }

  if (market === "让球胜平负") {
    const handicap = Number(item.handicap ?? item.letBall ?? item.line ?? 0);
    if (!Number.isFinite(handicap)) return null;
    return selection === outcomeFromScores(scores.home + handicap, scores.away);
  }

  if (market === "比分") {
    return selection === `${scores.home}:${scores.away}`;
  }

  if (market === "总进球") {
    return String(scores.home + scores.away) === selection;
  }

  return null;
}

function findMatchForBet(item, matches) {
  return matches.find((match) => match.id === item.matchId) ||
    matches.find((match) => item.matchUid && match.matchUid === item.matchUid) ||
    matches.find((match) => item.matchNo && match.matchNo === item.matchNo) ||
    matches.find((match) =>
      item.homeTeam &&
      item.awayTeam &&
      match.homeTeam.includes(item.homeTeam) &&
      match.awayTeam.includes(item.awayTeam)
    );
}

function estimatePrize(ticket) {
  if (Number(ticket.estimatedPrize) > 0) return Number(ticket.estimatedPrize);
  const multiplier = Number(ticket.multiplier || 1);
  const stakeUnits = Number(ticket.stakeUnits || 1);
  const oddsProduct = (ticket.betItems || []).reduce((product, item) => product * Number(item.odds || 1), 1);
  const estimate = 2 * multiplier * stakeUnits * oddsProduct;
  return Number.isFinite(estimate) ? Number(estimate.toFixed(2)) : 0;
}

function betOddsProduct(items) {
  const odds = (items || []).map((item) => Number(item.odds || 0)).filter((value) => value > 0);
  if (!odds.length) return 0;
  return odds.reduce((product, value) => product * value, 1);
}

function ticketDraftMath(form) {
  const multiplier = Number(form.multiplier || 0);
  const stakeUnits = Number(form.stakeUnits || 1);
  const oddsProduct = betOddsProduct(form.betItems);
  const stakeAmount = multiplier > 0 && stakeUnits > 0 ? 2 * multiplier * stakeUnits : 0;
  const estimatedPrize = multiplier > 0 && stakeUnits > 0 && oddsProduct > 0 ? 2 * multiplier * stakeUnits * oddsProduct : 0;
  return {
    multiplier,
    stakeUnits,
    oddsProduct,
    stakeAmount: Number(stakeAmount.toFixed(2)),
    estimatedPrize: Number(estimatedPrize.toFixed(2)),
  };
}

function settleTicketByScores(ticket, matches) {
  const items = ticket.betItems || [];
  if (!items.length) return null;
  const judged = items.map((item) => {
    const match = findMatchForBet(item, matches);
    const hit = match ? judgeBetItem(item, match) : null;
    return { item, match, hit };
  });
  if (judged.some((entry) => !entry.match || entry.hit === null)) return null;
  const won = judged.every((entry) => entry.hit);
  return {
    status: won ? "won" : "lost",
    actualPrize: won ? estimatePrize(ticket) : 0,
    settledAt: new Date().toISOString(),
    settledBy: "score-auto",
  };
}

function settleTicketsByScores(data) {
  return {
    ...data,
    tickets: data.tickets.map((ticket) => {
      if (ticket.status === "void") return ticket;
      const settlement = settleTicketByScores(ticket, data.matches);
      if (settlement) return { ...ticket, ...settlement, updatedAt: new Date().toISOString() };
      if (ticket.status === "won" || ticket.status === "lost" || ticket.status === "pending_settle") {
        return {
          ...ticket,
          status: "pending_match",
          actualPrize: 0,
          settledAt: null,
          settledBy: null,
          updatedAt: new Date().toISOString(),
        };
      }
      return ticket;
    }),
  };
}

function autoSettleReason(ticket, matches) {
  const items = ticket.betItems || [];
  if (!items.length) return "未生成字段化投注项，无法自动判断红黑";
  const pending = items.find((item) => {
    const match = findMatchForBet(item, matches);
    return !match || judgeBetItem(item, match) === null;
  });
  if (!pending) return "当前比分已自动结算";
  const match = findMatchForBet(pending, matches);
  if (!match) return `未关联赛程：${pending.matchNo || ""} ${pending.homeTeam || ""} vs ${pending.awayTeam || ""}`.trim();
  return `等待比分：${match.matchUid || match.matchNo} ${match.homeTeam} vs ${match.awayTeam}`;
}

function computeRows(participants, tickets) {
  return participants
    .map((participant) => {
      const own = tickets.filter((ticket) => ticket.participantId === participant.id);
      const settled = own.filter((ticket) => ticket.status === "won" || ticket.status === "lost");
      const totalStake = settled.reduce((sum, ticket) => sum + Number(ticket.stakeAmount || 0), 0);
      const totalPrize = settled.reduce((sum, ticket) => sum + Number(ticket.actualPrize || 0), 0);
      const netProfit = totalPrize - totalStake;
      const roi = totalStake > 0 ? netProfit / totalStake : 0;
      const weight = totalStake > 0 ? 1 - Math.exp(-totalStake / BASE_AMOUNT) : 0;
      const score = roi * weight;
      return {
        participant,
        totalStake,
        totalPrize,
        netProfit,
        roi,
        weight,
        score,
        won: own.filter((ticket) => ticket.status === "won").length,
        lost: own.filter((ticket) => ticket.status === "lost").length,
        pending: own.filter((ticket) => ticket.status === "pending_match" || ticket.status === "pending_settle").length,
        tickets: own,
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.netProfit !== a.netProfit) return b.netProfit - a.netProfit;
      if (b.totalPrize !== a.totalPrize) return b.totalPrize - a.totalPrize;
      return b.won - a.won;
    });
}

function parseOcrText(text) {
  const compact = text.replace(/\s+/g, " ");
  const moneyMatch =
    compact.match(/(?:合计|金额|投注金额|票款|人民币)[^\d]{0,8}(\d+(?:\.\d{1,2})?)/) ||
    compact.match(/(\d+(?:\.\d{1,2})?)\s*元/);
  const ticketMatch =
    compact.match(/(?:票号|序列号|流水号)[^\dA-Z]{0,8}([A-Z0-9-]{6,})/i) ||
    compact.match(/\b([A-Z0-9]{12,})\b/i);
  const playMatch = compact.match(/(竞彩足球|胜平负|比分|总进球|半全场|混合过关|单关|串关)/);
  const matchNos = [...compact.matchAll(/周[一二三四五六日天]\s*\d{3}|[0-9]{3}/g)]
    .map((item) => item[0].replace(/\s+/g, ""))
    .slice(0, 6);

  return {
    ticketNo: ticketMatch ? ticketMatch[1] : "",
    stakeAmount: moneyMatch ? moneyMatch[1] : "",
    playType: playMatch ? playMatch[1] : "",
    matchHints: Array.from(new Set(matchNos)).join("、"),
  };
}

async function recognizeTicket(file) {
  const formData = new FormData();
  formData.append("image", file);
  const response = await fetch("/api/recognize-ticket", {
    method: "POST",
    body: formData,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const context = [result.provider, result.model].filter(Boolean).join(" / ");
    throw new Error(`${result.error || "大模型识别失败。"}${context ? `（${context}）` : ""}`);
  }
  return result;
}

function modelResultToText(result) {
  const parsed = result.parsed || {};
  const lines = [
    parsed.rawText,
    parsed.ticketNo ? `票号：${parsed.ticketNo}` : "",
    parsed.issueNo ? `期号：${parsed.issueNo}` : "",
    parsed.playType ? `玩法：${parsed.playType}` : "",
    parsed.stakeAmount ? `投注金额：${parsed.stakeAmount}` : "",
    parsed.multiplier ? `倍数：${parsed.multiplier}` : "",
    parsed.estimatedPrize ? `预计最高奖金：${parsed.estimatedPrize}` : "",
    parsed.betItems?.length ? `结构化投注：${parsed.betItems.map((item) => {
      const market = normalizeMarket(item.market || item.playType, item.selection);
      const handicap = market === "让球胜平负" && item.handicap !== "" && item.handicap !== undefined ? `(${item.handicap})` : "";
      return `${item.matchNo || ""} ${item.homeTeam || ""} vs ${item.awayTeam || ""} ${market}${handicap} ${item.selection || ""}@${item.odds || ""}`;
    }).join("；")}` : "",
    parsed.selectionText ? `投注内容：${parsed.selectionText}` : "",
    parsed.warnings?.length ? `提示：${parsed.warnings.join("；")}` : "",
  ].filter(Boolean);
  return lines.join("\n") || result.raw || "";
}

function normalizeModelDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return formatDateTimeInput(date);
}

export default function App() {
  const [data, setData] = useState(loadData);
  const [syncStatus, setSyncStatus] = useState("正在读取共享数据...");
  const [activeTab, setActiveTab] = useState("rank");
  const [selectedUser, setSelectedUser] = useState("");
  const [filter, setFilter] = useState("all");
  const [ticketParticipantFilter, setTicketParticipantFilter] = useState("all");

  const rows = useMemo(() => computeRows(data.participants, data.tickets), [data]);
  const stats = useMemo(() => {
    const settled = data.tickets.filter((ticket) => ticket.status === "won" || ticket.status === "lost");
    return {
      participants: data.participants.length,
      stake: settled.reduce((sum, ticket) => sum + Number(ticket.stakeAmount || 0), 0),
      prize: settled.reduce((sum, ticket) => sum + Number(ticket.actualPrize || 0), 0),
      pending: data.tickets.filter((ticket) => ticket.status === "pending_match" || ticket.status === "pending_settle").length,
    };
  }, [data]);

  React.useEffect(() => {
    let alive = true;
    loadSharedData()
      .then((shared) => {
        if (!alive) return;
        if (shared) {
          setData(shared);
          saveData(shared);
          setSyncStatus(`共享数据已同步：${new Date().toLocaleTimeString("zh-CN", { hour12: false })}`);
        } else if ((data.tickets || []).length) {
          saveSharedData(data)
            .then(() => setSyncStatus("已将本机历史票据发布到共享数据。"))
            .catch((error) => setSyncStatus(`共享保存失败：${error.message}`));
        } else {
          setSyncStatus("暂无共享数据，本次修改后会自动创建。");
        }
      })
      .catch(() => {
        if (alive) setSyncStatus("共享数据暂不可用，当前使用本地缓存。");
      });
    return () => {
      alive = false;
    };
  }, []);

  function commit(next) {
    const migrated = migrateData(next);
    setData(migrated);
    saveData(migrated);
    setSyncStatus("正在保存共享数据...");
    saveSharedData(migrated)
      .then(() => setSyncStatus(`共享数据已保存：${new Date().toLocaleTimeString("zh-CN", { hour12: false })}`))
      .catch((error) => setSyncStatus(`共享保存失败：${error.message}`));
  }

  function updateTicket(ticketId, patch) {
    commit({
      ...data,
      tickets: data.tickets.map((ticket) => (ticket.id === ticketId ? { ...ticket, ...patch, updatedAt: new Date().toISOString() } : ticket)),
    });
  }

  function removeTicket(ticketId) {
    commit({ ...data, tickets: data.tickets.filter((ticket) => ticket.id !== ticketId) });
  }

  function refreshMatchStatuses() {
    const nextData = {
      ...data,
      tickets: data.tickets.map((ticket) => {
        if (ticket.status !== "pending_match") return ticket;
        const ticketMatches = ticket.matchIds.map((id) => data.matches.find((match) => match.id === id)).filter(Boolean);
        const finished = ticketMatches.length && ticketMatches.every((match) => getMatchStatus(match) !== "scheduled");
        return finished ? { ...ticket, status: "pending_settle", updatedAt: new Date().toISOString() } : ticket;
      }),
    };
    commit(settleTicketsByScores(nextData));
  }

  function lockBoard() {
    if (data.tickets.some((ticket) => ticket.status === "pending_match" || ticket.status === "pending_settle" || ticket.status === "draft")) {
      alert("仍有未结算或待确认票据，不能锁榜。");
      return;
    }
    commit({ ...data, locked: true, lockedAt: new Date().toISOString() });
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <ShieldCheck size={28} />
          <div>
            <strong>世界杯竞猜统计</strong>
            <span>350 元奖励榜</span>
          </div>
        </div>
        <nav>
          <Tab id="rank" active={activeTab} setActive={setActiveTab} icon={<BarChart3 size={18} />} label="排行榜" />
          <Tab id="upload" active={activeTab} setActive={setActiveTab} icon={<Upload size={18} />} label="上传票据" />
          <Tab id="tickets" active={activeTab} setActive={setActiveTab} icon={<ListChecks size={18} />} label="票据管理" />
          <Tab id="people" active={activeTab} setActive={setActiveTab} icon={<Users size={18} />} label="参与者" />
          <Tab id="matches" active={activeTab} setActive={setActiveTab} icon={<CalendarClock size={18} />} label="赛程" />
        </nav>
        <div className="ruleBox">
          <b>排名公式</b>
          <span>排名分 = 收益率 x (1 - e^(-投入/100))</span>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <p>整张票结算，比分自动判定红黑</p>
            <h1>{pageTitle(activeTab)}</h1>
          </div>
          <div className="topActions">
            <button className="ghost" onClick={refreshMatchStatuses}>
              <Clock3 size={17} /> 刷新自动结算
            </button>
            <button className="primary" onClick={lockBoard} disabled={data.locked}>
              <Award size={17} /> {data.locked ? "已锁榜" : "锁定最终榜"}
            </button>
          </div>
          <div className="syncStatus">{syncStatus}</div>
        </header>

        <EventBanner rows={rows} stats={stats} />

        {activeTab === "rank" && <RankView rows={rows} stats={stats} setSelectedUser={setSelectedUser} selectedUser={selectedUser} />}
        {activeTab === "upload" && <UploadView data={data} commit={commit} locked={data.locked} />}
        {activeTab === "tickets" && (
          <TicketsView
            data={data}
            filter={filter}
            setFilter={setFilter}
            participantFilter={ticketParticipantFilter}
            setParticipantFilter={setTicketParticipantFilter}
            updateTicket={updateTicket}
            removeTicket={removeTicket}
          />
        )}
        {activeTab === "people" && <PeopleView data={data} commit={commit} rows={rows} selectedUser={selectedUser} setSelectedUser={setSelectedUser} />}
        {activeTab === "matches" && <MatchesView data={data} commit={commit} />}
      </main>
    </div>
  );
}

function EventBanner({ rows, stats }) {
  const leader = rows[0]?.participant?.name || "暂无";
  const netPool = stats.prize - stats.stake;

  return (
    <section className="eventBanner">
      <div className="eventCopy">
        <span className="eventEyebrow">
          <Sparkles size={15} /> 2026 WORLD CUP PICKS
        </span>
        <h2>朋友局世界杯竞猜战报</h2>
        <p>上传票据、核对赛程和投注项，录入比分后自动沉淀每个人的收益率和加权排名。</p>
        <div className="hostChips">
          <span><MapPin size={14} /> USA</span>
          <span>Mexico</span>
          <span>Canada</span>
        </div>
      </div>
      <div className="eventScoreboard">
        <div>
          <span>奖池</span>
          <strong>350 元</strong>
        </div>
        <div>
          <span>当前领跑</span>
          <strong>{leader}</strong>
        </div>
        <div>
          <span>已结算净值</span>
          <strong className={netPool >= 0 ? "positive" : "negative"}>{money(netPool)}</strong>
        </div>
      </div>
      <div className="worldCupVisual" aria-hidden="true">
        <Trophy size={34} />
        <span className="yearMark">2026</span>
        <span className="ballMark" />
      </div>
    </section>
  );
}

function pageTitle(tab) {
  return {
    rank: "实时排行榜",
    upload: "上传与 AI 识别",
    tickets: "票据管理",
    people: "参与者管理",
    matches: "世界杯赛程",
  }[tab];
}

function Tab({ id, active, setActive, icon, label }) {
  return (
    <button className={active === id ? "navItem active" : "navItem"} onClick={() => setActive(id)}>
      {icon}
      {label}
    </button>
  );
}

function RankView({ rows, stats, setSelectedUser, selectedUser }) {
  const selected = rows.find((row) => row.participant.id === selectedUser) || rows[0];
  return (
    <section className="contentStack">
      <div className="statGrid">
        <Stat icon={<Award />} label="奖励" value="350 元" />
        <Stat icon={<Users />} label="参与人数" value={`${stats.participants} 人`} />
        <Stat icon={<CircleDollarSign />} label="已结算投入" value={`${money(stats.stake)} 元`} />
        <Stat icon={<Clock3 />} label="待结算票据" value={`${stats.pending} 张`} />
      </div>

      <div className="panel">
        <div className="panelHeader">
          <div>
            <h2>加权收益排行榜</h2>
            <p>只统计红单和黑单；待比赛、待比分、作废票不进入排名。</p>
          </div>
        </div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>排名</th>
                <th>参与者</th>
                <th>投入</th>
                <th>中奖</th>
                <th>净收益</th>
                <th>收益率</th>
                <th>投入权重</th>
                <th>排名分</th>
                <th>红/黑/待</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.participant.id} onClick={() => setSelectedUser(row.participant.id)}>
                  <td><span className={index === 0 ? "rank first" : "rank"}>{index + 1}</span></td>
                  <td>{row.participant.name}</td>
                  <td>{money(row.totalStake)}</td>
                  <td>{money(row.totalPrize)}</td>
                  <td className={row.netProfit >= 0 ? "positive" : "negative"}>{money(row.netProfit)}</td>
                  <td>{percent(row.roi)}</td>
                  <td>{row.weight.toFixed(3)}</td>
                  <td><b>{row.score.toFixed(4)}</b></td>
                  <td>{row.won}/{row.lost}/{row.pending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="panel">
          <div className="panelHeader">
            <div>
              <h2>{selected.participant.name} 的票据</h2>
              <p>投入 {money(selected.totalStake)} 元，中奖 {money(selected.totalPrize)} 元，排名分 {selected.score.toFixed(4)}</p>
            </div>
          </div>
          <TicketMiniList tickets={selected.tickets} />
        </div>
      )}
    </section>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="stat">
      {React.cloneElement(icon, { size: 22 })}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function UploadView({ data, commit, locked }) {
  const [form, setForm] = useState({
    participantId: data.participants[0]?.id || "",
    ticketNo: "",
    purchaseTime: formatDateTimeInput(new Date()),
    playType: "",
    stakeAmount: "",
    stakeUnits: "1",
    multiplier: "",
    estimatedPrize: "",
    selectionText: "",
    betItems: [],
    matchIds: [],
    imageUrl: "",
    ocrRawText: "",
  });
  const [ocrStatus, setOcrStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function onFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const imageUrl = await compressImageFile(file);
    setForm((next) => ({ ...next, imageUrl }));
    setBusy(true);
    setOcrStatus("大模型识别中，复杂票据可能需要十几秒");
    try {
      const result = await recognizeTicket(file);
      const parsed = result.parsed || {};
      const fallbackParsed = parseOcrText(result.raw || parsed.rawText || "");
      const modelText = modelResultToText(result);
      const selectionParts = [
        ...(parsed.matchHints || []),
        parsed.selectionText,
      ].filter(Boolean);
      const purchaseTime = normalizeModelDateTime(parsed.purchaseTime);
      const betItems = Array.isArray(parsed.betItems) ? parsed.betItems : [];
      const matchedIds = betItems.map((item) => findMatchForBet(item, data.matches)?.id).filter(Boolean);
      setForm((next) => ({
        ...next,
        ocrRawText: modelText,
        ticketNo: parsed.ticketNo || fallbackParsed.ticketNo || next.ticketNo,
        purchaseTime: purchaseTime || next.purchaseTime,
        stakeAmount: parsed.stakeAmount || fallbackParsed.stakeAmount || next.stakeAmount,
        multiplier: parsed.multiplier || next.multiplier,
        stakeUnits: parsed.stakeAmount && parsed.multiplier ? String(Math.max(1, Math.round(Number(parsed.stakeAmount) / 2 / Number(parsed.multiplier)))) : next.stakeUnits,
        estimatedPrize: parsed.estimatedPrize || next.estimatedPrize,
        playType: parsed.playType || fallbackParsed.playType || next.playType,
        betItems,
        matchIds: Array.from(new Set([...next.matchIds, ...matchedIds])),
        selectionText: next.selectionText || selectionParts.join("；") || fallbackParsed.matchHints,
      }));
      setOcrStatus(`大模型识别完成${parsed.confidence ? `，置信度 ${Math.round(parsed.confidence * 100)}%` : ""}，请人工校正`);
    } catch (error) {
      setOcrStatus(`大模型识别失败：${error.message || "请手动录入"}`);
    } finally {
      setBusy(false);
    }
  }

  function submit(event) {
    event.preventDefault();
    if (locked) {
      alert("榜单已锁定，不能新增票据。");
      return;
    }
    const participant = data.participants.find((person) => person.id === form.participantId);
    const addedMatches = [];
    const matchedIds = new Set(form.matchIds);
    form.betItems.forEach((item) => {
      const matched = findMatchForBet(item, [...data.matches, ...addedMatches]);
      if (matched) {
        matchedIds.add(matched.id);
        return;
      }
      if (item.matchNo || item.homeTeam || item.awayTeam) {
        const match = {
          id: uid("m"),
          matchNo: item.matchNo || `识别${addedMatches.length + 1}`,
          homeTeam: item.homeTeam || "主队待确认",
          awayTeam: item.awayTeam || "客队待确认",
          kickoffTime: nextIso(1),
          status: "scheduled",
          homeScore: "",
          awayScore: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        addedMatches.push(match);
        matchedIds.add(match.id);
      }
    });
    const allMatches = [...data.matches, ...addedMatches];
    const selectedMatches = Array.from(matchedIds).map((id) => allMatches.find((match) => match.id === id)).filter(Boolean);
    const gate = canSubmitTicket(selectedMatches, form.purchaseTime);
    if (!gate.ok) {
      alert(gate.reason);
      return;
    }
    if (!form.imageUrl) {
      alert("请上传票据图片。");
      return;
    }
    if (!Number(form.stakeAmount)) {
      alert("请填写有效投注金额。");
      return;
    }
      const ticket = {
      id: uid("t"),
      participantId: form.participantId,
      imageUrl: form.imageUrl,
      ticketNo: makeTicketUid(participant?.name),
      purchaseTime: form.purchaseTime,
      playType: form.playType.trim() || "未填写",
      stakeAmount: Number(form.stakeAmount),
      stakeUnits: Number(form.stakeUnits || 1),
      multiplier: Number(form.multiplier || 0),
      estimatedPrize: Number(form.estimatedPrize || 0),
      actualPrize: 0,
      status: "pending_match",
      ocrRawText: form.ocrRawText,
      matchIds: selectedMatches.map((match) => match.id),
      betItems: form.betItems.map((item) => ({
        ...item,
        matchId: findMatchForBet(item, selectedMatches)?.id || item.matchId || "",
        matchUid: findMatchForBet(item, selectedMatches)?.matchUid || item.matchUid || "",
        matchNo: findMatchForBet(item, selectedMatches)?.matchNo || item.matchNo || "",
        market: normalizeMarket(item.market || item.playType || form.playType, item.selection),
        handicap: item.handicap === "" || item.handicap === undefined || item.handicap === null ? "" : Number(item.handicap),
        selection: normalizeSelection(item.selection),
        odds: Number(item.odds || 0),
      })),
      selectionText: form.selectionText.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    commit({ ...data, matches: allMatches, tickets: [ticket, ...data.tickets] });
    setForm((next) => ({
      ...next,
      ticketNo: "",
      stakeAmount: "",
      stakeUnits: "1",
      multiplier: "",
      estimatedPrize: "",
      playType: "",
      selectionText: "",
      betItems: [],
      matchIds: [],
      imageUrl: "",
      ocrRawText: "",
    }));
    setOcrStatus("已保存为待比赛票据");
  }

  return (
    <section className="twoColumn">
      <form className="panel formPanel" onSubmit={submit}>
        <div className="panelHeader">
          <div>
            <h2>上传体彩单</h2>
            <p>大模型自动识别票据，保存前必须人工确认。</p>
          </div>
        </div>
        <label>
          参与者
          <select value={form.participantId} onChange={(event) => setForm({ ...form, participantId: event.target.value })}>
            {data.participants.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
          </select>
        </label>
        <label className="fileDrop">
          <FileImage size={24} />
          <span>{form.imageUrl ? "已选择图片，可重新上传" : "选择票据图片并 AI 识别"}</span>
          <input type="file" accept="image/*" onChange={onFile} />
        </label>
        {ocrStatus && <div className="hint">{busy ? "处理中：" : ""}{ocrStatus}</div>}
        {(() => {
          const draftMath = ticketDraftMath(form);
          return (
            <div className="calcHint">
              <span>理论投注金额：{money(draftMath.stakeAmount)} 元 = 2元 x {draftMath.multiplier || "-"} 倍 x {draftMath.stakeUnits || "-"} 注</span>
              <span>赔率乘积：{draftMath.oddsProduct ? draftMath.oddsProduct.toFixed(3) : "-"}</span>
              <span>理论最高奖金：{money(draftMath.estimatedPrize)} 元</span>
              <button type="button" className="ghost compactBtn" onClick={() => setForm({ ...form, stakeAmount: draftMath.stakeAmount || form.stakeAmount, estimatedPrize: draftMath.estimatedPrize || form.estimatedPrize })}>套用计算值</button>
            </div>
          );
        })()}
        <div className="fieldGrid">
          <label>票据UID<input value={makeTicketUid(data.participants.find((person) => person.id === form.participantId)?.name)} readOnly /></label>
          <label>购买时间<input type="datetime-local" value={form.purchaseTime} onChange={(e) => setForm({ ...form, purchaseTime: e.target.value })} /></label>
          <label>玩法<input value={form.playType} onChange={(e) => setForm({ ...form, playType: e.target.value })} placeholder="混合过关 / 胜平负" /></label>
          <label>投注金额<input type="number" min="0" step="0.01" value={form.stakeAmount} onChange={(e) => setForm({ ...form, stakeAmount: e.target.value })} /></label>
          <label>倍数<input type="number" min="0" step="1" value={form.multiplier} onChange={(e) => setForm({ ...form, multiplier: e.target.value })} /></label>
          <label>注数<input type="number" min="1" step="1" value={form.stakeUnits} onChange={(e) => setForm({ ...form, stakeUnits: e.target.value })} /></label>
          <label>预计奖金<input type="number" min="0" step="0.01" value={form.estimatedPrize} onChange={(e) => setForm({ ...form, estimatedPrize: e.target.value })} /></label>
        </div>
        <BetItemsEditor
          items={form.betItems}
          matches={data.matches}
          onChange={(betItems) => {
            const matchedIds = betItems.map((item) => findMatchForBet(item, data.matches)?.id).filter(Boolean);
            setForm({ ...form, betItems, matchIds: Array.from(new Set([...form.matchIds, ...matchedIds])) });
          }}
        />
        <label>投注内容<textarea value={form.selectionText} onChange={(e) => setForm({ ...form, selectionText: e.target.value })} rows="3" /></label>
        <button className="primary wide" disabled={busy || locked}><Check size={17} /> 确认提交</button>
      </form>

      <div className="panel previewPanel">
        <h2>识别预览</h2>
        {form.imageUrl ? <img src={form.imageUrl} alt="票据预览" /> : <div className="empty">上传后显示票据图片</div>}
        <textarea
          className="ocrText"
          value={form.ocrRawText}
          onChange={(event) => setForm({ ...form, ocrRawText: event.target.value })}
          placeholder="AI 识别原文会显示在这里，也可以手动粘贴修改。"
        />
      </div>
    </section>
  );
}

function BetItemsEditor({ items, matches, onChange }) {
  function updateItem(index, patch) {
    onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  function emptyItem() {
    return {
      matchNo: "",
      homeTeam: "",
      awayTeam: "",
      market: "胜平负",
      selection: "",
      odds: "",
      handicap: "",
      matchId: "",
      matchUid: "",
    };
  }

  function addItem() {
    onChange([...items, emptyItem()]);
  }

  function removeItem(index) {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  }

  function selectionField(item, index, market) {
    if (market === "比分") {
      return <label>比分选择<input value={normalizeSelection(item.selection)} onChange={(e) => updateItem(index, { selection: e.target.value })} placeholder="如 2:1" /></label>;
    }
    if (market === "总进球") {
      return <label>总进球<input type="number" min="0" value={item.selection || ""} onChange={(e) => updateItem(index, { selection: e.target.value })} placeholder="如 3" /></label>;
    }
    if (market === "半全场") {
      return <label>选择<input value={item.selection || ""} onChange={(e) => updateItem(index, { selection: e.target.value })} placeholder="暂不自动结算" /></label>;
    }
    return (
      <label>选择
        <select value={normalizeSelection(item.selection)} onChange={(e) => updateItem(index, { selection: e.target.value })}>
          <option value="">请选择</option>
          <option value="胜">{market === "让球胜平负" ? "让胜" : "主胜"}</option>
          <option value="平">{market === "让球胜平负" ? "让平" : "平"}</option>
          <option value="负">{market === "让球胜平负" ? "让负" : "主负"}</option>
        </select>
      </label>
    );
  }

  return (
    <div className="betEditor">
      <div className="betEditorHeader">
        <div>
          <strong>字段化投注项</strong>
          <span>AI 识别失败也可以手动补全</span>
        </div>
        <button className="ghost compactBtn" type="button" onClick={addItem}><Plus size={15} /> 新增投注项</button>
      </div>
      {!items.length && <div className="empty compact">暂无投注项，请点击“新增投注项”手动填写。</div>}
      {items.map((item, index) => {
        const matched = findMatchForBet(item, matches);
        const market = normalizeMarket(item.market || item.playType, item.selection);
        return (
          <div className="betItemRow" key={`${item.matchNo}-${index}`}>
            <label className="wideField">关联赛程
              <select
                value={matched?.id || item.matchId || ""}
                onChange={(e) => {
                  const match = matches.find((candidate) => candidate.id === e.target.value);
                  updateItem(index, match ? {
                    matchId: match.id,
                    matchUid: match.matchUid || "",
                    matchNo: match.matchNo || "",
                    homeTeam: match.homeTeam || "",
                    awayTeam: match.awayTeam || "",
                  } : {
                    matchId: "",
                    matchUid: "",
                  });
                }}
              >
                <option value="">自动匹配 / 暂不关联</option>
                {matches.map((match) => (
                  <option key={match.id} value={match.id}>
                    {(match.matchUid || match.matchNo || match.id)} · {match.homeTeam} vs {match.awayTeam}
                  </option>
                ))}
              </select>
            </label>
            <label>场次<input value={item.matchNo || ""} onChange={(e) => updateItem(index, { matchNo: e.target.value })} /></label>
            <label>主队<input value={item.homeTeam || ""} onChange={(e) => updateItem(index, { homeTeam: e.target.value })} /></label>
            <label>客队<input value={item.awayTeam || ""} onChange={(e) => updateItem(index, { awayTeam: e.target.value })} /></label>
            <label>玩法
              <select value={market} onChange={(e) => updateItem(index, { market: e.target.value })}>
                <option value="胜平负">胜平负</option>
                <option value="让球胜平负">让球胜平负</option>
                <option value="比分">比分</option>
                <option value="总进球">总进球</option>
                <option value="半全场">半全场</option>
              </select>
            </label>
            {market === "让球胜平负" && (
              <label>让球数<input type="number" step="0.5" value={item.handicap ?? ""} onChange={(e) => updateItem(index, { handicap: e.target.value })} placeholder="主队让球，如 -1" /></label>
            )}
            {selectionField(item, index, market)}
            <label>赔率<input type="number" step="0.001" value={item.odds || ""} onChange={(e) => updateItem(index, { odds: e.target.value })} /></label>
            <div className={matched ? "matchLink ok" : "matchLink warn"}>
              {matched ? `已匹配：${matched.matchUid || matched.matchNo}` : "未匹配赛程"}
            </div>
            <button className="ghost compactBtn wideField" type="button" onClick={() => removeItem(index)}>删除投注项</button>
          </div>
        );
      })}
    </div>
  );
}

function TicketsView({ data, filter, setFilter, participantFilter, setParticipantFilter, updateTicket, removeTicket }) {
  const tickets = data.tickets
    .filter((ticket) => filter === "all" || ticket.status === filter)
    .filter((ticket) => participantFilter === "all" || ticket.participantId === participantFilter)
    .map((ticket) => ({
      ...ticket,
      participant: data.participants.find((person) => person.id === ticket.participantId),
      matches: ticket.matchIds.map((id) => data.matches.find((match) => match.id === id)).filter(Boolean),
    }));
  const selectedParticipant = data.participants.find((person) => person.id === participantFilter);
  const ticketCountText = participantFilter === "all"
    ? `当前显示 ${tickets.length} 张票据`
    : `${selectedParticipant?.name || "该参与者"} 当前显示 ${tickets.length} 张票据`;

  return (
    <section className="contentStack">
      <div className="panel">
        <div className="panelHeader">
          <div>
            <h2>票据列表</h2>
            <p>录入并确认比分后，点击刷新自动结算；串关未全部出比分会保持待定。{ticketCountText}</p>
          </div>
          <div className="ticketFilters">
            <select value={participantFilter} onChange={(event) => setParticipantFilter(event.target.value)} aria-label="按参与者筛选">
              <option value="all">全部参与者</option>
              {data.participants.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
            </select>
            <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="按状态筛选">
              <option value="all">全部状态</option>
              {Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>
        </div>
        <div className="ticketGrid">
          {tickets.map((ticket) => (
            <article className="ticketCard" key={ticket.id}>
              <img src={ticket.imageUrl} alt="票据" />
              <div className="ticketBody">
                <div className="ticketTop">
                  <div>
                    <strong>{ticket.participant?.name || "未知参与者"}</strong>
                    <span>{ticket.ticketNo || "未填票号"}</span>
                  </div>
                  <span className={statusClass[ticket.status]}>{statusLabels[ticket.status]}</span>
                </div>
                <p>{ticket.playType} · 投入 {money(ticket.stakeAmount)} 元 · 中奖 {money(ticket.actualPrize)} 元</p>
                <p className="muted">{ticket.matches.map((match) => `${match.matchNo} ${match.homeTeam} vs ${match.awayTeam}`).join(" / ")}</p>
                {!!ticket.betItems?.length && (
                  <div className="betChips">
                    {ticket.betItems.map((item, index) => (
                      <span key={`${ticket.id}-${index}`}>
                        {item.matchNo || "场次"} {item.homeTeam || ""} vs {item.awayTeam || ""} · {normalizeMarket(item.market || item.playType, item.selection)}
                        {normalizeMarket(item.market || item.playType, item.selection) === "让球胜平负" && item.handicap !== "" && item.handicap !== undefined ? `(${item.handicap})` : ""}
                        · {normalizeSelection(item.selection) || "未选"} {item.odds ? `@${item.odds}` : ""}
                      </span>
                    ))}
                  </div>
                )}
                <p className="selection">{ticket.selectionText || "未填写投注内容"}</p>
                <div className="cardActions">
                  <span className="autoSettleNote">{autoSettleReason(ticket, data.matches)}</span>
                  <button className="ghost" onClick={() => updateTicket(ticket.id, { status: "void", actualPrize: 0 })} disabled={data.locked}>
                    作废
                  </button>
                  <button className="iconBtn" onClick={() => removeTicket(ticket.id)} disabled={data.locked} title="删除">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
          {!tickets.length && <div className="empty">暂无票据</div>}
        </div>
      </div>
    </section>
  );
}

function PeopleView({ data, commit, rows, selectedUser, setSelectedUser }) {
  const [name, setName] = useState("");
  const selected = rows.find((row) => row.participant.id === selectedUser) || rows[0];

  function addPerson(event) {
    event.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    commit({
      ...data,
      participants: [...data.participants, { id: uid("p"), name: clean, avatar: "", createdAt: new Date().toISOString() }],
    });
    setName("");
  }

  return (
    <section className="twoColumn">
      <div className="panel">
        <div className="panelHeader"><h2>参与者</h2></div>
        <form className="inlineForm" onSubmit={addPerson}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="新增参与者姓名" />
          <button className="primary"><Plus size={17} /> 新增</button>
        </form>
        <div className="personList">
          {rows.map((row) => (
            <button key={row.participant.id} className={selected?.participant.id === row.participant.id ? "person active" : "person"} onClick={() => setSelectedUser(row.participant.id)}>
              <span>{row.participant.name}</span>
              <b>{row.score.toFixed(4)}</b>
            </button>
          ))}
        </div>
      </div>
      <div className="panel">
        {selected ? (
          <>
            <h2>{selected.participant.name}</h2>
            <div className="detailGrid">
              <Stat icon={<CircleDollarSign />} label="投入" value={`${money(selected.totalStake)} 元`} />
              <Stat icon={<Award />} label="中奖" value={`${money(selected.totalPrize)} 元`} />
              <Stat icon={<BarChart3 />} label="收益率" value={percent(selected.roi)} />
              <Stat icon={<ShieldCheck />} label="排名分" value={selected.score.toFixed(4)} />
            </div>
            <TicketMiniList tickets={selected.tickets} />
          </>
        ) : <div className="empty">暂无参与者</div>}
      </div>
    </section>
  );
}

function MatchesView({ data, commit }) {
  const [stageFilter, setStageFilter] = useState("group");
  const sortedMatches = [...data.matches].sort((a, b) =>
    new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime() ||
    String(a.matchNo).localeCompare(String(b.matchNo))
  );
  const visibleMatches = sortedMatches.filter((match) =>
    stageFilter === "group" ? match.stage === "group" : match.stage !== "group"
  );
  const [scoreDrafts, setScoreDrafts] = useState(() =>
    Object.fromEntries(data.matches.map((match) => {
      const savedDraft = loadScoreDrafts()[match.id] || {};
      const hasConfirmedScore = match.homeScore !== "" && match.homeScore !== undefined && match.homeScore !== null &&
        match.awayScore !== "" && match.awayScore !== undefined && match.awayScore !== null;
      return [match.id, {
        homeScore: hasConfirmedScore ? match.homeScore : savedDraft.homeScore ?? match.homeScore ?? "",
        awayScore: hasConfirmedScore ? match.awayScore : savedDraft.awayScore ?? match.awayScore ?? "",
      }];
    }))
  );
  const [form, setForm] = useState({
    matchNo: "",
    homeTeam: "",
    awayTeam: "",
    kickoffTime: formatDateTimeInput(new Date()),
  });

  function addMatch(event) {
    event.preventDefault();
    if (!form.matchNo.trim() || !form.homeTeam.trim() || !form.awayTeam.trim()) {
      alert("请填写场次、主队和客队。");
      return;
    }
    const newMatch = {
      id: uid("m"),
      matchUid: `WC26-${stageFilter === "group" ? "G" : "KO"}-${form.matchNo.trim()}`,
      matchNo: form.matchNo.trim(),
      stage: stageFilter === "group" ? "group" : "knockout",
      homeTeam: form.homeTeam.trim(),
      awayTeam: form.awayTeam.trim(),
      kickoffTime: form.kickoffTime,
      status: "scheduled",
      homeScore: "",
      awayScore: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    commit({ ...data, matches: [...data.matches, newMatch] });
    setScoreDrafts((next) => ({ ...next, [newMatch.id]: { homeScore: "", awayScore: "" } }));
    setForm({ matchNo: "", homeTeam: "", awayTeam: "", kickoffTime: formatDateTimeInput(new Date()) });
  }

  function removeMatch(id) {
    const match = data.matches.find((item) => item.id === id);
    const affectedTickets = data.tickets.filter((ticket) =>
      (ticket.matchIds || []).includes(id) ||
      (ticket.betItems || []).some((item) => item.matchId === id || (match?.matchUid && item.matchUid === match.matchUid))
    );
    const confirmText = affectedTickets.length
      ? `确认删除 ${match?.matchNo || ""} ${match?.homeTeam || ""} vs ${match?.awayTeam || ""}？\n\n已有 ${affectedTickets.length} 张票据引用这场比赛，删除后会解除这些票据的赛程关联，并重新计算红黑单和排行榜。`
      : `确认删除 ${match?.matchNo || "这场比赛"}？`;
    if (!window.confirm(confirmText)) {
      return;
    }
    const nextData = {
      ...data,
      matches: data.matches.filter((item) => item.id !== id),
      tickets: data.tickets.map((ticket) => {
        const usedByTicket = affectedTickets.some((affected) => affected.id === ticket.id);
        if (!usedByTicket) return ticket;
        return {
          ...ticket,
          matchIds: (ticket.matchIds || []).filter((matchId) => matchId !== id),
          betItems: (ticket.betItems || []).map((item) =>
            item.matchId === id || (match?.matchUid && item.matchUid === match.matchUid)
              ? { ...item, matchId: "", matchUid: "" }
              : item
          ),
          status: ticket.status === "won" || ticket.status === "lost" ? "pending_match" : ticket.status,
          actualPrize: ticket.status === "won" || ticket.status === "lost" ? 0 : ticket.actualPrize,
          settledAt: ticket.status === "won" || ticket.status === "lost" ? null : ticket.settledAt,
          settledBy: ticket.status === "won" || ticket.status === "lost" ? null : ticket.settledBy,
          updatedAt: new Date().toISOString(),
        };
      }),
    };
    commit(settleTicketsByScores(nextData));
  }

  function updateMatch(id, patch) {
    const nextData = {
      ...data,
      matches: data.matches.map((match) => match.id === id ? { ...match, ...patch, updatedAt: new Date().toISOString() } : match),
    };
    commit(settleTicketsByScores(nextData));
  }

  function updateScoreDraft(id, patch) {
    setScoreDrafts((next) => {
      const updated = { ...next, [id]: { ...(next[id] || {}), ...patch } };
      saveScoreDrafts(updated);
      return updated;
    });
  }

  function confirmScore(match) {
    const draft = scoreDrafts[match.id] || {};
    if (draft.homeScore === "" || draft.awayScore === "") {
      alert("请先填写主队和客队比分。");
      return;
    }
    updateMatch(match.id, {
      homeScore: draft.homeScore,
      awayScore: draft.awayScore,
      scoreConfirmedAt: new Date().toISOString(),
    });
  }

  const statusSummary = visibleMatches.reduce((summary, match) => {
    const status = getMatchStatus(match);
    summary[status] = (summary[status] || 0) + 1;
    return summary;
  }, {});
  const groupCount = sortedMatches.filter((match) => match.stage === "group").length;
  const knockoutCount = sortedMatches.filter((match) => match.stage !== "group").length;

  return (
    <section className="contentStack">
      <div className="panel schedulePanel">
        <div className="panelHeader">
          <div>
            <h2>赛程管理</h2>
            <p>小组赛已预置为中文队名；淘汰赛可手动新增。比分填写后必须点击确认比分才会结算票据。</p>
          </div>
        </div>
        <div className="stageTabs">
          <button type="button" className={stageFilter === "group" ? "active" : ""} onClick={() => setStageFilter("group")}>
            小组赛 <span>{groupCount}</span>
          </button>
          <button type="button" className={stageFilter === "knockout" ? "active" : ""} onClick={() => setStageFilter("knockout")}>
            淘汰赛 <span>{knockoutCount}</span>
          </button>
        </div>
        <div className="matchStats">
          <div><span>当前阶段</span><strong>{visibleMatches.length}</strong></div>
          <div><span>未开赛</span><strong>{statusSummary.scheduled || 0}</strong></div>
          <div><span>待比分</span><strong>{statusSummary.finished || 0}</strong></div>
          <div><span>已录比分</span><strong>{statusSummary.settled || 0}</strong></div>
        </div>
        <form className="matchForm" onSubmit={addMatch}>
          <input value={form.matchNo} onChange={(e) => setForm({ ...form, matchNo: e.target.value })} placeholder="场次：1/8-01" />
          <input value={form.homeTeam} onChange={(e) => setForm({ ...form, homeTeam: e.target.value })} placeholder="主队" />
          <input value={form.awayTeam} onChange={(e) => setForm({ ...form, awayTeam: e.target.value })} placeholder="客队" />
          <input type="datetime-local" value={form.kickoffTime} onChange={(e) => setForm({ ...form, kickoffTime: e.target.value })} />
          <button type="submit" className="primary"><Plus size={17} /> 添加赛程</button>
        </form>
        <div className="tableWrap scheduleTableWrap">
          <table className="matchTable">
            <thead>
              <tr><th>场次</th><th>比赛</th><th>北京时间</th><th>比分</th><th>赛果</th><th>状态</th><th>操作</th></tr>
            </thead>
            <tbody>
              {visibleMatches.map((match) => (
                <tr key={match.id}>
                  <td>
                    <b>{match.matchNo}</b>
                    <small className="matchUid">{match.matchUid || match.id}</small>
                  </td>
                  <td>
                    <b>{match.homeTeam} vs {match.awayTeam}</b>
                    {match.group ? <small className="matchGroup">{match.group}组</small> : null}
                  </td>
                  <td>{match.kickoffTime}</td>
                  <td>
                    <div className="scoreInputs">
                      <input
                        type="number"
                        min="0"
                        value={scoreDrafts[match.id]?.homeScore ?? match.homeScore ?? ""}
                        onChange={(e) => updateScoreDraft(match.id, { homeScore: e.target.value })}
                        aria-label={`${match.homeTeam} 比分`}
                      />
                      <span>:</span>
                      <input
                        type="number"
                        min="0"
                        value={scoreDrafts[match.id]?.awayScore ?? match.awayScore ?? ""}
                        onChange={(e) => updateScoreDraft(match.id, { awayScore: e.target.value })}
                        aria-label={`${match.awayTeam} 比分`}
                      />
                    </div>
                  </td>
                  <td>{matchOutcome(match) || "未录入"}</td>
                  <td><MatchStatusBadge match={match} /></td>
                  <td>
                    <div className="rowActions">
                      <button className="ghost compactBtn" type="button" onClick={() => confirmScore(match)}>确认比分</button>
                      <button className="iconBtn" type="button" onClick={() => removeMatch(match.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!visibleMatches.length && (
                <tr>
                  <td colSpan="7"><div className="empty compact">暂无淘汰赛，可先手动添加占位赛程。</div></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function MatchStatusBadge({ match }) {
  const status = getMatchStatus(match);
  if (status === "settled") return <span className="badge green">已录比分</span>;
  if (status === "finished") return <span className="badge amber">待比分</span>;
  return <span className="badge blue">未开赛</span>;
}
function TicketMiniList({ tickets }) {
  if (!tickets.length) return <div className="empty">暂无票据</div>;
  return (
    <div className="miniList">
      {tickets.map((ticket) => (
        <div key={ticket.id} className="miniItem">
          <span className={statusClass[ticket.status]}>{statusLabels[ticket.status]}</span>
          <b>{ticket.playType}</b>
          <span>投入 {money(ticket.stakeAmount)} 元</span>
          <span>中奖 {money(ticket.actualPrize)} 元</span>
          <span>{ticket.selectionText || ticket.ticketNo || "未填写投注内容"}</span>
        </div>
      ))}
    </div>
  );
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

