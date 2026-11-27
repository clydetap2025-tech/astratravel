import { cityById, places } from "../../../data/catalog.js";
import { countLabel } from "../../../data/i18n.js";
import { useTravel } from "../../shared/context";
import { distanceKm, tripCity } from "../../shared/geo";
import { creditOf, hasPhoto, Icon, PlaceImage } from "../../shared/ui";
import { CityGlobe, CitySelect } from "./CityGlobe";

/** "От Алматы" → "от Алматы": only the first letter, so names keep their capital. */
const lowerFirst = (text: string) => text.charAt(0).toLocaleLowerCase() + text.slice(1);

/**
 * The top of the Places page: the globe on the left is how you move between cities; on the right,
 * the chosen city — its photo, name, a few plain numbers and what to do next.
 */
export function CityHeader() {
  const { preferences, saved, t, local, language, number } = useTravel();
  const all = preferences.city === "all";
  const city = cityById[tripCity(preferences)];
  const here = all ? places : places.filter((place) => place.city === city.id);
  // The photo is the first one that shows a place of this city (not a dish or a general view).
  const cover = here.find((place) => hasPhoto(place) && (creditOf(place.id)?.kind ?? "place") === "place") ?? here.find(hasPhoto);
  const trips = here.filter((place) => place.zone === "daytrip").length;
  const far = all || city.id === "almaty" ? 0 : distanceKm(cityById.almaty, city);
  const seen = here.filter((place) => saved.visited.includes(place.id)).length;
  return <section className="city-stage" aria-labelledby="page-title">
    <div className="city-stage-globe">
      <CityGlobe />
      <p className="city-stage-hint">{t("globeHint")}</p>
    </div>
    <div className="city-stage-info">
      <CitySelect />
      {cover && <div className="city-photo"><PlaceImage place={cover} lazy={false} parallax /></div>}
      <h1 id="page-title">{all ? t("allCities") : local(city.name)}</h1>
      <p className="city-region">{all ? t("heroBlurb") : local(city.region)}</p>
      <p className="city-facts">
        <span><strong>{here.length}</strong> {countLabel(here.length, "placeCount", language)}</span>
        {trips > 0 && <span><strong>{trips}</strong> {lowerFirst(t("statTrips"))}</span>}
        {far > 0 && <span><strong>{number(far)}</strong> km {lowerFirst(t("statFromAlmaty"))}</span>}
        {seen > 0 && <span><Icon name="flag" size={14} />{t("visitedProgress").replace("{n}", String(seen)).replace("{m}", String(here.length))}</span>}
      </p>
      <div className="actions">
        <a className="button button-primary" href="#planner"><Icon name="route" size={18} />{t("makePlan")}</a>
        <a className="button" href="#welcome">{t(preferences.visitor ? "editProfile" : "customizePicks")}</a>
      </div>
    </div>
  </section>;
}
