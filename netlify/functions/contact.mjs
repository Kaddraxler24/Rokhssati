// Rokhssati: contact form (questions about the activation code, auto-écoles, other). Messages are kept in the
// Netlify Blobs store "messages" and read back from the private page (endpoint /api/messages, admin key).
import { getStore } from "@netlify/blobs";
const H = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Cache-Control": "no-store" };
const out = (o, st = 200) => new Response(JSON.stringify(o), { status: st, headers: H });
const cut = (v, n) => String(v || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, n);
export default async (req) => {
  if (req.method === "OPTIONS") return new Response("", { status: 204, headers: { ...H, "Access-Control-Allow-Methods": "POST" } });
  if (req.method !== "POST") return out({ ok: false, err: "method" }, 405);
  let b; try { b = await req.json(); } catch (e) { return out({ ok: false, err: "json" }, 400); }
  if (b.hp) return out({ ok: true });                       // honeypot filled: a robot, answer ok and drop it
  const m = { kind: cut(b.kind, 20) || "autre", name: cut(b.name, 80), phone: cut(b.phone, 30), email: cut(b.email, 120),
              school: cut(b.school, 120), wilaya: cut(b.wilaya, 60), students: cut(b.students, 20),
              dev: cut(b.dev, 12), lang: cut(b.lang, 4), msg: cut(b.msg, 2000), at: new Date().toISOString() };
  if (!m.phone && !m.email) return out({ ok: false, err: "contact" }, 400);
  if (!m.msg && m.kind !== "auto-ecole") return out({ ok: false, err: "msg" }, 400);
  console.log(JSON.stringify({ t: m.at, contact: m.kind, dev: m.dev }));
  try {
    await getStore("messages").setJSON(m.at + "-" + Math.random().toString(36).slice(2, 8), m);
  } catch (e) { console.log("store error", String(e)); return out({ ok: false, err: "store" }, 500); }
  return out({ ok: true });
};
export const config = { path: "/api/contact" };
