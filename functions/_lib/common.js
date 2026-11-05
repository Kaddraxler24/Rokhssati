// Shared helpers for the Cloudflare Pages Functions (same behaviour as the former Netlify functions).
export const H = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type, x-admin-key", "Cache-Control": "no-store" };
export const out = (o, st = 200) => new Response(JSON.stringify(o), { status: st, headers: H });
export const preflight = (methods) => new Response("", { status: 204, headers: { ...H, "Access-Control-Allow-Methods": methods } });
export const same = (a, b) => { a = String(a); b = String(b); if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; };
export async function listJSON(kv, prefix) {
  const rows = []; let cursor;
  do {
    const r = await kv.list({ prefix, cursor });
    for (const k of r.keys) { const v = await kv.get(k.name, "json"); if (v) rows.push(v); }
    cursor = r.list_complete ? null : r.cursor;
  } while (cursor);
  return rows;
}
export function admin(request, env) {
  if (!env.ROKH_ADMIN_KEY) return out({ ok: false, err: "config" }, 500);
  if (!same(request.headers.get("x-admin-key") || "", env.ROKH_ADMIN_KEY)) return out({ ok: false, err: "key" }, 403);
  if (!env.ROKH_KV) return out({ ok: false, err: "kv" }, 500);
  return null;
}
