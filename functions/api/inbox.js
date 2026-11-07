// Rokhssati: the visitor reads his own thread ("Mes messages"). GET /api/inbox?box=<token>
import { out, preflight } from "../_lib/common.js";
import { bxOf } from "../_lib/inbox.js";
export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return preflight("GET");
  const bx = await bxOf(new URL(request.url).searchParams.get("box"));
  if (!bx) return out({ ok: false, err: "box" }, 400);
  if (!env.ROKH_KV) return out({ ok: false, err: "store" }, 500);
  const doc = (await env.ROKH_KV.get("box:" + bx, "json")) || { items: [] };
  return out({ ok: true, items: doc.items });
}
