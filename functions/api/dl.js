// Rokhssati: counts an APK download, then sends the file. /api/dl?src=popup|page|banner
import { count } from "../_lib/stats.js";
export async function onRequest({ request, env, waitUntil }) {
  const src = (new URL(request.url).searchParams.get("src") || "autre").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "autre";
  if (request.method === "GET") {
    const p = count(env, "dl_" + src, request);
    if (waitUntil) waitUntil(p); else await p;
  }
  return new Response(null, { status: 302, headers: { Location: "/rokhssati.apk", "Cache-Control": "no-store" } });
}
