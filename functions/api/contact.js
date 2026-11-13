// Rokhssati: contact form (activation code questions, auto-écoles, other). Kept in KV under "msg:".
import { out, preflight } from "../_lib/common.js";
import { count } from "../_lib/stats.js";
import { bxOf, addItem } from "../_lib/inbox.js";
const cut = (v, n) => String(v || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, n);
export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return preflight("POST");
  if (request.method !== "POST") return out({ ok: false, err: "method" }, 405);
  let b; try { b = await request.json(); } catch (e) { return out({ ok: false, err: "json" }, 400); }
  if (b.hp) return out({ ok: true });                       // honeypot filled: a robot
  if (b.kind !== "signal") await count(env, "contact_try", request);
  const m = { kind: cut(b.kind, 20) || "autre", name: cut(b.name, 80), phone: cut(b.phone, 30), email: cut(b.email, 120),
              school: cut(b.school, 120), wilaya: cut(b.wilaya, 60), students: cut(b.students, 20),
              dev: cut(b.dev, 12), lang: cut(b.lang, 4), msg: cut(b.msg, 2000), at: new Date().toISOString() };
  // "Votre demande" (page Premium / Contact): free codes only (3-day trial, one month for testers / audit / demos), never sold
  const DEM = { "essai-3j": "Demande : code d'essai 3 jours", "mois": "Demande : code d'un mois (testeur, audit, démo)", "probleme": "Problème avec un code" };
  const dem = m.kind === "code" ? DEM[cut(b.demande, 20)] : "";
  if (dem) { m.demande = cut(b.demande, 20); m.msg = dem + (m.msg ? " — " + m.msg : ""); }
  const sig = m.kind === "signal";                           // "report a question" from the trainer: no contact needed
  // phone/e-mail optional (replies go to "Mes messages"), except for driving schools
  if (m.kind === "auto-ecole" && !m.phone && !m.email) { await count(env, "contact_incomplet", request); return out({ ok: false, err: "contact" }, 400); }
  // "prévenez-moi" list for the Premium release: e-mail only, nothing to pay, no pre-order (kept 12 months like every message)
  // 09/11/2026 : depuis la pub « prix prévus », e-mail OU téléphone, + formule préférée (m1 / m3 / y) et source (site / appli)
  if (m.kind === "premium") {
    const okMail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m.email), okTel = /^\+?[0-9]{9,15}$/.test(m.phone);
    if (!okMail && !okTel) return out({ ok: false, err: "email" }, 400);
    if (!okMail) m.email = ""; if (!okTel) m.phone = "";
    const F = { m1: "1 mois (600 DA)", m3: "3 mois (1 000 DA)", y: "1 an (sans prix affiché)" };
    m.formule = F[cut(b.formule, 4)] ? cut(b.formule, 4) : ""; m.src = cut(b.src, 10);
    m.msg = "Intéressé par le Premium" + (m.formule ? " — formule : " + F[m.formule] : "") + (m.src ? " (" + m.src + ")" : "");
  }
  if (!m.msg && m.kind !== "auto-ecole") return out({ ok: false, err: "msg" }, 400);
  if (!env.ROKH_KV) return out({ ok: false, err: "store" }, 500);
  // R4-011 (13/11/2026): at most 15 messages per network address per hour (anti-spam; the address itself is not stored with the message)
  const rl = "rl:c:" + (request.headers.get("cf-connecting-ip") || "?") + ":" + Math.floor(Date.now() / 3600000);
  const nrl = +(await env.ROKH_KV.get(rl)) || 0;
  if (nrl >= 15) return out({ ok: false, err: "trop" }, 429);
  await env.ROKH_KV.put(rl, String(nrl + 1), { expirationTtl: 7200 });
  await count(env, "contact_" + (sig ? "signal" : m.kind === "auto-ecole" ? "autoecole" : m.kind === "code" ? "code" : m.kind === "premium" ? "premium" : "autre"), request);
  if (m.demande === "essai-3j" || m.demande === "mois") await count(env, m.demande === "mois" ? "code_dem_mois" : "code_dem_3j", request);
  m.bx = await bxOf(b.box);                                   // private thread for "Mes messages" (optional)
  await env.ROKH_KV.put("msg:" + m.at + "-" + Math.random().toString(36).slice(2, 8), JSON.stringify(m), { expirationTtl: 365 * 86400 });   // erased after 12 months
  if (m.bx && !sig) await addItem(env, m.bx, { from: "me", text: m.msg || "(" + m.kind + ")", at: m.at });
  return out({ ok: true });
}
