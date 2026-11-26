import { addAiNotes, planRoute, validateRequest } from "./planner.mjs";
import { assets } from "../dist/worker-assets.mjs";

const headers = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; form-action 'self'",
};
const sessionMarker = "astra_active";

function reply(data, status = 200, extra = {}) {
  return Response.json(data, { status, headers: { ...headers, ...extra, "Cache-Control": "no-store" } });
}

const requests = new Map();
function withinLimit(id) {
  const now = Date.now();
  for (const [key, entry] of requests) {
    if (entry.until <= now) requests.delete(key);
  }
  const entry = requests.get(id) ?? { count: 0, until: now + 60000 };
  requests.set(id, entry);
  return ++entry.count <= 8;
}

async function readSmallJson(request) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const bytes = new Uint8Array(4096);
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return JSON.parse(new TextDecoder().decode(bytes.subarray(0, length)));
      if (length + value.length > bytes.length) {
        await reader.cancel();
        return null;
      }
      bytes.set(value, length);
      length += value.length;
    }
  } catch {
    return null;
  }
}

async function handleApi(request, path, env) {
  const id = request.headers.get("oai-authenticated-user-id");
  const active = Boolean(id && (request.headers.get("cookie") ?? "").split(";").some((cookie) => cookie.trim() === sessionMarker + "=1"));
  const status = { mode: "sites", ai: Boolean(env.OPENAI_API_KEY), canActivate: Boolean(id), user: active ? {} : null };
  if (request.method === "GET" && path === "/api/session") return reply(status);
  if (request.method !== "POST" || request.headers.get("sec-fetch-site") === "cross-site" ||
      request.headers.get("content-type")?.split(";")[0] !== "application/json") {
    return reply({ error: "request_error" }, 405);
  }
  if (path === "/api/activate" || path === "/api/logout") {
    if (!id) return reply({ error: "unauthorized" }, 401);
    const activate = path === "/api/activate";
    return reply({ ...status, user: activate ? {} : null }, 200, {
      "Set-Cookie": sessionMarker + (activate ? "=1; Max-Age=604800" : "=; Max-Age=0") + "; HttpOnly; Secure; SameSite=Lax; Path=/",
    });
  }
  if (path !== "/api/plan") return reply({ error: "request_error" }, 404);
  if (!active) return reply({ error: "unauthorized" }, 401);
  if (!withinLimit(id)) return reply({ error: "too_many" }, 429);
  const prefs = validateRequest(await readSmallJson(request));
  if (!prefs) return reply({ error: "invalid_input" }, 400);
  const plan = planRoute(prefs);
  if (!plan) return reply({ error: "no_plan" }, 422);
  return reply(await addAiNotes(plan, prefs, env));
}

export default {
  async fetch(request, env = {}) {
    const path = new URL(request.url).pathname;
    if (path.startsWith("/api/")) return handleApi(request, path, env);
    if (!["GET", "HEAD"].includes(request.method)) return new Response(null, { status: 405, headers });
    const key = path === "/" ? "/index.html" : path;
    if (!Object.hasOwn(assets, key)) return new Response("Not found", { status: 404, headers });
    const [type, content] = assets[key];
    return new Response(request.method === "HEAD" ? null : Uint8Array.from(atob(content), (char) => char.charCodeAt(0)), {
      headers: { ...headers, "Content-Type": type, "Cache-Control": key === "/index.html" ? "no-cache" : "public, max-age=300" },
    });
  },
};
