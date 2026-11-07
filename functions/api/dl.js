// Rokhssati: download link of the APK. Since 07/11/2026 the app is "prochainement" on the site:
// old links (posts, shares) land on the home page Android section instead of the file. /api/dl?src=…
const SOON = false;
import { count } from "../_lib/stats.js";
export async function onRequest({ request, env, waitUntil }) {
  const src = (new URL(request.url).searchParams.get("src") || "autre").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "autre";
  if (request.method === "GET") {
    // owner's own browsers (switch in gestion.html) are not counted; computers are counted apart (an APK installs only on Android)
    const q = new URL(request.url).searchParams, ua = request.headers.get("user-agent") || "";
    const p = q.get("me") === "1" ? Promise.resolve() : count(env, (/android/i.test(ua) ? "dl_" : "dlpc_") + src, request);
    if (waitUntil) waitUntil(p); else await p;
  }
  return new Response(null, { status: 302, headers: { Location: SOON ? "/#android" : "/rokhssati.apk", "Cache-Control": "no-store" } });
}
