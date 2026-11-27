import { budgets, categories, cityById, languages, origins, places, placeById } from "../../data/catalog.js";
import { districtByKey } from "../../data/districts.js";
import { copy } from "../../data/i18n.js";
import { airports, demoFlights, isFlightSearch } from "../../data/tickets.js";

export type Language = keyof typeof languages;
export type Message = keyof typeof copy;
export type Place = (typeof places)[number];
export type Category = "nature" | "food" | "culture" | "city";
export type Airport = Extract<keyof typeof airports, string>;
export type FlightSearch = { from: Airport; to: Airport; date: string; passengers: number };
export type Flight = Omit<ReturnType<typeof demoFlights>[number], "search"> & { search: FlightSearch; transit?: string };
export type FlightBookmark = { key: string; search: FlightSearch };
/** Everything the visitor keeps on this device: bookmarks, the places of their own route (in order) and places they have been to. */
export type Saved = { places: string[]; flights: FlightBookmark[]; route: string[]; visited: string[] };
export type Visitor = "" | "guest" | "local";
export type Preferences = { language: Language; origin: string; visitor: Visitor; district: string; interests: Category[]; city: string };
export type Theme = "system" | "light" | "dark";
export type PlanInputs = { days: number; budget: keyof typeof budgets; interests: Category[] };
export type Plan = {
  mode: "ai" | "demo";
  cost: number;
  days: { placeIds: string[]; cost: number; minutes: number; note?: string }[];
  overview?: string;
};
export type Session = {
  mode: "local" | "offline" | "sites";
  user: { username?: string | null } | null;
  canActivate?: boolean;
  /** Whether the server has an AI key; without one the AI card says so instead of asking to sign in. */
  ai?: boolean;
};
export type Modal = { kind: "profile" | "account" | "credits" } | { kind: "place"; place: Place } | { kind: "flight"; flight: Flight };
export type Page = "welcome" | "places" | "tickets" | "saved" | "planner";
export type AuthAction = "login" | "register" | "demo" | "logout" | "activate";
export type Credentials = { username: string; password: string };
type ApiRoutes = {
  session: { input: undefined; output: Session };
  plan: { input: PlanInputs & Pick<Preferences, "language" | "origin" | "visitor" | "district" | "city">; output: Plan };
} & Record<AuthAction, { input: Credentials | Record<string, never>; output: Session }>;
export type Api = <Route extends keyof ApiRoutes>(
  route: Route, body: ApiRoutes[Route]["input"], signal?: AbortSignal,
) => Promise<ApiRoutes[Route]["output"]>;

export const fetchApi: Api = async (route, body, signal) => {
  const response = await fetch("/api/" + route, body === undefined ? { signal } : {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "request_error");
  return result;
};

export function flightsFor(search: FlightSearch): Flight[] {
  return demoFlights(search);
}

function stored(key: string): unknown {
  try { return JSON.parse(window.localStorage.getItem("astratravel." + key) ?? "null"); }
  catch { return null; }
}

export function saveLocal(key: string, value: Preferences | Saved | Plan | Theme | boolean | null) {
  try {
    if (value === null) window.localStorage.removeItem("astratravel." + key);
    else window.localStorage.setItem("astratravel." + key, JSON.stringify(value));
  }
  catch { /* Storage can be disabled for previews. */ }
}

/** On a first visit, the browser's own language when the guide has it; Russian otherwise. */
function browserLanguage(): Language {
  if (typeof navigator === "undefined") return "ru";
  for (const tag of navigator.languages ?? [navigator.language]) {
    const code = tag.slice(0, 2).toLowerCase();
    if (Object.hasOwn(languages, code)) return code as Language;
  }
  return "ru";
}

export function readPreferences(): Preferences {
  const record = stored("profile") as Partial<Preferences> | null;
  const visitor = record?.visitor === "guest" || record?.visitor === "local" ? record.visitor : record?.origin ? "guest" : "";
  return {
    language: record?.language && Object.hasOwn(languages, record.language) ? record.language : browserLanguage(),
    origin: visitor === "guest" && record?.origin && origins.includes(record.origin) ? record.origin : "",
    visitor,
    district: visitor === "local" && typeof record?.district === "string" && Object.hasOwn(districtByKey, record.district) ? record.district : "",
    city: typeof record?.city === "string" && (record.city === "all" || Object.hasOwn(cityById, record.city)) ? record.city : "almaty",
    interests: Array.isArray(record?.interests) ? record.interests.filter((item): item is Category => categories.includes(item)) : [],
  };
}

/** The last plan, so it survives a reload. Anything that no longer matches the catalog is dropped. */
export function readPlan(): Plan | null {
  const record = stored("plan") as Plan | null;
  if (!record || !Array.isArray(record.days) || !record.days.length || typeof record.cost !== "number") return null;
  const days = record.days.filter((day) => Array.isArray(day?.placeIds) && day.placeIds.every((id) => Object.hasOwn(placeById, id))
    && typeof day.cost === "number" && typeof day.minutes === "number");
  if (days.length !== record.days.length) return null;
  return {
    mode: record.mode === "ai" ? "ai" : "demo", cost: record.cost,
    overview: typeof record.overview === "string" ? record.overview : undefined,
    days: days.map(({ placeIds, cost, minutes, note }) => ({ placeIds, cost, minutes, note: typeof note === "string" ? note : undefined })),
  };
}

/** Countries a place is matched to ("a taste of home"); landmarks outside Almaty have none. */
export function matchesOf(place: Place): string[] {
  return (place as { match?: string[] }).match ?? [];
}

export function readOnboarded() {
  return stored("onboarded") === true;
}

export function readTheme(): Theme {
  const value = stored("theme");
  return value === "light" || value === "dark" ? value : "system";
}

export function readSaved(): Saved {
  const record = stored("saved") as Partial<Saved> | null;
  const ids = (list: unknown) => Array.isArray(list) ? [...new Set(list.filter((id): id is string => typeof id === "string" && Object.hasOwn(placeById, id)))] : [];
  return {
    places: ids(record?.places), route: ids(record?.route), visited: ids(record?.visited),
    flights: Array.isArray(record?.flights) ? record.flights.filter((entry) =>
      entry && isFlightSearch(entry.search) && flightsFor(entry.search).some((flight) => flight.key === entry.key)) : [],
  };
}

/** A link straight to one place: #places/<id>. */
export function placeFromHash(hash = globalThis.location?.hash ?? ""): Place | undefined {
  const match = /^#places\/([\w-]+)$/.exec(hash);
  return match ? placeById[match[1]] : undefined;
}

export const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: reducedMotion() ? "instant" : "smooth", block: "start",
  });
}
