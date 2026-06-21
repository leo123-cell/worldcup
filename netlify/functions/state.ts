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
    return json({ data: url.searchParams.get("omitImages") === "1" ? stripImages(data) : data || null });
  }

  if (req.method === "POST") {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json({ error: "Invalid request body." }, 400);
    }

    const current = await store.get(STATE_KEY, { type: "json" });

    if (url.searchParams.get("delete") === "ticket") {
      const ticketId = (body as any).ticketId;
      if (!ticketId) return json({ error: "Missing ticket id." }, 400);
      const existing = current && typeof current === "object"
        ? current as any
        : { participants: [], matches: [], tickets: [], locked: false };
      if (existing.locked) return json({ error: "Leaderboard is locked." }, 409);
      const tickets = Array.isArray(existing.tickets) ? existing.tickets : [];
      const next = {
        ...existing,
        tickets: tickets.filter((ticket: any) => ticket.id !== ticketId),
      };
      if (current) await store.setJSON(`${BACKUP_PREFIX}${Date.now()}`, current);
      await store.setJSON(STATE_KEY, next);
      return json({ ok: true, savedAt: new Date().toISOString(), ticketCount: next.tickets.length });
    }

    if (url.searchParams.get("append") === "ticket") {
      const ticket = (body as any).ticket;
      if (!ticket?.id) return json({ error: "Missing ticket data." }, 400);
      const existing = current && typeof current === "object"
        ? current as any
        : { participants: (body as any).participants || [], matches: [], tickets: [], locked: false };
      if (existing.locked) return json({ error: "Leaderboard is locked." }, 409);

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
      if (current) await store.setJSON(`${BACKUP_PREFIX}${Date.now()}`, current);
      await store.setJSON(STATE_KEY, next);
      return json({ ok: true, savedAt: new Date().toISOString(), ticketCount: next.tickets.length });
    }

    const currentTickets = Array.isArray((current as any)?.tickets) ? (current as any).tickets.length : 0;
    const nextTickets = Array.isArray((body as any)?.tickets) ? (body as any).tickets.length : 0;
    const allowTicketShrink = url.searchParams.get("allowTicketShrink") === "1";
    if (currentTickets > 0 && nextTickets < currentTickets && !allowTicketShrink) {
      return json({
        error: `Blocked stale ticket overwrite. Current has ${currentTickets}, incoming has ${nextTickets}. Sync shared data first.`,
        currentTickets,
        nextTickets,
      }, 409);
    }

    const nextState = current && typeof current === "object" && !allowTicketShrink
      ? mergeState(current as any, body as any)
      : body;
    if (current) await store.setJSON(`${BACKUP_PREFIX}${Date.now()}`, current);
    await store.setJSON(STATE_KEY, nextState);
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

function mergeState(current: any, incoming: any) {
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

function mergeById(currentItems: any, incomingItems: any) {
  const currentList = Array.isArray(currentItems) ? currentItems : [];
  const incomingList = Array.isArray(incomingItems) ? incomingItems : [];
  const currentMap = new Map(currentList.filter((item: any) => item?.id).map((item: any) => [item.id, item]));
  const incomingMap = new Map(incomingList.filter((item: any) => item?.id).map((item: any) => [item.id, item]));
  const ids = [
    ...incomingList.filter((item: any) => item?.id).map((item: any) => item.id),
    ...currentList.filter((item: any) => item?.id && !incomingMap.has(item.id)).map((item: any) => item.id),
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

function itemTime(item: any) {
  const value = Date.parse(item?.updatedAt || item?.createdAt || "");
  return Number.isFinite(value) ? value : 0;
}

function stripImages(data: any) {
  if (!data || typeof data !== "object") return data || null;
  return {
    ...data,
    tickets: Array.isArray(data.tickets)
      ? data.tickets.map((ticket: any) => ticket?.imageUrl ? { ...ticket, imageUrl: "" } : ticket)
      : [],
  };
}
