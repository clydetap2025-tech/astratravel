import { useEffect, useState } from "react";
import { ASTRA_MARK, GlassIconReveal } from "../components/ui/liquid-glass-logo-reveal";
import { onServer } from "../shared/motion";
import { reducedMotion } from "../shared/model";

const KEY = "astratravel.launched";

/**
 * The glass logo as the app's loading screen: it plays, short (about 1.5 s), each time the app is
 * opened — once per browser session, not on every page change — then the page fades in under it.
 * Any key or tap skips it; with reduced motion it does not play at all.
 */
export function Splash({ dark, skipLabel, disabled }: { dark: boolean; skipLabel: string; disabled: boolean }) {
  const [state, setState] = useState<"on" | "leaving" | "off">(() => {
    if (onServer || disabled || reducedMotion()) return "off";
    try { return sessionStorage.getItem(KEY) ? "off" : "on"; } catch { return "off"; }
  });
  function end() {
    try { sessionStorage.setItem(KEY, "1"); } catch { /* Optional. */ }
    setState((current) => current === "on" ? "leaving" : current);
    window.setTimeout(() => setState("off"), 420);
  }
  useEffect(() => {
    if (state !== "on") return;
    const onKey = () => end();
    const safety = window.setTimeout(end, 2200);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); window.clearTimeout(safety); };
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps
  if (state === "off") return null;
  return <div className="splash" data-leaving={state === "leaving" || undefined} onClick={end} role="presentation">
    <GlassIconReveal logo={ASTRA_MARK} label="AstraTravel" look={dark ? "dark" : "light"} className="splash-reveal" speed={2.3}
      background={dark ? "#05070b" : "#e8edf3"} logoColor={dark ? "#ffffff" : "#0e1428"} plateColor={dark ? "#05070b" : "#ffffff"}
      logoScale={0.62} finalScale={0.78} tileSize={260} onFinish={() => window.setTimeout(end, 150)} />
    <button type="button" className="button button-small splash-skip" onClick={(event) => { event.stopPropagation(); end(); }}>{skipLabel}</button>
  </div>;
}
