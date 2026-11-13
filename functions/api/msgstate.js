// Rokhssati: status of a contact message in Gestion (13/11/2026). POST { key: "msg:…", st: "new" | "wip" | "done" } (x-admin-key).
// Nouveau = pas encore traité, En cours = répondu ou en traitement, Résolu = rien à faire. History kept in m.hist.
import { out, preflight, admin } from "../_lib/common.js";
const ST = ["new", "wip", "done"];
export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return preflight("POST");
  if (request.method !== "POST") return out({ ok: false, err: "method" }, 405);
  const no = admin(request, env); if (no) return no;
  let b; try { b = await request.json(); } catch (e) { return out({ ok: false, err: "json" }, 400); }
  const key = String(b.key || ""), st = String(b.st || "");
  if (!/^msg:/.test(key) || !ST.includes(st)) return out({ ok: false, err: "input" }, 400);
  const m = await env.ROKH_KV.get(key, "json");
  if (!m) return out({ ok: false, err: "notfound" }, 404);
  const at = new Date().toISOString();
  m.st = st; m.hist = (m.hist || []).concat([{ st, at }]).slice(-20);
  await env.ROKH_KV.put(key, JSON.stringify(m), { expirationTtl: Math.max(60, Math.round((Date.parse(m.at) + 365 * 86400000 - Date.now()) / 1000)) });
  return out({ ok: true, st, at });
}
