import { useMemo } from "react";
import { AnimatePresence, m } from "motion/react";
import { cities, places } from "../data/catalog.js";
import { countLabel, fill, tr } from "../data/i18n.js";
import { between, GlobeStage, globeTheme } from "./components/ui/globe-stage";
import { BORDER } from "./components/ui/kz-map";
import { RouteGlobe, type Place as GlobePlace } from "./components/ui/route-globe";
import { Icon } from "./Icon";
import { easeOut, onServer, TextEffect } from "./motion";
import { PlaceImage, useDarkTheme, useTravel } from "./ui";
import { distanceKm, tripCity } from "./Welcome";

/** Roughly the middle of Kazakhstan. */
const KZ_MIDDLE = { lat: 48, lng: 67 };

/**
 * The first screen: a route globe turned to Kazakhstan, with flights from the chosen city to every
 * other city in the guide. Picking a city (a tap on its point or the list in the card) turns the
 * globe to it, redraws the routes from there and swaps the card beside it; the buttons start the
 * welcome flow or open that city straight away.
 */
export function GlobeHero({ onStart, onOpen }: { onStart: () => void; onOpen: () => void }) {
  const { preferences, updatePreferences, t, local, language } = useTravel();
  const dark = useDarkTheme();
  const index = Math.max(0, cities.findIndex((city) => city.id === tripCity(preferences)));
  const city = cities[index];
  const count = places.filter((place) => place.city === city.id).length;
  const top = places.filter((place) => place.city === city.id).slice(0, 3);
  // Routes from the chosen city to every other one, each with its distance.
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
  const choose = (id: string) => updatePreferences({ city: id });

  const header = <div className="hero-copy">
    <p className="eyebrow"><Icon name="pin" size={14} />{t("region")}</p>
    <TextEffect as="h1" id="home-title" className="hero-title" text={t("heroLineOne") + " " + t("heroLineTwo")} />
    <m.p className="hero-blurb" initial={onServer ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5, ease: easeOut }}>
      {t("heroBlurb")}
    </m.p>
    <m.div className="hero-actions" initial={onServer ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5, ease: easeOut }}>
      <button type="button" className="button button-green" onClick={onOpen}>{fill("viewCity", language, local(city.name))}<Icon name="arrow" size={18} /></button>
      <button type="button" className="button button-soft" onClick={onStart}><Icon name="sparkles" size={17} />{t("customizePicks")}</button>
    </m.div>
  </div>;

  const card = <div className="hero-city glass" aria-live="polite">
    <label className="hero-city-label" htmlFor="hero-city">{t("cityLabel")}</label>
    <span className="select-wrap with-icon hero-city-select">
      <Icon name="pin" size={17} />
      <select id="hero-city" value={city.id} onChange={(event) => choose(event.target.value)}>
        {cities.map((item) => <option key={item.id} value={item.id}>{local(item.name)}</option>)}
      </select>
      <Icon name="chevron" size={15} />
    </span>
    <AnimatePresence mode="wait" initial={false}>
      <m.div key={city.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28, ease: easeOut }}>
        <strong className="hero-city-name">{local(city.name)}</strong>
        <span className="hero-city-region">{local(city.region)}</span>
        <span className="hero-city-meta">{city.airport} · {count} {countLabel(count, "placeCount", language)}</span>
        <span className="hero-city-thumbs">{top.map((place) => <span key={place.id} className="hero-city-thumb" title={local(place.title)}>
          <PlaceImage place={place} className="hero-thumb" width={96} height={72} />
          <small>{local(place.title)}</small>
        </span>)}</span>
      </m.div>
    </AnimatePresence>
  </div>;

  const globe = <RouteGlobe hub={hub} places={routes} theme={globeTheme(dark)} focus={focus} zoom={3} outline={BORDER}
    onSelect={(next) => choose(others[next].id)} onHubSelect={() => choose(city.id)} label={fill("routesFrom", language, routes.length).replace("{city}", hub.name)}
    describe={(place, from) => from.name + " — " + place.name + (place.note ? ", " + place.note : "")} />;

  return <section className="globe-hero" aria-labelledby="home-title">
    <GlobeStage className="gs-hero" globe={globe} header={header} card={card} hint={t("globeHint")} />
  </section>;
}
