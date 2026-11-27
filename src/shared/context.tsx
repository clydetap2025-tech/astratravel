import { createContext, useContext, useEffect, useState } from "react";
import { locales } from "../../data/catalog.js";
import { copy, countryName, timeSpan, tr } from "../../data/i18n.js";
import type { Flight, Language, Message, Modal, Place, Preferences, Saved } from "./model";

/** What every screen can read and do; App provides it. */
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
  /** Adds a place to the visitor's own route, or takes it out. */
  toggleRoute: (place: Place) => void;
  /** Moves a place of the route one step up (-1) or down (1). */
  moveRoute: (id: string, step: -1 | 1) => void;
  /** Marks a place as visited, or unmarks it. */
  toggleVisited: (place: Place) => void;
  /** Shares a place: the system share sheet where there is one, otherwise the link is copied. */
  share: (place: Place) => void;
  notify: (message: string) => void;
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
    number: (value: number) => new Intl.NumberFormat(locale).format(value),
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
