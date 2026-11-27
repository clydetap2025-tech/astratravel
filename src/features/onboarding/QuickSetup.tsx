import { useEffect, useRef } from "react";
import { AnimatePresence, m } from "motion/react";
import { cityById, origins } from "../../../data/catalog.js";
import { districts } from "../../../data/districts.js";
import { travellerByCountry } from "../../../data/travellers.js";
import { useTravel } from "../../shared/context";
import { distanceKm, tripCity } from "../../shared/geo";
import type { Category } from "../../shared/model";
import { fade, spring } from "../../shared/motion";
import { CountryBadge, GlassIcon, Icon } from "../../shared/ui";
import type { IconName } from "../../shared/ui";

const categoryIcon: Record<Category, IconName> = { nature: "mountain", food: "food", culture: "landmark", city: "city" };
const interests: { key: Category; body: "natureBody" | "foodBody" | "cultureBody" | "cityBody" }[] = [
  { key: "nature", body: "natureBody" }, { key: "food", body: "foodBody" }, { key: "culture", body: "cultureBody" }, { key: "city", body: "cityBody" },
];

/** Arrow keys move the choice inside a radio group, as the WAI-ARIA radio pattern expects. */
export function arrowKeys(event: React.KeyboardEvent<HTMLElement>) {
  const keys: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
  const delta = keys[event.key];
  if (!delta) return;
  const radios = [...event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')];
  const index = radios.indexOf(document.activeElement as HTMLElement);
  if (index < 0) return;
  event.preventDefault();
  const next = radios[(index + delta + radios.length) % radios.length];
  next.focus();
  next.click();
}

/** One short form — visiting or local, where from, what you like — and straight into the guide. Every field is optional. */
export function QuickSetup({ onBack, onFinish }: { onBack: () => void; onFinish: (target: "places" | "planner") => void }) {
  const { preferences, updatePreferences, t, local, country, language } = useTravel();
  const heading = useRef<HTMLDivElement>(null);
  const city = cityById[tripCity(preferences)];
  const visitor = preferences.visitor || "guest";
  const from = travellerByCountry[preferences.origin];
  useEffect(() => { heading.current?.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true }); }, []);
  // A first visit counts as a guest until they say otherwise.
  useEffect(() => { if (!preferences.visitor) updatePreferences({ visitor: "guest" }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const who: { key: "guest" | "local"; icon: IconName; title: "guestTitle" | "localTitle" }[] = [
    { key: "guest", icon: "suitcase", title: "guestTitle" }, { key: "local", icon: "home", title: "localTitle" },
  ];
  const toggle = (key: Category) => updatePreferences({
    interests: preferences.interests.includes(key) ? preferences.interests.filter((item) => item !== key) : [...preferences.interests, key],
  });

  return <section className="quick glass glass-strong" aria-labelledby="quick-title">
    <div className="quick-top">
      <button type="button" className="icon-button" aria-label={t("back")} onClick={onBack}><Icon name="back" size={18} /></button>
      <span className="quick-city"><Icon name="pin" size={15} />{local(city.name)}</span>
      <button type="button" className="button button-small" onClick={() => onFinish("places")}>{t("skipIntro")}</button>
    </div>
    <div ref={heading} className="quick-head">
      <h1 id="quick-title" className="quick-title" tabIndex={-1}>{t("quickTitle")}</h1>
      <p>{t("quickIntro")}</p>
    </div>

    <div className="quick-body">
      <div className="quick-field">
        <span className="quick-label" id="quick-who">{t("whoShort")}</span>
        <div className="quick-who" role="radiogroup" aria-labelledby="quick-who" onKeyDown={arrowKeys}>
          {who.map((option) => <button key={option.key} type="button" role="radio" aria-checked={visitor === option.key}
            tabIndex={visitor === option.key ? 0 : -1} className="quick-who-option"
            onClick={() => updatePreferences(option.key === "local" ? { visitor: "local", origin: "" } : { visitor: "guest", district: "" })}>
            {visitor === option.key && <m.span layoutId="quick-who-drop" className="quick-drop" transition={spring} aria-hidden="true" />}
            <Icon name={option.icon} size={18} /><span>{t(option.title)}</span>
          </button>)}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {visitor === "guest" ? <m.div key="guest" className="quick-field" {...fade}>
          <label className="quick-label" htmlFor="quick-origin">{t("origin")}</label>
          <span className="select-wrap with-icon">
            <Icon name="globe" size={18} />
            <select id="quick-origin" value={preferences.origin} onChange={(event) => updatePreferences({ origin: event.target.value })}>
              <option value="">{t("chooseCountry")}</option>
              {origins.map((code) => <option key={code} value={code}>{country(code)}</option>)}
            </select>
            <Icon name="chevron" size={16} />
          </span>
          {from && <p className="quick-route"><CountryBadge code={preferences.origin} />{country(preferences.origin)}
            <span className="quick-route-line" aria-hidden="true" />{local(city.name)} · {new Intl.NumberFormat(language).format(distanceKm(from, city))} km</p>}
        </m.div> : <m.div key="local" className="quick-field" {...fade}>
          {city.id === "almaty" ? <>
            <span className="quick-label" id="quick-district">{t("districtTitle")}</span>
            <div className="quick-chips" role="radiogroup" aria-labelledby="quick-district" onKeyDown={arrowKeys}>
              {districts.map((district) => <button key={district.key} type="button" role="radio" aria-checked={preferences.district === district.key}
                tabIndex={preferences.district === district.key || (!preferences.district && district === districts[0]) ? 0 : -1}
                className="quick-chip" onClick={() => updatePreferences({ district: district.key })}>{local(district.name)}</button>)}
            </div>
          </> : <p className="quick-note">{t("localBody")}</p>}
        </m.div>}
      </AnimatePresence>

      <div className="quick-field">
        <span className="quick-label" id="quick-likes">{t("interestsTitle")}</span>
        <div className="quick-likes" role="group" aria-labelledby="quick-likes">
          {interests.map((item) => {
            const on = preferences.interests.includes(item.key);
            return <m.button key={item.key} type="button" aria-pressed={on} className="quick-like" whileTap={{ scale: 0.96 }} onClick={() => toggle(item.key)}>
              <GlassIcon name={categoryIcon[item.key]} tone={item.key} />
              <strong>{t(item.key)}</strong><small>{t(item.body)}</small>
              <m.span className="quick-like-check" aria-hidden="true" initial={false} animate={{ scale: on ? 1 : 0, opacity: on ? 1 : 0 }} transition={spring}>
                <Icon name="check" size={13} />
              </m.span>
            </m.button>;
          })}
        </div>
      </div>
    </div>

    <div className="quick-actions">
      <button type="button" className="button button-primary button-large quick-go" onClick={() => onFinish("places")}>{t("showPicks")}<Icon name="arrow" size={18} /></button>
      <button type="button" className="button button-large" onClick={() => onFinish("planner")}><Icon name="route" size={18} />{t("makePlan")}</button>
    </div>
  </section>;
}
