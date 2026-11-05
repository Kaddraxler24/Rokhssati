// Rokhssati: private list of contact messages. Header "x-admin-key" = env ROKH_ADMIN_KEY.
import crypto from "node:crypto";
import { getStore } from "@netlify/blobs";
const H = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "x-admin-key", "Cache-Control": "no-store" };
const out = (o, st = 200) => new Response(JSON.stringify(o), { status: st, headers: H });
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
export default async (req) => {
  if (req.method === "OPTIONS") return new Response("", { status: 204, headers: H });
  const A = process.env.ROKH_ADMIN_KEY;
  if (!A) return out({ ok: false, err: "config" }, 500);
  if (!same(req.headers.get("x-admin-key") || "", A)) return out({ ok: false, err: "key" }, 403);
  const st = getStore("messages"); const rows = [];
  const { blobs } = await st.list();
  for (const b of blobs) { const v = await st.get(b.key, { type: "json" }); if (v) rows.push(v); }
  rows.sort((a, b) => (b.at || "").localeCompare(a.at || ""));
  return out({ ok: true, n: rows.length, rows });
};
export const config = { path: "/api/messages" };
