import type { Transition } from "motion/react";

/**
 * Motion is kept for things that respond to the visitor: a drop sliding under the chosen option,
 * a card opening into its dialog, a toast arriving. Nothing animates on its own, nothing plays on
 * page load beyond a short fade, and nothing moves at all under reduced motion.
 */
export const onServer = typeof window === "undefined";
export const spring: Transition = { type: "spring", stiffness: 420, damping: 36, mass: 0.8 };
export const easeOut = [0.2, 0.8, 0.2, 1] as const;
/** Page changes and swapped content: a quick crossfade, no sliding. */
export const fade = { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.18 } }, exit: { opacity: 0, transition: { duration: 0.1 } } };
