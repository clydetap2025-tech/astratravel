import { placeById, places as allPlaces } from "../../data/catalog.js";
import { fill } from "../../data/i18n.js";
import { FlightStack } from "../features/tickets/flights";
import { useTravel } from "../shared/context";
import { tripCity } from "../shared/geo";
import { flightsFor } from "../shared/model";
import { EmptyState, PageHeader, Section } from "../shared/ui";
import { PlaceGrid } from "./PlacesPage";

/** Saved: bookmarked places and flights, and the places already visited. Empty, it suggests a start. */
export function SavedPage() {
  const { saved, t, preferences, language } = useTravel();
  const places = saved.places.map((id) => placeById[id]).filter(Boolean);
  const visited = saved.visited.map((id) => placeById[id]).filter(Boolean);
  const flights = saved.flights.flatMap(({ key, search }) => flightsFor(search).filter((flight) => flight.key === key));
  const city = tripCity(preferences);
  const starters = allPlaces.filter((place) => place.city === city).slice(0, 3);
  const empty = !places.length && !flights.length;
  return <>
    <PageHeader title={t("saved")} lead={t("savedOnDevice")}
      actions={places.length > 0 ? <span className="badge">{fill("savedCount", language, places.length, allPlaces.length)}</span> : undefined} />
    {empty && <EmptyState icon="heart" title={t("noSaved")} description={t("noSavedBody")}>
      <a className="button button-primary" href="#places">{t("discover")}</a>
    </EmptyState>}
    {empty && starters.length > 0 && <Section id="starters" title={t("savedSuggest")}><PlaceGrid list={starters} /></Section>}
    {places.length > 0 && <Section id="saved-places" title={t("places")} count={places.length}><PlaceGrid list={places} /></Section>}
    {flights.length > 0 && <Section id="saved-flights" title={t("flights")} count={flights.length}><FlightStack flights={flights} /></Section>}
    {visited.length > 0 && <Section id="visited" title={t("visitedTitle")} count={visited.length}><PlaceGrid list={visited} /></Section>}
  </>;
}
