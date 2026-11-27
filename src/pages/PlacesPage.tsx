import { useEffect, useRef } from "react";
import { m } from "motion/react";
import { recommend } from "../../data/catalog.js";
import { CityBar, CityHeader } from "../features/places/CityHeader";
import { filterPlaces, filters, initialFilters, sorts, ZONES } from "../features/places/catalog";
import type { PlaceFilters, SortOrder } from "../features/places/catalog";
import { PlaceCard } from "../features/places/PlaceCard";
import { useTravel } from "../shared/context";
import type { Place } from "../shared/model";
import { spring } from "../shared/motion";
import { CategoryIcon, EmptyState, GlassIcon, Icon, PageHeader, Section } from "../shared/ui";

/**
 * Places: the city header, then the catalogue — search (press / to jump to it), sort, categories
 * and the places grouped by distance — and an invitation to the planner.
 */
export function PlacesPage({ filter, onFilter }: { filter: PlaceFilters; onFilter: (filter: PlaceFilters) => void }) {
  const { preferences: { origin, city }, t, local, updatePreferences } = useTravel();
  const search = useRef<HTMLInputElement>(null);
  const results = filterPlaces(recommend(origin, city), filter, local as (value: Record<string, string>) => string);
  const grouped = city !== "all" && filter.category === "all" && !filter.query.trim() && filter.sort === "recommended";
  // Nothing here, but the search matches places in other cities: offer to look there.
  const elsewhere = !results.length && city !== "all" && filter.query.trim()
    ? filterPlaces(recommend(origin, "all"), filter, local as (value: Record<string, string>) => string).length : 0;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key !== "/" || event.metaKey || event.ctrlKey || /input|textarea|select/i.test(target.tagName)) return;
      event.preventDefault();
      search.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const tools = <>
    <label className="search-field glass">
      <Icon name="search" size={18} />
      <span className="sr-only">{t("search")}</span>
      <input ref={search} type="search" name="place-search" placeholder={t("search")} autoComplete="off" value={filter.query}
        onChange={(event) => onFilter({ ...filter, query: event.target.value })}
        onKeyDown={(event) => { if (event.key === "Escape") onFilter({ ...filter, query: "" }); }} />
      <kbd aria-hidden="true">/</kbd>
    </label>
    <label className="select-wrap with-icon sort-select">
      <Icon name="sort" size={17} />
      <span className="sr-only">{t("sortBy")}</span>
      <select value={filter.sort} onChange={(event) => onFilter({ ...filter, sort: event.target.value as SortOrder })}>
        {Object.entries(sorts).map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}
      </select>
      <Icon name="chevron" size={15} />
    </label>
  </>;

  return <>
    <CityBar />
    {city === "all"
      ? <PageHeader eyebrow={t("region")} title={t("allCities")} lead={t("heroBlurb")} />
      : <CityHeader key={city} />}
    <Section id="catalog" className="catalog" title={t(city === "all" ? "allCities" : origin ? "recommendedTitle" : "exploreTitle")} count={results.length} tools={tools}>
      <div className="chips" role="group" aria-label={t("categories")}>
        {filters.map((category) => <button key={category} type="button" className="chip" aria-pressed={filter.category === category}
          onClick={() => onFilter({ ...filter, category })}>
          {filter.category === category && <m.span layoutId="chip-drop" className="chip-drop" transition={spring} aria-hidden="true" />}
          <span className="chip-content"><CategoryIcon category={category} size={17} />{t(category)}</span>
        </button>)}
      </div>
      <div aria-live="polite">{results.length ? (grouped ? ZONES.map((zone) => {
        const list = results.filter((place) => zone.match(place.zone));
        if (!list.length) return null;
        const hours = Math.round(list.reduce((sum, place) => sum + place.minutes, 0) / 60);
        return <section key={zone.key} className="zone" aria-labelledby={"zone-" + zone.key}>
          <h3 className="zone-title" id={"zone-" + zone.key}>{t(zone.title)}<span>{list.length} · ≈ {hours} {t("hoursShort")}</span></h3>
          <PlaceGrid list={list} />
        </section>;
      }) : <PlaceGrid list={results} />)
        : <EmptyState icon="search" title={t("emptySearch")}>
          <div className="actions">
            {elsewhere > 0 && <button className="button button-primary" type="button" onClick={() => updatePreferences({ city: "all" })}>
              <Icon name="globe" size={17} />{t("searchAllCities").replace("{n}", String(elsewhere))}</button>}
            <button className="button" type="button" onClick={() => onFilter(initialFilters)}>{t("clearFilters")}</button>
          </div>
        </EmptyState>}</div>
    </Section>
    <aside className="promo glass">
      <GlassIcon name="route" tone="accent" size={26} />
      <div><h2>{t("plannerPromo")}</h2><p>{t("plannerPromoBody")}</p></div>
      <a className="button button-primary" href="#planner">{t("makePlan")}<Icon name="arrow" size={17} /></a>
    </aside>
  </>;
}

export function PlaceGrid({ list }: { list: Place[] }) {
  return <div className="place-grid">{list.map((place) => <PlaceCard key={place.id} place={place} />)}</div>;
}
