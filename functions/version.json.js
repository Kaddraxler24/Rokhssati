// Rokhssati: the Android app (1.4.17+) reads /version.json?v=<versionCode> at each start to look for updates.
// We count those reads per version and per day (no device id, no personal data), then serve the file.
import { count } from "./_lib/stats.js";
export async function onRequest({ request, env, next, waitUntil }) {
  try {
    const v = (new URL(request.url).searchParams.get("v") || "").replace(/[^0-9]/g, "").slice(0, 4);
    if (request.method === "GET" && v) {
      const p = count(env, "app_v" + v, request);
      if (waitUntil) waitUntil(p); else await p;
    }
  } catch (e) { /* never block the update check */ }
  return next();
}
