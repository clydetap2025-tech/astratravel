import type { Dispatch, SetStateAction } from "react";
import { addDays, airports, isFlightSearch, todayInKazakhstan } from "../../data/tickets.js";
import { personCount } from "../../data/i18n.js";
import { FlightStack, sortLabels } from "../features/tickets/flights";
import type { SortOrder, TicketState } from "../features/tickets/flights";
import { useTravel } from "../shared/context";
import type { Airport, FlightSearch } from "../shared/model";
import { flightsFor, scrollToId } from "../shared/model";
import { EmptyState, GlassIcon, Icon, PageHeader, SelectField } from "../shared/ui";

const airportCodes = Object.keys(airports) as Airport[];
const popular: [Airport, Airport][] = [["NQZ", "ALA"], ["ALA", "SCO"], ["ALA", "HSA"], ["NQZ", "KGF"], ["ALA", "UKK"], ["URA", "NQZ"]];

/** Flights (a demo): the search form, then either popular routes with their lowest fare or the results with a 5-day price strip. */
export function TicketsPage({ state, onChange }: { state: TicketState; onChange: Dispatch<SetStateAction<TicketState>> }) {
  const { language, t, local, money, dateLabel, span } = useTravel();
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
    <PageHeader eyebrow={<><Icon name="plane" size={14} />{t("demo")}</>} title={t("flightsTitle")} lead={t("flightDemo")} />
    <form className="booking-form glass" id="booking-form" onSubmit={(event) => { event.preventDefault(); run(draft, true); }}>
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
      <button className="button button-primary" type="submit"><Icon name="search" size={18} />{t("findFlights")}</button>
      {error && <p className="form-error" role="alert">{t(error)}</p>}
    </form>
    <section className="section ticket-results" id="ticket-results">
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
          <button className="chip" type="button" aria-pressed={directOnly} onClick={() =>
            onChange((previous) => ({ ...previous, directOnly: !previous.directOnly }))}><span className="chip-content"><Icon name="plane" size={17} />{t("directOnly")}</span></button>
          <SelectField id="flight-sort" label={<span className="sr-only">{t("sortBy")}</span>} value={sort} icon="sort"
            onChange={(value) => onChange((previous) => ({ ...previous, sort: value as SortOrder }))}>
            {Object.entries(sortLabels).map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}
          </SelectField>
        </div>
        {flights.length ? <FlightStack flights={flights} /> : <EmptyState icon="plane" title={t("noDirect")}>
          <button type="button" className="button" onClick={() =>
            onChange((previous) => ({ ...previous, directOnly: false }))}>{t("clearFilters")}</button>
        </EmptyState>}
      </> : <>
        <h2>{t("popularRoutes")}</h2><div className="popular-grid">
          {popular.map(([from, to]) => {
            const fares = flightsFor({ ...draft, from, to });
            const cheapest = Math.min(...fares.map((flight) => flight.total));
            const quickest = Math.min(...fares.map((flight) => flight.duration));
            return <button key={from + to} className="popular-route glass" type="button" onClick={() => run({ ...draft, from, to }, true)}>
              <GlassIcon name="plane" tone="accent" />
              <span className="popular-text"><strong>{city(from)} — {city(to)}</strong><small>{from} · {to} · {span(quickest)}</small></span>
              <span className="popular-fare"><small>{t("fromPrice")}</small><strong>{money(cheapest)}</strong></span>
            </button>;
          })}
        </div>
      </>}
    </section>
  </>;
}

