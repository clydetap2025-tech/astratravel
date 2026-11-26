import { createContext, useContext, useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { languages, locales, origins } from "../data/catalog.js";
import { copy, countryName, timeSpan, tr } from "../data/i18n.js";
import { PlaceCover } from "./components/ui/place-cover";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";
import type { Flight, Language, Message, Modal, Place, Preferences, Saved } from "./model";

type TravelView = {
  preferences: Preferences;
  saved: Saved;
  asset: (file: string) => string;
  /** Opens a dialog; pass the clicked element so a place can morph out of its card. */
  open: (modal: Modal, from?: Element | null) => void;
  /** Applies part of the preferences at once; a language change crossfades the page. */
  updatePreferences: (changes: Partial<Preferences>) => void;
  togglePlace: (place: Place) => void;
  toggleFlight: (flight: Flight) => void;
};

export const TravelContext = createContext<TravelView | null>(null);

export function useTravel() {
  const view = useContext(TravelContext);
  if (!view) throw new Error("AstraTravel context is unavailable");
  const language = view.preferences.language;
  const locale = locales[language];
  const t = (key: Message): string => tr(key, language);
  return {
    ...view, language, t,
    local: (value: Record<Language, string>) => value[language],
    money: (value: number) => new Intl.NumberFormat(locale).format(value) + " ₸",
    /** Free, an estimate, or "check the price" when the guide does not know it. */
    price: (cost: number | null) => cost === null ? tr("priceUnknown", language) : cost ? "≈ " + new Intl.NumberFormat(locale).format(cost) + " ₸" : tr("free", language),
    span: (value: number) => timeSpan(value, language),
    dateLabel: (date: string, options: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(locale, { timeZone: "UTC", ...options }).format(new Date(date + "T12:00:00Z")),
    errorText: (error: unknown) => t(error instanceof Error && Object.hasOwn(copy, error.message) ? error.message as Message : "request_error"),
    country: (code: string) => countryName(code, language),
  };
}

/** True when the page is dark: an explicit choice on <html data-theme>, otherwise the system setting. */
export function useDarkTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      const chosen = document.documentElement.dataset.theme;
      setDark(chosen ? chosen === "dark" : query.matches);
    };
    sync();
    query.addEventListener?.("change", sync);
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => { query.removeEventListener?.("change", sync); observer.disconnect(); };
  }, []);
  return dark;
}

export const categoryIcons: Record<string, IconName> = { all: "compass", nature: "mountain", food: "food", culture: "landmark", city: "city" };

export function CategoryIcon({ category, size = 18 }: { category: string; size?: number }) {
  return <Icon name={categoryIcons[category] ?? "pin"} size={size} />;
}

export function SelectField({ id, label, icon, value, onChange, children, required }: {
  id: string; label: ReactNode; icon?: IconName; value?: string | number;
  onChange?: (value: string) => void; children: ReactNode; required?: boolean;
}) {
  return <label className="field" htmlFor={id}><span>{label}</span>
    <span className={"select-wrap" + (icon ? " with-icon" : "")}>
      {icon && <Icon name={icon} size={19} />}
      <select id={id} name={id} value={value} onChange={onChange ? (event) => onChange(event.target.value) : undefined} required={required}>{children}</select>
      <Icon name="chevron" size={16} />
    </span>
  </label>;
}

export function PreferenceForm({ prefix, onSave }: { prefix: string; onSave: (preferences: Partial<Preferences>) => void }) {
  const { preferences, t, country } = useTravel();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const language = form.get(prefix + "-language");
    const origin = form.get(prefix + "-origin");
    if (typeof language === "string" && Object.hasOwn(languages, language) && typeof origin === "string" && origins.includes(origin)) {
      onSave({ language: language as Language, origin });
    }
  }
  return <form className="stack-form" onSubmit={submit}>
    <div className="field"><label htmlFor={prefix + "-language"}>{t("language")}</label>
      <span className="select-wrap with-icon"><Icon name="globe" size={19} />
        <select id={prefix + "-language"} name={prefix + "-language"} defaultValue={preferences.language}>
          {Object.entries(languages).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
        </select><Icon name="chevron" size={16} />
      </span>
    </div>
    <div className="field"><label htmlFor={prefix + "-origin"}>{t("origin")}</label>
      <span className="select-wrap with-icon"><Icon name="pin" size={19} />
        <select id={prefix + "-origin"} name={prefix + "-origin"} defaultValue={preferences.origin} required>
          <option value="">{t("chooseCountry")}</option>
          {origins.map((code) => <option key={code} value={code}>{country(code)}</option>)}
        </select><Icon name="chevron" size={16} />
      </span>
    </div>
    <button className="button button-green" type="submit">{t("showSuggestions")}</button>
  </form>;
}

export function EmptyState({ icon, title, description, children }: { icon: IconName; title: string; description?: string; children?: ReactNode }) {
  return <div className="empty-state">
    <span className="feature-icon"><Icon name={icon} size={27} /></span><h3>{title}</h3>
    {description && <p>{description}</p>}{children}
  </div>;
}

export function Heart({ pressed, onClick }: { pressed: boolean; onClick: () => void }) {
  const { t } = useTravel();
  return <button className="icon-button heart-button" type="button" aria-pressed={pressed}
    aria-label={t(pressed ? "unsave" : "save")} onClick={onClick}><Icon name="heart" /></button>;
}

/** Line drawings per category, a few each, in the ink colour of the current theme. No religious symbols. */
const coverArt: Record<string, ReactNode[]> = {
  nature: [
    <><circle cx="300" cy="72" r="22" /><path d="M20 200 L120 84 L168 140 L214 96 L320 200" /><path d="M104 102 L120 84 L136 104 M198 114 L214 96 L230 116" /><path d="M60 224 H340 M110 240 H290" /></>,
    <><path d="M40 196 C90 150 130 150 170 176 C210 202 260 196 360 150" /><path d="M120 196 V120 M108 140 L120 120 L132 140 M100 160 L120 132 L140 160 M240 186 V104 M226 128 L240 104 L254 128 M218 152 L240 120 L262 152" /><path d="M40 224 H360" /></>,
    <><path d="M60 210 C120 170 280 170 340 210" /><path d="M80 210 C80 140 140 92 200 92 C260 92 320 140 320 210" /><path d="M150 210 V150 M200 210 V130 M250 210 V150" /></>,
  ],
  culture: [
    <><path d="M120 210 V140 H280 V210" /><path d="M136 140 C136 84 264 84 264 140" /><path d="M200 84 V64" /><path d="M160 210 V176 A12 12 0 0 1 184 176 V210 M216 210 V176 A12 12 0 0 1 240 176 V210" /><path d="M80 210 H320" /></>,
    <><path d="M90 104 L200 64 L310 104 Z" /><path d="M100 104 H300 M110 116 H290" /><path d="M126 116 V200 M166 116 V200 M206 116 V200 M246 116 V200 M286 116 V200" /><path d="M90 200 H310 M80 214 H320" /></>,
    <><path d="M170 210 V96 H230 V210" /><path d="M164 96 H236 M176 96 C176 70 224 70 224 96" /><path d="M200 70 V52" /><path d="M110 210 V156 H170 M230 156 H290 V210" /><path d="M80 210 H320" /></>,
  ],
  city: [
    <><path d="M40 210 V150 H90 V210 M100 210 V110 H146 V210 M160 210 V70 L206 54 V210 M220 210 V128 H262 V210 M276 210 V160 H330 V210" /><path d="M182 54 V30" /><path d="M30 210 H350" /></>,
    <><path d="M30 190 H370" /><path d="M80 190 V100 M320 190 V100" /><path d="M80 104 C150 170 250 170 320 104" /><path d="M120 140 V190 M160 154 V190 M200 158 V190 M240 154 V190 M280 140 V190" /><path d="M30 214 H370" /></>,
    <><path d="M200 214 V40" /><path d="M176 214 L200 60 L224 214" /><path d="M184 96 H216 M188 140 H212" /><circle cx="200" cy="60" r="12" /><path d="M60 214 H340" /></>,
  ],
  food: [
    <><path d="M112 150 H272 C268 204 236 226 192 226 C148 226 116 204 112 150Z" /><path d="M100 150 H284 M150 128 c-12 -16 12 -24 0 -42 M190 122 c-12 -16 12 -24 0 -42 M230 128 c-12 -16 12 -24 0 -42" /><path d="M248 96 L316 150 M262 88 L326 140" /></>,
  ],
};

const pick = (id: string, count: number) => [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % count;

/**
 * A designed cover for places the guide has no photo of: a soft liquid gradient tinted by
 * category, two drifting glass droplets and a line drawing, with the city and category set
 * like a poster. Everything is seeded by the place id, so each cover is stable and distinct.
 */
export function SketchCover({ place, className, label = true }: { place: Place; className?: string; label?: boolean }) {
  const { local, t } = useTravel();
  const variants = coverArt[place.category] ?? coverArt.city;
  const seed = pick(place.id, 997);
  const id = "cv-" + place.id;
  const ax = 60 + (seed % 7) * 40;
  const bx = 340 - (seed % 5) * 36;
  return <svg className={"sketch-cover cover-" + place.category + (className ? " " + className : "")} viewBox="0 0 400 260"
    aria-hidden="true" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id={id + "-bg"} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" className="cover-stop-a" /><stop offset="1" className="cover-stop-b" />
      </linearGradient>
      <radialGradient id={id + "-drop"} cx=".35" cy=".3" r=".75">
        <stop offset="0" stopColor="#fff" stopOpacity=".85" /><stop offset=".55" stopColor="#fff" stopOpacity=".18" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width="400" height="260" fill={`url(#${id}-bg)`} />
    <g className="cover-drops">
      <circle cx={ax} cy={70 + (seed % 3) * 20} r={70 + (seed % 4) * 10} fill={`url(#${id}-drop)`} />
      <circle cx={bx} cy={190 - (seed % 4) * 14} r={46 + (seed % 3) * 12} fill={`url(#${id}-drop)`} />
    </g>
    <g className="cover-art" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      {variants[pick(place.id, variants.length)]}
    </g>
    {label && <g className="cover-text">
      <text x="20" y="34" className="cover-kicker">{t(place.category as Message).toUpperCase()}</text>
      <text x="20" y="238" className="cover-city">{local(place.location)}</text>
    </g>}
  </svg>;
}

/** The place's photo, or a sketch cover when the demo has none. */
export function PlaceImage({ place, className, width, height, lazy = true }: { place: Place; className?: string; width?: number; height?: number; lazy?: boolean }) {
  const { asset } = useTravel();
  if ("photo" in place && place.photo === false) return <PlaceCover id={place.id} city={place.city} category={place.category} className={className} />;
  return <img className={className} src={asset(place.id + ".webp")} data-asset={place.id + ".webp"} alt="" width={width} height={height}
    loading={lazy ? "lazy" : undefined} decoding="async" />;
}

/** Two-letter country badge; flag emoji do not render on Windows, so the code is drawn instead. */
export function CountryBadge({ code }: { code: string }) {
  return code && code !== "OTHER" ? <span className="country-badge" aria-hidden="true">{code}</span> : null;
}
