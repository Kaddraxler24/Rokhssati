// "Mes messages": a private thread per browser / app install. The visitor keeps a random token
// (localStorage "rokhssati-box"); the server only stores its SHA-256 (bx), so the thread can't be
// guessed from the device number. One KV document per thread: "box:<bx>" = { items: [{ from, text, at }] }.
export async function bxOf(token) {
  const t = String(token || "");
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(t)) return "";
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("rokhssati-box|" + t));
  return [...new Uint8Array(h)].slice(0, 16).map((b) => b.toString(16).padStart(2, "0")).join("");
}
export async function addItem(env, bx, item) {
  const k = "box:" + bx;
  const doc = (await env.ROKH_KV.get(k, "json")) || { items: [] };
  doc.items.push(item);
  doc.items = doc.items.slice(-50);
  await env.ROKH_KV.put(k, JSON.stringify(doc), { expirationTtl: 365 * 86400 });
  return doc;
}
// 13/11/2026 — read receipts. The device says "I have displayed every Rokhssati reply up to <at>".
// Stored in the same thread: doc.seen (latest reply displayed) + doc.reads [{ upto, when }] (first time each step was reached),
// so Gestion can show « lu le … » per reply. Only reply dates that really exist are accepted. Returns true if something new was read.
export async function markSeen(env, bx, at) {
  const k = "box:" + bx;
  const doc = await env.ROKH_KV.get(k, "json");
  if (!doc || !Array.isArray(doc.items)) return false;
  if (!doc.items.some((x) => x.from === "r" && x.at === at)) return false;
  if (doc.seen && doc.seen >= at) return false;
  doc.seen = at;
  doc.reads = (doc.reads || []).concat([{ upto: at, when: new Date().toISOString() }]).slice(-50);
  await env.ROKH_KV.put(k, JSON.stringify(doc), { expirationTtl: 365 * 86400 });
  return true;
}
// first time a reply dated <at> was displayed, or ""
export function readAt(doc, at) {
  const r = ((doc && doc.reads) || []).filter((x) => x.upto >= at).sort((a, b) => a.when.localeCompare(b.when))[0];
  return r ? r.when : "";
}
