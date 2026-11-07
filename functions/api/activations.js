// Rokhssati: private list of activated codes (header x-admin-key = ROKH_ADMIN_KEY).
import { out, preflight, admin, listJSON } from "../_lib/common.js";
export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return preflight("GET");
  const no = admin(request, env); if (no) return no;
  const rows = await listJSON(env.ROKH_KV, "act:");
  // free trials of the launch offer (functions/api/essai.js), shown in the same list
  const trials = await listJSON(env.ROKH_KV, "trial:d:");
  for (const t of trials) rows.push({ code: "ESSAI 3 j", dev: t.dev, first: t.at, last: t.at, n: 1, until: t.until, trial: true });
  rows.sort((a, b) => (b.first || "").localeCompare(a.first || ""));
  const nTrial = rows.filter((r) => r.trial).length;
  return out({ ok: true, n: rows.length - nTrial, trials: nTrial, rows });
}
