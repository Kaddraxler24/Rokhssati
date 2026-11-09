// Rokhssati: anonymous product measurement (08/11/2026). No cookie, no identifier, no IP stored, no personal data.
// The browser sends a small batch of counters (e.g. {"c_done":1,"cd:c-feux":1}); they are added to ONE KV value
// per day ("ag:<YYYY-MM-DD>"), so the free KV write quota is not exhausted. Only whitelisted counter names are kept.
// Not sent at all when the visitor opted out (page Confidentialité), when the browser sends Do Not Track / GPC,
// or from the owner's browsers (gestion.html switch).
import { out, preflight } from "../_lib/common.js";
import { BOT, day } from "../_lib/stats.js";
// parcours (09/11/2026) : ss_web / ss_app = sessions, en: = écran d'entrée, pv: = écran vu, nv:A>B = enchaînement, t5: = temps (tranches de 5 s)
const OK = /^((vc|a1c|r1c|r7c):20[0-9]{6}|v_new|r1|r7|a1|c_done|ae_w|ae_map|qk_s|qk_e|ss_web|ss_app|pr_v|pr_i|pr_n|pr_m1|pr_m3|pr_y|pr_c|pv:[a-z0-9-]{1,32}|en:[a-z0-9-]{1,32}|t5:[a-z0-9-]{1,32}|nv:[a-z0-9-]{1,32}>[a-z0-9-]{1,32}|t_start|t_end|e_start|e_end|e_pts|e_tot|co:[a-z0-9-]{2,24}|cd:[a-z0-9-]{2,24}|qko:q[0-9a-f]{6,12})$/;
export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return preflight("POST");
  if (request.method !== "POST") return out({ ok: false }, 405);
  if (!env.ROKH_KV || BOT.test(request.headers.get("user-agent") || "") || request.headers.get("sec-gpc") === "1" || request.headers.get("dnt") === "1") return out({ ok: true });
  let b; try { b = JSON.parse((await request.text()).slice(0, 4000)); } catch (e) { return out({ ok: false }, 400); }
  if (!b || typeof b !== "object") return out({ ok: false }, 400);
  // 09/11/2026 : compteurs séparés appli / site. « a|… » = appli, « w|… » = site ; les clés sans préfixe datent d'avant la séparation.
  // L'appli 1.4.27 n'envoie pas _p : reconnue par la WebView Android (« ; wv) ») ou une origine autre que rokhssati.com.
  const ua = request.headers.get("user-agent") || "", org = request.headers.get("origin") || "";
  const p = b._p === "a" || b._p === "w" ? b._p : (/; wv\)/.test(ua) || (org && !/rokhssati\.com$/.test(org)) ? "a" : "w");
  const add = {}; let n = 0;
  for (const [k, v] of Object.entries(b)) {
    const x = Math.floor(+v);
    if (OK.test(k) && x >= 1 && x <= 200 && ++n <= 60) add[p + "|" + k] = x;
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
