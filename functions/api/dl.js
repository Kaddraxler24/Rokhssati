// Rokhssati: download link of the APK. Since 07/11/2026 the app is "prochainement" on the site:
// old links (posts, shares) land on the home page Android section instead of the file. /api/dl?src=…
const SOON = false;
import { count } from "../_lib/stats.js";
export async function onRequest({ request, env, waitUntil }) {
  const src = (new URL(request.url).searchParams.get("src") || "autre").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "autre";
  if (request.method === "GET") {
    const p = count(env, "dl_" + src, request);
    if (waitUntil) waitUntil(p); else await p;
  }
  return new Response(null, { status: 302, headers: { Location: SOON ? "/#android" : "/rokhssati.apk", "Cache-Control": "no-store" } });
}
