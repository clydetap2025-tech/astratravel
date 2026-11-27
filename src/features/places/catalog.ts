import type { Category, Place } from "../../shared/model";

export const filters = ["all", "nature", "food", "culture", "city"] as const;
export const sorts = { recommended: "sortRecommended", quick: "sortQuick", cheap: "sortCheap" } as const;
export type SortOrder = keyof typeof sorts;
export type PlaceFilters = { category: Category | "all"; query: string; sort: SortOrder };
export const initialFilters: PlaceFilters = { category: "all", query: "", sort: "recommended" };

/** Groups of a city's catalogue by how far they are: in town, around it, a day trip away. */
export const ZONES = [
  { key: "center", title: "zoneCenter", match: (zone: string) => zone === "center" },
  { key: "near", title: "zoneNear", match: (zone: string) => zone === "outskirts" || zone === "hill" || zone === "mountains" },
  { key: "away", title: "zoneAway", match: (zone: string) => zone === "daytrip" },
] as const;

const normalized = (text: string) => text.trim().normalize("NFKC").toLocaleLowerCase();

/** The places that match the category and the search text (in any language), in the chosen order. */
export function filterPlaces(list: Place[], filter: PlaceFilters, local: (value: Record<string, string>) => string) {
  const query = normalized(filter.query);
  const found = list.filter((place) => {
    if (filter.category !== "all" && place.category !== filter.category) return false;
    if (!query) return true;
    const text = [local(place.summary), ...Object.values(place.title), ...Object.values(place.location), ...Object.values(place.address)].join(" ");
    return normalized(text).includes(query);
  });
  if (filter.sort === "quick") return [...found].sort((a, b) => a.minutes - b.minutes);
  if (filter.sort === "cheap") return [...found].sort((a, b) => (a.cost ?? Infinity) - (b.cost ?? Infinity));
  return found;
}
