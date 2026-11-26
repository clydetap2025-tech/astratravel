import type { Dispatch, SetStateAction } from "react";
import { addDays, airports, clock, defaultFlightSearch, isFlightSearch, todayInKazakhstan } from "../data/tickets.js";
import { personCount } from "../data/i18n.js";
import { Icon } from "./Icon";
import type { Airport, Flight, FlightSearch, Message } from "./model";
import { flightsFor, scrollToId } from "./model";
import { EmptyState, Heart, SelectField, useTravel } from "./ui";

const airportCodes = Object.keys(airports) as Airport[];
const popular: [Airport, Airport][] = [["NQZ", "ALA"], ["URA", "NQZ"], ["ALA", "SCO"]];
const sortLabels = { price: "lowestPrice", duration: "shortestFlight", departure: "earliestFlight" } satisfies Record<string, Message>;
type SortOrder = keyof typeof sortLabels;
export type TicketState = { draft: FlightSearch; search: FlightSearch | null; directOnly: boolean; sort: SortOrder; error: Message | null };

export function initialTicketState(): TicketState {
  return { draft: defaultFlightSearch() as FlightSearch, search: null, directOnly: false, sort: "price", error: null };
}

export function TicketsPage({ state, onChange }: { state: TicketState; onChange: Dispatch<SetStateAction<TicketState>> }) {
  const { language, t, local, money, dateLabel } = useTravel();
  const city = (code: Airport) => local(airports[code].city);
  const today = todayInKazakhstan();
  const { draft, search, directOnly, sort, error } = state;
  const cities = airportCodes.map((code) => <option key={code} value={code}>{city(code)} · {code}</option>);

  function edit(changes: Partial<FlightSearch>) {
    onChange((previous) => ({ ...previous, error: null, draft: { ...previous.draft, ...changes } }));
  }
  function run(next: FlightSearch, scroll: boolean) {
    if (next.from === next.to) return onChange((previous) => ({ ...previous, error: "flightCitiesError" }));
    if (!isFlightSearch(next) || next.date < today || next.date > addDays(today, 365)) {
      return onChange((previous) => ({ ...previous, error: "flightDateError" }));
    }
    onChange((previous) => ({ ...previous, draft: next, search: next, error: null }));
    if (scroll) requestAnimationFrame(() => scrollToId("ticket-results"));
  }

  const firstDate = search ? [today, [addDays(search.date, -2), addDays(today, 361)].sort()[0]].sort()[1] : today;
  const dates = search ? Array.from({ length: 5 }, (_, index) => addDays(firstDate, index)) : [];
  const flights = search ? flightsFor(search).filter((flight) => !directOnly || !flight.transit)
    .sort((first, second) => first[sort] - second[sort]) : [];

  return <>
    <section className="screen-cover flights-cover">
      <span className="region-tag"><Icon name="plane" size={17} />{t("demo")}</span>
      <h1>{t("flightsTitle")}</h1><p>{t("flightDemo")}</p>
    </section>
    <form className="booking-form panel" id="booking-form" onSubmit={(event) => { event.preventDefault(); run(draft, true); }}>
      <div className="route-fields">
        <SelectField id="flight-from" label={t("from")} value={draft.from} icon="plane"
          onChange={(value) => edit({ from: value as Airport })}>{cities}</SelectField>
        <button className="icon-button swap-button" type="button" aria-label={t("swap")}
          onClick={() => edit({ from: draft.to, to: draft.from })}><Icon name="swap" size={19} /></button>
        <SelectField id="flight-to" label={t("to")} value={draft.to} icon="pin"
          onChange={(value) => edit({ to: value as Airport })}>{cities}</SelectField>
      </div>
      <label className="field" htmlFor="flight-date"><span>{t("departureDate")}</span>
        <input type="date" id="flight-date" name="flight-date" value={draft.date} min={today}
          max={addDays(today, 365)} onChange={(event) => edit({ date: event.target.value })} required />
      </label>
      <SelectField id="flight-passengers" label={t("passengers")} value={draft.passengers} icon="user"
        onChange={(value) => edit({ passengers: Number(value) })}>
        {[1, 2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{personCount(count, language)}</option>)}
      </SelectField>
      <button className="button button-green" type="submit"><Icon name="search" size={19} />{t("findFlights")}</button>
      {error && <p className="form-error" role="alert">{t(error)}</p>}
    </form>
    <section className="ticket-results" id="ticket-results">
      {search ? <>
        <div className="result-heading"><h2>{city(search.from)} — {city(search.to)}</h2>
          <span>{personCount(search.passengers, language)} · {t("demo")}</span></div>
        <div className="date-strip" aria-label={t("dateOptions")}>
          {dates.map((date) => {
            const price = Math.min(...flightsFor({ ...search, date }).map((flight) => flight.total));
            return <button key={date} type="button" aria-pressed={date === search.date} onClick={() => run({ ...search, date }, false)}>
              <span>{dateLabel(date, { weekday: "short", day: "numeric", month: "short" })}</span><strong>{money(price)}</strong>
            </button>;
          })}
        </div>
        <div className="result-tools">
          <button className="pill" type="button" aria-pressed={directOnly} onClick={() =>
            onChange((previous) => ({ ...previous, directOnly: !previous.directOnly }))}><Icon name="plane" size={17} />{t("directOnly")}</button>
          <SelectField id="flight-sort" label={<span className="sr-only">{t("sortBy")}</span>} value={sort} icon="sort"
            onChange={(value) => onChange((previous) => ({ ...previous, sort: value as SortOrder }))}>
            {Object.entries(sortLabels).map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}
          </SelectField>
        </div>
        {flights.length ? <FlightStack flights={flights} /> : <EmptyState icon="plane" title={t("noDirect")}>
          <button type="button" className="button button-soft" onClick={() =>
            onChange((previous) => ({ ...previous, directOnly: false }))}>{t("clearFilters")}</button>
        </EmptyState>}
      </> : <>
        <h2>{t("popularRoutes")}</h2><div className="popular-grid">
          {popular.map(([from, to]) => <button key={from + to} className="panel popular-route" type="button"
            onClick={() => run({ ...draft, from, to }, true)}>
            <span className="feature-icon"><Icon name="plane" /></span>
            <span><strong>{city(from)} — {city(to)}</strong><small>{from} · {to}</small></span>
          </button>)}
        </div>
      </>}
    </section>
  </>;
}

export function FlightStack({ flights }: { flights: Flight[] }) {
  const { saved, t, money, open, toggleFlight } = useTravel();
  return <div className="flight-stack">{flights.map((flight) => <article key={flight.key} className="panel flight-card">
    <div className="carrier"><span className={"carrier-code carrier-" + flight.code.toLowerCase()} aria-hidden="true">{flight.code}</span>
      <strong>{flight.carrier}</strong></div>
    <FlightPath flight={flight} />
    <div className="flight-fare"><strong>{money(flight.total)}</strong><span>{t(flight.search.passengers > 1 ? "forPassengers" : "perPerson")}</span></div>
    <div className="flight-card-actions">
      <Heart pressed={saved.flights.some((item) => item.key === flight.key)} onClick={() => toggleFlight(flight)} />
      <button className="button button-soft" type="button" onClick={() => open({ kind: "flight", flight })}>{t("flightDetails")}</button>
    </div>
  </article>)}</div>;
}

function FlightPath({ flight }: { flight: Flight }) {
  const { t, span } = useTravel();
  return <div className="flight-path">
    <div className="flight-point"><strong>{clock(flight.departure)}</strong><span>{flight.search.from}</span></div>
    <div className="flight-leg"><span>{span(flight.duration)}</span><div className="flight-line"><Icon name="plane" size={16} /></div>
      <span>{flight.transit ? t("flightConnection") + " · " + flight.transit : t("direct")}</span></div>
    <div className="flight-point"><strong>{clock(flight.arrival)}{flight.arrival >= 1440 && <sup>+1</sup>}</strong><span>{flight.search.to}</span></div>
  </div>;
}

export function FlightDetail({ flight }: { flight: Flight }) {
  const { saved, language, t, money, dateLabel, local, toggleFlight } = useTravel();
  const { from, to, date, passengers } = flight.search;
  return <div className="dialog-padding">
    <span className="setup-icon"><Icon name="plane" size={24} /></span>
    <h2 id="dialog-title">{local(airports[from].city)} — {local(airports[to].city)}</h2>
    <p>{flight.carrier} · {dateLabel(date, { day: "numeric", month: "long", year: "numeric" })} · {personCount(passengers, language)}</p>
    <div className="detail-flight-path"><FlightPath flight={flight} /></div>
    <dl className="fact-grid">
      <div><dt>{t("perPerson")}</dt><dd>{money(flight.price)}</dd></div>
      <div><dt>{t("total")}</dt><dd>{money(flight.total)}</dd></div>
    </dl>
    <div className="dialog-actions"><Heart pressed={saved.flights.some((item) => item.key === flight.key)} onClick={() => toggleFlight(flight)} />
      <p>{t("flightDemo")}</p></div>
  </div>;
}
