// Rokhssati: private list of activated codes (header x-admin-key = ROKH_ADMIN_KEY).
import { out, preflight, admin, listJSON } from "../_lib/common.js";
export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return preflight("GET");
  const no = admin(request, env); if (no) return no;
  const rows = await listJSON(env.ROKH_KV, "act:");
  rows.sort((a, b) => (b.first || "").localeCompare(a.first || ""));
  return out({ ok: true, n: rows.length, rows });
}
