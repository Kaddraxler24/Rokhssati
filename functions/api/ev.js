// Rokhssati: anonymous product measurement (08/11/2026). No cookie, no identifier, no IP stored, no personal data.
// The browser sends a small batch of counters (e.g. {"c_done":1,"cd:c-feux":1}); they are added to ONE KV value
// per day ("ag:<YYYY-MM-DD>"), so the free KV write quota is not exhausted. Only whitelisted counter names are kept.
// Not sent at all when the visitor opted out (page Confidentialité), when the browser sends Do Not Track / GPC,
// or from the owner's browsers (gestion.html switch).
import { out, preflight } from "../_lib/common.js";
import { BOT, day } from "../_lib/stats.js";
const OK = /^(v_new|r1|r7|a1|c_done|ae_w|ae_map|qk_s|qk_e|t_start|t_end|e_start|e_end|e_pts|e_tot|co:[a-z0-9-]{2,24}|cd:[a-z0-9-]{2,24}|qko:q[0-9a-f]{6,12})$/;
export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return preflight("POST");
  if (request.method !== "POST") return out({ ok: false }, 405);
  if (!env.ROKH_KV || BOT.test(request.headers.get("user-agent") || "") || request.headers.get("sec-gpc") === "1" || request.headers.get("dnt") === "1") return out({ ok: true });
  let b; try { b = JSON.parse((await request.text()).slice(0, 4000)); } catch (e) { return out({ ok: false }, 400); }
  if (!b || typeof b !== "object") return out({ ok: false }, 400);
  const add = {}; let n = 0;
  for (const [k, v] of Object.entries(b)) {
    const x = Math.floor(+v);
    if (OK.test(k) && x >= 1 && x <= 200 && ++n <= 60) add[k] = x;
  }
  if (!n) return out({ ok: true });
  try {
    const key = "ag:" + day();
    const cur = (await env.ROKH_KV.get(key, "json")) || {};
    for (const [k, v] of Object.entries(add)) cur[k] = (cur[k] || 0) + v;
    await env.ROKH_KV.put(key, JSON.stringify(cur), { expirationTtl: 60 * 60 * 24 * 400 });
  } catch (e) { console.log("ev error", String(e)); }
  return out({ ok: true });
}
