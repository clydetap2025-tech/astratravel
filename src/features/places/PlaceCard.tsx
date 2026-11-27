import { placeMap } from "../../../data/catalog.js";
import { useTravel } from "../../shared/context";
import type { Category, Place } from "../../shared/model";
import { matchesOf } from "../../shared/model";
import { askAstra } from "../../pages/AssistantPage";
import { CategoryIcon, CountryBadge, Heart, Icon, PhotoCredit, PhotoNote, PlaceImage } from "../../shared/ui";

/** The two everyday actions on a place: add it to my route, and mark it as visited. */
export function PlaceActions({ place, compact = false }: { place: Place; compact?: boolean }) {
  const { saved, toggleRoute, toggleVisited, share, t } = useTravel();
  const inRoute = saved.route.includes(place.id);
  const visited = saved.visited.includes(place.id);
  return <div className={"place-actions" + (compact ? " is-compact" : "")}>
    <button type="button" className="button button-small" aria-pressed={inRoute} onClick={() => toggleRoute(place)}>
      <Icon name={inRoute ? "check" : "plus"} size={17} />{t(inRoute ? "inRoute" : "addToRoute")}
    </button>
    <button type="button" className="icon-button" aria-pressed={visited} aria-label={t(visited ? "visited" : "markVisited")}
      title={t(visited ? "visited" : "markVisited")} onClick={() => toggleVisited(place)}><Icon name="flag" size={18} /></button>
    <button type="button" className="icon-button" aria-label={t("share")} title={t("share")} onClick={() => share(place)}><Icon name="share" size={18} /></button>
  </div>;
}

export function PlaceCard({ place }: { place: Place }) {
  const { preferences: { origin }, saved, open, togglePlace, t, local, span, price } = useTravel();
  const matched = matchesOf(place).includes(origin);
  const visited = saved.visited.includes(place.id);
  const time = place.zone === "daytrip" ? t("fullDay") : span(place.minutes);
  return <article className="place-card glass" data-visited={visited || undefined}>
    <div className="place-photo">
      <PlaceImage place={place} width={480} height={360} parallax />
      <span className={"place-tag" + (matched ? " is-match" : "")}>
        {matched ? <><CountryBadge code={origin} />{t("forYou")}</> : <><CategoryIcon category={place.category} size={14} />{t(place.category as Category)}</>}
      </span>
      {visited && <span className="place-visited"><Icon name="flag" size={14} />{t("visited")}</span>}
      <Heart pressed={saved.places.includes(place.id)} onClick={() => togglePlace(place)} />
      <PhotoNote place={place} />
    </div>
    <div className="place-body">
      <p className="place-location"><Icon name="pin" size={14} />{local(place.location)}</p>
      <h3><button type="button" className="card-link" onClick={(event) => open({ kind: "place", place }, event.currentTarget)}>{local(place.title)}</button></h3>
      <p className="place-summary">{local(place.summary)}</p>
      <p className="place-meta"><span><Icon name="clock" size={15} />{time}</span><span><Icon name="coin" size={15} />{price(place.cost)}</span></p>
      <PlaceActions place={place} compact />
    </div>
  </article>;
}

export function PlaceDetail({ place }: { place: Place }) {
  const { saved, togglePlace, t, local, span, price } = useTravel();
  return <>
    <figure className="detail-photo">
      <PlaceImage place={place} className="detail-image" lazy={false} />
      <figcaption><PhotoCredit place={place} /></figcaption>
    </figure>
    <div className="dialog-body">
      <p className="place-location"><Icon name="pin" size={15} />{local(place.location)}</p>
      <h2 id="dialog-title">{local(place.title)}</h2>
      <p className="address">{local(place.address)}</p>
      <p>{local(place.summary)}</p>
      <dl className="facts">
        <div><dt>{t("duration")}</dt><dd><Icon name="clock" size={17} />{place.zone === "daytrip" ? t("fullDay") : span(place.minutes)}</dd></div>
        <div><dt>{t("estCost")}</dt><dd><Icon name="coin" size={17} />{price(place.cost)}</dd></div>
      </dl>
      <div className="callout"><Icon name="info" /><div><strong>{t("travelTip")}</strong><p>{local(place.tip)}</p></div></div>
      <PlaceActions place={place} />
      <div className="dialog-actions">
        <a className="button button-primary" href={placeMap(place)} target="_blank" rel="noopener"><Icon name="directions" size={17} />{t("map")}</a>
        {"twogis" in place && place.twogis && <a className="button" href={place.twogis} target="_blank" rel="noopener"><Icon name="external" size={16} />{t("open2gis")}</a>}
        <button type="button" className="button" onClick={() => askAstra({ placeId: place.id, cityId: place.city })}><Icon name="sparkles" size={16} />{t("askAstra")}</button>
        <Heart pressed={saved.places.includes(place.id)} onClick={() => togglePlace(place)} />
        <a className="text-link" href={place.source} target="_blank" rel="noopener">{t("source")}<Icon name="external" size={14} /></a>
      </div>
    </div>
  </>;
}
