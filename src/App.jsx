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
const LOCAL_BACKUP_KEY = "worldcup-betting-tracker-backup-v1";
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

const passTypeOptions = [
  "单关",
  "2串1",
  "3串1",
  "4串1",
  "5串1",
  "6串1",
  "7串1",
  "8串1",
];

const defaultForecastInputs = {
  homeValue: "120",
  awayValue: "80",
  homeOdds: "2.10",
  drawOdds: "3.20",
  awayOdds: "3.60",
  homeAttack: "6",
  homeDefense: "6",
  awayAttack: "5",
  awayDefense: "5",
  styleEdge: "0",
  formEdge: "0",
  h2hEdge: "0",
  injuryEdge: "0",
  restTravelEdge: "0",
  weatherEdge: "0",
  motivationEdge: "0",
  baseGoals: "2.55",
  asianLine: "0",
  overUnderLine: "2.5",
  overOdds: "1.90",
  underOdds: "1.90",
  returnRate: "94",
  marketNote: "盘口和赔率为手动录入；临场大幅变盘需要重新计算。",
  homeNews: "主队新闻：核心阵容、伤停、轮换和赛前发布会信息待补充。",
  awayNews: "客队新闻：防线伤停、旅行距离、适应场地和心理状态待补充。",
  h2hText: "过往战绩：录入近 3-5 次交手、同洲/同风格球队表现和友谊赛参考。",
  lineupText: "首发判断：录入门将、中卫、后腰、前锋等关键位置可用性。",
};

const teamForecastProfiles = {
  阿根廷: { rating: 91, value: 920, attack: 9, defense: 8 },
  法国: { rating: 90, value: 980, attack: 9, defense: 8 },
  英格兰: { rating: 88, value: 1080, attack: 9, defense: 8 },
  西班牙: { rating: 88, value: 880, attack: 9, defense: 8 },
  巴西: { rating: 87, value: 920, attack: 9, defense: 7 },
  葡萄牙: { rating: 86, value: 870, attack: 9, defense: 7 },
  荷兰: { rating: 84, value: 720, attack: 8, defense: 8 },
  德国: { rating: 84, value: 760, attack: 8, defense: 7 },
  比利时: { rating: 82, value: 560, attack: 8, defense: 7 },
  乌拉圭: { rating: 80, value: 480, attack: 8, defense: 7 },
  克罗地亚: { rating: 79, value: 430, attack: 7, defense: 7 },
  摩洛哥: { rating: 79, value: 410, attack: 7, defense: 8 },
  哥伦比亚: { rating: 78, value: 390, attack: 8, defense: 7 },
  瑞士: { rating: 77, value: 310, attack: 7, defense: 7 },
  美国: { rating: 76, value: 330, attack: 7, defense: 7 },
  日本: { rating: 76, value: 290, attack: 7, defense: 7 },
  墨西哥: { rating: 75, value: 230, attack: 7, defense: 7 },
  塞内加尔: { rating: 75, value: 260, attack: 7, defense: 7 },
  厄瓜多尔: { rating: 74, value: 250, attack: 7, defense: 7 },
  奥地利: { rating: 74, value: 280, attack: 7, defense: 7 },
  土耳其: { rating: 73, value: 260, attack: 7, defense: 6 },
  韩国: { rating: 72, value: 190, attack: 7, defense: 6 },
  加拿大: { rating: 72, value: 210, attack: 7, defense: 6 },
  挪威: { rating: 72, value: 360, attack: 8, defense: 6 },
  苏格兰: { rating: 70, value: 180, attack: 6, defense: 7 },
  瑞典: { rating: 70, value: 190, attack: 6, defense: 7 },
  伊朗: { rating: 69, value: 95, attack: 6, defense: 7 },
  澳大利亚: { rating: 69, value: 90, attack: 6, defense: 6 },
  捷克: { rating: 68, value: 160, attack: 6, defense: 6 },
  波黑: { rating: 67, value: 120, attack: 6, defense: 6 },
  巴拉圭: { rating: 67, value: 130, attack: 6, defense: 6 },
  加纳: { rating: 67, value: 150, attack: 6, defense: 6 },
  乌克兰: { rating: 67, value: 220, attack: 6, defense: 6 },
  埃及: { rating: 66, value: 150, attack: 6, defense: 6 },
  科特迪瓦: { rating: 66, value: 180, attack: 6, defense: 6 },
  突尼斯: { rating: 64, value: 70, attack: 5, defense: 6 },
  南非: { rating: 63, value: 55, attack: 5, defense: 6 },
  阿尔及利亚: { rating: 63, value: 120, attack: 6, defense: 5 },
  卡塔尔: { rating: 62, value: 55, attack: 5, defense: 5 },
  沙特阿拉伯: { rating: 62, value: 65, attack: 5, defense: 5 },
  乌兹别克斯坦: { rating: 61, value: 60, attack: 5, defense: 5 },
  新西兰: { rating: 60, value: 35, attack: 5, defense: 5 },
  巴拿马: { rating: 59, value: 45, attack: 5, defense: 5 },
  伊拉克: { rating: 58, value: 40, attack: 5, defense: 5 },
  约旦: { rating: 57, value: 35, attack: 5, defense: 5 },
  海地: { rating: 56, value: 30, attack: 5, defense: 4 },
  佛得角: { rating: 56, value: 45, attack: 5, defense: 5 },
  库拉索: { rating: 54, value: 28, attack: 4, defense: 4 },
  刚果民主共和国: { rating: 54, value: 65, attack: 5, defense: 4 },
};

function teamForecastProfile(teamName) {
  return teamForecastProfiles[teamName] || { rating: 65, value: 100, attack: 6, defense: 6 };
}

function fairOdds(probability, margin = 0.94) {
  return (1 / clamp(probability * margin, 0.05, 0.82)).toFixed(2);
}

function marketFromRatings(homeRating, awayRating) {
  const diff = homeRating - awayRating;
  const draw = clamp(0.29 - Math.abs(diff) * 0.0075, 0.16, 0.31);
  const nonDraw = 1 - draw;
  const homeShare = 1 / (1 + Math.exp(-diff / 10));
  const minDog = Math.abs(diff) >= 28 ? 0.025 : Math.abs(diff) >= 20 ? 0.04 : 0.06;
  const home = clamp(nonDraw * homeShare, minDog, 0.88);
  const away = clamp(nonDraw - home, minDog, 0.84);
  const total = home + draw + away;
  return [home / total, draw / total, away / total];
}

function lineFromDiff(diff) {
  if (diff >= 28) return "-2";
  if (diff >= 22) return "-1.75";
  if (diff >= 18) return "-1.5";
  if (diff >= 13) return "-1";
  if (diff >= 8) return "-0.75";
  if (diff >= 4) return "-0.25";
  if (diff <= -28) return "2";
  if (diff <= -22) return "1.75";
  if (diff <= -18) return "1.5";
  if (diff <= -13) return "1";
  if (diff <= -8) return "0.75";
  if (diff <= -4) return "0.25";
  return "0";
}

function forecastInputsForMatch(match) {
  if (!match) return defaultForecastInputs;
  const home = teamForecastProfile(match.homeTeam);
  const away = teamForecastProfile(match.awayTeam);
  const diff = home.rating - away.rating;
  const [homeProb, drawProb, awayProb] = marketFromRatings(home.rating, away.rating);
  const attackTempo = (home.attack + away.attack) / 2;
  const defenseDrag = (home.defense + away.defense) / 2;
  const mismatchBoost = Math.abs(diff) >= 28 ? 0.55 : Math.abs(diff) >= 20 ? 0.35 : Math.abs(diff) >= 14 ? 0.18 : 0;
  const favoriteAttackBoost = diff > 14 ? Math.max(0, home.attack - away.defense) * 0.08 : diff < -14 ? Math.max(0, away.attack - home.defense) * 0.08 : 0;
  const totalLine = clamp(2.5 + (attackTempo - 6.5) * 0.18 - (defenseDrag - 6.5) * 0.1 + mismatchBoost + favoriteAttackBoost, 2, 3.6);
  return {
    ...defaultForecastInputs,
    homeValue: String(home.value),
    awayValue: String(away.value),
    homeOdds: fairOdds(homeProb),
    drawOdds: fairOdds(drawProb),
    awayOdds: fairOdds(awayProb),
    homeAttack: String(home.attack),
    homeDefense: String(home.defense),
    awayAttack: String(away.attack),
    awayDefense: String(away.defense),
    asianLine: lineFromDiff(diff),
    overUnderLine: totalLine.toFixed(2),
    baseGoals: totalLine.toFixed(2),
    overOdds: mismatchBoost > 0 ? "1.82" : attackTempo >= defenseDrag ? "1.86" : "1.96",
    underOdds: mismatchBoost > 0 ? "2.04" : attackTempo >= defenseDrag ? "1.98" : "1.88",
    styleEdge: String(clamp(Math.round(diff / 10), -4, 4)),
    formEdge: "0",
    marketNote: `${match.homeTeam} vs ${match.awayTeam} 的盘口为模型按球队实力预填，赛前应按真实体彩/市场赔率校正。`,
    homeNews: `${match.homeTeam} 新闻：补充首发、伤停、轮换、定位球和赛前发布会信息。`,
    awayNews: `${match.awayTeam} 新闻：补充旅行、适应场地、防线可用性和反击效率信息。`,
    h2hText: `${match.homeTeam} 与 ${match.awayTeam} 的直接交手样本不足时，可参考同洲或相近风格球队表现。`,
    lineupText: "首发判断：重点看门将、中卫、后腰和中锋是否主力出战。",
  };
}

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

function saveLocalBackup(data) {
  localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify({
    backedUpAt: new Date().toISOString(),
    data,
  }));
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

async function appendSharedTicket(ticket, matches = [], participants = []) {
  const response = await fetch("/api/state?append=ticket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticket, matches, participants }),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || "共享票据追加失败");
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
  if (match.scoreClearedAt) return "scheduled";
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

function validateBetItems(items, matches) {
  if (!items.length) return { ok: false, reason: "至少填写 1 个投注项。" };
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const line = `投注项 ${index + 1}`;
    const matched = findMatchForBet(item, matches);
    if (!matched && (!item.matchNo || !item.homeTeam || !item.awayTeam)) {
      return { ok: false, reason: `${line} 请关联赛程，或手填场次、主队和客队。` };
    }
    const market = normalizeMarket(item.market || item.playType, item.selection);
    const selection = normalizeSelection(item.selection);
    if (market === "胜平负" || market === "让球胜平负") {
      if (!["胜", "平", "负"].includes(selection)) return { ok: false, reason: `${line} 请选择胜、平或负。` };
      if (market === "让球胜平负" && !Number.isFinite(Number(item.handicap))) {
        return { ok: false, reason: `${line} 请填写让球数。主队让 1 球填 -1，主队受让 1 球填 1。` };
      }
    } else if (market === "比分") {
      if (!/^\d+:\d+$/.test(selection)) return { ok: false, reason: `${line} 请完整填写比分，例如 2:1。` };
    } else if (market === "总进球") {
      if (!["0", "1", "2", "3", "4", "5", "6", "7+"].includes(selection)) return { ok: false, reason: `${line} 请选择总进球数。` };
    }
    if (item.odds !== "" && item.odds !== undefined && item.odds !== null && !Number.isFinite(Number(item.odds))) {
      return { ok: false, reason: `${line} 的赔率格式不正确。` };
    }
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
  if (/^\s*7\s*\+\s*$/.test(text)) return "7+";
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
    const totalGoals = scores.home + scores.away;
    if (selection === "7+") return totalGoals >= 7;
    return String(totalGoals) === selection;
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

function suggestedPassType(items) {
  const count = (items || []).length;
  return count > 1 ? `${count}串1` : "单关";
}

function defaultBetItem() {
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

function scoreSelectionParts(selection) {
  const raw = String(selection || "").replace("：", ":");
  const partial = raw.match(/^(\d*)\s*:\s*(\d*)$/);
  if (partial) return { home: partial[1], away: partial[2] };
  const score = normalizeSelection(selection).match(/^(\d+):(\d+)$/);
  return {
    home: score ? score[1] : "",
    away: score ? score[2] : "",
  };
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function numeric(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function oddsToImplied(odds) {
  const values = odds.map((value) => numeric(value, 0));
  const raw = values.map((value) => value > 1 ? 1 / value : 0);
  const total = raw.reduce((sum, value) => sum + value, 0);
  return total > 0 ? raw.map((value) => value / total) : [0.45, 0.28, 0.27];
}

function poisson(k, lambda) {
  let factorial = 1;
  for (let index = 2; index <= k; index += 1) factorial *= index;
  return Math.exp(-lambda) * Math.pow(lambda, k) / factorial;
}

function scoreProbabilityGrid(homeLambda, awayLambda, maxGoals = 6) {
  const rows = [];
  for (let home = 0; home <= maxGoals; home += 1) {
    for (let away = 0; away <= maxGoals; away += 1) {
      rows.push({
        home,
        away,
        score: `${home}-${away}`,
        probability: poisson(home, homeLambda) * poisson(away, awayLambda),
      });
    }
  }
  return rows.sort((a, b) => b.probability - a.probability);
}

function outcomeStatsFromScores(scores) {
  const homeWin = scores.filter((row) => row.home > row.away).reduce((sum, row) => sum + row.probability, 0);
  const draw = scores.filter((row) => row.home === row.away).reduce((sum, row) => sum + row.probability, 0);
  const awayWin = scores.filter((row) => row.home < row.away).reduce((sum, row) => sum + row.probability, 0);
  const totalMass = homeWin + draw + awayWin;
  return {
    homeWin: totalMass ? homeWin / totalMass : homeWin,
    draw: totalMass ? draw / totalMass : draw,
    awayWin: totalMass ? awayWin / totalMass : awayWin,
  };
}

function calibrateLambdas(implied, targetGoals, seedHome, seedAway, netEdge) {
  let best = {
    homeLambda: seedHome,
    awayLambda: seedAway,
    loss: Number.POSITIVE_INFINITY,
  };
  for (let home = 0.3; home <= 3.6; home += 0.05) {
    for (let away = 0.25; away <= 3.4; away += 0.05) {
      const scores = scoreProbabilityGrid(home, away, 5);
      const stats = outcomeStatsFromScores(scores);
      const total = home + away;
      const edge = home - away;
      const loss =
        Math.pow(stats.homeWin - implied[0], 2) * 3.4 +
        Math.pow(stats.draw - implied[1], 2) * 3.8 +
        Math.pow(stats.awayWin - implied[2], 2) * 3.4 +
        Math.pow(total - targetGoals, 2) * 0.55 +
        Math.pow(edge - netEdge * 0.85, 2) * 0.18 +
        Math.pow(home - seedHome, 2) * 0.08 +
        Math.pow(away - seedAway, 2) * 0.08;
      if (loss < best.loss) {
        best = { homeLambda: home, awayLambda: away, loss };
      }
    }
  }
  return best;
}

function pickMainForecastScore(scores, outcomes) {
  const leaders = [
    { type: "home", probability: outcomes.homeWin, matches: (row) => row.home > row.away },
    { type: "draw", probability: outcomes.draw, matches: (row) => row.home === row.away },
    { type: "away", probability: outcomes.awayWin, matches: (row) => row.home < row.away },
  ].sort((a, b) => b.probability - a.probability);
  const exactTop = scores[0];
  const leader = leaders[0];
  const leaderScore = scores.find((row) => leader.matches(row)) || exactTop;
  if (leader.type !== "draw") {
    return leaderScore;
  }
  return exactTop;
}

function buildForecast(match, inputs) {
  const homeValue = numeric(inputs.homeValue, 0);
  const awayValue = numeric(inputs.awayValue, 0);
  const valueEdge = clamp(Math.log((homeValue + 25) / (awayValue + 25)) * 1.15, -1.2, 1.2);
  const implied = oddsToImplied([inputs.homeOdds, inputs.drawOdds, inputs.awayOdds]);
  const marketEdge = clamp((implied[0] - implied[2]) * 2.2, -1.1, 1.1);
  const asianEdge = clamp(-numeric(inputs.asianLine, 0) * 0.36, -0.8, 0.8);
  const attackDefenseEdge = clamp(((numeric(inputs.homeAttack, 5) - numeric(inputs.awayDefense, 5)) - (numeric(inputs.awayAttack, 5) - numeric(inputs.homeDefense, 5))) / 8, -1, 1);
  const situationalEdge =
    numeric(inputs.styleEdge, 0) * 0.14 +
    numeric(inputs.formEdge, 0) * 0.14 +
    numeric(inputs.h2hEdge, 0) * 0.08 +
    numeric(inputs.injuryEdge, 0) * 0.13 +
    numeric(inputs.restTravelEdge, 0) * 0.09 +
    numeric(inputs.weatherEdge, 0) * 0.06 +
    numeric(inputs.motivationEdge, 0) * 0.08;
  const netEdge = clamp(valueEdge * 0.2 + marketEdge * 0.28 + asianEdge * 0.12 + attackDefenseEdge * 0.22 + situationalEdge * 0.18, -1.35, 1.35);
  const baseGoals = clamp(numeric(inputs.baseGoals, 2.55), 1.5, 4.2);
  const overUnderLine = numeric(inputs.overUnderLine, baseGoals);
  const drawPull = implied[1] ? (implied[1] - 0.26) * 0.7 : 0;
  const overBias = clamp((1 / numeric(inputs.overOdds, 1.9) - 1 / numeric(inputs.underOdds, 1.9)) * 0.9, -0.28, 0.28);
  const totalGoals = clamp(baseGoals * 0.42 + overUnderLine * 0.58 + overBias + (numeric(inputs.homeAttack, 5) + numeric(inputs.awayAttack, 5) - 10) * 0.07 - Math.max(drawPull, 0) * 0.22, 1.4, 4.6);
  const seedHomeLambda = clamp(totalGoals / 2 + netEdge * 0.58 + numeric(inputs.homeAttack, 5) * 0.035 - numeric(inputs.awayDefense, 5) * 0.025, 0.25, 3.6);
  const seedAwayLambda = clamp(totalGoals - seedHomeLambda, 0.2, 3.4);
  const calibrated = calibrateLambdas(implied, totalGoals, seedHomeLambda, seedAwayLambda, netEdge);
  let homeLambda = clamp(calibrated.homeLambda, 0.25, 3.6);
  let awayLambda = clamp(calibrated.awayLambda, 0.2, 3.4);
  const favoriteProb = Math.max(implied[0], implied[2]);
  const handicapAbs = Math.abs(numeric(inputs.asianLine, 0));
  const mismatchPressure = clamp(
    (favoriteProb - 0.7) * 2.2 +
    (handicapAbs - 1.25) * 0.28 +
    Math.abs(valueEdge) * 0.1 +
    Math.max(0, Math.abs(attackDefenseEdge) - 0.55) * 0.35,
    0,
    0.78
  );
  if (mismatchPressure > 0 && favoriteProb >= 0.7 && handicapAbs >= 1.25) {
    if (implied[0] >= implied[2]) {
      homeLambda = clamp(homeLambda + mismatchPressure * 0.78, 0.25, 3.9);
      awayLambda = clamp(awayLambda - mismatchPressure * 0.86, 0.12, 2.8);
    } else {
      awayLambda = clamp(awayLambda + mismatchPressure * 0.78, 0.2, 3.7);
      homeLambda = clamp(homeLambda - mismatchPressure * 0.86, 0.12, 2.8);
    }
  }
  const adjustedTotalGoals = homeLambda + awayLambda;
  const scores = scoreProbabilityGrid(homeLambda, awayLambda);
  const outcomes = outcomeStatsFromScores(scores);
  const mainScore = pickMainForecastScore(scores, outcomes);
  const factors = [
    ["市场赔率", marketEdge, "赔率会聚合公开信息，是当前权重最高的输入。"],
    ["盘口让球", asianEdge, "亚洲让球盘反映强弱和赔付压力，临场变化需要重点关注。"],
    ["阵容身价", valueEdge, "身价代表阵容上限，但对单场预测只做中等权重。"],
    ["攻防匹配", attackDefenseEdge, "比较主队进攻对客队防守、客队进攻对主队防守。"],
    ["打法克制", numeric(inputs.styleEdge, 0) / 5, "正数表示主队打法更克制对手，负数相反。"],
    ["近期状态", numeric(inputs.formEdge, 0) / 5, "包含近况、进球质量、门将表现和临场信心。"],
    ["伤停影响", numeric(inputs.injuryEdge, 0) / 5, "核心伤停、轮换深度和关键位置缺口。"],
    ["赛程旅行", numeric(inputs.restTravelEdge, 0) / 5, "休息天数、跨时区、长途旅行和场地适应。"],
  ];
  return {
    match,
    homeLambda,
    awayLambda,
    topScores: scores.slice(0, 8),
    mainScore,
    exactTopScore: scores[0],
    probabilities: {
      home: outcomes.homeWin,
      draw: outcomes.draw,
      away: outcomes.awayWin,
    },
    implied,
    netEdge,
    totalGoals: adjustedTotalGoals,
    factors,
    confidence: clamp(0.58 + Math.abs(netEdge) * 0.14 + Math.abs(implied[0] - implied[2]) * 0.18 - implied[1] * 0.08, 0.48, 0.86),
  };
}

function forecastBacktestRows(matches) {
  return [...matches]
    .filter((match) => scorePair(match))
    .sort((a, b) => new Date(b.kickoffTime).getTime() - new Date(a.kickoffTime).getTime())
    .map((match) => {
      const inputs = forecastInputsForMatch(match);
      const forecast = buildForecast(match, inputs);
      const scores = scorePair(match);
      const predicted = forecast.mainScore;
      const actualOutcome = outcomeFromScores(scores.home, scores.away);
      const predictedOutcome = outcomeFromScores(predicted.home, predicted.away);
      return {
        match,
        forecast,
        actualScore: `${scores.home}-${scores.away}`,
        exactHit: predicted.home === scores.home && predicted.away === scores.away,
        outcomeHit: actualOutcome === predictedOutcome,
        goalError: Math.abs(predicted.home - scores.home) + Math.abs(predicted.away - scores.away),
      };
    });
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
    const localBeforeSync = data;
    loadSharedData()
      .then((shared) => {
        if (!alive) return;
        if (shared) {
          const localTicketCount = (localBeforeSync.tickets || []).length;
          const sharedTicketCount = (shared.tickets || []).length;
          if (sharedTicketCount === 0 && localTicketCount > 0) {
            saveSharedData(localBeforeSync)
              .then(() => setSyncStatus("线上票据为空，已用本机历史票据恢复共享数据。"))
              .catch((error) => setSyncStatus(`共享恢复失败：${error.message}`));
            return;
          }
          if (localTicketCount > sharedTicketCount) {
            saveLocalBackup(localBeforeSync);
          }
          setData(shared);
          saveData(shared);
          setSyncStatus(`共享数据已同步：${new Date().toLocaleTimeString("zh-CN", { hour12: false })}`);
        } else if ((localBeforeSync.tickets || []).length) {
          saveSharedData(localBeforeSync)
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

  function refreshSharedData() {
    setSyncStatus("正在同步共享数据...");
    return loadSharedData()
      .then((shared) => {
        if (shared) {
          setData(shared);
          saveData(shared);
          setSyncStatus(`共享数据已同步：${new Date().toLocaleTimeString("zh-CN", { hour12: false })}`);
        } else {
          setSyncStatus("暂无共享数据，本次修改后会自动创建。");
        }
      })
      .catch((error) => setSyncStatus(`共享同步失败：${error.message}`));
  }

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      loadSharedData()
        .then((shared) => {
          if (!shared) return;
          setData((current) => {
            const sharedUpdated = JSON.stringify({
              tickets: (shared.tickets || []).map((ticket) => [ticket.id, ticket.updatedAt]),
              matches: (shared.matches || []).map((match) => [match.id, match.updatedAt, match.homeScore, match.awayScore]),
            });
            const currentUpdated = JSON.stringify({
              tickets: (current.tickets || []).map((ticket) => [ticket.id, ticket.updatedAt]),
              matches: (current.matches || []).map((match) => [match.id, match.updatedAt, match.homeScore, match.awayScore]),
            });
            if (sharedUpdated === currentUpdated) return current;
            saveData(shared);
            setSyncStatus(`共享数据已自动同步：${new Date().toLocaleTimeString("zh-CN", { hour12: false })}`);
            return shared;
          });
        })
        .catch(() => {});
    }, 30000);
    return () => window.clearInterval(timer);
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

  function appendTicket(ticket, addedMatches = []) {
    setData((current) => {
      const existingMatchIds = new Set((current.matches || []).map((match) => match.id));
      const merged = migrateData({
        ...current,
        matches: [
          ...(current.matches || []),
          ...addedMatches.filter((match) => !existingMatchIds.has(match.id)),
        ],
        tickets: (current.tickets || []).some((item) => item.id === ticket.id)
          ? current.tickets
          : [ticket, ...(current.tickets || [])],
      });
      saveData(merged);
      return merged;
    });
    setSyncStatus("正在保存新增票据...");
    return appendSharedTicket(ticket, addedMatches, data.participants)
      .then(() => setSyncStatus(`新增票据已保存：${new Date().toLocaleTimeString("zh-CN", { hour12: false })}`))
      .catch((error) => {
        setSyncStatus(`新增票据共享保存失败：${error.message}`);
        throw error;
      });
  }

  function updateTicket(ticketId, patch) {
    commit({
      ...data,
      tickets: data.tickets.map((ticket) => (ticket.id === ticketId ? { ...ticket, ...patch, updatedAt: new Date().toISOString() } : ticket)),
    });
  }

  function replaceTicket(ticketId, nextTicket) {
    const nextData = {
      ...data,
      tickets: data.tickets.map((ticket) => ticket.id === ticketId ? { ...nextTicket, updatedAt: new Date().toISOString() } : ticket),
    };
    commit(settleTicketsByScores(nextData));
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
          <Tab id="forecast" active={activeTab} setActive={setActiveTab} icon={<Sparkles size={18} />} label="比分预测" />
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
            <button className="ghost" onClick={refreshSharedData}>
              <Search size={17} /> 同步共享数据
            </button>
            <button className="primary" onClick={lockBoard} disabled={data.locked}>
              <Award size={17} /> {data.locked ? "已锁榜" : "锁定最终榜"}
            </button>
          </div>
          <div className="syncStatus">{syncStatus}</div>
        </header>

        {activeTab !== "forecast" && <EventBanner rows={rows} stats={stats} />}

        {activeTab === "rank" && <RankView rows={rows} stats={stats} setSelectedUser={setSelectedUser} selectedUser={selectedUser} />}
        {activeTab === "upload" && <UploadView data={data} appendTicket={appendTicket} locked={data.locked} />}
        {activeTab === "tickets" && (
          <TicketsView
            data={data}
            filter={filter}
            setFilter={setFilter}
            participantFilter={ticketParticipantFilter}
            setParticipantFilter={setTicketParticipantFilter}
            updateTicket={updateTicket}
            replaceTicket={replaceTicket}
            removeTicket={removeTicket}
          />
        )}
        {activeTab === "forecast" && <ForecastView data={data} />}
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
    upload: "上传票据",
    tickets: "票据管理",
    forecast: "世界杯比分预测",
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

function ForecastView({ data }) {
  const upcoming = [...data.matches]
    .sort((a, b) => new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime())
    .filter((match) => !matchOutcome(match));
  const matches = upcoming.length ? upcoming : data.matches;
  const initialMatch = matches[0] || data.matches[0];
  const [matchId, setMatchId] = useState(initialMatch?.id || "");
  const [inputs, setInputs] = useState(() => forecastInputsForMatch(initialMatch));
  const selectedMatch = data.matches.find((match) => match.id === matchId) || matches[0] || data.matches[0];
  const forecast = selectedMatch ? buildForecast(selectedMatch, inputs) : null;
  const backtestRows = forecastBacktestRows(data.matches);
  const backtestStats = backtestRows.length
    ? {
        exact: backtestRows.filter((row) => row.exactHit).length,
        outcome: backtestRows.filter((row) => row.outcomeHit).length,
        avgError: backtestRows.reduce((sum, row) => sum + row.goalError, 0) / backtestRows.length,
      }
    : null;

  function setInput(field, value) {
    setInputs((next) => ({ ...next, [field]: value }));
  }

  function changeForecastMatch(nextMatchId) {
    const nextMatch = data.matches.find((match) => match.id === nextMatchId) || matches[0] || data.matches[0];
    setMatchId(nextMatchId);
    setInputs(forecastInputsForMatch(nextMatch));
  }

  function loadMarketPreset() {
    setInputs((next) => ({
      ...next,
      homeValue: "191.85",
      awayValue: "49.25",
      homeOdds: "1.67",
      drawOdds: "4.10",
      awayOdds: "8.30",
      asianLine: "-1",
      overUnderLine: "2.5",
      overOdds: "1.86",
      underOdds: "1.98",
      returnRate: "95",
      homeAttack: "7",
      homeDefense: "6",
      awayAttack: "4",
      awayDefense: "5",
      styleEdge: "1",
      formEdge: "1",
      h2hEdge: "0",
      injuryEdge: "0",
      restTravelEdge: "0",
      weatherEdge: "0",
      motivationEdge: "1",
      baseGoals: "2.65",
      marketNote: "主队让一球低水，市场认为主队有明显优势，但大胜仍取决于早球效率。",
      homeNews: "主队新闻：阵容身价优势明显，边路推进和定位球质量占优。",
      awayNews: "客队新闻：客队更依赖防守反击，若早段失球会被迫提高阵型。",
      h2hText: "过往战绩：双方正式交手样本较少，更多参考相近风格球队表现。",
      lineupText: "首发判断：若主队主力中锋和双边锋首发，2球以上胜面会提高。",
    }));
  }

  if (!selectedMatch || !forecast) {
    return <div className="empty">暂无可预测比赛。</div>;
  }

  return (
    <section className="forecastLayout forecastScreen">
      <div className="forecastHero">
        <div>
          <span className="eventEyebrow"><Sparkles size={15} /> WORLD CUP FORECAST ENGINE</span>
          <h2>世界杯比分预测</h2>
          <p>把盘口、赔率、身价、攻防强弱、打法克制、近况、伤停、新闻和过往战绩换算成因子积分，再用 Poisson 进球分布推演比分。</p>
        </div>
        <div className="forecastSummary">
          <span>模型状态</span>
          <strong>factor-poisson-v1</strong>
          <small>盘口、赔率与新闻手动录入</small>
        </div>
      </div>

      <div className="forecastGrid">
        <div className="forecastControls forecastCard">
          <div className="panelHeader">
            <div>
              <h2>数据输入</h2>
              <p>赔率、盘口和新闻建议按赛前最新信息填写。</p>
            </div>
            <button type="button" className="ghost compactBtn" onClick={loadMarketPreset}>载入示例</button>
          </div>
          <label>预测比赛
            <select value={selectedMatch.id} onChange={(event) => changeForecastMatch(event.target.value)}>
              {matches.map((match) => (
                <option key={match.id} value={match.id}>
                  {match.matchNo} {match.homeTeam} vs {match.awayTeam} · {match.kickoffTime}
                </option>
              ))}
            </select>
          </label>
          <div className="forecastSectionTitle">盘口与赔率</div>
          <div className="factorGrid">
            <label>主队身价/实力<input type="number" step="0.01" value={inputs.homeValue} onChange={(e) => setInput("homeValue", e.target.value)} /></label>
            <label>客队身价/实力<input type="number" step="0.01" value={inputs.awayValue} onChange={(e) => setInput("awayValue", e.target.value)} /></label>
            <label>主胜赔率<input type="number" step="0.01" value={inputs.homeOdds} onChange={(e) => setInput("homeOdds", e.target.value)} /></label>
            <label>平局赔率<input type="number" step="0.01" value={inputs.drawOdds} onChange={(e) => setInput("drawOdds", e.target.value)} /></label>
            <label>客胜赔率<input type="number" step="0.01" value={inputs.awayOdds} onChange={(e) => setInput("awayOdds", e.target.value)} /></label>
            <label>亚洲让球<input type="number" step="0.25" value={inputs.asianLine} onChange={(e) => setInput("asianLine", e.target.value)} /></label>
            <label>大小球盘口<input type="number" step="0.25" value={inputs.overUnderLine} onChange={(e) => setInput("overUnderLine", e.target.value)} /></label>
            <label>大球赔率<input type="number" step="0.01" value={inputs.overOdds} onChange={(e) => setInput("overOdds", e.target.value)} /></label>
            <label>小球赔率<input type="number" step="0.01" value={inputs.underOdds} onChange={(e) => setInput("underOdds", e.target.value)} /></label>
            <label>返还率 %<input type="number" step="0.1" value={inputs.returnRate} onChange={(e) => setInput("returnRate", e.target.value)} /></label>
            <label>预期总进球<input type="number" step="0.05" value={inputs.baseGoals} onChange={(e) => setInput("baseGoals", e.target.value)} /></label>
          </div>
          <div className="forecastSectionTitle">攻防评分</div>
          <div className="factorGrid">
            <label>主队进攻<input type="number" min="1" max="10" value={inputs.homeAttack} onChange={(e) => setInput("homeAttack", e.target.value)} /></label>
            <label>主队防守<input type="number" min="1" max="10" value={inputs.homeDefense} onChange={(e) => setInput("homeDefense", e.target.value)} /></label>
            <label>客队进攻<input type="number" min="1" max="10" value={inputs.awayAttack} onChange={(e) => setInput("awayAttack", e.target.value)} /></label>
            <label>客队防守<input type="number" min="1" max="10" value={inputs.awayDefense} onChange={(e) => setInput("awayDefense", e.target.value)} /></label>
          </div>
          <div className="sliderGrid">
            {[
              ["styleEdge", "打法克制"],
              ["formEdge", "近期状态"],
              ["h2hEdge", "过往战绩"],
              ["injuryEdge", "伤停影响"],
              ["restTravelEdge", "赛程旅行"],
              ["weatherEdge", "天气场地"],
              ["motivationEdge", "战意压力"],
            ].map(([field, label]) => (
              <label key={field}>{label}<span>{inputs[field]}</span>
                <input type="range" min="-5" max="5" step="1" value={inputs[field]} onChange={(e) => setInput(field, e.target.value)} />
              </label>
            ))}
          </div>
        </div>

        <div className="forecastResult forecastCard">
          <div className="matchForecastHeader">
            <div>
              <span>{selectedMatch.matchNo}</span>
              <strong>{selectedMatch.homeTeam}</strong>
              <small>HOME · {numeric(inputs.homeValue).toFixed(2)}</small>
            </div>
            <div className="mainScoreBox">
              <span>主推比分</span>
              <strong>{forecast.mainScore.score}</strong>
              <small>置信度 {percent(forecast.confidence)}</small>
            </div>
            <div>
              <span>{selectedMatch.kickoffTime}</span>
              <strong>{selectedMatch.awayTeam}</strong>
              <small>AWAY · {numeric(inputs.awayValue).toFixed(2)}</small>
            </div>
          </div>

          <div className="probGrid">
            <ForecastProb label="主胜" value={forecast.probabilities.home} />
            <ForecastProb label="平局" value={forecast.probabilities.draw} />
            <ForecastProb label="客胜" value={forecast.probabilities.away} />
            <ForecastProb label="预期进球" value={forecast.totalGoals / 5} text={`${forecast.homeLambda.toFixed(2)}:${forecast.awayLambda.toFixed(2)}`} />
          </div>

          <div className="scoreTriplet">
            <div><span>主推</span><strong>{forecast.mainScore.score}</strong><small>跟随最高赛果方向</small></div>
            <div><span>概率最高</span><strong>{forecast.exactTopScore.score}</strong><small>单一比分 {percent(forecast.exactTopScore.probability)}</small></div>
            <div><span>进取</span><strong>{forecast.topScores.find((row) => Math.abs(row.home - row.away) >= 2)?.score || forecast.topScores[2]?.score}</strong><small>拉开比分</small></div>
          </div>

          <div className="forecastPanels">
            <div>
              <h3>比分分布 Top 8</h3>
              <div className="scoreBars">
                {forecast.topScores.map((row) => (
                  <div key={row.score}>
                    <b>{row.score}</b>
                    <span><i style={{ width: `${Math.max(5, row.probability * 520)}%` }} /></span>
                    <em>{percent(row.probability)}</em>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3>因子贡献</h3>
              <div className="factorList">
                {forecast.factors.map(([label, value, note]) => (
                  <div key={label}>
                    <b>{label}</b>
                    <span className={value >= 0 ? "positive" : "negative"}>{value >= 0 ? "+" : ""}{value.toFixed(3)}</span>
                    <small>{note}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="riskBox">
            <b>模型判断</b>
            <span>赔率隐含概率：主胜 {percent(forecast.implied[0])}，平 {percent(forecast.implied[1])}，客胜 {percent(forecast.implied[2])}。盘口：{inputs.asianLine}，大小球：{inputs.overUnderLine}。</span>
            <span>风险点：小组赛轮换、临场伤停、红牌、天气和早球会显著改变比分分布。这个工具适合辅助判断，不保证命中。</span>
          </div>
        </div>

        <div className="forecastIntel forecastCard">
          <h2>专业解读</h2>
          <div className="intelCard">
            <span>模型口径</span>
            <strong>盘口 + 赔率 + 因子 Poisson</strong>
            <p>市场 {forecast.factors[0][1] >= 0 ? "偏主队" : "偏客队"}，盘口因子 {forecast.factors[1][1] >= 0 ? "支持主队" : "支持客队"}，当前净优势 {forecast.netEdge.toFixed(3)}。</p>
          </div>
          <label>盘口解读<textarea rows="3" value={inputs.marketNote} onChange={(e) => setInput("marketNote", e.target.value)} /></label>
          <label>主队新闻<textarea rows="3" value={inputs.homeNews} onChange={(e) => setInput("homeNews", e.target.value)} /></label>
          <label>客队新闻<textarea rows="3" value={inputs.awayNews} onChange={(e) => setInput("awayNews", e.target.value)} /></label>
          <label>过往战绩<textarea rows="3" value={inputs.h2hText} onChange={(e) => setInput("h2hText", e.target.value)} /></label>
          <label>首发与伤停<textarea rows="3" value={inputs.lineupText} onChange={(e) => setInput("lineupText", e.target.value)} /></label>
        </div>
      </div>

      <div className="forecastBacktest forecastCard">
        <div className="panelHeader">
          <div>
            <h2>历史回测</h2>
            <p>展示已录入比分比赛的模型复盘，用于观察预测倾向和误差。</p>
          </div>
          {backtestStats && (
            <div className="backtestStats">
              <span>赛果命中 {percent(backtestStats.outcome / backtestRows.length)}</span>
              <span>比分命中 {percent(backtestStats.exact / backtestRows.length)}</span>
              <span>平均偏差 {backtestStats.avgError.toFixed(2)} 球</span>
            </div>
          )}
        </div>
        {backtestRows.length ? (
          <div className="backtestList">
            {backtestRows.slice(0, 12).map((row) => (
              <div className="backtestItem" key={row.match.id}>
                <div>
                  <span>{row.match.matchNo} · {row.match.kickoffTime}</span>
                  <strong>{row.match.homeTeam} vs {row.match.awayTeam}</strong>
                </div>
                <div>
                  <span>预测</span>
                  <strong>{row.forecast.mainScore.score}</strong>
                  <small>{row.forecast.topScores.slice(0, 3).map((score) => score.score).join(" / ")}</small>
                </div>
                <div>
                  <span>赛果</span>
                  <strong>{row.actualScore}</strong>
                  <small>{row.outcomeHit ? "方向命中" : "方向未中"} · 偏差 {row.goalError}</small>
                </div>
                <em className={row.exactHit ? "hit" : row.outcomeHit ? "partial" : "miss"}>
                  {row.exactHit ? "比分命中" : row.outcomeHit ? "赛果命中" : "未命中"}
                </em>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty compactEmpty">暂无已录入比分的比赛。等赛程里填完比分后，这里会自动出现回测。</div>
        )}
      </div>
    </section>
  );
}

function ForecastProb({ label, value, text }) {
  return (
    <div className="forecastProb">
      <span>{label}</span>
      <strong>{text || percent(value)}</strong>
    </div>
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

function UploadView({ data, appendTicket, locked }) {
  const [form, setForm] = useState({
    participantId: data.participants[0]?.id || "",
    ticketNo: "",
    purchaseTime: formatDateTimeInput(new Date()),
    playType: "单关",
    stakeAmount: "",
    stakeUnits: "1",
    multiplier: "",
    estimatedPrize: "",
    selectionText: "",
    betItems: [defaultBetItem()],
    matchIds: [],
    imageUrl: "",
  });
  const [uploadStatus, setUploadStatus] = useState("");

  async function onFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const imageUrl = await compressImageFile(file);
    setForm((next) => ({ ...next, imageUrl }));
    setUploadStatus("图片已上传，请手动填写票据信息和投注项。");
  }

  async function submit(event) {
    event.preventDefault();
    if (locked) {
      alert("榜单已锁定，不能新增票据。");
      return;
    }
    const participant = data.participants.find((person) => person.id === form.participantId);
    const itemCheck = validateBetItems(form.betItems, data.matches);
    if (!itemCheck.ok) {
      alert(itemCheck.reason);
      return;
    }
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
    setUploadStatus("正在保存新增票据...");
    await appendTicket(ticket, addedMatches);
    setForm((next) => ({
      ...next,
      ticketNo: "",
      stakeAmount: "",
      stakeUnits: "1",
      multiplier: "",
      estimatedPrize: "",
      playType: "单关",
      selectionText: "",
      betItems: [defaultBetItem()],
      matchIds: [],
      imageUrl: "",
    }));
    setUploadStatus("已保存为待比赛票据");
  }

  return (
    <section className="twoColumn">
      <form className="panel formPanel" onSubmit={submit}>
        <div className="panelHeader">
          <div>
            <h2>上传体彩单</h2>
            <p>按票面逐行填写：比赛、玩法、选择、赔率；串关和混合玩法都可以录。</p>
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
          <span>{form.imageUrl ? "已选择图片，可重新上传" : "选择票据图片"}</span>
          <input type="file" accept="image/*" onChange={onFile} />
        </label>
        {uploadStatus && <div className="hint">{uploadStatus}</div>}
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
          <label>购买时间<input type="datetime-local" value={form.purchaseTime} onChange={(e) => setForm({ ...form, purchaseTime: e.target.value })} /></label>
          <label>过关方式
            <select value={form.playType} onChange={(e) => setForm({ ...form, playType: e.target.value })}>
              {passTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
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
            const nextPassType = form.playType === "单关" || /^\d+串1$/.test(form.playType)
              ? suggestedPassType(betItems)
              : form.playType;
            setForm({ ...form, playType: nextPassType, betItems, matchIds: Array.from(new Set([...form.matchIds, ...matchedIds])) });
          }}
        />
        <label>备注，可不填<textarea value={form.selectionText} onChange={(e) => setForm({ ...form, selectionText: e.target.value })} rows="2" placeholder="比如票面特殊说明、手工核对备注" /></label>
        <button className="primary wide" disabled={locked}><Check size={17} /> 确认提交</button>
      </form>

      <div className="panel previewPanel">
        <h2>票据预览</h2>
        {form.imageUrl ? <img src={form.imageUrl} alt="票据预览" /> : <div className="empty">上传后显示票据图片</div>}
      </div>
    </section>
  );
}

function BetItemsEditor({ items, matches, onChange }) {
  function updateItem(index, patch) {
    onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  function emptyItem() {
    return defaultBetItem();
  }

  function addItem() {
    onChange([...items, emptyItem()]);
  }

  function duplicateItem(index) {
    onChange([...items.slice(0, index + 1), { ...items[index] }, ...items.slice(index + 1)]);
  }

  function removeItem(index) {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  }

  function selectionField(item, index, market) {
    if (market === "比分") {
      const score = scoreSelectionParts(item.selection);
      return (
        <label>比分选择
          <div className="scoreInputs betScoreInputs">
            <input
              type="number"
              min="0"
              value={score.home}
              onChange={(e) => updateItem(index, { selection: `${e.target.value}:${score.away}` })}
              aria-label="主队比分选择"
            />
            <span>:</span>
            <input
              type="number"
              min="0"
              value={score.away}
              onChange={(e) => updateItem(index, { selection: `${score.home}:${e.target.value}` })}
              aria-label="客队比分选择"
            />
          </div>
        </label>
      );
    }
    if (market === "总进球") {
      return (
        <label>总进球
          <select value={normalizeSelection(item.selection)} onChange={(e) => updateItem(index, { selection: e.target.value })}>
            <option value="">请选择</option>
            {["0", "1", "2", "3", "4", "5", "6", "7+"].map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      );
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
          <strong>投注项</strong>
          <span>一张票买几行就填几行；混合玩法串关也逐行填写</span>
        </div>
        <button className="ghost compactBtn" type="button" onClick={addItem}><Plus size={15} /> 新增投注项</button>
      </div>
      {!items.length && <div className="empty compact">暂无投注项，请点击“新增投注项”。</div>}
      {items.map((item, index) => {
        const matched = findMatchForBet(item, matches);
        const market = normalizeMarket(item.market || item.playType, item.selection);
        return (
          <div className="betItemRow" key={`${item.matchNo}-${index}`}>
            <div className="betItemIndex">投注项 {index + 1}</div>
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
            <label>玩法
              <select value={market} onChange={(e) => updateItem(index, { market: e.target.value, selection: "", handicap: e.target.value === "让球胜平负" ? item.handicap : "" })}>
                <option value="胜平负">胜平负</option>
                <option value="让球胜平负">让球胜平负</option>
                <option value="比分">比分</option>
                <option value="总进球">总进球</option>
              </select>
            </label>
            {market === "让球胜平负" && (
              <label>让球数<input type="number" step="0.5" value={item.handicap ?? ""} onChange={(e) => updateItem(index, { handicap: e.target.value })} placeholder="主队让球，如 -1" /></label>
            )}
            {selectionField(item, index, market)}
            <label>赔率<input type="number" step="0.001" value={item.odds || ""} onChange={(e) => updateItem(index, { odds: e.target.value })} /></label>
            {!matched && (
              <div className="manualMatchFields wideField">
                <label>场次<input value={item.matchNo || ""} onChange={(e) => updateItem(index, { matchNo: e.target.value })} placeholder="如 M003" /></label>
                <label>主队<input value={item.homeTeam || ""} onChange={(e) => updateItem(index, { homeTeam: e.target.value })} /></label>
                <label>客队<input value={item.awayTeam || ""} onChange={(e) => updateItem(index, { awayTeam: e.target.value })} /></label>
              </div>
            )}
            <div className={matched ? "matchLink ok" : "matchLink warn"}>
              {matched
                ? `已匹配：${matched.matchUid || matched.matchNo} · ${matched.homeTeam} vs ${matched.awayTeam}`
                : "未匹配赛程，可手填场次和双方"}
            </div>
            {market === "让球胜平负" && <div className="matchLink warn">提示：主队让 1 球填 -1；主队受让 1 球填 1。</div>}
            <div className="betItemActions wideField">
              <button className="ghost compactBtn" type="button" onClick={() => duplicateItem(index)}>复制本项</button>
              <button className="ghost compactBtn" type="button" onClick={() => removeItem(index)} disabled={items.length <= 1}>删除投注项</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ticketToEditForm(ticket) {
  return {
    participantId: ticket.participantId || "",
    purchaseTime: ticket.purchaseTime || formatDateTimeInput(new Date()),
    playType: ticket.playType || "单关",
    stakeAmount: ticket.stakeAmount ?? "",
    stakeUnits: ticket.stakeUnits ?? "1",
    multiplier: ticket.multiplier ?? "",
    estimatedPrize: ticket.estimatedPrize ?? "",
    selectionText: ticket.selectionText || "",
    betItems: (ticket.betItems || []).map((item) => ({ ...item })),
    matchIds: [...(ticket.matchIds || [])],
    imageUrl: ticket.imageUrl || "",
  };
}

function TicketsView({ data, filter, setFilter, participantFilter, setParticipantFilter, updateTicket, replaceTicket, removeTicket }) {
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState(null);
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

  function startEdit(ticket) {
    setEditingId(ticket.id);
    setEditForm(ticketToEditForm(ticket));
  }

  function cancelEdit() {
    setEditingId("");
    setEditForm(null);
  }

  async function replaceEditImage(file) {
    if (!file || !editForm) return;
    const imageUrl = await compressImageFile(file);
    setEditForm({ ...editForm, imageUrl });
  }

  function saveEdit(ticket) {
    if (!editForm) return;
    if (!Number(editForm.stakeAmount)) {
      alert("请填写有效投注金额。");
      return;
    }
    const itemCheck = validateBetItems(editForm.betItems, data.matches);
    if (!itemCheck.ok) {
      alert(itemCheck.reason);
      return;
    }
    const matchedIds = new Set(editForm.matchIds || []);
    editForm.betItems.forEach((item) => {
      const matched = findMatchForBet(item, data.matches);
      if (matched) matchedIds.add(matched.id);
    });
    const selectedMatches = Array.from(matchedIds).map((id) => data.matches.find((match) => match.id === id)).filter(Boolean);
    const gate = canSubmitTicket(selectedMatches, editForm.purchaseTime);
    if (!gate.ok) {
      alert(gate.reason);
      return;
    }
    const normalizedBetItems = editForm.betItems.map((item) => {
      const matched = findMatchForBet(item, selectedMatches);
      return {
        ...item,
        matchId: matched?.id || item.matchId || "",
        matchUid: matched?.matchUid || item.matchUid || "",
        matchNo: matched?.matchNo || item.matchNo || "",
        market: normalizeMarket(item.market || item.playType || editForm.playType, item.selection),
        handicap: item.handicap === "" || item.handicap === undefined || item.handicap === null ? "" : Number(item.handicap),
        selection: normalizeSelection(item.selection),
        odds: Number(item.odds || 0),
      };
    });
    replaceTicket(ticket.id, {
      ...ticket,
      participantId: editForm.participantId,
      imageUrl: editForm.imageUrl,
      purchaseTime: editForm.purchaseTime,
      playType: editForm.playType || "单关",
      stakeAmount: Number(editForm.stakeAmount),
      stakeUnits: Number(editForm.stakeUnits || 1),
      multiplier: Number(editForm.multiplier || 0),
      estimatedPrize: Number(editForm.estimatedPrize || 0),
      actualPrize: 0,
      status: "pending_match",
      settledAt: null,
      settledBy: null,
      matchIds: selectedMatches.map((match) => match.id),
      betItems: normalizedBetItems,
      selectionText: editForm.selectionText.trim(),
    });
    cancelEdit();
  }

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
                  <button className="ghost" onClick={() => startEdit(ticket)} disabled={data.locked}>
                    编辑
                  </button>
                  <button className="ghost" onClick={() => updateTicket(ticket.id, { status: "void", actualPrize: 0 })} disabled={data.locked}>
                    作废
                  </button>
                  <button className="iconBtn" onClick={() => removeTicket(ticket.id)} disabled={data.locked} title="删除">
                    <Trash2 size={16} />
                  </button>
                </div>
                {editingId === ticket.id && editForm && (
                  <div className="ticketEditForm">
                    <div className="editPreview">
                      {editForm.imageUrl ? <img src={editForm.imageUrl} alt="票据预览" /> : <div className="empty compact">暂无图片</div>}
                      <label className="ghost compactBtn">
                        更换图片
                        <input type="file" accept="image/*" onChange={(event) => replaceEditImage(event.target.files?.[0])} hidden />
                      </label>
                    </div>
                    <div className="fieldGrid">
                      <label>参与者
                        <select value={editForm.participantId} onChange={(event) => setEditForm({ ...editForm, participantId: event.target.value })}>
                          {data.participants.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                        </select>
                      </label>
                      <label>购买时间<input type="datetime-local" value={editForm.purchaseTime} onChange={(e) => setEditForm({ ...editForm, purchaseTime: e.target.value })} /></label>
                      <label>过关方式
                        <select value={editForm.playType} onChange={(e) => setEditForm({ ...editForm, playType: e.target.value })}>
                          {passTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </label>
                      <label>投注金额<input type="number" min="0" step="0.01" value={editForm.stakeAmount} onChange={(e) => setEditForm({ ...editForm, stakeAmount: e.target.value })} /></label>
                      <label>倍数<input type="number" min="0" step="1" value={editForm.multiplier} onChange={(e) => setEditForm({ ...editForm, multiplier: e.target.value })} /></label>
                      <label>注数<input type="number" min="1" step="1" value={editForm.stakeUnits} onChange={(e) => setEditForm({ ...editForm, stakeUnits: e.target.value })} /></label>
                      <label>预计奖金<input type="number" min="0" step="0.01" value={editForm.estimatedPrize} onChange={(e) => setEditForm({ ...editForm, estimatedPrize: e.target.value })} /></label>
                    </div>
                    {(() => {
                      const draftMath = ticketDraftMath(editForm);
                      return (
                        <div className="calcHint">
                          <span>理论投注金额：{money(draftMath.stakeAmount)} 元 = 2元 x {draftMath.multiplier || "-"} 倍 x {draftMath.stakeUnits || "-"} 注</span>
                          <span>赔率乘积：{draftMath.oddsProduct ? draftMath.oddsProduct.toFixed(3) : "-"}</span>
                          <span>理论最高奖金：{money(draftMath.estimatedPrize)} 元</span>
                          <button type="button" className="ghost compactBtn" onClick={() => setEditForm({ ...editForm, stakeAmount: draftMath.stakeAmount || editForm.stakeAmount, estimatedPrize: draftMath.estimatedPrize || editForm.estimatedPrize })}>套用计算值</button>
                        </div>
                      );
                    })()}
                    <BetItemsEditor
                      items={editForm.betItems}
                      matches={data.matches}
                      onChange={(betItems) => {
                        const matchedIds = betItems.map((item) => findMatchForBet(item, data.matches)?.id).filter(Boolean);
                        const nextPassType = editForm.playType === "单关" || /^\d+串1$/.test(editForm.playType)
                          ? suggestedPassType(betItems)
                          : editForm.playType;
                        setEditForm({ ...editForm, playType: nextPassType, betItems, matchIds: Array.from(new Set([...(editForm.matchIds || []), ...matchedIds])) });
                      }}
                    />
                    <label>投注内容<textarea value={editForm.selectionText} onChange={(e) => setEditForm({ ...editForm, selectionText: e.target.value })} rows="3" /></label>
                    <div className="rowActions">
                      <button type="button" className="primary compactBtn" onClick={() => saveEdit(ticket)}>保存修改</button>
                      <button type="button" className="ghost compactBtn" onClick={cancelEdit}>取消</button>
                    </div>
                  </div>
                )}
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
    const homeScore = String(draft.homeScore ?? "").trim();
    const awayScore = String(draft.awayScore ?? "").trim();
    if (!homeScore && !awayScore) {
      updateMatch(match.id, {
        homeScore: "",
        awayScore: "",
        scoreConfirmedAt: null,
        scoreClearedAt: new Date().toISOString(),
      });
      return;
    }
    if (!homeScore || !awayScore) {
      alert("请先填写主队和客队比分。");
      return;
    }
    updateMatch(match.id, {
      homeScore,
      awayScore,
      scoreConfirmedAt: new Date().toISOString(),
      scoreClearedAt: null,
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

