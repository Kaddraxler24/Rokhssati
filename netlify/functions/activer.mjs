// Rokhssati: checks an activation code on the server, so the secret key never ships in the site or the app.
// Env vars (Netlify > Site configuration > Environment variables): ROKH_CODE_KEY (hex), ROKH_SIGN_KEY (base64 PKCS8 DER, EC P-256).
// Every attempt is written to the function log (Netlify > Logs > Functions); every successful activation is kept
// in the Netlify Blobs store "activations" (code, device id, dates, count) and listed by /api/activations.
import crypto from "node:crypto";
import { getStore } from "@netlify/blobs";

const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const EPOCH = Date.UTC(2026, 0, 1), DZ = 3600000;
const clean = (s) => { const c = String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); return (c.length === 15 && c.slice(0, 3) === "RKS") ? c.slice(3) : c; };
const bits = (buf, n) => { let s = ""; for (const b of buf) { s += b.toString(2).padStart(8, "0"); if (s.length >= n) break; } return s.slice(0, n); };
const dayEnd = (day) => EPOCH + (day + 1) * 86400000 - 1 - DZ;

function check(keyHex, dev, code) {
  const c = clean(code); if (c.length !== 12) return null;
  let bs = ""; for (const ch of c) { const v = A.indexOf(ch); if (v < 0) return null; bs += v.toString(2).padStart(5, "0"); }
  const day = parseInt(bs.slice(0, 14), 2);
  const mac = crypto.createHmac("sha256", Buffer.from(keyHex, "hex")).update(clean(dev) + "|" + day, "utf8").digest();
  const want = bits(mac, 46), got = bs.slice(14);
  if (got.length !== want.length || !crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want))) return null;
  return { day, until: dayEnd(day) };
}

const H = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" };
const out = (o, st = 200) => new Response(JSON.stringify(o), { status: st, headers: H });

export default async (req) => {
  if (req.method === "OPTIONS") return new Response("", { status: 204, headers: { ...H, "Access-Control-Allow-Methods": "GET", "Access-Control-Allow-Headers": "Content-Type" } });
  const u = new URL(req.url);
  const dev = (u.searchParams.get("d") || "").slice(0, 20), code = (u.searchParams.get("c") || "").slice(0, 30);
  const K = process.env.ROKH_CODE_KEY, S = process.env.ROKH_SIGN_KEY;
  if (!K || !S) return out({ ok: false, err: "config" }, 500);
  if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(dev)) return out({ ok: false, err: "dev" }, 400);
  const r = check(K, dev, code);
  const c = clean(code);
  const log = (res) => console.log(JSON.stringify({ t: new Date().toISOString(), res, dev, code: c ? c.slice(0, 4) + "…" : "" }));
  if (!r) { log("code"); return out({ ok: false, err: "code" }); }
  if (r.until < Date.now()) { log("exp"); return out({ ok: false, err: "exp", until: r.until }); }
  log("ok");
  try {
    const st = getStore("activations"), now = new Date().toISOString();
    const prev = await st.get(c, { type: "json" });
    await st.setJSON(c, prev ? { ...prev, last: now, n: (prev.n || 1) + 1 } : { code: c, dev, until: r.until, first: now, last: now, n: 1 });
  } catch (e) { console.log("store error", String(e)); }   // never block an activation because of the list
  const key = crypto.createPrivateKey({ key: Buffer.from(S, "base64"), format: "der", type: "pkcs8" });
  const t = crypto.sign("sha256", Buffer.from(dev + "|" + r.until), { key, dsaEncoding: "ieee-p1363" }).toString("base64url");
  return out({ ok: true, until: r.until, t });
};

export const config = { path: "/api/activer" };
