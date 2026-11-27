import { categories, cityById, origins, placeById } from "../../data/catalog.js";
import { districtByKey } from "../../data/districts.js";
import { isFlightSearch } from "../../data/tickets.js";
import type { Category, FlightBookmark, Preferences, Role, Saved } from "./model";
import type { Supabase } from "./supabase";

export type Profile = {
  role: Role; displayName: string | null; blocked: boolean;
  preferences: Partial<Preferences>;
};

const syncedKey = (uid: string) => "astratravel.synced." + uid;

/** Reads the account: profile, favourites, flights, route (in order) and visited places. */
export async function pullAccount(client: Supabase, uid: string): Promise<{ profile: Profile; saved: Saved }> {
  const [profile, places, flights, route, visited] = await Promise.all([
    client.from("profiles").select("role, display_name, blocked_at, language, origin, visitor, district, interests, city_id").eq("id", uid).single(),
    client.from("saved_places").select("place_id").order("created_at"),
    client.from("saved_flights").select("flight_key, search").order("created_at"),
    client.from("user_route").select("place_id, position").order("position"),
    client.from("visited_places").select("place_id").order("created_at"),
  ]);
  for (const result of [profile, places, flights, route, visited]) if (result.error) throw result.error;
  const row = profile.data!;
  const known = (id: string) => Object.hasOwn(placeById, id);
  const preferences: Partial<Preferences> = {};
  if (row.language === "ru" || row.language === "kk" || row.language === "en" || row.language === "ja") preferences.language = row.language;
  if (row.visitor === "guest" || row.visitor === "local") preferences.visitor = row.visitor;
  if (row.origin && origins.includes(row.origin)) preferences.origin = row.origin;
  if (row.district && Object.hasOwn(districtByKey, row.district)) preferences.district = row.district;
  if (row.city_id && Object.hasOwn(cityById, row.city_id)) preferences.city = row.city_id;
  if (row.interests?.length) preferences.interests = row.interests.filter((item): item is Category => categories.includes(item));
  return {
    profile: { role: (row.role as Role) ?? "user", displayName: row.display_name, blocked: Boolean(row.blocked_at), preferences },
    saved: {
      places: places.data!.map((item) => item.place_id).filter(known),
      flights: flights.data!.filter((item) => isFlightSearch(item.search)).map((item) => ({ key: item.flight_key, search: item.search as FlightBookmark["search"] })),
      route: route.data!.map((item) => item.place_id).filter(known),
      visited: visited.data!.map((item) => item.place_id).filter(known),
    },
  };
}

/**
 * First sign-in on this device: what was kept in the browser joins the account (nothing is lost on
 * either side), then the account is read back. Later sign-ins just read the account.
 */
export async function mergeLocalIntoAccount(client: Supabase, uid: string, local: Saved, preferences: Preferences) {
  let alreadySynced = false;
  try { alreadySynced = localStorage.getItem(syncedKey(uid)) === "1"; } catch { /* Storage can be disabled. */ }
  if (!alreadySynced) {
    const remote = await pullAccount(client, uid);
    const writes = [];
    if (local.places.length) writes.push(client.from("saved_places").upsert(local.places.map((place_id) => ({ user_id: uid, place_id })), { onConflict: "user_id,place_id", ignoreDuplicates: true }));
    if (local.flights.length) writes.push(client.from("saved_flights").upsert(local.flights.map((flight) => ({ user_id: uid, flight_key: flight.key, search: flight.search })), { onConflict: "user_id,flight_key", ignoreDuplicates: true }));
    if (local.visited.length) writes.push(client.from("visited_places").upsert(local.visited.map((place_id) => ({ user_id: uid, place_id })), { onConflict: "user_id,place_id", ignoreDuplicates: true }));
    if (local.route.length) writes.push(client.rpc("set_my_route", { place_ids: [...new Set([...remote.saved.route, ...local.route])] }));
    // Settings chosen before signing in fill the gaps of a new profile.
    if (!remote.profile.preferences.visitor && preferences.visitor) writes.push(savePreferences(client, uid, preferences));
    for (const result of await Promise.all(writes)) if (result.error) throw result.error;
    try { localStorage.setItem(syncedKey(uid), "1"); } catch { /* Optional. */ }
  }
  return pullAccount(client, uid);
}

export function savePreferences(client: Supabase, uid: string, preferences: Preferences) {
  return client.from("profiles").update({
    language: preferences.language, origin: preferences.origin || null, visitor: preferences.visitor || null,
    district: preferences.district || null, interests: preferences.interests,
    city_id: preferences.city !== "all" && Object.hasOwn(cityById, preferences.city) ? preferences.city : null,
  }).eq("id", uid);
}

/** One change of the visitor's lists, written as soon as it happens. */
export async function writeChange(client: Supabase, uid: string, before: Saved, after: Saved) {
  const added = (a: string[], b: string[]) => b.filter((id) => !a.includes(id));
  const jobs = [];
  const placesAdded = added(before.places, after.places), placesRemoved = added(after.places, before.places);
  if (placesAdded.length) jobs.push(client.from("saved_places").upsert(placesAdded.map((place_id) => ({ user_id: uid, place_id })), { onConflict: "user_id,place_id", ignoreDuplicates: true }));
  if (placesRemoved.length) jobs.push(client.from("saved_places").delete().eq("user_id", uid).in("place_id", placesRemoved));
  const visitedAdded = added(before.visited, after.visited), visitedRemoved = added(after.visited, before.visited);
  if (visitedAdded.length) jobs.push(client.from("visited_places").upsert(visitedAdded.map((place_id) => ({ user_id: uid, place_id })), { onConflict: "user_id,place_id", ignoreDuplicates: true }));
  if (visitedRemoved.length) jobs.push(client.from("visited_places").delete().eq("user_id", uid).in("place_id", visitedRemoved));
  if (before.route.join() !== after.route.join()) jobs.push(client.rpc("set_my_route", { place_ids: after.route }));
  const keys = (list: FlightBookmark[]) => list.map((flight) => flight.key);
  const flightsAdded = after.flights.filter((flight) => !keys(before.flights).includes(flight.key));
  const flightsRemoved = added(keys(after.flights), keys(before.flights));
  if (flightsAdded.length) jobs.push(client.from("saved_flights").upsert(flightsAdded.map((flight) => ({ user_id: uid, flight_key: flight.key, search: flight.search })), { onConflict: "user_id,flight_key", ignoreDuplicates: true }));
  if (flightsRemoved.length) jobs.push(client.from("saved_flights").delete().eq("user_id", uid).in("flight_key", flightsRemoved));
  for (const result of await Promise.all(jobs)) if (result.error) throw result.error;
}

export type LimitStatus = { left: number; limit: number; resetsAt: string; enabled: boolean; blocked: boolean };

export async function readLimit(client: Supabase): Promise<LimitStatus | null> {
  const { data, error } = await client.rpc("ai_limit_status");
  const row = data?.[0];
  if (error || !row) return null;
  return { left: row.messages_left, limit: row.daily_limit, resetsAt: row.resets_at, enabled: row.ai_enabled, blocked: row.blocked };
}
