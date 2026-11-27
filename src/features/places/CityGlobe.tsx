import { useMemo } from "react";
import { cities } from "../../../data/catalog.js";
import { fill, tr } from "../../../data/i18n.js";
import { between, globeTheme } from "../../components/ui/globe-stage";
import { BORDER } from "../../components/ui/kz-map";
import { RouteGlobe, type Place as GlobePlace } from "../../components/ui/route-globe";
import { useDarkTheme, useTravel } from "../../shared/context";
import { distanceKm, tripCity } from "../../shared/geo";

/** Roughly the middle of Kazakhstan. */
const KZ_MIDDLE = { lat: 48, lng: 67 };

/**
 * The globe as the city switcher: the chosen city in the middle with routes to every other one.
 * A tap on a city's point (or arrow keys and Enter) opens that city; hovering shows the distance.
 */
export function CityGlobe() {
  const { preferences, updatePreferences, local, language } = useTravel();
  const dark = useDarkTheme();
  const city = cities.find((item) => item.id === tripCity(preferences)) ?? cities[0];
  const others = useMemo(() => cities.filter((item) => item.id !== city.id), [city]);
  const hub = useMemo<GlobePlace>(() => ({ name: local(city.name), lon: city.lng, lat: city.lat }), [city, language]); // eslint-disable-line react-hooks/exhaustive-deps
  const routes = useMemo<GlobePlace[]>(() => {
    const km = new Intl.NumberFormat(language);
    return others.map((item) => ({
      name: local(item.name), lon: item.lng, lat: item.lat,
      note: tr("kmToAlmaty", language).replace("{n}", km.format(distanceKm(item, city))).replace("{city}", local(city.name)),
    }));
  }, [others, language]); // eslint-disable-line react-hooks/exhaustive-deps
  // Halfway between the city and the middle of the country, so its routes to every corner fit in the view.
  const focus = useMemo(() => between(city, KZ_MIDDLE, 0.5), [city]);
  return <RouteGlobe hub={hub} places={routes} theme={globeTheme(dark)} focus={focus} zoom={4.2} outline={BORDER}
    onSelect={(next) => updatePreferences({ city: others[next].id })} onHubSelect={() => updatePreferences({ city: city.id })}
    label={fill("routesFrom", language, routes.length).replace("{city}", hub.name)}
    describe={(place, from) => from.name + " — " + place.name + (place.note ? ", " + place.note : "")} />;
}

/** The same choice as a plain list, for keyboards, screen readers and quick jumps. */
export function CitySelect({ id = "city-select", withAll = true }: { id?: string; withAll?: boolean }) {
  const { preferences, updatePreferences, t, local } = useTravel();
  return <label className="select-wrap city-select" htmlFor={id}>
    <span className="sr-only">{t("cityLabel")}</span>
    <select id={id} value={withAll || preferences.city !== "all" ? preferences.city : tripCity(preferences)}
      onChange={(event) => updatePreferences({ city: event.target.value })}>
      {cities.map((item) => <option key={item.id} value={item.id}>{local(item.name)}</option>)}
      {withAll && <option value="all">{t("allCities")}</option>}
    </select>
    <svg className="icon" width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><path d="m6.5 9.5 5.5 5.5 5.5-5.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
  </label>;
}
