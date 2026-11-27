import { placeById } from "../../../data/catalog.js";
import { useTravel } from "../../shared/context";
import type { Place } from "../../shared/model";
import { EmptyState, Icon, PlaceImage } from "../../shared/ui";

/** Directions through every stop, in order, in Google Maps. */
function directions(stops: Place[]) {
  const query = (place: Place) => place.map;
  const params = new URLSearchParams({ api: "1", travelmode: "driving", destination: query(stops[stops.length - 1]) });
  if (stops.length > 1) params.set("origin", query(stops[0]));
  if (stops.length > 2) params.set("waypoints", stops.slice(1, -1).map(query).join("|"));
  return "https://www.google.com/maps/dir/?" + params.toString();
}

/**
 * The visitor's own route: the places they added with "Add to route", in their order. Stops can be
 * moved up and down or taken out; the totals and the link to directions follow at once.
 */
export function MyRoute() {
  const { saved, moveRoute, toggleRoute, open, t, local, span, money } = useTravel();
  const stops = saved.route.map((id) => placeById[id]).filter((place): place is Place => Boolean(place));
  if (!stops.length) {
    return <EmptyState icon="route" title={t("myRouteEmpty")} description={t("myRouteEmptyBody")}>
      <a className="button button-primary" href="#places"><Icon name="compass" size={17} />{t("discover")}</a>
    </EmptyState>;
  }
  const minutes = stops.reduce((sum, place) => sum + place.minutes, 0) + (stops.length - 1) * 20;
  const cost = stops.reduce((sum, place) => sum + (place.cost ?? 0), 0);
  const unknown = stops.some((place) => place.cost === null);
  return <div className="my-route glass">
    <ol className="route-list">
      {stops.map((place, index) => <li key={place.id} className="route-stop">
        <span className="route-number" aria-hidden="true">{index + 1}</span>
        <PlaceImage place={place} className="route-thumb" width={72} height={54} />
        <div className="route-text">
          <button type="button" className="card-link" onClick={(event) => open({ kind: "place", place }, event.currentTarget)}>{local(place.title)}</button>
          <small>{local(place.location)} · {span(place.minutes)}</small>
        </div>
        <div className="route-tools">
          <button type="button" className="icon-button" aria-label={t("moveUp") + ": " + local(place.title)} disabled={index === 0}
            onClick={() => moveRoute(place.id, -1)}><Icon name="up" size={17} /></button>
          <button type="button" className="icon-button" aria-label={t("moveDown") + ": " + local(place.title)} disabled={index === stops.length - 1}
            onClick={() => moveRoute(place.id, 1)}><Icon name="down" size={17} /></button>
          <button type="button" className="icon-button" aria-label={t("removeFromRoute") + ": " + local(place.title)}
            onClick={() => toggleRoute(place)}><Icon name="trash" size={17} /></button>
        </div>
      </li>)}
    </ol>
    <div className="route-summary">
      <p><Icon name="clock" size={16} />{span(minutes)} · {stops.length} {t("stops")}</p>
      <p><Icon name="coin" size={16} />{cost ? "≈ " + money(cost) : t("free")}{unknown ? " + " + t("priceUnknown").toLowerCase() : ""}</p>
      <a className="button button-primary" href={directions(stops)} target="_blank" rel="noopener"><Icon name="directions" size={17} />{t("openDirections")}</a>
    </div>
  </div>;
}
