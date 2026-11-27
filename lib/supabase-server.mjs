// Server-side access to Supabase over plain HTTP (no SDK on the server).
// SUPABASE_URL and SUPABASE_ANON_KEY may go to the browser; SUPABASE_SERVICE_ROLE_KEY never leaves the server.
import { createHash } from "node:crypto";

export function supabaseConfig(env = process.env) {
  const url = (env.SUPABASE_URL || "").replace(/\/+$/, "");
  const anonKey = env.SUPABASE_ANON_KEY || "";
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/.test(url) && !/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(url)) return null;
  if (!anonKey) return null;
  return { url, anonKey, serviceKey: env.SUPABASE_SERVICE_ROLE_KEY || "" };
}

/** A database error raised by our SQL functions (raise exception 'ai_daily_limit' …) as { code, hint }. */
export class DatabaseError extends Error {
  constructor(code, hint, status) {
    super(code);
    this.hint = hint;
    this.status = status;
  }
}

const known = new Set(["ai_daily_limit", "account_blocked", "ai_disabled", "too_many", "not_found", "unauthorized", "invalid_input", "forbidden", "registration_closed"]);

async function call(config, path, { token, service = false, method = "GET", body, prefer, signal } = {}) {
  const key = service ? config.serviceKey : config.anonKey;
  if (!key) throw new DatabaseError("server_not_configured");
  const response = await fetch(config.url + path, {
    method,
    signal: signal ?? AbortSignal.timeout(10000),
    headers: {
      apikey: key,
      Authorization: "Bearer " + (service ? config.serviceKey : token || config.anonKey),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = typeof data?.message === "string" ? data.message : "";
    throw new DatabaseError(known.has(message) ? message : "request_error", data?.hint ?? null, response.status);
  }
  return data;
}

export const rest = (config, path, options) => call(config, "/rest/v1/" + path, options);
export const rpc = (config, name, args, options) => call(config, "/rest/v1/rpc/" + name, { ...options, method: "POST", body: args ?? {} });

const userCache = new Map();
/** The signed-in user behind "Authorization: Bearer <access token>", checked by Supabase Auth itself. */
export async function userFromRequest(config, request) {
  const header = request.headers.authorization ?? "";
  const token = /^Bearer ([A-Za-z0-9._-]{20,4096})$/.exec(header)?.[1];
  if (!config || !token) return null;
  const key = createHash("sha256").update(token).digest("hex");
  const now = Date.now();
  for (const [id, entry] of userCache) if (entry.until <= now) userCache.delete(id);
  const cached = userCache.get(key);
  if (cached) return cached.user;
  const response = await fetch(config.url + "/auth/v1/user", {
    headers: { apikey: config.anonKey, Authorization: "Bearer " + token }, signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return null;
  const data = await response.json();
  if (typeof data?.id !== "string") return null;
  const user = { id: data.id, email: data.email ?? null, token };
  userCache.set(key, { user, until: now + 60000 });
  return user;
}

let settingsCache = { at: 0, value: null };
/** app_settings as an object, cached for a minute. */
export async function appSettings(config) {
  if (settingsCache.value && Date.now() - settingsCache.at < 60000) return settingsCache.value;
  const rows = await rest(config, "app_settings?select=key,value");
  const value = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  settingsCache = { at: Date.now(), value };
  return value;
}

/** A salted hash of the visitor's IP for the guest counter: the address itself is never stored. */
export function ipHash(ip, env = process.env) {
  return createHash("sha256").update((env.GUEST_IP_SALT || env.SUPABASE_URL || "astratravel") + "|" + ip).digest("hex");
}
