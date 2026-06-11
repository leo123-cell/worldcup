import { getStore } from "@netlify/blobs";

const STORE_NAME = "worldcup-tracker";
const STATE_KEY = "state-v1";
const BACKUP_PREFIX = "state-backup-";

export default async (req: Request) => {
  const store = getStore({ name: STORE_NAME, consistency: "strong" });

  if (req.method === "GET") {
    const url = new URL(req.url);
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
    const currentTickets = Array.isArray((current as any)?.tickets) ? (current as any).tickets.length : 0;
    const nextTickets = Array.isArray((body as any)?.tickets) ? (body as any).tickets.length : 0;
    if (currentTickets > 0 && nextTickets === 0) {
      return json({
        error: "\u5df2\u62e6\u622a\u7a7a\u7968\u636e\u6570\u636e\u8986\u76d6\u3002\u8bf7\u5148\u5237\u65b0\u9875\u9762\u518d\u64cd\u4f5c\u3002",
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
