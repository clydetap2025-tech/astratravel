// Astra AI chat: the instructions (system prompt + chat mode + the app's data for the city) and a streamed
// answer from the OpenAI Responses API. Message texts are never logged.
import { budgets, cityById, languages, places, placeById } from "../data/catalog.js";
import { districtByKey } from "../data/districts.js";
import { countryName } from "../data/i18n.js";
import { CHAT_MODE, fillPrompt } from "./ai-prompt.mjs";

const LANGS = new Set(["ru", "kk", "en", "ja"]);
const id = (value) => typeof value === "string" && /^[a-z0-9-]{2,40}$/.test(value) ? value : null;

/** Checks the request body of /api/chat; returns null when it is not acceptable. */
export function validateChat(body) {
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 2000) return null;
  const language = LANGS.has(body.language) ? body.language : "ru";
  const context = body.context && typeof body.context === "object" ? body.context : {};
  const placeId = id(context.placeId) && placeById[context.placeId] ? context.placeId : null;
  const cityId = id(context.cityId) && cityById[context.cityId] ? context.cityId : placeId ? placeById[placeId].city : "almaty";
  const route = Array.isArray(context.route) ? context.route.filter((item) => id(item) && placeById[item]).slice(0, 20) : [];
  const visitor = context.visitor === "guest" || context.visitor === "local" ? context.visitor : "";
  const origin = typeof context.origin === "string" && /^([A-Z]{2}|OTHER)$/.test(context.origin) ? context.origin : "";
  const district = typeof context.district === "string" && districtByKey[context.district] ? context.district : "";
  const conversationId = typeof body.conversationId === "string" && /^[0-9a-f-]{36}$/.test(body.conversationId) ? body.conversationId : null;
  // Guests have no stored history; the browser sends the last turns (at most 6) of the current chat.
  const history = Array.isArray(body.history) ? body.history
    .filter((item) => (item?.role === "user" || item?.role === "assistant") && typeof item.content === "string" && item.content.length <= 2000)
    .slice(-6).map((item) => ({ role: item.role, content: item.content })) : [];
  return { message, language, placeId, cityId, route, visitor, origin, district, conversationId, history };
}

function describe(place, lang) {
  return {
    id: place.id, name: place.title[lang], category: place.category, address: place.address?.[lang] ?? "",
    minutes: place.minutes, cost: place.cost ?? null, tip: place.tip?.[lang] ?? "",
    ...(place.match?.length ? { match: place.match } : {}), ...(place.twogis ? { has2gis: true } : {}),
  };
}

export function chatInstructions(chat) {
  const lang = chat.language;
  const city = cityById[chat.cityId];
  const itinerary = chat.route.map((placeId) => describe(placeById[placeId], lang));
  const base = fillPrompt({
    language: lang + " (" + languages[lang] + ")",
    visitor: chat.visitor || '""',
    origin_country: chat.origin ? chat.origin + " — " + countryName(chat.origin, "en") : "",
    district: chat.district ? districtByKey[chat.district].name.ru : "",
    city: city.name[lang],
    interests: "не указаны",
    days: "—",
    budget: budgets.standard,
    itinerary: JSON.stringify(itinerary),
  });
  const catalog = places.filter((place) => place.city === chat.cityId).map((place) => describe(place, lang));
  const focus = chat.placeId ? "\n\nПользователь открыл чат из карточки места: " + JSON.stringify(describe(placeById[chat.placeId], lang)) : "";
  return base + "\n\n" + fillPrompt({ language: lang, itinerary: "«Мой маршрут»" }, CHAT_MODE)
    + "\n\n# Каталог города " + city.name.ru + " (данные приложения)\n" + JSON.stringify(catalog) + focus;
}

/**
 * Streams the answer: calls onDelta(text) for each piece and resolves with { text, usage }.
 * Throws on an OpenAI error before the first piece; a stop (signal) resolves with what came so far.
 */
export async function streamAnswer({ env, model, instructions, history, message, signal, onDelta }) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    signal,
    headers: { Authorization: "Bearer " + env.OPENAI_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      model, store: false, stream: true, reasoning: { effort: "low" }, max_output_tokens: 900, instructions,
      input: [...history, { role: "user", content: message }].map((item) => ({ role: item.role, content: item.content })),
    }),
  });
  if (!response.ok || !response.body) throw new Error("openai_" + response.status);
  let text = "";
  let usage = null;
  let buffer = "";
  const decoder = new TextDecoder();
  try {
    for await (const chunk of response.body) {
      buffer += decoder.decode(chunk, { stream: true });
      let index;
      while ((index = buffer.indexOf("\n\n")) >= 0) {
        const block = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);
        const data = block.split("\n").filter((line) => line.startsWith("data: ")).map((line) => line.slice(6)).join("");
        if (!data || data === "[DONE]") continue;
        let event;
        try { event = JSON.parse(data); } catch { continue; }
        if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
          text += event.delta;
          onDelta(event.delta);
        } else if (event.type === "response.completed") {
          usage = event.response?.usage ?? null;
        } else if (event.type === "response.failed" || event.type === "error") {
          if (!text) throw new Error("openai_failed");
        }
      }
    }
  } catch (error) {
    if (!signal?.aborted || !text) throw error;
  }
  return { text: text.slice(0, 2000), usage };
}
