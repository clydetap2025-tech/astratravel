import { Fragment, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AlmatySky, AlmatyStreets } from "./almaty-art";

/**
 * Sketch City Hero, fitted to AstraTravel: the first screen on warm paper with a two-line headline
 * that rises word by word, a stats line whose numbers count up, a serif blurb and the calls to
 * action, over a hand-drawn Almaty panorama that inks in from left to right. The skyline drifts and
 * follows the pointer and the scroll a little more than the streets do. Every movement stops under
 * prefers-reduced-motion, and without JavaScript the screen renders in its finished state.
 *
 * Differences from the original component: no own header (the site header stays), no web fonts or
 * remote images (the site's CSP allows only its own origin), and styles live in styles.css.
 */

export type SketchCityStat = { value: number; label: string };

export type SketchCityHeroProps = {
  eyebrow?: ReactNode;
  headline: [string, string];
  stats: SketchCityStat[];
  /** Word placed between the last two stats, e.g. "and". */
  join: string;
  blurb: string;
  actions?: ReactNode;
  /** Changes whenever the copy's language does, so the counters restart and the words rise again. */
  copyKey?: string;
};

/** Ease-out cubic count-up, clamped. */
export function countAt(target: number, t: number) {
  const k = Math.min(Math.max(t, 0), 1);
  return Math.round(target * (1 - Math.pow(1 - k, 3)));
}

/** Layer offsets in CSS px for an eased pointer (-1…1) and scroll (0…1). */
export function layerOffsets(px: number, py: number, scroll: number, time: number) {
  const drift = Math.sin(time / 2200) * 2.5;
  return {
    sky: { x: -px * 9 + drift, y: -py * 4 + scroll * 26 },
    street: { x: -px * 3, y: -py * 2 + scroll * 6 },
  };
}

/** The server render stays free of style attributes, which the site CSP blocks in markup. */
const onServer = typeof window === "undefined";
const delay = (seconds: number) => onServer ? undefined : { animationDelay: seconds.toFixed(2) + "s" };

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function SketchCityHero({ eyebrow, headline, stats, join, blurb, actions, copyKey = "" }: SketchCityHeroProps) {
  const rootRef = useRef<HTMLElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const streetRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [counts, setCounts] = useState(() => stats.map((stat) => stat.value));

  // Start the intro once the page has its fonts, so the drawing never jumps mid-animation.
  useEffect(() => {
    let alive = true;
    const show = () => { if (alive) setReady(true); };
    const late = window.setTimeout(show, 1200);
    document.fonts?.ready.then(show, show);
    return () => { alive = false; window.clearTimeout(late); };
  }, []);

  // Count the stats up after the headline has risen, and again after a language switch.
  useEffect(() => {
    if (!ready || reducedMotion()) { setCounts(stats.map((stat) => stat.value)); return; }
    let frame = 0;
    const start = performance.now() + 550;
    const tick = (now: number) => {
      const t = (now - start) / 1400;
      setCounts(stats.map((stat) => countAt(stat.value, t)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, copyKey]);

  // Parallax: eased pointer and scroll, paused off screen and in background tabs.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion()) return;
    let frame = 0;
    let visible = true;
    let last = performance.now();
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0, scroll: 0 };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const bounds = root.getBoundingClientRect();
      target.x = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2));
      target.y = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2));
    };
    const onLeave = () => { target.x = 0; target.y = 0; };
    const step = (now: number) => {
      const dt = Math.min(now - last, 64);
      last = now;
      const bounds = root.getBoundingClientRect();
      const scroll = Math.max(0, Math.min(1, -bounds.top / Math.max(bounds.height, 1)));
      const ease = 1 - Math.pow(1 - 0.075, dt / 16.67);
      current.x += (target.x - current.x) * ease;
      current.y += (target.y - current.y) * ease;
      current.scroll += (scroll - current.scroll) * ease;
      const offsets = layerOffsets(current.x, current.y, current.scroll, now);
      if (skyRef.current) skyRef.current.style.transform = `translate3d(${offsets.sky.x.toFixed(2)}px, ${offsets.sky.y.toFixed(2)}px, 0)`;
      if (streetRef.current) streetRef.current.style.transform = `translate3d(${offsets.street.x.toFixed(2)}px, ${offsets.street.y.toFixed(2)}px, 0)`;
      frame = visible && !document.hidden ? requestAnimationFrame(step) : 0;
    };
    const wake = () => {
      if (!frame && visible && !document.hidden) { last = performance.now(); frame = requestAnimationFrame(step); }
    };
    const observer = new IntersectionObserver((entries) => { visible = entries[0]?.isIntersecting ?? true; wake(); });
    observer.observe(root);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", wake);
    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", wake);
    };
  }, []);

  let wordIndex = 0;
  // Japanese has no spaces, so each line rises as one piece there.
  const words = headline.map((line) => line.split(/(?<= )/));
  const afterWords = 0.12 + words.flat().length * 0.07;

  return <section ref={rootRef} className="sch-root" data-ready={ready} aria-labelledby="home-title">
    <div className="sch-stage" aria-hidden="true">
      <div className="sch-art">
        <div ref={skyRef} className="sch-layer sch-sky"><AlmatySky /></div>
        <div ref={streetRef} className="sch-layer sch-ink"><AlmatyStreets /></div>
      </div>
    </div>
    <div className="sch-copy" key={copyKey}>
      {eyebrow}
      <h1 className="sch-h1" id="home-title">
        {words.map((line, lineIndex) => <span key={lineIndex} className={"sch-line" + (lineIndex ? " sch-line-accent" : "")}>
          {line.map((word) => {
            const wordDelay = 0.12 + wordIndex++ * 0.07;
            return <span key={word + wordDelay} className="sch-word" style={delay(wordDelay)}>{word}</span>;
          })}
        </span>)}
      </h1>
      <p className="sch-stats sch-fade" style={delay(afterWords)}>
        {stats.map((stat, index) => <Fragment key={stat.label}>
          <span className="sch-num">
            <span className="sch-ghost" aria-hidden="true">{stat.value}</span>
            <span className="sch-val">{counts[index] ?? stat.value}</span>
          </span>{" "}{stat.label}{index < stats.length - 2 ? ", " : index === stats.length - 2 ? " " + join + " " : "."}
        </Fragment>)}
      </p>
      <p className="sch-blurb sch-fade" style={delay(afterWords + 0.1)}>{blurb}</p>
      {actions && <div className="sch-actions sch-fade" style={delay(afterWords + 0.2)}>{actions}</div>}
    </div>
  </section>;
}
