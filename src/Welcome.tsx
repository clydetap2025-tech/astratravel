import { useMemo } from "react";
import { m } from "motion/react";
import { cityById, mustSee, origins, picksFor, placeById, places, weekendEscapes, worldKitchens } from "../data/catalog.js";
import { fill, tr } from "../data/i18n.js";
import { travellerByCountry, travellers } from "../data/travellers.js";
import { between, GlobeStage, globeTheme } from "./components/ui/globe-stage";
import { RouteGlobe, type Place as GlobePlace } from "./components/ui/route-globe";
import { Icon } from "./Icon";
import type { Category, Message, Place, Preferences } from "./model";
import { rise, stagger } from "./motion";
import { CountryBadge, PlaceImage, useDarkTheme, useTravel } from "./ui";

/** Great-circle distance in km, rounded to the nearest 10. */
export function distanceKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const rad = Math.PI / 180;
  const dLat = (to.lat - from.lat) * rad;
  const dLng = (to.lng - from.lng) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(from.lat * rad) * Math.cos(to.lat * rad) * Math.sin(dLng / 2) ** 2;
  return Math.round((2 * 6371 * Math.asin(Math.sqrt(a))) / 10) * 10;
}

const byId = (ids: string[]) => ids.map((id) => placeById[id]).filter((place): place is Place => Boolean(place));
/** The visitor's city, or Almaty when they browse the whole country. */
export const tripCity = (preferences: Preferences) => cityById[preferences.city] ? preferences.city : "almaty";

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

export function PickRow({ place, index }: { place: Place; index: number }) {
  const { open, local, price } = useTravel();
  return <m.li variants={rise}><button type="button" className="pick-row" onClick={(event) => open({ kind: "place", place }, event.currentTarget)}>
    <span className="pick-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
    <PlaceImage place={place} className="pick-thumb" width={56} height={56} />
    <span className="pick-text"><strong>{local(place.title)}</strong>
      <small>{local(place.summary)}</small></span>
    <span className="pick-cost">{price(place.cost)}</span>
  </button></m.li>;
}

export function PickGroup({ title, places: list, badge }: { title: Message; places: Place[]; badge?: string }) {
  const { t } = useTravel();
  return <div className="pick-group">
    <h3>{badge && <CountryBadge code={badge} />}{t(title)}</h3>
    <m.ul variants={stagger} initial="enter" animate="center">{list.map((place, index) => <PickRow key={place.id} place={place} index={index} />)}</m.ul>
  </div>;
}

/**
 * The guest's "where from" step: a country list beside the globe. The globe turns to the country
 * and draws its way to the city they picked; the card states the route and, for Almaty, the
 * places with food from their country.
 */
export function GuestStep() {
  const { preferences, updatePreferences, t, local, language, country } = useTravel();
  const dark = useDarkTheme();
  const origin = preferences.origin;
  const active = travellers.findIndex((item) => item.country === origin);
  const city = cityById[tripCity(preferences)];

  // One route per country of origin, from the city of the trip, each with its distance.
  const hub = useMemo<GlobePlace>(() => ({ name: local(city.name), lon: city.lng, lat: city.lat }), [city, language]); // eslint-disable-line react-hooks/exhaustive-deps
  const routes = useMemo<GlobePlace[]>(() => {
    const km = new Intl.NumberFormat(language);
    return travellers.map((item) => ({
      name: country(item.country), lon: item.lng, lat: item.lat,
      note: tr("kmToAlmaty", language).replace("{n}", km.format(distanceKm(item, city))).replace("{city}", local(city.name)),
    }));
  }, [city, language]); // eslint-disable-line react-hooks/exhaustive-deps

  const from = travellerByCountry[origin];
  const home = origin && city.id === "almaty" ? picksFor(origin) : [];
  const choose = (code: string) => updatePreferences({ origin: code });
  const distance = from && tr("kmToAlmaty", language).replace("{n}", new Intl.NumberFormat(language).format(distanceKm(from, city)))
    .replace("{city}", local(city.name));

  const header = <>
    <h2 id="welcome-title" className="flow-title">{t("welcomeTitle")}</h2>
    <p className="flow-intro">{t("welcomeIntro")}</p>
    <div className="welcome-field">
      <label className="welcome-label" htmlFor="welcome-origin">{t("origin")}</label>
      <span className="select-wrap with-icon">
        <Icon name="pin" size={19} />
        <select id="welcome-origin" value={origin} onChange={(event) => choose(event.target.value)}>
          <option value="">{t("chooseCountry")}</option>
          {origins.map((code) => <option key={code} value={code}>{country(code)}</option>)}
        </select>
        <Icon name="chevron" size={16} />
      </span>
    </div>
  </>;

  const card = <div className="welcome-card" aria-live="polite">
    {from ? <m.div className="route-card" key={origin + city.id}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <span className="route-end"><small>{t("origin")}</small><strong>{country(origin)}</strong></span>
      <span className="route-line" aria-hidden="true" />
      <span className="route-end route-end-to"><small>{t("cityLabel")}</small><strong>{local(city.name)}</strong></span>
      <span className="route-distance">{distance}</span>
    </m.div> : !origin && <p className="welcome-empty">{t("pickCountryFirst")}</p>}
    {home.length > 0 && <PickGroup key={"home-" + origin} title="homeTaste" places={home} badge={origin} />}
  </div>;

  // With a country chosen, the globe frames it together with the city; before that it spins.
  const focus = useMemo(() => from ? between(from, city, 0.32) : null, [from, city]);

  const globe = <RouteGlobe hub={hub} places={routes} theme={globeTheme(dark)} focus={focus} active={active < 0 ? null : active}
    onSelect={(index) => choose(travellers[index].country)} label={fill("routesFrom", language, routes.length).replace("{city}", hub.name)}
    describe={(place, to) => place.name + " — " + to.name + (place.note ? ", " + place.note : "")} />;

  return <GlobeStage globe={globe} header={header} card={card} hint={t("globeHint")} />;
}
