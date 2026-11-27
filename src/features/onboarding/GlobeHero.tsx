import { AnimatePresence, m } from "motion/react";
import { fade } from "../../shared/motion";
import { cities, places } from "../../../data/catalog.js";
import { countLabel, fill } from "../../../data/i18n.js";
import { GlobeStage } from "../../components/ui/globe-stage";
import { CityGlobe } from "../places/CityGlobe";
import { useTravel } from "../../shared/context";
import { tripCity } from "../../shared/geo";
import { Icon, PlaceImage } from "../../shared/ui";

/**
 * The first screen: a route globe turned to Kazakhstan, with flights from the chosen city to every
 * other city in the guide. Picking a city (a tap on its point or the list in the card) turns the
 * globe to it, redraws the routes from there and swaps the card beside it; the buttons start the
 * welcome flow or open that city straight away.
 */
export function GlobeHero({ onStart, onOpen }: { onStart: () => void; onOpen: () => void }) {
  const { preferences, updatePreferences, t, local, language, open } = useTravel();
  const index = Math.max(0, cities.findIndex((city) => city.id === tripCity(preferences)));
  const city = cities[index];
  const count = places.filter((place) => place.city === city.id).length;
  const top = places.filter((place) => place.city === city.id).slice(0, 3);
  const choose = (id: string) => updatePreferences({ city: id });

  const header = <div className="hero-copy parallax-frame is-text" data-parallax>
    <div className="parallax-layer">
            <h1 id="home-title" className="hero-title">{t("heroLineOne") + " " + t("heroLineTwo")}</h1>
      <p className="lead hero-blurb">{t("heroBlurb")}</p>
      <div className="actions hero-actions">
        <button type="button" className="button button-primary button-large" onClick={onOpen}>{fill("viewCity", language, local(city.name))}<Icon name="arrow" size={18} /></button>
        <button type="button" className="button button-large" onClick={onStart}>{t("customizePicks")}</button>
      </div>
    </div>
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
      <m.div key={city.id} {...fade}>
        <strong className="hero-city-name">{local(city.name)}</strong>
        <span className="hero-city-region">{local(city.region)}</span>
        <span className="hero-city-meta">{city.airport} · {count} {countLabel(count, "placeCount", language)}</span>
        <span className="hero-city-thumbs">{top.map((place) => <button key={place.id} type="button" className="hero-city-thumb"
          onClick={(event) => open({ kind: "place", place }, event.currentTarget)}>
          <PlaceImage place={place} className="hero-thumb" width={160} height={120} />
          <small>{local(place.title)}</small>
        </button>)}</span>
      </m.div>
    </AnimatePresence>
  </div>;

  return <section className="globe-hero" aria-labelledby="home-title">
    <GlobeStage className="gs-hero" globe={<div className="parallax-frame is-globe" data-parallax><div className="parallax-layer"><CityGlobe /></div></div>} header={header} card={card} hint={t("globeHint")} />
  </section>;
}
