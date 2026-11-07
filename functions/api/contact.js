// Rokhssati: contact form (activation code questions, auto-écoles, other). Kept in KV under "msg:".
import { out, preflight } from "../_lib/common.js";
import { count } from "../_lib/stats.js";
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
  const sig = m.kind === "signal";                           // "report a question" from the trainer: no contact needed
  if (!sig && !m.phone && !m.email) { await count(env, "contact_incomplet", request); return out({ ok: false, err: "contact" }, 400); }
  if (!m.msg && m.kind !== "auto-ecole") return out({ ok: false, err: "msg" }, 400);
  if (!env.ROKH_KV) return out({ ok: false, err: "store" }, 500);
  await count(env, "contact_" + (sig ? "signal" : m.kind === "auto-ecole" ? "autoecole" : m.kind === "code" ? "code" : "autre"), request);
  await env.ROKH_KV.put("msg:" + m.at + "-" + Math.random().toString(36).slice(2, 8), JSON.stringify(m));
  return out({ ok: true });
}
