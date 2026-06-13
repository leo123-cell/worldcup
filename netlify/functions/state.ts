import { getStore } from "@netlify/blobs";

const STORE_NAME = "worldcup-tracker";
const STATE_KEY = "state-v1";
const BACKUP_PREFIX = "state-backup-";

export default async (req: Request) => {
  const store = getStore({ name: STORE_NAME, consistency: "strong" });
  const url = new URL(req.url);

  if (req.method === "GET") {
    if (url.searchParams.get("backups") === "1") {
      const { blobs } = await store.list({ prefix: BACKUP_PREFIX });
      return json({ backups: blobs.map((blob) => blob.key).sort().reverse().slice(0, 20) });
    }
    const backupKey = url.searchParams.get("backup");
    if (backupKey?.startsWith(BACKUP_PREFIX)) {
      const backup = await store.get(backupKey, { type: "json" });
      return json({ data: backup || null });
    }
    const data = await store.get(STATE_KEY, { type: "json" });
    return json({ data: data || null });
  }

  if (req.method === "POST") {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json({ error: "\u8bf7\u6c42\u6570\u636e\u683c\u5f0f\u4e0d\u6b63\u786e\u3002" }, 400);
    }
    const current = await store.get(STATE_KEY, { type: "json" });
    if (url.searchParams.get("append") === "ticket") {
      const ticket = (body as any).ticket;
      if (!ticket?.id) return json({ error: "\u7f3a\u5c11\u7968\u636e\u6570\u636e\u3002" }, 400);
      const existing = current && typeof current === "object"
        ? current as any
        : { participants: (body as any).participants || [], matches: [], tickets: [], locked: false };
      if (existing.locked) return json({ error: "\u699c\u5355\u5df2\u9501\u5b9a\uff0c\u4e0d\u80fd\u65b0\u589e\u7968\u636e\u3002" }, 409);
      const incomingMatches = Array.isArray((body as any).matches) ? (body as any).matches : [];
      const matchMap = new Map((existing.matches || []).map((match: any) => [match.id, match]));
      for (const match of incomingMatches) {
        if (match?.id && !matchMap.has(match.id)) matchMap.set(match.id, match);
      }
      const tickets = Array.isArray(existing.tickets) ? existing.tickets : [];
      const next = {
        ...existing,
        participants: Array.isArray(existing.participants) && existing.participants.length
          ? existing.participants
          : ((body as any).participants || []),
        matches: Array.from(matchMap.values()),
        tickets: tickets.some((item: any) => item.id === ticket.id) ? tickets : [ticket, ...tickets],
      };
      if (current) {
        await store.setJSON(`${BACKUP_PREFIX}${Date.now()}`, current);
      }
      await store.setJSON(STATE_KEY, next);
      return json({ ok: true, savedAt: new Date().toISOString(), ticketCount: next.tickets.length });
    }
    const currentTickets = Array.isArray((current as any)?.tickets) ? (current as any).tickets.length : 0;
    const nextTickets = Array.isArray((body as any)?.tickets) ? (body as any).tickets.length : 0;
    const allowTicketShrink = url.searchParams.get("allowTicketShrink") === "1";
    if (currentTickets > 0 && nextTickets < currentTickets && !allowTicketShrink) {
      return json({
        error: `已拦截票据数据减少覆盖。当前线上 ${currentTickets} 张，本次保存 ${nextTickets} 张。请先同步共享数据再操作。`,
        currentTickets,
        nextTickets,
      }, 409);
    }
    if (current) {
      await store.setJSON(`${BACKUP_PREFIX}${Date.now()}`, current);
    }
    await store.setJSON(STATE_KEY, body);
    return json({ ok: true, savedAt: new Date().toISOString() });
  }

  return json({ error: "Method not allowed" }, 405);
};

export const config = {
  path: "/api/state",
  method: ["GET", "POST"],
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
