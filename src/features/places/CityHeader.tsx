import { cities, cityById, places } from "../../../data/catalog.js";
import { countLabel } from "../../../data/i18n.js";
import { KzMap } from "../../components/ui/kz-map";
import { useTravel } from "../../shared/context";
import { distanceKm, tripCity } from "../../shared/geo";
import { creditOf, hasPhoto, Icon, PlaceImage } from "../../shared/ui";

/** The city switcher: every city with its number of places, plus the whole country. */
export function CityBar() {
  const { preferences, updatePreferences, t, local, language } = useTravel();
  const count = (id: string) => places.filter((place) => place.city === id).length;
  const options = [...cities.map((city) => ({ id: city.id, name: local(city.name), count: count(city.id) })),
    { id: "all", name: t("allCities"), count: places.length }];
  return <nav className="city-bar glass" aria-label={t("cityLabel")}>
    {options.map((option) => <button key={option.id} type="button" className="city-chip" aria-pressed={preferences.city === option.id}
      onClick={() => updatePreferences({ city: option.id })}>
      <span>{option.name}</span><small>{option.count} {countLabel(option.count, "placeCount", language)}</small>
    </button>)}
  </nav>;
}

/**
 * The head of a city: a photo of the city across the page that drifts as you scroll, with a glass
 * panel on it — name, real numbers, how much of it you have seen — and the map of the country.
 */
export function CityHeader() {
  const { preferences, updatePreferences, saved, t, local, language, number, span } = useTravel();
  const city = cityById[tripCity(preferences)];
  const here = places.filter((place) => place.city === city.id);
  // The cover is the first photo that shows a place of this city (not a dish or a generic city view).
  const cover = here.find((place) => hasPhoto(place) && (creditOf(place.id)?.kind ?? "place") === "place") ?? here.find(hasPhoto) ?? here[0];
  const trips = here.filter((place) => place.zone === "daytrip").length;
  const hours = Math.round(here.reduce((sum, place) => sum + place.minutes, 0) / 60);
  const far = city.id === "almaty" ? 0 : distanceKm(cityById.almaty, city);
  const seen = here.filter((place) => saved.visited.includes(place.id)).length;
  return <header className="city-header">
    {cover && <PlaceImage place={cover} className="city-cover" lazy={false} parallax />}
    <div className="city-header-grid">
      <div className="city-panel glass glass-strong">
        <p className="eyebrow"><Icon name="pin" size={14} />{local(city.region)}</p>
        <h1 id="page-title">{local(city.name)}</h1>
        <dl className="stats">
          <div><dt>{countLabel(here.length, "placeCount", language)}</dt><dd>{here.length}</dd></div>
          <div><dt>{t("statTrips")}</dt><dd>{trips}</dd></div>
          <div><dt>{t("statHours")}</dt><dd>{hours}</dd></div>
          {far > 0 && <div><dt>{t("statFromAlmaty")}</dt><dd>{number(far)}<small> km</small></dd></div>}
        </dl>
        <label className="progress">
          <span className="progress-text"><Icon name="flag" size={15} />{t("visitedProgress").replace("{n}", String(seen)).replace("{m}", String(here.length))}</span>
          <progress value={seen} max={Math.max(1, here.length)} />
        </label>
        <div className="actions">
          <a className="button button-primary" href="#planner"><Icon name="route" size={18} />{t("makePlan")}</a>
          <a className="button" href="#welcome"><Icon name="sparkles" size={17} />{t(preferences.visitor ? "editProfile" : "customizePicks")}</a>
        </div>
      </div>
      <div className="city-map glass">
        <KzMap current={city.id} onPick={(id) => updatePreferences({ city: id })} label={(id) => local(cityById[id].name)} />
        <p className="city-map-caption">{city.airport} · {far > 0 ? span(Math.max(60, Math.round(42 + far / 12))) + " " + t("flightFromAlmaty") : t("cityLabel")}</p>
      </div>
    </div>
  </header>;
}
