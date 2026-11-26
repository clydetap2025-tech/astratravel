import type { ReactNode } from "react";
import { DAY, NIGHT, type GlobeTheme } from "./route-globe";
import { slerp, toLonLat, toVec } from "./route-globe-utils/globe";

/**
 * The layout around a Route Globe: the host's header and card beside the globe on wide containers
 * and above and below it on narrow ones (a container query, so it follows the space it is given,
 * not the window). Styles: `gs-*` in public/styles.css.
 */
export function GlobeStage({ globe, header, card, hint, className = "" }: {
  globe: ReactNode;
  header?: ReactNode;
  card?: ReactNode;
  hint?: string;
  className?: string;
}) {
  return <div className={"gs " + className}>
    <div className="gs-stage">
      {header && <header className="gs-header">{header}</header>}
      <div className="gs-globe">{globe}</div>
      {card && <div className="gs-card">{card}{hint && <p className="gs-hint">{hint}</p>}</div>}
    </div>
  </div>;
}

/** The globe palette for the page theme. The ground stays clear so the page backdrop shows through. */
export const globeTheme = (dark: boolean): GlobeTheme => ({ ...(dark ? NIGHT : DAY), ground: "transparent" });

/** A point a fraction t of the way along the great circle from a to b, used to frame two places at once. */
export function between(a: { lat: number; lng: number }, b: { lat: number; lng: number }, t: number) {
  return toLonLat(slerp(toVec(a.lng, a.lat), toVec(b.lng, b.lat), t));
}
