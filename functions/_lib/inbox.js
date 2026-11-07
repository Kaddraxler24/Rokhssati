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
