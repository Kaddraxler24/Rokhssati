// Rokhssati: the visitor reads his own thread ("Mes messages"). GET /api/inbox?box=<token>
// 13/11/2026: POST { box, seen: "<date of the latest Rokhssati reply displayed>" } = read receipt (« lu le … » in Gestion).
import { out, preflight } from "../_lib/common.js";
import { count } from "../_lib/stats.js";
import { bxOf, markSeen } from "../_lib/inbox.js";
export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return preflight("GET, POST");
  if (!env.ROKH_KV) return out({ ok: false, err: "store" }, 500);
  if (request.method === "POST") {
    let b; try { b = await request.json(); } catch (e) { return out({ ok: false, err: "json" }, 400); }
    const bx = await bxOf(b.box), at = String(b.seen || "");
    if (!bx || !/^20\d\d-\d\d-\d\dT[\d:.]+Z$/.test(at)) return out({ ok: false, err: "input" }, 400);
    const fresh = await markSeen(env, bx, at);
    if (fresh) await count(env, "rep_read", request);
    return out({ ok: true });
  }
  const bx = await bxOf(new URL(request.url).searchParams.get("box"));
  if (!bx) return out({ ok: false, err: "box" }, 400);
  const doc = (await env.ROKH_KV.get("box:" + bx, "json")) || { items: [] };
  return out({ ok: true, items: doc.items });
}
