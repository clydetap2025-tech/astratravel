import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { addAiNotes, planRoute, validateRequest } from "./lib/planner.mjs";
import { chatInstructions, streamAnswer, validateChat } from "./lib/chat.mjs";
import { appSettings, DatabaseError, ipHash, rest, rpc, supabaseConfig, userFromRequest } from "./lib/supabase-server.mjs";

const root = dirname(fileURLToPath(import.meta.url));
// A local .env (OPENAI_API_KEY, SUPABASE_URL, …) is read when present; on Vercel these come from the project's Environment Variables.
try {
  process.loadEnvFile(resolve(root, ".env"));
} catch {}

// Accounts, favourites and the AI limit live in Supabase. Without SUPABASE_URL / SUPABASE_ANON_KEY the site works
// as before without accounts: everything stays in the browser and the chat says it needs an account.
const supabase = supabaseConfig();
const supabaseOrigin = supabase ? new URL(supabase.url).origin : "";
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:" + (supabaseOrigin ? " " + supabaseOrigin : "")
    + "; connect-src 'self'" + (supabaseOrigin ? " " + supabaseOrigin : "") + "; object-src 'none'; base-uri 'none'; form-action 'self'",
};
const types = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".webp": "image/webp",
  ".woff": "font/woff", ".svg": "image/svg+xml", ".txt": "text/plain; charset=utf-8",
  ".png": "image/png", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json; charset=utf-8",
};
// A short in-memory guard for the itinerary notes; the chat is limited in the database (consume_ai_message).
const rateLimits = new Map();
function throttle(key, limit) {
  const now = Date.now();
  for (const [id, entry] of rateLimits) {
    if (entry.until <= now) rateLimits.delete(id);
  }
  const entry = rateLimits.get(key) ?? { count: 0, until: now + 60000 };
  rateLimits.set(key, entry);
  return ++entry.count > limit;
}

async function jsonBody(request, max = 4096) {
  // Vercel's Node runtime may have read the body already and offer it as request.body; the plain server reads the stream.
  let given;
  try {
    given = request.body;
  } catch {
    return null;
  }
  if (given !== undefined) {
    const text = typeof given === "string" || Buffer.isBuffer(given) ? given.toString() : JSON.stringify(given);
    if (!text || text.length > max) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size <= max) chunks.push(chunk);
  }
  if (size > max) return null;
  try {
    return JSON.parse(Buffer.concat(chunks));
  } catch {
    return null;
  }
}

function json(response, status, data, headers = {}) {
  response.writeHead(status, {
    ...securityHeaders, "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store", ...headers,
  });
  response.end(JSON.stringify(data));
}

function clientIp(request) {
  // Behind Vercel's proxy the socket (if any) is the proxy; Vercel sets the client address in x-real-ip / x-forwarded-for.
  const forwarded = process.env.VERCEL ? request.headers["x-real-ip"] || request.headers["x-forwarded-for"]?.split(",")[0].trim() : null;
  return forwarded || request.socket?.remoteAddress || "unknown";
}

/** What the browser needs to start: whether accounts and AI are on, and the public Supabase settings. */
async function sessionInfo(request) {
  const user = supabase ? await userFromRequest(supabase, request).catch(() => null) : null;
  return {
    mode: supabase ? "supabase" : "local",
    ai: Boolean(process.env.OPENAI_API_KEY),
    guestChat: Boolean(supabase?.serviceKey && process.env.OPENAI_API_KEY),
    supabase: supabase ? { url: supabase.url, anonKey: supabase.anonKey } : undefined,
    user: user ? { id: user.id, email: user.email } : null,
  };
}

/** One row per OpenAI call (tokens and errors) for the admin overview. Needs the service role; skipped without it. */
function logAiRequest(row) {
  if (!supabase?.serviceKey) return;
  void rest(supabase, "ai_requests", { service: true, method: "POST", body: row, prefer: "return=minimal" }).catch(() => {});
}

const limitStatus = { ai_daily_limit: 429, too_many: 429, account_blocked: 403, ai_disabled: 503, not_found: 404, unauthorized: 401 };

/**
 * /api/chat: check the JWT → take one message from today's allowance in the database (consume_ai_message)
 * → only then ask OpenAI, streaming the answer as NDJSON lines → store the reply. If OpenAI fails, the message
 * is given back (refund_ai_message). Guests without an account get a few messages a day per IP.
 */
async function chat(request, response) {
  if (!process.env.OPENAI_API_KEY || !supabase) return json(response, 503, { error: "ai_unavailable" });
  const body = await jsonBody(request, 24000);
  const input = validateChat(body);
  if (!input) return json(response, 400, { error: "invalid_input" });
  const user = await userFromRequest(supabase, request);
  if (!user && !(supabase.serviceKey && body.guest === true)) return json(response, 401, { error: "unauthorized" });

  const settings = await appSettings(supabase);
  const model = typeof settings.ai_model === "string" && /^[a-z0-9.-]{3,40}$/.test(settings.ai_model) ? settings.ai_model : "gpt-5.4-nano";
  let conversationId = input.conversationId;
  let messageId = null;
  let left;
  let history = input.history;
  const guestKey = user ? null : ipHash(clientIp(request));
  try {
    if (user) {
      if (!conversationId) {
        const [created] = await rest(supabase, "ai_conversations", {
          token: user.token, method: "POST", prefer: "return=representation",
          body: { title: input.message.slice(0, 80), city_id: input.cityId, place_id: input.placeId },
        });
        conversationId = created.id;
      }
      const [taken] = await rpc(supabase, "consume_ai_message", { conversation: conversationId, content: input.message }, { token: user.token });
      left = taken.left;
      messageId = taken.message_id;
      // The last turns of this conversation before the new message, oldest first.
      const rows = await rest(supabase, "ai_messages?select=role,content&conversation_id=eq." + conversationId
        + "&id=lt." + messageId + "&status=eq.ok&order=id.desc&limit=10", { token: user.token });
      history = rows.reverse();
    } else {
      left = await rpc(supabase, "consume_guest_ai_message", { ip_hash: guestKey }, { service: true });
    }
  } catch (error) {
    if (error instanceof DatabaseError) {
      return json(response, limitStatus[error.message] ?? 400, { error: error.message, resetsAt: error.hint ?? undefined, conversationId });
    }
    throw error;
  }

  const controller = new AbortController();
  response.on("close", () => { if (!response.writableFinished) controller.abort(); });
  let started = false;
  const send = (data) => {
    if (!started) {
      started = true;
      response.writeHead(200, { ...securityHeaders, "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" });
    }
    if (!response.writableEnded) response.write(JSON.stringify(data) + "\n");
  };
  try {
    send({ type: "start", conversationId, left });
    const answer = await streamAnswer({
      env: process.env, model, instructions: chatInstructions(input), history, message: input.message,
      signal: controller.signal, onDelta: (text) => send({ type: "delta", text }),
    });
    if (!answer.text) throw new Error("openai_empty");
    if (user) {
      await rpc(supabase, "save_ai_reply", { conversation: conversationId, content: answer.text, tokens: answer.usage?.output_tokens ?? null }, { token: user.token }).catch(() => {});
    }
    logAiRequest({ user_id: user?.id ?? null, model, status: "ok", kind: user ? "chat" : "guest_chat", input_tokens: answer.usage?.input_tokens ?? null, output_tokens: answer.usage?.output_tokens ?? null });
    send({ type: "done", conversationId, left });
    response.end();
  } catch (error) {
    // OpenAI failed or sent nothing: the message is given back, so it does not count towards the limit.
    let refunded = false;
    if (supabase.serviceKey) {
      if (messageId) refunded = await rpc(supabase, "refund_ai_message", { message: messageId }, { service: true }).then(() => true, () => false);
      if (guestKey) refunded = await rpc(supabase, "refund_guest_ai_message", { ip_hash: guestKey }, { service: true }).then(() => true, () => false);
    }
    logAiRequest({ user_id: user?.id ?? null, model, status: "error", kind: user ? "chat" : "guest_chat", error_code: String(error?.message ?? "error").slice(0, 60) });
    if (controller.signal.aborted) return response.end();
    send({ type: "error", error: "ai_unavailable", conversationId, left: refunded ? left + 1 : left });
    response.end();
  }
}

async function api(request, response, path) {
  if (request.method === "GET" && path === "/api/session") return json(response, 200, await sessionInfo(request));
  if (request.method !== "POST" || request.headers["sec-fetch-site"] === "cross-site" ||
      request.headers["content-type"]?.split(";")[0] !== "application/json") {
    return json(response, 405, { error: "request_error" });
  }
  if (path === "/api/chat") return chat(request, response);
  if (path === "/api/plan") {
    const user = supabase ? await userFromRequest(supabase, request) : null;
    if (!user) return json(response, 401, { error: "unauthorized" });
    if (throttle("plan:" + user.id, 8)) return json(response, 429, { error: "too_many" });
    const body = await jsonBody(request);
    if (!body || typeof body !== "object" || Array.isArray(body)) return json(response, 400, { error: "invalid_input" });
    const prefs = validateRequest(body);
    if (!prefs) return json(response, 400, { error: "invalid_input" });
    const plan = planRoute(prefs);
    if (!plan) return json(response, 422, { error: "no_plan" });
    const result = await addAiNotes(plan, prefs, process.env);
    if (process.env.OPENAI_API_KEY) {
      logAiRequest({ user_id: user.id, model: process.env.OPENAI_MODEL || "gpt-5.4-nano", status: result.mode === "ai" ? "ok" : "error", kind: "plan" });
    }
    return json(response, 200, result);
  }
  return json(response, 404, { error: "request_error" });
}

/** Handles one request: the API, plus the static files when the app runs as its own server. Vercel calls it through api/index.mjs. */
export async function handle(request, response) {
  const path = new URL(request.url, "http://localhost").pathname;
  try {
    if (path.startsWith("/api/")) return await api(request, response, path);
    if (!["GET", "HEAD"].includes(request.method)) return json(response, 405, { error: "request_error" });
    const asset = path === "/" ? "/index.html" : path;
    const mime = types[extname(asset)];
    if (!mime || !/^\/(?:assets\/)?[a-zA-Z0-9_-]+\.[a-z0-9]+$/.test(asset)) {
      return json(response, 404, { error: "request_error" });
    }
    const file = ["/index.html", "/app.js", "/styles.css"].includes(asset) ? "dist/client" + asset : "public" + asset;
    const content = await readFile(resolve(root, file));
    response.writeHead(200, { ...securityHeaders, "Content-Type": mime, "Cache-Control": "no-cache" });
    response.end(request.method === "HEAD" ? undefined : content);
  } catch (error) {
    if (error.code === "ENOENT") return json(response, 404, { error: "request_error" });
    console.error("AstraTravel request failed:", error.message);
    if (!response.headersSent) return json(response, 500, { error: "request_error" });
    response.end();
  }
}

export const server = createServer(handle);
export default handle;
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const portArg = process.argv.indexOf("--port");
  const hostArg = process.argv.indexOf("--host");
  const port = Number(portArg > 0 ? process.argv[portArg + 1] : process.env.PORT || 3000);
  const host = hostArg > 0 ? process.argv[hostArg + 1] : "0.0.0.0";
  server.listen(port, host, () => console.log("AstraTravel available at http://localhost:" + server.address().port));
}
