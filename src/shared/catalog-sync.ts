import { cityById, places, placeById } from "../../data/catalog.js";
import { photoCredits } from "../../data/photos.js";
import type { Database } from "./database.types";
import type { Supabase } from "./supabase";

type Row = Database["public"]["Tables"]["places"]["Row"];
type Localized = { ru: string; kk: string; en: string; ja: string };
type Mutable = Record<string, unknown>;

/** Photos uploaded in the admin panel (Supabase Storage), by place id. */
export const photoOverrides: Record<string, string> = {};

const isLocalized = (value: unknown): value is Localized =>
  Boolean(value) && typeof value === "object" && ["ru", "kk", "en", "ja"].every((key) => typeof (value as Mutable)[key] === "string");

/**
 * The catalogue ships with the site (data/*.js) so it works offline and without Supabase. When the site is
 * connected, edits made in the admin panel are laid over it: texts, time, price, coordinates, photo and
 * "published". New places need their city in data/catalog.js; they are added when the city is known.
 */
export function applyCatalogRows(rows: Row[]) {
  const published = new Set<string>();
  for (const row of rows) {
    if (!row.is_published) continue;
    published.add(row.id);
    let place = placeById[row.id] as unknown as Mutable | undefined;
    if (!place) {
      if (!Object.hasOwn(cityById, row.city_id) || !isLocalized(row.title)) continue;
      place = { id: row.id, city: row.city_id, photo: false, source: row.source_url, map: row.map_query };
      (places as unknown as Mutable[]).push(place);
      (placeById as unknown as Record<string, Mutable>)[row.id] = place;
    }
    for (const key of ["title", "summary", "tip", "address", "location"] as const) if (isLocalized(row[key])) place[key] = row[key];
    place.category = row.category;
    place.zone = row.zone;
    place.minutes = row.minutes;
    place.cost = row.cost_kzt;
    if (row.twogis_url) place.twogis = row.twogis_url;
    if (row.lat !== null && row.lng !== null) { place.lat = Number(row.lat); place.lng = Number(row.lng); }
    if (row.photo_url?.startsWith("https://") && row.photo_author && row.photo_license) {
      photoOverrides[row.id] = row.photo_url;
      (photoCredits as Record<string, unknown>)[row.id] = {
        file: "", page: row.photo_page ?? row.photo_url, author: row.photo_author, license: row.photo_license, licenseUrl: "",
        article: "", kind: row.photo_kind === "city" || row.photo_kind === "dish" ? row.photo_kind : "place",
      };
      delete place.photo;
    }
  }
  // Places an editor unpublished disappear from the site. Visitors can only read published rows, so a bundled
  // place missing from them is unpublished; this only applies once the database holds the seeded catalogue.
  if (published.size >= places.length / 2) {
    for (let index = places.length - 1; index >= 0; index -= 1) {
      const id = places[index].id;
      if (!published.has(id)) {
        places.splice(index, 1);
        delete (placeById as Record<string, unknown>)[id];
      }
    }
  }
}

export async function loadCatalog(client: Supabase) {
  const { data, error } = await client.from("places").select("*").eq("is_published", true);
  if (error || !data) return false;
  applyCatalogRows(data);
  return true;
}
