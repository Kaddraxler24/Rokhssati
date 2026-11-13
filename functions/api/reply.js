// Rokhssati: the admin answers a message inside the site / app (header x-admin-key).
// POST { key: "msg:…", text } → appended to the visitor's thread, message marked as answered.
import { out, preflight, admin } from "../_lib/common.js";
import { addItem } from "../_lib/inbox.js";
import { count } from "../_lib/stats.js";
export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return preflight("POST");
  if (request.method !== "POST") return out({ ok: false, err: "method" }, 405);
  const no = admin(request, env); if (no) return no;
  let b; try { b = await request.json(); } catch (e) { return out({ ok: false, err: "json" }, 400); }
  const key = String(b.key || ""), text = String(b.text || "").trim().slice(0, 3000);
  if (!/^msg:/.test(key) || !text) return out({ ok: false, err: "input" }, 400);
  const m = await env.ROKH_KV.get(key, "json");
  if (!m) return out({ ok: false, err: "notfound" }, 404);
  if (!m.bx) return out({ ok: false, err: "nobox" }, 400);
  const at = new Date().toISOString();
  await addItem(env, m.bx, { from: "r", text, at });
  m.replies = (m.replies || []).concat([{ text, at }]);
  if (!m.st || m.st === "new") m.st = "wip";                 // 13/11/2026: answered → « En cours » until marked « Résolu »
  await env.ROKH_KV.put(key, JSON.stringify(m), { expirationTtl: Math.max(60, Math.round((Date.parse(m.at) + 365 * 86400000 - Date.now()) / 1000)) });
  await count(env, "rep_sent", request);
  return out({ ok: true, at });
}
