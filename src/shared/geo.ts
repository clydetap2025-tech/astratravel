import { cityById, mustSee, picksFor, placeById, places, weekendEscapes, worldKitchens } from "../../data/catalog.js";
import type { Category, Message, Place, Preferences } from "./model";

/** Great-circle distance in km, rounded to the nearest 10. */
export function distanceKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const rad = Math.PI / 180;
  const dLat = (to.lat - from.lat) * rad;
  const dLng = (to.lng - from.lng) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(from.lat * rad) * Math.cos(to.lat * rad) * Math.sin(dLng / 2) ** 2;
  return Math.round((2 * 6371 * Math.asin(Math.sqrt(a))) / 10) * 10;
}

/** The visitor's city, or Almaty when they browse the whole country. */
export const tripCity = (preferences: Preferences) => cityById[preferences.city] ? preferences.city : "almaty";

const byId = (ids: string[]) => ids.map((id) => placeById[id]).filter((place): place is Place => Boolean(place));

/** The visitor's picks in titled groups, built from their city, their country and their interests. */
export function personalGroups(preferences: Preferences): { title: Message; places: Place[] }[] {
  const likes = new Set(preferences.interests);
  const ranked = (list: Place[]) => [...list].sort((a, b) => Number(likes.has(b.category as Category)) - Number(likes.has(a.category as Category)));
  const city = tripCity(preferences);
  if (city !== "almaty") {
    const here = places.filter((place) => place.city === city);
    const groups: { title: Message; places: Place[] }[] = [
      { title: "cityHighlights", places: ranked(here.filter((place) => place.zone !== "daytrip")) },
      { title: "outOfTown", places: ranked(here.filter((place) => place.zone === "daytrip")) },
    ];
    return groups.filter((group) => group.places.length);
  }
  if (preferences.visitor === "local") {
    const groups: { title: Message; places: Place[] }[] = [
      { title: "weekendTitle", places: ranked(byId([...weekendEscapes, "big-almaty-lake", "altyn-emel", "tamgaly"])) },
      { title: "worldTitle", places: worldKitchens().slice(0, 5) },
    ];
    return likes.has("food") && !likes.has("nature") ? groups.reverse() : groups;
  }
  const home = preferences.origin ? picksFor(preferences.origin) : [];
  const extras = byId([...mustSee, "medeu", "central-museum"]).filter((place) => !home.includes(place));
  return [
    ...(home.length ? [{ title: "homeTaste" as Message, places: home }] : []),
    { title: "cityHighlights", places: ranked(extras) },
  ];
}
