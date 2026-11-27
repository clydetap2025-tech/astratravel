import { airports, clock, defaultFlightSearch } from "../../../data/tickets.js";
import { personCount } from "../../../data/i18n.js";
import { useTravel } from "../../shared/context";
import type { Flight, FlightSearch, Message } from "../../shared/model";
import { Heart, Icon } from "../../shared/ui";

export const sortLabels = { price: "lowestPrice", duration: "shortestFlight", departure: "earliestFlight" } satisfies Record<string, Message>;
export type SortOrder = keyof typeof sortLabels;
export type TicketState = { draft: FlightSearch; search: FlightSearch | null; directOnly: boolean; sort: SortOrder; error: Message | null };

export function initialTicketState(): TicketState {
  return { draft: defaultFlightSearch() as FlightSearch, search: null, directOnly: false, sort: "price", error: null };
}

export function FlightStack({ flights }: { flights: Flight[] }) {
  const { saved, t, money, open, toggleFlight } = useTravel();
  return <div className="flight-stack">{flights.map((flight) => <article key={flight.key} className="flight-card glass">
    <div className="carrier"><span className={"carrier-code carrier-" + flight.code.toLowerCase()} aria-hidden="true">{flight.code}</span>
      <strong>{flight.carrier}</strong></div>
    <FlightPath flight={flight} />
    <div className="flight-fare"><strong>{money(flight.total)}</strong><span>{t(flight.search.passengers > 1 ? "forPassengers" : "perPerson")}</span></div>
    <div className="flight-card-actions">
      <Heart pressed={saved.flights.some((item) => item.key === flight.key)} onClick={() => toggleFlight(flight)} />
      <button className="button" type="button" onClick={() => open({ kind: "flight", flight })}>{t("flightDetails")}</button>
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
  return <div className="dialog-body">
    <span className="glass-icon tone-accent" aria-hidden="true"><Icon name="plane" size={24} /></span>
    <h2 id="dialog-title">{local(airports[from].city)} — {local(airports[to].city)}</h2>
    <p>{flight.carrier} · {dateLabel(date, { day: "numeric", month: "long", year: "numeric" })} · {personCount(passengers, language)}</p>
    <div className="detail-flight-path"><FlightPath flight={flight} /></div>
    <dl className="facts">
      <div><dt>{t("perPerson")}</dt><dd>{money(flight.price)}</dd></div>
      <div><dt>{t("total")}</dt><dd>{money(flight.total)}</dd></div>
    </dl>
    <div className="dialog-actions"><Heart pressed={saved.flights.some((item) => item.key === flight.key)} onClick={() => toggleFlight(flight)} />
      <p>{t("flightDemo")}</p></div>
  </div>;
}
