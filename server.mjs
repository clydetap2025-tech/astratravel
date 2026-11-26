import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { createHash, randomBytes, scrypt as deriveKey, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { DatabaseSync } from "node:sqlite";
import { resolve, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { addAiNotes, planRoute, validateRequest } from "./lib/planner.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.ASTRA_DATA_DIR || resolve(root, ".data");
await mkdir(dataDir, { recursive: true, mode: 0o700 });
const db = new DatabaseSync(resolve(dataDir, "astratravel.sqlite"));
db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    salt TEXT NOT NULL,
    password_hash TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
`);

const scrypt = promisify(deriveKey);
const sessionLife = 7 * 24 * 3600;
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; form-action 'self'",
};
const types = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".webp": "image/webp",
  ".woff": "font/woff", ".svg": "image/svg+xml", ".txt": "text/plain; charset=utf-8",
  ".png": "image/png", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json; charset=utf-8",
};
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

const hash = (token) => createHash("sha256").update(token).digest("hex");
const cookieToken = (request) => request.headers.cookie?.match(/(?:^|;\s*)astra_session=([a-f0-9]{64})(?:;|$)/)?.[1];

function sessionFor(request) {
  const token = cookieToken(request);
  if (!token) return null;
  return db.prepare(`
    SELECT sessions.token_hash AS token, users.username AS username
    FROM sessions LEFT JOIN users ON users.id = sessions.user_id
    WHERE token_hash = ? AND expires_at > ?
  `).get(hash(token), Date.now()) ?? null;
}

function cookie(request, token, maxAge) {
  const secure = request.socket.encrypted || request.headers["x-forwarded-proto"] === "https";
  return `astra_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}

function newSession(request, userId) {
  const old = cookieToken(request);
  if (old) db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hash(old));
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());
  const token = randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions VALUES (?, ?, ?)").run(hash(token), userId, Date.now() + sessionLife * 1000);
  return cookie(request, token, sessionLife);
}

function identity(session) {
  return { mode: "local", ai: Boolean(process.env.OPENAI_API_KEY), user: session ? { username: session.username } : null };
}

async function jsonBody(request) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size <= 4096) chunks.push(chunk);
  }
  if (size > 4096) return null;
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

async function account(request, response, body, register) {
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  // Names in any script (Cyrillic and Kazakh included), digits, "_" and "-".
  if (!/^[\p{L}\p{N}_-]{3,24}$/u.test(username) || password.length < 8 || password.length > 128) {
    return json(response, 400, { error: "invalid_account" });
  }
  if (register) {
    const salt = randomBytes(16).toString("hex");
    const derived = await scrypt(password, salt, 64);
    const record = db.prepare("INSERT INTO users (username, salt, password_hash) VALUES (?, ?, ?) ON CONFLICT DO NOTHING")
      .run(username, salt, derived.toString("hex"));
    if (!record.changes) return json(response, 409, { error: "name_taken" });
    return json(response, 201, identity({ username }), { "Set-Cookie": newSession(request, record.lastInsertRowid) });
  }

  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  const derived = await scrypt(password, user?.salt ?? "invalid-account-placeholder", 64);
  if (!user || !timingSafeEqual(derived, Buffer.from(user.password_hash, "hex"))) {
    return json(response, 401, { error: "bad_login" });
  }
  return json(response, 200, identity(user), { "Set-Cookie": newSession(request, user.id) });
}

async function api(request, response, path) {
  const session = sessionFor(request);
  if (request.method === "GET" && path === "/api/session") return json(response, 200, identity(session));
  if (request.method !== "POST" || request.headers["sec-fetch-site"] === "cross-site" ||
      request.headers["content-type"]?.split(";")[0] !== "application/json") {
    return json(response, 405, { error: "request_error" });
  }
  if (path === "/api/plan" && !session) return json(response, 401, { error: "unauthorized" });

  const ip = request.socket.remoteAddress;
  const isPlan = path === "/api/plan";
  if (throttle(isPlan ? "plan:" + session.token : "auth:" + ip, isPlan ? 8 : 20)) {
    return json(response, 429, { error: "too_many" });
  }
  const body = await jsonBody(request);
  if (!body || typeof body !== "object" || Array.isArray(body)) return json(response, 400, { error: "invalid_input" });

  if (path === "/api/demo") {
    return json(response, 200, identity({ username: null }), { "Set-Cookie": newSession(request, null) });
  }
  if (path === "/api/login" || path === "/api/register") {
    return account(request, response, body, path === "/api/register");
  }
  if (path === "/api/logout") {
    if (session) db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(session.token);
    return json(response, 200, identity(null), { "Set-Cookie": cookie(request, "", 0) });
  }
  if (isPlan) {
    const prefs = validateRequest(body);
    if (!prefs) return json(response, 400, { error: "invalid_input" });
    const plan = planRoute(prefs);
    if (!plan) return json(response, 422, { error: "no_plan" });
    return json(response, 200, await addAiNotes(plan, prefs, process.env));
  }
  return json(response, 404, { error: "request_error" });
}

export const server = createServer(async (request, response) => {
  const path = new URL(request.url, "http://localhost").pathname;
  try {
    if (path.startsWith("/api/")) return await api(request, response, path);
    if (!["GET", "HEAD"].includes(request.method)) return json(response, 405, { error: "request_error" });
    const asset = path === "/" ? "/index.html" : path;
    const mime = types[extname(asset)];
    if (!mime || !/^\/(?:assets\/)?[a-zA-Z0-9_-]+\.[a-z0-9]+$/.test(asset)) {
      return json(response, 404, { error: "request_error" });
    }
    const file = ["/index.html", "/app.js"].includes(asset) ? "dist/client" + asset : "public" + asset;
    const content = await readFile(resolve(root, file));
    response.writeHead(200, { ...securityHeaders, "Content-Type": mime, "Cache-Control": "no-cache" });
    response.end(request.method === "HEAD" ? undefined : content);
  } catch (error) {
    if (error.code === "ENOENT") return json(response, 404, { error: "request_error" });
    console.error("AstraTravel request failed:", error.message);
    if (!response.headersSent) return json(response, 500, { error: "request_error" });
    response.end();
  }
});
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const portArg = process.argv.indexOf("--port");
  const hostArg = process.argv.indexOf("--host");
  const port = Number(portArg > 0 ? process.argv[portArg + 1] : process.env.PORT || 3000);
  const host = hostArg > 0 ? process.argv[hostArg + 1] : "0.0.0.0";
  server.listen(port, host, () => console.log("AstraTravel available at http://localhost:" + server.address().port));
}
