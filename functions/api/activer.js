// Rokhssati: checks an activation code on the server (secret keys in Cloudflare > Pages > Settings > Variables).
// ROKH_CODE_KEY (hex), ROKH_SIGN_KEY (base64 PKCS8 DER, EC P-256); KV binding ROKH_KV keeps successful activations.
import { out, preflight } from "../_lib/common.js";
const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const EPOCH = Date.UTC(2026, 0, 1), DZ = 3600000;
const clean = (s) => { const c = String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); return (c.length === 15 && c.slice(0, 3) === "RKS") ? c.slice(3) : c; };
const bits = (buf, n) => { let s = ""; for (const b of buf) { s += b.toString(2).padStart(8, "0"); if (s.length >= n) break; } return s.slice(0, n); };
const dayEnd = (day) => EPOCH + (day + 1) * 86400000 - 1 - DZ;
const hex = (h) => new Uint8Array(h.match(/../g).map((x) => parseInt(x, 16)));
const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const b64url = (u8) => btoa(String.fromCharCode(...u8)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const enc = new TextEncoder();

async function check(keyHex, dev, code) {
  const c = clean(code); if (c.length !== 12) return null;
  let bs = ""; for (const ch of c) { const v = A.indexOf(ch); if (v < 0) return null; bs += v.toString(2).padStart(5, "0"); }
  const day = parseInt(bs.slice(0, 14), 2);
  const k = await crypto.subtle.importKey("raw", hex(keyHex), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(clean(dev) + "|" + day)));
  const want = bits(mac, 46), got = bs.slice(14);
  let r = got.length ^ want.length; for (let i = 0; i < want.length; i++) r |= (got.charCodeAt(i) || 0) ^ want.charCodeAt(i);
  return r === 0 ? { day, until: dayEnd(day) } : null;
}

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return preflight("GET");
  const u = new URL(request.url);
  const dev = (u.searchParams.get("d") || "").slice(0, 20), code = (u.searchParams.get("c") || "").slice(0, 30);
  const K = env.ROKH_CODE_KEY, S = env.ROKH_SIGN_KEY;
  if (!K || !S) return out({ ok: false, err: "config" }, 500);
  if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(dev)) return out({ ok: false, err: "dev" }, 400);
  const r = await check(K.trim(), dev, code), c = clean(code);
  const log = (res) => console.log(JSON.stringify({ t: new Date().toISOString(), res, dev, code: c ? c.slice(0, 4) + "…" : "" }));
  if (!r) { log("code"); return out({ ok: false, err: "code" }); }
  if (r.until < Date.now()) { log("exp"); return out({ ok: false, err: "exp", until: r.until }); }
  log("ok");
  try {
    if (env.ROKH_KV) {
      const now = new Date().toISOString(), prev = await env.ROKH_KV.get("act:" + c, "json");
      await env.ROKH_KV.put("act:" + c, JSON.stringify(prev ? { ...prev, last: now, n: (prev.n || 1) + 1 } : { code: c, dev, until: r.until, first: now, last: now, n: 1 }));
    }
  } catch (e) { console.log("store error", String(e)); }   // never block an activation because of the list
  const key = await crypto.subtle.importKey("pkcs8", b64(S.trim()), { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(dev + "|" + r.until)));
  return out({ ok: true, until: r.until, t: b64url(sig) });
}
