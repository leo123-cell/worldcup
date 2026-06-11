import { getStore } from "@netlify/blobs";

const STORE_NAME = "worldcup-tracker";
const STATE_KEY = "state-v1";

export default async (req: Request) => {
  const store = getStore({ name: STORE_NAME, consistency: "strong" });

  if (req.method === "GET") {
    const data = await store.get(STATE_KEY, { type: "json" });
    return json({ data: data || null });
  }

  if (req.method === "POST") {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json({ error: "请求数据格式不正确。" }, 400);
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
