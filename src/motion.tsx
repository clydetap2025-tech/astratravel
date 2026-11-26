import type { ReactNode } from "react";
import { useEffect } from "react";
import { m, useReducedMotion } from "motion/react";
import type { Transition, Variants } from "motion/react";

/**
 * Motion primitives shared by the app: short fades and slides that show what changed, a stagger
 * for lists and reveal on scroll. No glows or blur, and nothing moves under reduced motion.
 * The server render never hides anything: without JavaScript every element is already in place.
 */

export const onServer = typeof window === "undefined";
export const spring: Transition = { type: "spring", stiffness: 380, damping: 32, mass: 0.8 };
export const softSpring: Transition = { type: "spring", stiffness: 220, damping: 26 };
export const easeOut = [0.2, 0.8, 0.2, 1] as const;

/** Page and step transitions: a short slide, its direction set by `custom` (1 or -1). */
export const slide: Variants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 24 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.45, ease: easeOut } },
  exit: (direction: number) => ({ opacity: 0, x: direction * -16, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }),
};

/** Page changes: a short slide in the direction of travel through the menu (custom: 1 or -1). */
export const pageSlide: Variants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 40 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.42, ease: easeOut } },
  exit: (direction: number) => ({ opacity: 0, x: direction * -28, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }),
};

export const page: Variants = {
  enter: { opacity: 0, y: 14 },
  center: { opacity: 1, y: 0, transition: { duration: 0.42, ease: easeOut } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

export const stagger: Variants = { center: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } } };
export const rise: Variants = {
  enter: { opacity: 0, y: 10 },
  center: { opacity: 1, y: 0, transition: { duration: 0.35, ease: easeOut } },
};

/** Words that fade up one after another; re-runs whenever the text changes. */
export function TextEffect({ text, as: Tag = "h2", className, id, delay = 0 }: { text: string; as?: "h1" | "h2" | "p"; className?: string; id?: string; delay?: number }) {
  // The heading takes focus after a step change (tabIndex -1), so screen readers announce it.
  const reduced = useReducedMotion();
  const words = text.split(/(?<= )/);
  const Component = m[Tag];
  return <Component key={text} id={id} className={className} aria-label={text} tabIndex={-1}
    initial={onServer || reduced ? false : "enter"} animate="center"
    variants={{ center: { transition: { staggerChildren: 0.045, delayChildren: delay } } }}>
    {words.map((word, index) => <m.span key={index} aria-hidden="true" className="te-word"
      variants={{ enter: { opacity: 0, y: 10 }, center: { opacity: 1, y: 0, transition: { duration: 0.42, ease: easeOut } } }}>
      {word}
    </m.span>)}
  </Component>;
}

/** Fades a block up the first time it scrolls into view. */
export function Reveal({ children, className, delay = 0, as = "div" }: { children: ReactNode; className?: string; delay?: number; as?: "div" | "section" | "li" }) {
  const reduced = useReducedMotion();
  const Component = m[as];
  return <Component className={className} initial={onServer || reduced ? false : { opacity: 0, y: 22 }}
    whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -8% 0px" }}
    transition={{ duration: 0.55, ease: easeOut, delay }}>
    {children}
  </Component>;
}

/**
 * Light that follows the pointer across glass: sets --mx/--my on the glass surface under the
 * cursor, which styles.css turns into a soft specular highlight. Mouse and pen only.
 */
const GLASS = ".panel, .choice-card, .place-content, .for-you-card, .hero-city, .flight-card, .popular-route, .route-card";
export function useGlassLight() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let frame = 0;
    let last: PointerEvent | null = null;
    const apply = () => {
      frame = 0;
      const target = last && (last.target as Element | null)?.closest?.<HTMLElement>(GLASS);
      if (!last || !target) return;
      const bounds = target.getBoundingClientRect();
      target.style.setProperty("--mx", (last.clientX - bounds.left).toFixed(0) + "px");
      target.style.setProperty("--my", (last.clientY - bounds.top).toFixed(0) + "px");
    };
    const onMove = (event: PointerEvent) => { last = event; if (!frame) frame = requestAnimationFrame(apply); };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => { document.removeEventListener("pointermove", onMove); cancelAnimationFrame(frame); };
  }, []);
}
