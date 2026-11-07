// Rokhssati: private list of contact messages (header x-admin-key = ROKH_ADMIN_KEY).
import { out, preflight, admin } from "../_lib/common.js";
export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return preflight("GET");
  const no = admin(request, env); if (no) return no;
  const rows = []; let cursor;
  do {   // same as listJSON, but each row keeps its KV key (needed to answer it)
    const r = await env.ROKH_KV.list({ prefix: "msg:", cursor });
    for (const k of r.keys) { const v = await env.ROKH_KV.get(k.name, "json"); if (v) { v.key = k.name; v.canReply = !!v.bx; delete v.bx; rows.push(v); } }
    cursor = r.list_complete ? null : r.cursor;
  } while (cursor);
  rows.sort((a, b) => (b.at || "").localeCompare(a.at || ""));
  return out({ ok: true, n: rows.length, rows });
}
