import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { flushSync } from "react-dom";
import { AnimatePresence, domMax, LazyMotion, m, MotionConfig } from "motion/react";
import { planRoute, validateRequest } from "../lib/planner.mjs";
import { cityById, languages, placeById, places as allPlaces } from "../data/catalog.js";
import { districtByKey } from "../data/districts.js";
import { fill, tr } from "../data/i18n.js";
import { Account } from "./Account";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";
import { onServer, pageSlide, spring, useGlassLight } from "./motion";
import { Logo } from "./components/ui/logo";
import { LiquidNavbar, NimbusIcons } from "./components/ui/liquid-glass-navbar";
import { ThemeSwitch } from "./components/ui/theme-switch";
import { cityRegion } from "./components/ui/place-cover";
import { ASTRA_MARK, GlassIconReveal } from "./components/ui/liquid-glass-logo-reveal";
import { useLayoutEffect } from "react";
import { Onboarding } from "./Onboarding";
import { tripCity } from "./Welcome";
import { initialFilters, PlaceCard, PlaceDetail, PlacesPage } from "./Places";
import { initialPlanInputs, PlannerPage } from "./Planner";
import { FlightDetail, FlightStack, initialTicketState, TicketsPage } from "./Tickets";
import type { Airport, Api, Flight, Language, Modal, Page, Place, Plan, Preferences, Session, Theme } from "./model";
import { fetchApi, flightsFor, readOnboarded, readPlan, readPreferences, readSaved, readTheme, saveLocal, scrollToId } from "./model";
import { EmptyState, TravelContext, useDarkTheme, useTravel } from "./ui";

const navigation: Record<Exclude<Page, "welcome">, IconName> = { places: "compass", tickets: "plane", saved: "heart", planner: "route" };
const pages = Object.keys(navigation) as Page[];

/** The page in the address; a first visit with no page named starts with the welcome flow. */
function currentPage(): Page {
  const hash = globalThis.location?.hash.slice(1);
  if (hash === "welcome" || (hash && Object.hasOwn(navigation, hash))) return hash as Page;
  return onServer || readOnboarded() ? "places" : "welcome";
}

export function App({ api = fetchApi, assets, offline = false }: { api?: Api; assets?: Record<string, string>; offline?: boolean }) {
  const [preferences, setPreferences] = useState(readPreferences);
  const [page, setPage] = useState(currentPage);
  // Pages slide toward the side of the menu they sit on; the welcome flow counts as the far left.
  const order: Page[] = ["welcome", "places", "tickets", "saved", "planner"];
  const previousPage = useRef(page);
  const direction = order.indexOf(page) >= order.indexOf(previousPage.current) ? 1 : -1;
  useEffect(() => { previousPage.current = page; }, [page]);
  const [filters, setFilters] = useState(initialFilters);
  // Flights start out pointed at the city the visitor is planning (from Almaty, or Astana for Almaty itself).
  const [tickets, setTickets] = useState(() => {
    const state = initialTicketState();
    const airport = cityById[tripCity(readPreferences())]?.airport as Airport | undefined;
    if (!airport) return state;
    const from = (airport === "ALA" ? "NQZ" : "ALA") as Airport;
    return { ...state, draft: { ...state.draft, from, to: airport } };
  });
  const [saved, setSaved] = useState(readSaved);
  const [modal, setModal] = useState<Modal | null>(null);
  const [session, setSession] = useState<Session>({ mode: offline ? "offline" : "local", user: null });
  const [inputs, setInputs] = useState(() => {
    const interests = readPreferences().interests;
    return interests.length ? { ...initialPlanInputs, interests } : initialPlanInputs;
  });
  const [onboarded, setOnboarded] = useState(readOnboarded);
  // The glass logo plays once, on the very first visit only.
  const [splash, setSplash] = useState<"on" | "leaving" | "off">(() => {
    if (onServer || offline) return "off";
    try { return localStorage.getItem("astratravel.intro") ? "off" : "on"; } catch { return "off"; }
  });
  function endSplash() {
    try { localStorage.setItem("astratravel.intro", "1"); } catch { /* Optional. */ }
    setSplash((current) => current === "on" ? "leaving" : current);
    window.setTimeout(() => setSplash("off"), 650);
  }
  useEffect(() => {
    if (splash !== "on") return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape" || event.key === "Enter" || event.key === " ") endSplash(); };
    const safety = window.setTimeout(endSplash, 6000);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); window.clearTimeout(safety); };
  }, [splash]); // eslint-disable-line react-hooks/exhaustive-deps
  const [theme, setTheme] = useState<Theme>(readTheme);
  const dark = useDarkTheme();
  useGlassLight();
  // The backdrop and accents take the colour of the part of the country being explored.
  useEffect(() => { document.documentElement.dataset.region = cityRegion[tripCity(preferences)] ?? "centre"; }, [preferences.city, preferences.visitor]); // eslint-disable-line react-hooks/exhaustive-deps
  const [plan, setPlan] = useState<Plan | null>(readPlan);
  const [aiPending, setAiPending] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [planIssue, setPlanIssue] = useState<unknown>(null);
  const [toast, setToast] = useState<{ message: string; href?: string } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const pendingPlan = useRef<AbortController | null>(null);
  const identityRevision = useRef(0);
  const t = (key: "skip" | "added" | "removed" | "unauthorized" | "welcomePage" | "skipSplash" | Exclude<Page, "welcome">) => tr(key, preferences.language);

  useEffect(() => {
    const controller = new AbortController();
    const revision = identityRevision.current;
    async function loadSession() {
      let loaded = await api("session", undefined, controller.signal);
      if (controller.signal.aborted || revision !== identityRevision.current) return;
      if (loaded.mode === "sites" && loaded.canActivate && !loaded.user) {
        let returnPage: string | null = null;
        try {
          returnPage = sessionStorage.getItem("astratravel.signin-page");
          sessionStorage.removeItem("astratravel.signin-page");
        } catch { /* Storage can be disabled. */ }
        if (returnPage && (returnPage === "welcome" || Object.hasOwn(navigation, returnPage))) {
          loaded = await api("activate", {}, controller.signal);
          if (controller.signal.aborted || revision !== identityRevision.current) return;
          location.hash = returnPage;
        }
      }
      setSession(loaded);
    }
    void loadSession().catch(() => {});
    return () => controller.abort();
  }, [api]);

  useEffect(() => {
    function navigate() {
      setModal(null);
      setPage(currentPage());
      window.scrollTo(0, 0);
      document.getElementById("main")?.focus({ preventScroll: true });
    }
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);

  useEffect(() => {
    document.documentElement.lang = preferences.language;
    document.title = "AstraTravel — " + t(page === "welcome" ? "welcomePage" : page);
  }, [page, preferences.language]); // eslint-disable-line react-hooks/exhaustive-deps

  // The browser chrome follows the page theme.
  useEffect(() => {
    for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) meta.content = dark ? "#05070b" : "#e8edf3";
  }, [dark]);

  useEffect(() => { saveLocal("saved", saved); }, [saved]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  useLayoutEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (modal && !element.open) element.showModal();
    if (!modal && element.open) element.close();
  }, [modal]);

  useEffect(() => { saveLocal("plan", plan); }, [plan]);

  /** Drops a request in flight; AI notes are dropped too, since they are written in one language for one person. */
  function settlePlan(keepCatalogPlan: boolean) {
    pendingPlan.current?.abort();
    pendingPlan.current = null;
    setPlanning(false);
    setPlanIssue(null);
    setAiPending(false);
    setPlan((current) => current && keepCatalogPlan
      ? { mode: "demo", cost: current.cost, days: current.days.map(({ placeIds, cost, minutes }) => ({ placeIds, cost, minutes })) }
      : null);
  }

  function changeSession(next: Session) {
    identityRevision.current += 1;
    if (!next.user && plan?.mode === "ai") settlePlan(true);
    if (next.user && !session.user) setToast({ message: tr("signedIn", preferences.language) });
    setSession(next);
    setModal((shown) => shown?.kind === "account" ? null : shown);
  }

  /** Swaps the language with a crossfade: View Transitions where the browser has them, a CSS fade elsewhere. */
  function crossfade(apply: () => void) {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const doc = document as Document & { startViewTransition?: (update: () => void) => unknown };
    if (reduce) return apply();
    if (typeof doc.startViewTransition === "function") {
      try { doc.startViewTransition(() => flushSync(apply)); return; } catch { /* Fall through to the CSS fade. */ }
    }
    const root = document.documentElement;
    root.classList.add("lang-out");
    window.setTimeout(() => {
      flushSync(apply);
      requestAnimationFrame(() => root.classList.remove("lang-out"));
    }, 170);
  }

  function updatePreferences(changes: Partial<Preferences>) {
    const next = { ...preferences, ...changes };
    if ((Object.keys(changes) as (keyof Preferences)[]).every((key) => next[key] === preferences[key])) return;
    if (next.language !== preferences.language && plan?.mode === "ai") settlePlan(true);
    const apply = () => {
      setPreferences(next);
      saveLocal("profile", next);
    };
    if (next.language !== preferences.language) crossfade(apply);
    else apply();
  }

  /** The welcome flow is done: remember it, carry its interests into the planner and open the next page. */
  function finishOnboarding(target: "places" | "planner") {
    saveLocal("onboarded", true);
    setOnboarded(true);
    if (preferences.interests.length) setInputs((current) => ({ ...current, interests: preferences.interests }));
    location.hash = target;
  }

  /** Light, dark or system. The new theme spreads in a circle from the button where the browser allows it. */
  function changeTheme(next: Theme, event?: ReactMouseEvent) {
    const root = document.documentElement;
    const apply = () => {
      if (next === "system") root.removeAttribute("data-theme");
      else root.setAttribute("data-theme", next);
    };
    const doc = document as Document & { startViewTransition?: (update: () => void) => { finished: Promise<void> } };
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (event && !reduce && typeof doc.startViewTransition === "function") {
      root.style.setProperty("--vt-x", event.clientX + "px");
      root.style.setProperty("--vt-y", event.clientY + "px");
      root.classList.add("theme-vt");
      doc.startViewTransition(apply).finished.finally(() => root.classList.remove("theme-vt"));
    } else apply();
    setTheme(next);
    saveLocal("theme", next);
  }

  function showPlan() {
    if (matchMedia("(max-width: 760px)").matches) requestAnimationFrame(() => scrollToId("plan-output"));
  }

  /** The catalog plan runs in the browser, so it needs no account. */
  function buildPlan() {
    settlePlan(false);
    const request = validateRequest({ ...inputs, language: preferences.language, origin: preferences.origin, city: tripCity(preferences) });
    const result = request && planRoute(request);
    if (!result) return setPlanIssue(new Error(request ? "no_plan" : "invalid_input"));
    setPlan(result as Plan);
    showPlan();
  }

  /** AI notes come from the server and need a signed-in account. */
  async function buildAiPlan() {
    if (pendingPlan.current) return;
    let signedIn = session;
    if (!session.user) {
      // One tap for guests: sign in to the demo account and carry on (the server's sign-in flow keeps its own dialog).
      if (session.mode === "sites") return setModal({ kind: "account" });
      try { signedIn = await api("demo", {}); changeSession(signedIn); }
      catch (error) { return setPlanIssue(error instanceof Error ? error : new Error("request_error")); }
    }
    setPlanning(true);
    setPlanIssue(null);
    setAiPending(false);
    const controller = new AbortController();
    pendingPlan.current = controller;
    try {
      const result = await api("plan", { ...inputs, language: preferences.language, origin: preferences.origin, city: tripCity(preferences) }, controller.signal);
      if (controller.signal.aborted) return;
      setPlan(result);
      setAiPending(result.mode !== "ai");
      showPlan();
    } catch (error) {
      if (controller.signal.aborted) return;
      if (error instanceof Error && error.message === "unauthorized") {
        changeSession({ ...session, user: null });
        setToast({ message: t("unauthorized") });
      } else {
        setPlanIssue(error instanceof Error ? error : new Error("request_error"));
      }
    } finally {
      if (pendingPlan.current === controller) {
        pendingPlan.current = null;
        setPlanning(false);
      }
    }
  }

  /**
   * Opens a dialog. A place opened from its card morphs out of the card's picture: the card image
   * and the dialog image share a view-transition-name for the length of the transition.
   */
  function openModal(next: Modal, from?: Element | null) {
    const doc = document as Document & { startViewTransition?: (update: () => void) => { finished: Promise<void> } };
    const picture = from?.closest(".place-card, .for-you-card, .pick-row")?.querySelector<HTMLElement>("img, svg.sketch-cover");
    if (next.kind !== "place" || !picture || typeof doc.startViewTransition !== "function" || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setModal(next);
      return;
    }
    picture.style.viewTransitionName = "place-cover";
    const transition = doc.startViewTransition(() => {
      picture.style.viewTransitionName = "";
      flushSync(() => setModal(next));
    });
    transition.finished.finally(() => { picture.style.viewTransitionName = ""; });
  }

  function togglePlace(place: Place) {
    const selected = saved.places.includes(place.id);
    setSaved((previous) => ({ ...previous, places: selected
      ? previous.places.filter((id) => id !== place.id) : [...previous.places, place.id] }));
    setToast({ message: t(selected ? "removed" : "added"), href: selected ? undefined : "#saved" });
  }

  function toggleFlight(flight: Flight) {
    const selected = saved.flights.some(({ key }) => key === flight.key);
    setSaved((previous) => ({ ...previous, flights: selected
      ? previous.flights.filter(({ key }) => key !== flight.key)
      : [...previous.flights, { key: flight.key, search: flight.search }] }));
    setToast({ message: t(selected ? "removed" : "added") });
  }

  return <LazyMotion features={domMax} strict><MotionConfig reducedMotion="user"><TravelContext.Provider value={{
    preferences, saved, asset: (name) => assets?.[name] ?? "/assets/" + name, open: openModal, updatePreferences, togglePlace, toggleFlight,
  }}>
    {splash !== "off" && <div className="splash" data-leaving={splash === "leaving" || undefined} onClick={endSplash}>
      <GlassIconReveal logo={ASTRA_MARK} label="AstraTravel" look={dark ? "dark" : "light"} className="splash-reveal"
        background={dark ? "#05070b" : "#e8edf3"} logoColor={dark ? "#ffffff" : "#0e1428"} plateColor={dark ? "#05070b" : "#ffffff"}
        logoScale={0.62} finalScale={0.78} tileSize={300} onFinish={() => window.setTimeout(endSplash, 450)} />
      <button type="button" className="splash-skip" onClick={(event) => { event.stopPropagation(); endSplash(); }}>{t("skipSplash")}</button>
    </div>}
    <a className="skip-link" id="skip-link" href="#main" onClick={(event) => {
      event.preventDefault();
      document.getElementById("main")?.focus();
    }}>{t("skip")}</a>
    <Header page={page} signedIn={Boolean(session.user)} theme={theme} onTheme={changeTheme} />
    <main className="shell main-shell" id="main" tabIndex={-1}>
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <m.div key={page} className="page" custom={direction} variants={pageSlide} initial="enter" animate="center" exit="exit">
          {page === "welcome" && <Onboarding startStep={onboarded ? 1 : 0} onFinish={finishOnboarding} />}
          {page === "places" && <PlacesPage filter={filters} onFilter={setFilters} />}
          {page === "tickets" && <TicketsPage state={tickets} onChange={setTickets} />}
          {page === "saved" && <SavedPage />}
          {page === "planner" && <PlannerPage signedIn={Boolean(session.user)} inputs={inputs} onInput={setInputs}
            plan={plan} planning={planning} issue={planIssue} aiPending={aiPending} aiAvailable={session.ai !== false} onPlan={buildPlan} onAiPlan={() => void buildAiPlan()}
            start={districtByKey[preferences.district]} />}
        </m.div>
      </AnimatePresence>
    </main>
    <Footer />
    <Navigation page={page} mobile />
    <dialog ref={dialog} className={"dialog" + (modal?.kind === "place" ? " media-dialog" : "")}
      aria-labelledby="dialog-title" onClose={() => setModal(null)} onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) setModal(null);
      }}>
      {modal && <ModalContent modal={modal} page={page} api={api} session={session} onSession={changeSession} onClose={() => setModal(null)} />}
    </dialog>
    <div className="toast-region" role="status" aria-live="polite">
      <AnimatePresence>
        {toast && <m.div key={toast.message + String(saved.places.length)} className="toast"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }} transition={spring}>
          <Icon name="check" size={19} /><span>{toast.message}</span>
          {toast.href && <a className="toast-link" href={toast.href}>{tr("openSaved", preferences.language)}</a>}
        </m.div>}
      </AnimatePresence>
    </div>
  </TravelContext.Provider></MotionConfig></LazyMotion>;
}

function Brand() {
  return <a className="brand" href="#welcome" aria-label="AstraTravel">
    <Logo size={34} /><span>Astra<span>Travel</span></span>
  </a>;
}

/** The liquid-glass navbar: the water drop flows to the current page; on phones it floats at the bottom. */
function Navigation({ page, mobile = false }: { page: Page; mobile?: boolean }) {
  const { t } = useTravel();
  const dark = useDarkTheme();
  const items = [
    { label: t("places"), href: "#places", icon: NimbusIcons.globe, fx: "spin" as const },
    { label: t("tickets"), href: "#tickets", icon: NimbusIcons.plane, fx: "plane" as const },
    { label: t("saved"), href: "#saved", icon: NimbusIcons.heart, fx: "pop" as const },
    { label: t("planner"), href: "#planner", icon: NimbusIcons.route, fx: "drop" as const },
  ];
  const active = Math.max(0, pages.indexOf(page));
  return <LiquidNavbar items={items} active={page === "welcome" ? -1 : active} tone={dark ? "dark" : "light"} label={t("navigation")}
    compact={mobile ? true : undefined} className={mobile ? "mobile-nav" : "desktop-nav"} />;
}

const themeLabel = { system: "themeSystem", light: "themeLight", dark: "themeDark" } as const;

function Header({ page, signedIn, theme, onTheme }: {
  page: Page; signedIn: boolean; theme: Theme; onTheme: (theme: Theme, event?: ReactMouseEvent) => void;
}) {
  const { t, open, language, t: t2 } = useTravel();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <header className="site-header" data-scrolled={scrolled || undefined}><div className="shell header-inner glass">
    <Brand /><Navigation page={page} />
    <div className="header-actions">
      <ThemeSwitch value={theme} onChange={onTheme} labels={{ system: t(themeLabel.system), light: t(themeLabel.light), dark: t(themeLabel.dark) }} />
      <button className="header-language" type="button" aria-label={t2("language") + ": " + languages[language]} onClick={() => open({ kind: "profile" })}>
        <span className="header-language-mark" aria-hidden="true">Aa</span><span>{language.toUpperCase()}</span>
      </button>
      <button className="button button-header" type="button" onClick={() => open({ kind: "account" })}>
        <Icon name="user" size={17} /><span>{t(signedIn ? "profile" : "signIn")}</span>
      </button>
    </div>
  </div></header>;
}

function Footer() {
  const { t } = useTravel();
  return <footer className="site-footer"><div className="shell footer-inner"><Brand /><p>{t("illustrative")}</p></div></footer>;
}

function SavedPage() {
  const { saved, t, preferences, language } = useTravel();
  const places = saved.places.map((id) => placeById[id]).filter(Boolean);
  const flights = saved.flights.flatMap(({ key, search }) => flightsFor(search).filter((flight) => flight.key === key));
  const city = tripCity(preferences);
  // With nothing saved yet, offer three places from the trip city to start the list with one tap.
  const starters = allPlaces.filter((place) => place.city === city).slice(0, 3);
  const empty = !places.length && !flights.length;
  return <>
    <div className="simple-heading">
      <h1>{t("saved")}{places.length > 0 && <span className="count">{fill("savedCount", language, places.length, allPlaces.length)}</span>}</h1>
      <p>{t("savedOnDevice")}</p>
    </div>
    {empty && <EmptyState icon="heart" title={t("noSaved")} description={t("noSavedBody")}>
      <a className="button button-green" href="#places">{t("discover")}</a>
    </EmptyState>}
    {empty && starters.length > 0 && <section className="saved-section"><h2>{t("savedSuggest")}</h2>
      <div className="place-grid">{starters.map((place) => <PlaceCard key={place.id} place={place} />)}</div></section>}
    {places.length > 0 && <section className="saved-section"><h2>{t("places")}</h2>
      <div className="place-grid">{places.map((place) => <PlaceCard key={place.id} place={place} />)}</div></section>}
    {flights.length > 0 && <section className="saved-section"><h2>{t("flights")}</h2><FlightStack flights={flights} /></section>}
  </>;
}

function ModalContent({ modal, page, api, session, onSession, onClose }: {
  modal: Modal; page: Page; api: Api; session: Session; onSession: (session: Session) => void; onClose: () => void;
}) {
  const { t, language, updatePreferences } = useTravel();
  return <>
    <button className="icon-button dialog-close" type="button" aria-label={t("close")} onClick={onClose}><Icon name="x" /></button>
    {modal.kind === "place" && <PlaceDetail place={modal.place} />}
    {modal.kind === "flight" && <FlightDetail flight={modal.flight} />}
    {modal.kind === "account" && <Account session={session} api={api} page={page} onChange={onSession} />}
    {modal.kind === "profile" && <div className="dialog-padding"><span className="setup-icon"><Icon name="globe" size={23} /></span>
      <h2 id="dialog-title">{t("language")}</h2>
      <div className="lang-switch" role="radiogroup" aria-label={t("language")}>
        {(Object.keys(languages) as Language[]).map((code) => <button key={code} type="button" role="radio" aria-checked={language === code}
          lang={code} onClick={() => updatePreferences({ language: code })}>
          {language === code && <m.span layoutId="modal-lang" className="segment-pill" transition={spring} aria-hidden="true" />}
          <span className="nav-content">{languages[code]}</span>
        </button>)}
      </div>
      <a className="button button-soft dialog-wide" href="#welcome" onClick={onClose}><Icon name="sparkles" size={17} />{t("restartWelcome")}</a>
    </div>}
  </>;
}
