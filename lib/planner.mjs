import { budgets, categories, cityById, languages, origins, places as allPlaces, placeById } from "../data/catalog.js";

const visitOrder = { culture: 0, nature: 1, food: 2, city: 3 };

export function validateRequest(input) {
  if (!input || ![1, 2, 3].includes(input.days) || !Object.hasOwn(budgets, input.budget)) return null;
  if (!Array.isArray(input.interests) || input.interests.length > categories.length ||
      input.interests.some((item) => !categories.includes(item))) return null;
  if (!Object.hasOwn(languages, input.language) || !["", ...origins].includes(input.origin)) return null;
  const city = input.city === undefined ? "almaty" : input.city;
  if (!Object.hasOwn(cityById, city)) return null;
  return {
    city,
    days: input.days,
    budget: input.budget,
    interests: new Set(input.interests),
    language: input.language,
    origin: input.origin,
  };
}

function groupDay(stops, mask, prefs) {
  const daytrip = stops.some((place) => place.zone === "daytrip");
  if (daytrip && stops.length > 1) return null;
  if (stops.filter((place) => place.category === "food").length > 1) return null;
  const zones = new Set(stops.map((place) => place.zone));
  const extraMinutes = zones.size === 1 ? (stops.length - 1) * 15 : (zones.size - 1) * 45;
  const minutes = stops.reduce((sum, place) => sum + place.minutes, extraMinutes);
  const cost = stops.reduce((sum, place) => sum + (place.cost ?? 0), zones.size > 1 ? 450 : 0);
  if (minutes > 600 || cost > budgets[prefs.budget]) return null;

  const score = stops.reduce((sum, place) => {
    const interest = prefs.interests.has(place.category);
    const countryMatch = place.match?.includes(prefs.origin) && (!prefs.interests.size || prefs.interests.has("food"));
    const daytripBonus = daytrip ? (interest || !prefs.interests.size ? 9 : 0) : 0;
    return sum + 3 + (interest ? 7 : 0) + (countryMatch ? 10 : 0) + daytripBonus;
  }, 0) + new Set(stops.map((place) => place.category)).size * 1.5 - extraMinutes / 70 - cost / 18000;
  const ordered = [...stops].sort((left, right) => {
    // Visit the mountain resort early, eat in town afterwards, then see the city from Kok Tobe.
    if (left.zone === "mountains") return -1;
    if (right.zone === "mountains") return 1;
    return visitOrder[left.category] - visitOrder[right.category];
  });
  return { mask, score, daytrip, cost, minutes, stops: ordered };
}

export function planRoute(prefs) {
  // Each city is planned on its own, which also keeps the bitmasks below within 31 places.
  const places = allPlaces.filter((place) => place.city === prefs.city).slice(0, 30);
  const candidates = [];
  function collect(start, stops, mask) {
    for (let index = start; index < places.length; index++) {
      const next = [...stops, places[index]];
      const nextMask = mask | (1 << index);
      const candidate = groupDay(next, nextMask, prefs);
      if (!candidate) continue;
      candidates.push(candidate);
      if (next.length < 3 && !candidate.daytrip) collect(index + 1, next, nextMask);
    }
  }
  collect(0, [], 0);

  const memo = new Map();
  function select(remainingDays, used) {
    if (remainingDays === 0) return { score: 0, days: [] };
    const key = remainingDays * (1 << places.length) + used;
    if (memo.has(key)) return memo.get(key);
    let best = null;
    for (const candidate of candidates) {
      if (candidate.mask & used) continue;
      const rest = select(remainingDays - 1, candidate.mask | used);
      if (!rest) continue;
      const score = candidate.score + rest.score;
      if (!best || score > best.score + 1e-8) best = { score, days: [candidate, ...rest.days] };
    }
    memo.set(key, best);
    return best;
  }

  const selection = select(prefs.days, 0);
  if (!selection) return null;
  const days = selection.days
    .sort((first, second) => Number(first.daytrip) - Number(second.daytrip) || second.score - first.score)
    .map(({ stops, cost, minutes }) => ({ placeIds: stops.map((place) => place.id), cost, minutes }));
  return { mode: "demo", cost: days.reduce((sum, day) => sum + day.cost, 0), days };
}

export async function addAiNotes(plan, prefs, env) {
  if (!env.OPENAI_API_KEY) return plan;
  const language = languages[prefs.language];
  const stops = plan.days.map((day) => day.placeIds.map((id) => {
    const place = placeById[id];
    return { name: place.title[prefs.language], detail: place.tip[prefs.language] };
  }));
  const instruction = [
    "Write practical, short travel notes for a precomputed itinerary. Answer in " + language + ".",
    "Use only the given places and supplied details. Do not invent extra stops, times, live prices, or travel conditions.",
    "Return a one-sentence overview and exactly one short note per day, in the same order as the input.",
  ].join(" ");
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: "Bearer " + env.OPENAI_API_KEY, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(12000),
      body: JSON.stringify({
        model: env.OPENAI_MODEL || "gpt-4.1-mini",
        store: false,
        instructions: instruction,
        input: JSON.stringify(stops),
        max_output_tokens: 500,
        text: { format: {
          type: "json_schema", name: "itinerary_notes", strict: true,
          schema: {
            type: "object", properties: {
              overview: { type: "string" },
              notes: { type: "array", items: { type: "string" } },
            }, required: ["overview", "notes"], additionalProperties: false,
          },
        } },
      }),
    });
    if (!response.ok) return plan;
    const result = await response.json();
    const output = result.output?.flatMap((item) => item.content ?? []).find((part) => part.type === "output_text");
    const parsed = JSON.parse(output?.text ?? "");
    if (typeof parsed.overview !== "string" || parsed.notes?.length !== plan.days.length ||
        !parsed.notes.every((note) => typeof note === "string")) return plan;
    return {
      ...plan,
      mode: "ai",
      overview: parsed.overview.slice(0, 360),
      days: plan.days.map((day, index) => ({ ...day, note: parsed.notes[index].slice(0, 260) })),
    };
  } catch {
    return plan;
  }
}
