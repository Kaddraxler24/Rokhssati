// Rokhssati: the app (1.4.23+) reports once per version whether it is a new install or an update, and from which version.
// GET /api/maj?from=<versionCode|old|new>&to=<versionCode>  -> counters "inst_<to>" or "maj_<from>_<to>" (no device id)
import { out, preflight } from "../_lib/common.js";
import { count } from "../_lib/stats.js";
export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS") return preflight("GET");
  const q = new URL(request.url).searchParams;
  const to = (q.get("to") || "").replace(/[^0-9]/g, "").slice(0, 4), from = (q.get("from") || "").replace(/[^a-z0-9]/g, "").slice(0, 6);
  if (!to || !from) return out({ ok: false, err: "input" }, 400);
  await count(env, from === "new" ? "inst_" + to : "maj_" + from + "_" + to, request);
  return out({ ok: true });
}
