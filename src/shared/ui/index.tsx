import type { ReactNode } from "react";
import { photoCredits } from "../../../data/photos.js";
import { PlaceCover } from "../../components/ui/place-cover";
import { photoOverrides } from "../catalog-sync";
import { useTravel } from "../context";
import type { Message, Place } from "../model";
import { GlassIcon, Icon } from "./Icon";
import type { IconName } from "./Icon";

export { GlassIcon, Icon } from "./Icon";
export type { IconName } from "./Icon";

export const categoryIcons: Record<string, IconName> = { all: "compass", nature: "mountain", food: "food", culture: "landmark", city: "city" };

export function CategoryIcon({ category, size = 18 }: { category: string; size?: number }) {
  return <Icon name={categoryIcons[category] ?? "pin"} size={size} />;
}

/**
 * The head of every page, the same everywhere: a small eyebrow, the title, one line of lead text
 * and the page's main actions. `aside` sits on the right on wide screens (a map, a summary…).
 */
export function PageHeader({ eyebrow, title, lead, actions, aside, id = "page-title" }: {
  eyebrow?: ReactNode; title: ReactNode; lead?: ReactNode; actions?: ReactNode; aside?: ReactNode; id?: string;
}) {
  return <header className={"page-header" + (aside ? " has-aside" : "")}>
    <div className="page-header-text">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 id={id}>{title}</h1>
      {lead && <p className="lead">{lead}</p>}
      {actions && <div className="actions">{actions}</div>}
    </div>
    {aside && <div className="page-header-aside">{aside}</div>}
  </header>;
}

/** A titled block of a page, with an optional count and tools on the right of the title. */
export function Section({ id, title, count, tools, children, className }: {
  id: string; title: ReactNode; count?: ReactNode; tools?: ReactNode; children: ReactNode; className?: string;
}) {
  return <section className={"section" + (className ? " " + className : "")} aria-labelledby={id + "-title"} id={id}>
    <div className="section-head">
      <h2 id={id + "-title"}>{title}{count !== undefined && <span className="count">{count}</span>}</h2>
      {tools && <div className="section-tools">{tools}</div>}
    </div>
    {children}
  </section>;
}

export function SelectField({ id, label, icon, value, onChange, children, required }: {
  id: string; label: ReactNode; icon?: IconName; value?: string | number;
  onChange?: (value: string) => void; children: ReactNode; required?: boolean;
}) {
  return <label className="field" htmlFor={id}><span className="field-label">{label}</span>
    <span className={"select-wrap" + (icon ? " with-icon" : "")}>
      {icon && <Icon name={icon} size={18} />}
      <select id={id} name={id} value={value} onChange={onChange ? (event) => onChange(event.target.value) : undefined} required={required}>{children}</select>
      <Icon name="chevron" size={16} />
    </span>
  </label>;
}

export function EmptyState({ icon, title, description, children }: { icon: IconName; title: string; description?: string; children?: ReactNode }) {
  return <div className="empty-state glass">
    <GlassIcon name={icon} size={26} /><h3>{title}</h3>
    {description && <p>{description}</p>}{children}
  </div>;
}

/** Save to favourites: a glass circle with a heart that fills when saved. */
export function Heart({ pressed, onClick }: { pressed: boolean; onClick: () => void }) {
  const { t } = useTravel();
  return <button className="icon-button heart-button" type="button" aria-pressed={pressed}
    aria-label={t(pressed ? "unsave" : "save")} title={t(pressed ? "unsave" : "save")} onClick={onClick}><Icon name="heart" /></button>;
}

/** Two-letter country badge; flag emoji do not render on Windows, so the code is drawn instead. */
export function CountryBadge({ code }: { code: string }) {
  return code && code !== "OTHER" ? <span className="country-badge" aria-hidden="true">{code}</span> : null;
}

type Credit = { author: string; license: string; licenseUrl: string; page: string; kind: "place" | "city" | "dish" };
const credits = photoCredits as Record<string, Credit>;
export const creditOf = (id: string): Credit | undefined => credits[id];
export const hasPhoto = (place: Place) => !("photo" in place && place.photo === false) || Boolean(credits[place.id]);

/**
 * The place's photo, or a drawn cover when there is none. With `parallax` the picture sits in a
 * frame and drifts a little against the scroll (styles/parallax.css).
 */
export function PlaceImage({ place, className, width, height, lazy = true, parallax = false }: {
  place: Place; className?: string; width?: number; height?: number; lazy?: boolean; parallax?: boolean;
}) {
  const { asset } = useTravel();
  const picture = hasPhoto(place)
    ? <img className={parallax ? "parallax-layer" : className} src={photoOverrides[place.id] ?? asset(place.id + ".webp")} data-asset={place.id + ".webp"} alt=""
      width={width} height={height} loading={lazy ? "lazy" : undefined} decoding="async" />
    : <PlaceCover id={place.id} city={place.city} category={place.category} className={parallax ? "parallax-layer" : className} />;
  return parallax ? <span className={"parallax-frame" + (className ? " " + className : "")} data-parallax>{picture}</span> : picture;
}

const creditNote: Record<Credit["kind"], Message | null> = { place: null, city: "photoOfCity", dish: "photoOfDish" };

/** Who took the photo and under which licence, with a note when it shows the city or a dish instead of the place. */
export function PhotoCredit({ place }: { place: Place }) {
  const { t } = useTravel();
  const credit = credits[place.id];
  if (!credit) return null;
  const note = creditNote[credit.kind];
  return <p className="photo-credit"><Icon name="camera" size={14} />
    {note && <span>{t(note)} · </span>}
    <a href={credit.page} target="_blank" rel="noopener">{credit.author}</a>
    {" · "}{credit.licenseUrl ? <a href={credit.licenseUrl} target="_blank" rel="noopener">{credit.license}</a> : credit.license}
  </p>;
}

/** Small note under a card picture when the photo is of the city or a dish rather than the place. */
export function PhotoNote({ place }: { place: Place }) {
  const { t } = useTravel();
  const kind = credits[place.id]?.kind;
  return kind && kind !== "place" ? <span className="photo-note">{t(kind === "city" ? "photoOfCity" : "photoOfDish")}</span> : null;
}
