import { useEffect, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { KzMap } from "./components/ui/kz-map";
import { cities, cityById, placeMap, places, recommend } from "../data/catalog.js";
import { countLabel } from "../data/i18n.js";
import { districtByKey } from "../data/districts.js";
import { Icon } from "./Icon";
import type { Category, Place } from "./model";
import { matchesOf } from "./model";
import { onServer, Reveal, rise, stagger } from "./motion";
import { CategoryIcon, CountryBadge, EmptyState, Heart, PlaceImage, useTravel } from "./ui";
import { distanceKm, personalGroups, tripCity } from "./Welcome";

const filters = ["all", "nature", "food", "culture", "city"] as const;
export type PlaceFilters = { category: Category | "all"; query: string };
export const initialFilters: PlaceFilters = { category: "all", query: "" };

/** The city switcher: every city with its number of places, plus the whole country. */
function CityBar() {
  const { preferences, updatePreferences, t, local, language } = useTravel();
  const count = (id: string) => places.filter((place) => place.city === id).length;
  const options = [...cities.map((city) => ({ id: city.id, name: local(city.name), count: count(city.id) })),
    { id: "all", name: t("allCities"), count: places.length }];
  return <nav className="city-bar" aria-label={t("cityLabel")}>
    {options.map((option) => <button key={option.id} type="button" className="city-tab" aria-pressed={preferences.city === option.id}
      onClick={() => updatePreferences({ city: option.id })}>
      {preferences.city === option.id && <m.span layoutId="city-tab" className="city-tab-line" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
      <span>{option.name}</span><small>{option.count} {countLabel(option.count, "placeCount", language)}</small>
    </button>)}
  </nav>;
}

const ZONES = [
  { key: "center", title: "zoneCenter", match: (zone: string) => zone === "center" },
  { key: "near", title: "zoneNear", match: (zone: string) => zone === "outskirts" || zone === "hill" || zone === "mountains" },
  { key: "away", title: "zoneAway", match: (zone: string) => zone === "daytrip" },
] as const;

/** The top of the guide: a short portrait of the city with real numbers, then picks when there are many places. */
function ForYou() {
  const { preferences, updatePreferences, t, local, country, open, price, language, span } = useTravel();
  const city = cityById[tripCity(preferences)];
  const here = places.filter((place) => place.city === city.id);
  const groups = personalGroups(preferences);
  const picks = [...new Map(groups.flatMap((group) => group.places.map((place) => [place.id, { place, reason: group.title }]))).values()].slice(0, 10);
  const district = preferences.city === "almaty" ? districtByKey[preferences.district] : undefined;
  const byCategory = (["nature", "culture", "city", "food"] as const).map((key) => ({ key, count: here.filter((place) => place.category === key).length }));
  const trips = here.filter((place) => place.zone === "daytrip").length;
  const hours = Math.round(here.reduce((sum, place) => sum + place.minutes, 0) / 60);
  const almaty = cityById.almaty;
  const far = city.id === "almaty" ? 0 : distanceKm(almaty, city);
  const format = (value: number) => new Intl.NumberFormat(language).format(value);
  return <section className="for-you" aria-labelledby="for-you-title">
    <div className="city-overview">
      <div className="city-overview-text">
        <p className="eyebrow">{t(preferences.visitor === "local" ? "localBadge" : preferences.visitor === "guest" ? "guestBadge" : "forYouTitle")}
          {preferences.origin && <> · <CountryBadge code={preferences.origin} />{country(preferences.origin)}</>}
          {district && <> · {local(district.name)}</>}</p>
        <h1 id="for-you-title">{local(city.name)}</h1>
        <p className="for-you-region">{local(city.region)}</p>
        <dl className="city-stats">
          <div><dt>{countLabel(here.length, "placeCount", language)}</dt><dd><CountUp value={here.length} /></dd></div>
          <div><dt>{t("statTrips")}</dt><dd><CountUp value={trips} /></dd></div>
          <div><dt>{t("statHours")}</dt><dd><CountUp value={hours} /></dd></div>
          {far > 0 && <div><dt>{t("statFromAlmaty")}</dt><dd><CountUp value={far} format={format} /><small> km</small></dd></div>}
        </dl>
        <div className="category-bar" role="img" aria-label={byCategory.map((item) => t(item.key) + " " + item.count).join(", ")}>
          {byCategory.filter((item) => item.count).map((item) => <span key={item.key} className={"category-bar-" + item.key} style={{ flexGrow: item.count }}>
            <CategoryIcon category={item.key} size={14} />{item.count}
          </span>)}
        </div>
        <div className="city-overview-actions">
          <a className="button button-green" href="#planner"><Icon name="route" size={18} />{t("makePlan")}</a>
          <a className="button button-soft" href="#welcome">{t(preferences.visitor ? "editProfile" : "heroStart")}</a>
        </div>
      </div>
      <div className="city-overview-map glass">
        <KzMap current={city.id} onPick={(id) => updatePreferences({ city: id })} label={(id) => local(cityById[id].name)} />
        <span className="city-overview-caption">{city.airport} · {span(Math.max(60, Math.round(42 + far / 12)))} {far > 0 ? t("flightFromAlmaty") : ""}</span>
      </div>
    </div>
    {here.length > 8 && <m.ol className="for-you-strip" variants={stagger} initial="enter" animate="center" aria-label={t("forYouTitle")}>
      {picks.map(({ place, reason }, index) => <m.li key={place.id} variants={rise}>
        <button type="button" className="for-you-card" onClick={(event) => open({ kind: "place", place }, event.currentTarget)}>
          <PlaceImage place={place} className="for-you-image" width={260} height={170} />
          <span className="for-you-reason">{String(index + 1).padStart(2, "0")} · {t(reason)}</span>
          <strong>{local(place.title)}</strong>
          <small>{price(place.cost)}</small>
        </button>
      </m.li>)}
    </m.ol>}
  </section>;
}

/** A number that counts up when it first appears (and again when it changes). */
function CountUp({ value, format = String }: { value: number; format?: (value: number) => string }) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (onServer || matchMedia("(prefers-reduced-motion: reduce)").matches) { setShown(value); return; }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{format(shown)}</>;
}

export function PlacesPage({ filter, onFilter }: { filter: PlaceFilters; onFilter: (filter: PlaceFilters) => void }) {
  const { preferences: { origin, city }, t, local } = useTravel();
  const list = recommend(origin, city);
  const normalized = (query: string) => query.trim().normalize("NFKC").toLocaleLowerCase();
  const query = normalized(filter.query);
  const grouped = city !== "all" && filter.category === "all" && !filter.query.trim();
  const results = list.filter((place) => {
    const details = [local(place.summary), ...Object.values(place.title), ...Object.values(place.location), ...Object.values(place.address)];
    return (filter.category === "all" || place.category === filter.category) && normalized(details.join(" ")).includes(query);
  });

  return <>
    <CityBar />
    <AnimatePresence mode="wait" initial={false}>
      {city !== "all" && <m.div key={city} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}><ForYou /></m.div>}
    </AnimatePresence>
    <section className="catalog" id="catalog" aria-labelledby="catalog-title">
      <div className="section-heading">
        <h2 id="catalog-title">{city === "all" ? t("allCities") : t(origin ? "recommendedTitle" : "exploreTitle")} <span className="count">{results.length}</span></h2>
        <label className="search-field"><Icon name="search" />
          <span className="sr-only">{t("search")}</span>
          <input type="search" name="place-search" placeholder={t("search")} autoComplete="off" value={filter.query}
            onChange={(event) => onFilter({ ...filter, query: event.target.value })} />
        </label>
      </div>
      <div className="pills" id="categories">
        {filters.map((category) => <button key={category} type="button" className="pill" aria-pressed={filter.category === category}
          onClick={() => onFilter({ ...filter, category })}>
          {filter.category === category && <m.span layoutId="filter-pill" className="pill-indicator" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
          <span className="pill-content"><CategoryIcon category={category} />{t(category)}</span>
        </button>)}
      </div>
      <div id="place-list" aria-live="polite">{results.length ? (grouped ? ZONES.map((zone) => {
        const list = results.filter((place) => zone.match(place.zone));
        if (!list.length) return null;
        const hours = Math.round(list.reduce((sum, place) => sum + place.minutes, 0) / 60);
        return <section key={zone.key} className="zone-group" aria-labelledby={"zone-" + zone.key}>
          <h3 className="zone-title" id={"zone-" + zone.key}>{t(zone.title)}<span>{list.length} · ≈ {hours} {t("hoursShort")}</span></h3>
          <PlaceGrid list={list} />
        </section>;
      }) : <PlaceGrid list={results} />) :
        <EmptyState icon="search" title={t("emptySearch")}><button className="button button-soft" type="button"
          onClick={() => onFilter(initialFilters)}>{t("clearFilters")}</button></EmptyState>}</div>
    </section>
    <Reveal as="section" className="plan-banner">
      <span className="feature-icon"><Icon name="sparkles" size={27} /></span>
      <div><h2>{t("plannerPromo")}</h2><p>{t("plannerPromoBody")}</p></div>
      <a className="button button-yellow" href="#planner">{t("makePlan")}</a>
    </Reveal>
  </>;
}

/** Cards that slide into their new places when the filter changes. */
function PlaceGrid({ list }: { list: Place[] }) {
  return <div className="place-grid"><AnimatePresence initial={false}>{list.map((place, index) =>
    <m.div key={place.id} layout="position" initial={{ opacity: 0, y: 24, scale: 0.97 }} whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "0px 0px -6% 0px" }} exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.18 } }}
      transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1], delay: (index % 3) * 0.05, layout: { type: "spring", stiffness: 300, damping: 32 } }}>
      <PlaceCard place={place} />
    </m.div>)}
  </AnimatePresence></div>;
}

export function PlaceCard({ place }: { place: Place }) {
  const { preferences: { origin }, saved, open, togglePlace, t, local, span, price } = useTravel();
  const matched = matchesOf(place).includes(origin);
  const time = place.zone === "daytrip" ? t("fullDay") : span(place.minutes);
  return <article className="place-card">
    <div className="place-photo">
      <PlaceImage place={place} width={505} height={330} />
      <span className={"place-tag" + (matched ? " place-tag-match" : "")}>
        {matched ? <><CountryBadge code={origin} />{t("forYou")}</> : t(place.category as Category)}
      </span>
      <Heart pressed={saved.places.includes(place.id)} onClick={() => togglePlace(place)} />
    </div>
    <div className="place-content">
      <div className="place-location"><Icon name="pin" size={15} />{local(place.location)}</div>
      <h3><button type="button" className="title-button card-link" onClick={(event) => open({ kind: "place", place }, event.currentTarget)}>{local(place.title)}</button></h3>
      <p>{local(place.summary)}</p>
      <div className="place-meta"><span><Icon name="clock" size={16} />{time}</span>
        <span><Icon name="coin" size={16} />{price(place.cost)}</span></div>
    </div>
  </article>;
}

export function PlaceDetail({ place }: { place: Place }) {
  const { saved, togglePlace, t, local, span, price } = useTravel();
  return <>
    <PlaceImage place={place} className="detail-image" lazy={false} />
    <div className="dialog-padding">
      <div className="place-location"><Icon name="pin" size={16} />{local(place.location)}</div>
      <h2 id="dialog-title">{local(place.title)}</h2>
      <p className="address">{local(place.address)}</p><p>{local(place.summary)}</p>
      <dl className="fact-grid">
        <div><dt>{t("duration")}</dt><dd><Icon name="clock" size={17} />{place.zone === "daytrip" ? t("fullDay") : span(place.minutes)}</dd></div>
        <div><dt>{t("estCost")}</dt><dd><Icon name="coin" size={17} />{price(place.cost)}</dd></div>
      </dl>
      <div className="callout"><Icon name="info" /><div><strong>{t("travelTip")}</strong><p>{local(place.tip)}</p></div></div>
      <div className="dialog-actions">
        <a className="button button-green" href={placeMap(place)} target="_blank" rel="noopener"><Icon name="map" size={17} />{t("map")}</a>
        <Heart pressed={saved.places.includes(place.id)} onClick={() => togglePlace(place)} />
        <a className="source-link" href={place.source} target="_blank" rel="noopener">{t("source")}</a>
      </div>
    </div>
  </>;
}
