// Rokhssati: private list of contact messages (header x-admin-key = ROKH_ADMIN_KEY).
import { out, preflight, admin } from "../_lib/common.js";
import { readAt } from "../_lib/inbox.js";
// 13/11/2026: each reply gets readAt (first display on the person's device, see /api/inbox POST); st = new / wip / done.
export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return preflight("GET");
  const no = admin(request, env); if (no) return no;
  const rows = []; let cursor;
  do {   // same as listJSON, but each row keeps its KV key (needed to answer it)
    const r = await env.ROKH_KV.list({ prefix: "msg:", cursor });
    for (const k of r.keys) { const v = await env.ROKH_KV.get(k.name, "json"); if (v) {
        v.key = k.name; v.canReply = !!v.bx;
        if (v.bx) {
          const doc = await env.ROKH_KV.get("box:" + v.bx, "json");
          (v.replies || []).forEach((r) => { r.readAt = readAt(doc, r.at); });
          // whole conversation (same device) when it holds more than this message + its replies: Gestion shows it folded
          if (doc && doc.items && doc.items.length > 1 + (v.replies || []).length) v.thread = doc.items;
        }
        if (!v.st) v.st = (v.replies || []).length ? "wip" : "new";
        delete v.bx; rows.push(v);
      } }
    cursor = r.list_complete ? null : r.cursor;
  } while (cursor);
  rows.sort((a, b) => (b.at || "").localeCompare(a.at || ""));
  return out({ ok: true, n: rows.length, rows });
}
