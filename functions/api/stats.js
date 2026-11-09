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

// owner 08/11/2026: the pages' beacon reports to one Web Analytics entry ("rokhssati.pages.dev +2") while CF_SITE_TAG points to
// another ("rokhssati.com"), so Gestion under-counted. Without touching Cloudflare: query every Web Analytics site of the account,
// keeping only the public hostnames (the test version dev.rokhssati.pages.dev and previews are left out). Falls back to CF_SITE_TAG.
const HOSTS = '["rokhssati.com","www.rokhssati.com"]';
const QALL = Q.replace(/\$s:String!,/, "").replace(/siteTag:\$s,/g, "requestHost_in:" + HOSTS + ",");

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
    const ask = async (query, variables) => {
      const r = await fetch("https://api.cloudflare.com/client/v4/graphql", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ query, variables }) });
      const txt = await r.text(); try { return { r, j: JSON.parse(txt) }; } catch (e) { return { r, bad: "HTTP " + r.status + " : " + txt.slice(0, 160) }; }
    };
    let src = "all", { r, j, bad } = await ask(QALL, { a: acc, f: from, t: to });
    if (bad || (j.errors && j.errors.length) || !j.data || !j.data.viewer || !j.data.viewer.accounts[0]) {   // merged query refused: old behaviour
      src = "site"; ({ r, j, bad } = await ask(Q, { a: acc, s: site, f: from, t: to }));
    }
    if (bad) return { ok: false, err: bad };
    if (j.errors && j.errors.length) return { ok: false, err: j.errors.map((e) => e.message).join(" | ").slice(0, 300) };
    if (!j.data || !j.data.viewer) return { ok: false, err: "Réponse inattendue (HTTP " + r.status + ")" };
    const a = j.data.viewer.accounts[0];
    // ROK-02 (10/11/2026) : vues et visites de la page Gestion, retirées des totaux côté Gestion. Requête à part : si elle échoue, les totaux restent bruts.
    let adm = null;
    if (a) try {
      const QG = (src === "all" ? QALL : Q).replace(/\{viewer[\s\S]*$/, "") + "{viewer{accounts(filter:{accountTag:$a}){gdays:rumPageloadEventsAdaptiveGroups(limit:200,filter:{"
        + (src === "all" ? "requestHost_in:" + HOSTS : "siteTag:$s") + ',requestPath_in:["/gestion","/gestion.html"],date_geq:$f,date_leq:$t},orderBy:[date_ASC]){count sum{visits} dimensions{date}}}}}';
      const g = await ask(QG, src === "all" ? { a: acc, f: from, t: to } : { a: acc, s: site, f: from, t: to });
      const ga = g.j && !g.j.errors && g.j.data && g.j.data.viewer && g.j.data.viewer.accounts[0];
      if (ga) adm = (ga.gdays || []).map((x) => ({ d: x.dimensions.date, views: x.count, visits: x.sum.visits }));
    } catch (e) {}
    if (!a) return { ok: false, err: "Compte introuvable : vérifiez CF_ACCOUNT_ID, et que le jeton a la permission Account Analytics : Read sur ce compte" };
    return { ok: true, src,
      days: (a.days || []).map((x) => ({ d: x.dimensions.date, views: x.count, visits: x.sum.visits })),
      pages: (a.pages || []).map((x) => ({ p: x.dimensions.requestPath, views: x.count })),
      countries: (a.countries || []).map((x) => ({ c: x.dimensions.countryName, visits: x.sum.visits })),
      refs: (a.refs || []).map((x) => ({ h: x.dimensions.refererHost || "(direct)", visits: x.sum.visits })), adm };
  } catch (e) { return { ok: false, err: String(e).slice(0, 200) }; }
}

// anonymous product counters (functions/api/ev.js): one JSON value per day "ag:<day>"
async function product(kv, from) {
  if (!kv) return {};
  const r = await kv.list({ prefix: "ag:" }), out = {};
  await Promise.all(r.keys.filter((k) => k.name.slice(3) >= from).map(async (k) => { out[k.name.slice(3)] = (await kv.get(k.name, "json")) || {}; }));
  return out;
}

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return preflight("GET");
  const no = admin(request, env); if (no) return no;
  const days = Math.min(90, Math.max(7, parseInt(new URL(request.url).searchParams.get("days") || "30", 10) || 30));
  const to = day(), from = day(Date.now() - (days - 1) * 86400000);
  const [ev, w, ag] = await Promise.all([counters(env.ROKH_KV, from), web(env, from, to), product(env.ROKH_KV, from)]);
  return out({ ok: true, from, to, events: ev, web: w, product: ag });
}
