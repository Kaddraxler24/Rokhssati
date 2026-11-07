// Rokhssati: launch offer — free premium for the first TRIAL_MAX app installs, delivered automatically.
// GET /api/essai?info=1        -> { ok, left, now }   (now = server time, used by the app against clock tricks)
// GET /api/essai?d=XXXX-XXXX   -> { ok, until, t }    t = ECDSA signature of "dev|until" (same pass as a paid code)
// One trial per device id and per network address; the server stops after TRIAL_MAX trials.
import { out, preflight } from "../_lib/common.js";
import { count } from "../_lib/stats.js";
const TRIAL_MAX = 10, TRIAL_DAYS = 3;
const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const b64url = (u8) => btoa(String.fromCharCode(...u8)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return preflight("GET");
  const u = new URL(request.url), kv = env.ROKH_KV;
  if (!kv) return out({ ok: false, err: "store" }, 500);
  const used = +(await kv.get("trial:n")) || 0;
  if (u.searchParams.get("info")) return out({ ok: true, left: Math.max(0, TRIAL_MAX - used), days: TRIAL_DAYS, now: Date.now() });
  const S = env.ROKH_SIGN_KEY;
  if (!S) return out({ ok: false, err: "config" }, 500);
  const dev = (u.searchParams.get("d") || "").slice(0, 20);
  if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(dev)) return out({ ok: false, err: "dev" }, 400);
  if (used >= TRIAL_MAX) return out({ ok: false, err: "fini", left: 0 });
  const ip = request.headers.get("cf-connecting-ip") || "?";
  const [byDev, byIp] = await Promise.all([kv.get("trial:d:" + dev, "json"), kv.get("trial:ip:" + ip)]);
  if (byDev) return out({ ok: false, err: "deja", until: byDev.until });
  if (byIp) return out({ ok: false, err: "deja" });
  const until = Date.now() + TRIAL_DAYS * 86400000;
  const now = new Date().toISOString();
  await kv.put("trial:n", String(used + 1));
  await kv.put("trial:d:" + dev, JSON.stringify({ dev, until, at: now, ip: ip.slice(0, 45) }));
  await kv.put("trial:ip:" + ip, "1", { expirationTtl: 90 * 86400 });
  await count(env, "essai_ok", request);
  const key = await crypto.subtle.importKey("pkcs8", b64(S.trim()), { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(dev + "|" + until)));
  return out({ ok: true, until, t: b64url(sig), left: Math.max(0, TRIAL_MAX - used - 1) });
}
