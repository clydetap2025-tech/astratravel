import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { flushSync } from "react-dom";
import { AnimatePresence, domMax, LazyMotion, m, MotionConfig } from "motion/react";
import { planRoute, validateRequest } from "../../lib/planner.mjs";
import { cityById } from "../../data/catalog.js";
import { districtByKey } from "../../data/districts.js";
import { tr } from "../../data/i18n.js";
import { cityRegion } from "../components/ui/place-cover";
import { initialFilters } from "../features/places/catalog";
import { initialTicketState } from "../features/tickets/flights";
import { HomePage } from "../pages/HomePage";
import { PlacesPage } from "../pages/PlacesPage";
import { initialPlanInputs, PlannerPage } from "../pages/PlannerPage";
import { SavedPage } from "../pages/SavedPage";
import { TicketsPage } from "../pages/TicketsPage";
import { TravelContext, useDarkTheme } from "../shared/context";
import { tripCity } from "../shared/geo";
import type { Airport, Api, Flight, Modal, Page, Place, Plan, Preferences, Session, Theme } from "../shared/model";
import { fetchApi, placeFromHash, readOnboarded, readPlan, readPreferences, readSaved, readTheme, reducedMotion, saveLocal, scrollToId } from "../shared/model";
import { fade, onServer, spring } from "../shared/motion";
import { useParallax } from "../shared/parallax";
import { Icon } from "../shared/ui";
import { DialogContent } from "./Dialogs";
import { Footer, Header, Navigation, pages } from "./Header";
import { Splash } from "./Splash";

/** The page in the address; a first visit with no page named starts with the welcome flow. */
function currentPage(): Page {
  const hash = globalThis.location?.hash.slice(1).split("/")[0];
  if (hash === "welcome" || (hash && (pages as string[]).includes(hash))) return hash as Page;
  return onServer || readOnboarded() ? "places" : "welcome";
}

export function App({ api = fetchApi, assets, offline = false }: { api?: Api; assets?: Record<string, string>; offline?: boolean }) {
  const [preferences, setPreferences] = useState(readPreferences);
  const [page, setPage] = useState(currentPage);
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
  // Until a search is run, the flight form points at the city being explored (from Almaty, or from Astana for Almaty).
  useEffect(() => {
    const airport = cityById[tripCity(preferences)]?.airport as Airport | undefined;
    if (!airport) return;
    setTickets((state) => state.search ? state : { ...state, draft: { ...state.draft, from: (airport === "ALA" ? "NQZ" : "ALA") as Airport, to: airport } });
  }, [preferences.city]); // eslint-disable-line react-hooks/exhaustive-deps
  const [modal, setModal] = useState<Modal | null>(null);
  const [session, setSession] = useState<Session>({ mode: offline ? "offline" : "local", user: null });
  const [inputs, setInputs] = useState(() => {
    const interests = readPreferences().interests;
    return interests.length ? { ...initialPlanInputs, interests } : initialPlanInputs;
  });
  const [onboarded, setOnboarded] = useState(readOnboarded);
  const [theme, setTheme] = useState<Theme>(readTheme);
  const dark = useDarkTheme();
  useParallax();
  // The backdrop and accents take the colour of the part of the country being explored.
  useEffect(() => { document.documentElement.dataset.region = cityRegion[tripCity(preferences)] ?? "centre"; }, [preferences.city, preferences.visitor]); // eslint-disable-line react-hooks/exhaustive-deps
  const [plan, setPlan] = useState<Plan | null>(readPlan);
  const [aiPending, setAiPending] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [planIssue, setPlanIssue] = useState<unknown>(null);
  const [toast, setToast] = useState<{ message: string; href?: string; link?: string; id: number } | null>(null);
  const notify = (message: string, href?: string, link?: string) => setToast({ message, href, link, id: Date.now() });
  const dialog = useRef<HTMLDialogElement>(null);
  const pendingPlan = useRef<AbortController | null>(null);
  const identityRevision = useRef(0);
  const t = (key: Parameters<typeof tr>[0]) => tr(key, preferences.language);

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
        if (returnPage && (returnPage === "welcome" || (pages as string[]).includes(returnPage))) {
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
      const linked = placeFromHash();
      setModal(linked ? { kind: "place", place: linked } : null);
      setPage(currentPage());
      if (linked) return;
      window.scrollTo(0, 0);
      document.getElementById("main")?.focus({ preventScroll: true });
    }
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);

  // A shared link to a place (#places/<id>) opens it over the catalogue.
  useEffect(() => {
    const linked = placeFromHash();
    if (linked) setModal({ kind: "place", place: linked });
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
    if (next.user && !session.user) notify(t("signedIn"));
    setSession(next);
    setModal((shown) => shown?.kind === "account" ? null : shown);
  }

  /** Swaps the language with a crossfade: View Transitions where the browser has them, a CSS fade elsewhere. */
  function crossfade(apply: () => void) {
    const doc = document as Document & { startViewTransition?: (update: () => void) => unknown };
    if (reducedMotion()) return apply();
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
    if (event && !reducedMotion() && typeof doc.startViewTransition === "function") {
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
        notify(t("unauthorized"));
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
    const picture = from?.closest(".place-card, .route-stop, .hero-city-thumb")?.querySelector<HTMLElement>("img, svg.sketch-cover");
    if (next.kind !== "place" || !picture || typeof doc.startViewTransition !== "function" || reducedMotion()) {
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
    notify(t(selected ? "removed" : "added"), selected ? undefined : "#saved", t("openSaved"));
  }

  function toggleFlight(flight: Flight) {
    const selected = saved.flights.some(({ key }) => key === flight.key);
    setSaved((previous) => ({ ...previous, flights: selected
      ? previous.flights.filter(({ key }) => key !== flight.key)
      : [...previous.flights, { key: flight.key, search: flight.search }] }));
    notify(t(selected ? "removed" : "added"));
  }

  function toggleRoute(place: Place) {
    const selected = saved.route.includes(place.id);
    setSaved((previous) => ({ ...previous, route: selected ? previous.route.filter((id) => id !== place.id) : [...previous.route, place.id] }));
    notify(t(selected ? "removedFromRoute" : "addedToRoute"), selected ? undefined : "#planner", t("openRoute"));
  }

  function moveRoute(id: string, step: -1 | 1) {
    setSaved((previous) => {
      const route = [...previous.route];
      const from = route.indexOf(id);
      const to = from + step;
      if (from < 0 || to < 0 || to >= route.length) return previous;
      [route[from], route[to]] = [route[to], route[from]];
      return { ...previous, route };
    });
  }

  function toggleVisited(place: Place) {
    const selected = saved.visited.includes(place.id);
    setSaved((previous) => ({ ...previous, visited: selected ? previous.visited.filter((id) => id !== place.id) : [...previous.visited, place.id] }));
    notify(t(selected ? "unmarkedVisited" : "markedVisited"));
  }

  async function share(place: Place) {
    const url = location.href.split("#")[0] + "#places/" + place.id;
    const title = place.title[preferences.language] + " · AstraTravel";
    try {
      if (typeof navigator.share === "function" && matchMedia("(pointer: coarse)").matches) return await navigator.share({ title, url });
      await navigator.clipboard.writeText(url);
      notify(t("linkCopied"));
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) notify(url);
    }
  }

  return <LazyMotion features={domMax} strict><MotionConfig reducedMotion="user"><TravelContext.Provider value={{
    preferences, saved, asset: (name) => assets?.[name] ?? "/assets/" + name, open: openModal, updatePreferences, togglePlace, toggleFlight,
    toggleRoute, moveRoute, toggleVisited, share: (place) => void share(place), notify: (message) => notify(message),
  }}>
    <Splash dark={dark} skipLabel={t("skipSplash")} disabled={offline} />
    <a className="skip-link" id="skip-link" href="#main" onClick={(event) => {
      event.preventDefault();
      document.getElementById("main")?.focus();
    }}>{t("skip")}</a>
    <Header page={page} signedIn={Boolean(session.user)} theme={theme} onTheme={changeTheme} />
    <main className="shell main-shell" id="main" tabIndex={-1}>
      <AnimatePresence mode="wait" initial={false}>
        <m.div key={page} className="page" {...fade}>
          {page === "welcome" && <HomePage startStep={onboarded ? 1 : 0} onFinish={finishOnboarding} />}
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
      {modal && <DialogContent modal={modal} page={page} api={api} session={session} onSession={changeSession} onClose={() => setModal(null)} />}
    </dialog>
    <div className="toast-region" role="status" aria-live="polite">
      <AnimatePresence>
        {toast && <m.div key={toast.id} className="toast glass"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }} transition={spring}>
          <Icon name="check" size={18} /><span>{toast.message}</span>
          {toast.href && <a className="toast-link" href={toast.href}>{toast.link}</a>}
        </m.div>}
      </AnimatePresence>
    </div>
  </TravelContext.Provider></MotionConfig></LazyMotion>;
}

