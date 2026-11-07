// Rokhssati: tiny private counters (no cookie, no IP, no personal data). One KV key per day and event:
// "st:<YYYY-MM-DD Algeria time>:<event>" -> number. Free KV = 1 000 writes/day, so only rare events are counted here;
// visits and page views come from Cloudflare Web Analytics (already on every page).
export const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|meta-externalagent|whatsapp|telegram|discord|skype|curl|wget|python|httpclient|go-http|headless|lighthouse/i;
export const day = (t = Date.now()) => new Date(t + 3600000).toISOString().slice(0, 10);   // Algeria = UTC+1
const EV = /^[a-z][a-z0-9_-]{1,30}$/;
export async function count(env, ev, request) {
  try {
    if (!env.ROKH_KV || !EV.test(ev)) return;
    if (request && BOT.test(request.headers.get("user-agent") || "")) return;
    const k = "st:" + day() + ":" + ev;
    const n = parseInt((await env.ROKH_KV.get(k)) || "0", 10) || 0;
    await env.ROKH_KV.put(k, String(n + 1), { expirationTtl: 60 * 60 * 24 * 400 });
  } catch (e) { console.log("stats error", String(e)); }   // a counter must never break the site
}
