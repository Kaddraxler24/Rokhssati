// Rokhssati: private statistics (header x-admin-key = ROKH_ADMIN_KEY).
//  - our counters (KV "st:"): downloads, contact, activations, per day;
//  - optional: Cloudflare Web Analytics (visits, page views, pages, countries, referrers) when the secrets
//    CF_API_TOKEN (permission "Account Analytics: Read"), CF_ACCOUNT_ID and CF_SITE_TAG are set in Cloudflare Pages.
import { out, preflight, admin } from "../_lib/common.js";
import { day } from "../_lib/stats.js";

async function counters(kv, from) {
  const rows = {}; let cursor;
  do {
    const r = await kv.list({ prefix: "st:", cursor });
    for (const k of r.keys) {
      const [, d, ev] = k.name.split(":"); if (!d || d < from) continue;
      const n = parseInt((await kv.get(k.name)) || "0", 10) || 0;
      (rows[d] = rows[d] || {})[ev] = n;
    }
    cursor = r.list_complete ? null : r.cursor;
  } while (cursor);
  return rows;
}

const Q = `query($a:String!,$s:String!,$f:Date!,$t:Date!){viewer{accounts(filter:{accountTag:$a}){
 days:rumPageloadEventsAdaptiveGroups(limit:200,filter:{siteTag:$s,date_geq:$f,date_leq:$t},orderBy:[date_ASC]){count sum{visits} dimensions{date}}
 pages:rumPageloadEventsAdaptiveGroups(limit:20,filter:{siteTag:$s,date_geq:$f,date_leq:$t},orderBy:[count_DESC]){count dimensions{requestPath}}
 countries:rumPageloadEventsAdaptiveGroups(limit:10,filter:{siteTag:$s,date_geq:$f,date_leq:$t},orderBy:[count_DESC]){count sum{visits} dimensions{countryName}}
 refs:rumPageloadEventsAdaptiveGroups(limit:10,filter:{siteTag:$s,date_geq:$f,date_leq:$t},orderBy:[count_DESC]){count sum{visits} dimensions{refererHost}}
}}}`;

// secrets pasted from a phone often carry invisible characters (line breaks, non-breaking spaces, quotes, "Bearer ")
const clean = (v) => String(v || "").replace(/^\s*bearer\s+/i, "").replace(/[^\x21-\x7E]/g, "").replace(/^["'`]+|["'`]+$/g, "");
const hex32 = (v) => (clean(v).toLowerCase().match(/[0-9a-f]{32}/) || [""])[0];

async function web(env, from, to) {
  const token = clean(env.CF_API_TOKEN), acc = hex32(env.CF_ACCOUNT_ID), site = hex32(env.CF_SITE_TAG);
  if (!token || !acc || !site) {
    if (!env.CF_API_TOKEN && !env.CF_ACCOUNT_ID && !env.CF_SITE_TAG) return { ok: false, err: "not_configured" };
    return { ok: false, err: "Secret mal rempli : " + [!token && "CF_API_TOKEN", !acc && "CF_ACCOUNT_ID (32 caractères 0-9 a-f)", !site && "CF_SITE_TAG (32 caractères 0-9 a-f)"].filter(Boolean).join(", ") };
  }
  try {
    const r = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ query: Q, variables: { a: acc, s: site, f: from, t: to } }) });
    const txt = await r.text(); let j; try { j = JSON.parse(txt); } catch (e) { return { ok: false, err: "HTTP " + r.status + " : " + txt.slice(0, 160) }; }
    if (j.errors && j.errors.length) return { ok: false, err: j.errors.map((e) => e.message).join(" | ").slice(0, 300) };
    if (!j.data || !j.data.viewer) return { ok: false, err: "Réponse inattendue (HTTP " + r.status + ")" };
    const a = j.data.viewer.accounts[0];
    if (!a) return { ok: false, err: "Compte introuvable : vérifiez CF_ACCOUNT_ID, et que le jeton a la permission Account Analytics : Read sur ce compte" };
    return { ok: true,
      days: (a.days || []).map((x) => ({ d: x.dimensions.date, views: x.count, visits: x.sum.visits })),
      pages: (a.pages || []).map((x) => ({ p: x.dimensions.requestPath, views: x.count })),
      countries: (a.countries || []).map((x) => ({ c: x.dimensions.countryName, visits: x.sum.visits })),
      refs: (a.refs || []).map((x) => ({ h: x.dimensions.refererHost || "(direct)", visits: x.sum.visits })) };
  } catch (e) { return { ok: false, err: String(e).slice(0, 200) }; }
}

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return preflight("GET");
  const no = admin(request, env); if (no) return no;
  const days = Math.min(90, Math.max(7, parseInt(new URL(request.url).searchParams.get("days") || "30", 10) || 30));
  const to = day(), from = day(Date.now() - (days - 1) * 86400000);
  const [ev, w] = await Promise.all([counters(env.ROKH_KV, from), web(env, from, to)]);
  return out({ ok: true, from, to, events: ev, web: w });
}
