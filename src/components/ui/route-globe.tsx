import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { drawGlobe, landDots, rotate, slerp, toVec, type Vec3 } from "./route-globe-utils/globe";

/**
 * Route Globe
 * A dotted globe with flight arcs from one hub. Each route lifts off the surface on a great
 * circle; a comet runs along it and the destination pulses when it lands. Drag to spin; it
 * turns slowly on its own when left alone.
 *
 * Fitted to AstraTravel:
 * - Styles live in public/styles.css (`rg*`), not in an imported global.css: the site ships one
 *   stylesheet and its CSP (style-src 'self') blocks inline style attributes in the server render.
 * - The globe keeps its rotation when props change: a new hub, focus or selection turns it there
 *   smoothly instead of starting over.
 * - Optional `focus` (the view it turns to and settles on instead of spinning), `zoom`, `active`
 *   (one highlighted route), `onSelect` (click or tap a destination) and localisable text.
 */

export type Place = { name: string; lon: number; lat: number; note?: string };

const MUSCAT: Place = { name: "Muscat", lon: 58.41, lat: 23.59 };
const DEST: Place[] = [
  { name: "London", lon: -0.13, lat: 51.5, note: "7h 45m" },
  { name: "Istanbul", lon: 28.98, lat: 41.01, note: "4h 50m" },
  { name: "Cairo", lon: 31.24, lat: 30.04, note: "4h 10m" },
  { name: "Nairobi", lon: 36.82, lat: -1.29, note: "5h 05m" },
  { name: "Zanzibar", lon: 39.2, lat: -6.16, note: "5h 30m" },
  { name: "Mumbai", lon: 72.88, lat: 19.08, note: "2h 55m" },
  { name: "Kathmandu", lon: 85.32, lat: 27.72, note: "4h 15m" },
  { name: "Bangkok", lon: 100.5, lat: 13.76, note: "6h 20m" },
  { name: "Kuala Lumpur", lon: 101.69, lat: 3.14, note: "7h 05m" },
  { name: "Manila", lon: 120.98, lat: 14.6, note: "8h 40m" },
];

export type GlobeTheme = {
  ground: string;
  land: string;
  arc: string;
  glow: string;
  text: string;
  muted: string;
};

/** The palette from the original component. */
export const NIGHT: GlobeTheme = {
  ground: "#06080d",
  land: "#9fb4d6",
  arc: "#ffb547",
  glow: "rgb(90 140 255 / 0.18)",
  text: "#eef2fb",
  muted: "#7c8aa5",
};

/** The same idea for a light page: ink-blue land, a deeper amber that holds up on white. */
export const DAY: GlobeTheme = {
  ground: "#ffffff",
  land: "#2f3d57",
  arc: "#d97706",
  glow: "rgb(70 120 230 / 0.12)",
  text: "#0a0a0a",
  muted: "#595957",
};

type Props = {
  hub?: Place;
  places?: Place[];
  theme?: GlobeTheme;
  motion?: "full" | "reduced";
  className?: string;
  style?: CSSProperties;
  /** The view (longitude, latitude in degrees) to turn to and come back to after a drag. Without it the globe spins when idle. */
  focus?: { lon: number; lat: number } | null;
  /** Magnifies the sphere; above 1 it overflows the box, so the host should clip or fade the edge. */
  zoom?: number;
  /** Index in `places` of the route to highlight; the others dim. */
  active?: number | null;
  /** Called with the index in `places` when a destination is clicked or tapped. */
  onSelect?: (index: number) => void;
  /** Called when the hub itself is clicked or tapped. Without it a tap on the hub does nothing. */
  onHubSelect?: () => void;
  /** A region to outline on the globe, as [longitude, latitude] points of a closed polygon. */
  outline?: [number, number][];
  /** Accessible name of the globe. */
  label?: string;
  /** One line per route for screen readers. */
  describe?: (place: Place, hub: Place) => string;
};

/** Style attributes are left out of the server render, which the site CSP would block. */
const onServer = typeof window === "undefined";
const RAD = Math.PI / 180;
const SEGMENTS = 48;
const IDLE_MS = 2500;
const HIT_PX = 18;
const TAP_SLOP = 6;

/** The shortest signed turn from angle a to angle b. */
const turnTo = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
const clampTilt = (tilt: number) => Math.max(-0.9, Math.min(0.9, tilt));

export function RouteGlobe({
  hub = MUSCAT,
  places = DEST,
  theme = NIGHT,
  motion = "full",
  className = "",
  style,
  focus = null,
  zoom = 1,
  active = null,
  onSelect,
  onHubSelect,
  outline,
  label,
  describe = (p, h) => `${h.name} to ${p.name}${p.note ? `, ${p.note}` : ""}`,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const hubTag = useRef<HTMLSpanElement>(null);
  const activeTag = useRef<HTMLSpanElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const kick = useRef<(focusMoved: boolean) => void>(() => {});
  const placeTip = useRef(() => {});
  // Which destination the pointer rests on; the loop keeps the tooltip on it as the globe turns.
  const [hover, setHover] = useState<number | null>(null);

  // The routes as vectors, rebuilt only when the hub or the places change.
  const routes = useMemo(() => places.map((p, i) => ({ p, v: toVec(p.lon, p.lat), offset: i / places.length })), [places]);
  const hubVec = useMemo(() => toVec(hub.lon, hub.lat), [hub.lon, hub.lat]);
  const border = useMemo(() => (outline ?? []).map(([lon, lat]) => toVec(lon, lat)), [outline]);

  // What the animation loop reads every frame, kept current without restarting it.
  const live = useRef({ hub, hubVec, routes, border, theme, motion, focus, zoom, active, onSelect, onHubSelect });
  useLayoutEffect(() => {
    const s = live.current;
    const focusMoved = (s.focus?.lon !== focus?.lon || s.focus?.lat !== focus?.lat) && focus !== null;
    Object.assign(s, { hub, hubVec, routes, border, theme, motion, focus, zoom, active, onSelect, onHubSelect });
    kick.current(focusMoved);
    // Place a freshly shown tooltip before it is painted, now that its text (and width) is in the DOM.
    placeTip.current();
  });

  useEffect(() => {
    const el = host.current,
      cv = canvas.current;
    if (!el || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const cfg = live.current;
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const isReduced = () => cfg.motion === "reduced" || query.matches;
    // A magnified globe gets a denser lattice, so the land still reads as fine dots.
    const count = Math.round((window.innerWidth < 640 ? 18000 : 30000) * Math.min(4, Math.max(1, (cfg.zoom * cfg.zoom) / 2)));
    const dots = landDots(count);
    const spacing = Math.sqrt((4 * Math.PI) / count);
    const start0 = cfg.focus ?? { lon: cfg.hub.lon + 20, lat: 18 };
    const st = {
      yaw: start0.lon * RAD,
      tilt: clampTilt(start0.lat * RAD),
      vy: 0,
      vt: 0,
      drag: false,
      moved: false,
      id: -1, // the pointer that owns the drag
      px: 0,
      py: 0,
      downX: 0,
      downY: 0,
      moveAt: 0,
      last: 0,
      idle: -Infinity,
      // where a hovering pointer rests (canvas px), or null
      hx: null as number | null,
      hy: 0,
      hovered: null as number | null,
    };
    let W = 0,
      Hh = 0,
      dpr = 1,
      raf = 0,
      alive = true,
      visible = true;
    const t0 = performance.now();
    const pins: { i: number; x: number; y: number; front: boolean }[] = [];
    let hubAt: { x: number; y: number; front: boolean } | null = null;

    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = el.clientWidth;
      Hh = el.clientHeight;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(Hh * dpr);
    };
    const radius = () => Math.min(W, Hh) * 0.4 * cfg.zoom;
    const project = (v: Vec3, lift: number, r: number, cx: number, cy: number) => {
      const [x, y, z] = rotate(v, st.yaw, st.tilt);
      return { x: cx + x * r * lift, y: cy - y * r * lift, z };
    };
    const behind = (p: { x: number; y: number; z: number }, r: number, cx: number, cy: number) =>
      p.z < 0 && Math.hypot(p.x - cx, p.y - cy) < r;
    const placeTag = (tag: HTMLSpanElement | null, p: { x: number; y: number; z: number } | null) => {
      if (!tag) return;
      const shown = p !== null && p.z > 0.05;
      tag.style.opacity = shown ? "1" : "0";
      if (shown) tag.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
    };

    const draw = (now: number) => {
      const { theme: th, routes: rts, hubVec: H, active: act } = cfg;
      const reduced = isReduced();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, Hh);
      const r = radius(),
        cx = W / 2,
        cy = Hh / 2;
      drawGlobe(ctx, dots, { cx, cy, r, yaw: st.yaw, tilt: st.tilt, w: W, h: Hh }, th.land,
        Math.min(Math.max(1.4, r / 150), Math.max(1.4, spacing * r * 0.42)), th.glow);
      // the outlined region: a faint wash and a thin border on the near side
      if (cfg.border.length > 2) {
        const pts = cfg.border.map((v) => project(v, 1, r, cx, cy));
        if (pts.every((p) => p.z > 0)) {
          ctx.beginPath();
          pts.forEach((p, k) => (k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
          ctx.closePath();
          ctx.globalAlpha = 0.08;
          ctx.fillStyle = th.land;
          ctx.fill();
          ctx.globalAlpha = 0.55;
          ctx.strokeStyle = th.land;
          ctx.lineWidth = 1.2;
          ctx.lineJoin = "round";
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
      const t = (now - t0) / 1000;
      const lit = act !== null && act >= 0 && act < rts.length ? act : null;
      pins.length = 0;
      let activeEnd: { x: number; y: number; z: number } | null = null;
      ctx.lineCap = "round";
      rts.forEach((rt, i) => {
        const on = lit === null || lit === i;
        const dim = on ? 1 : 0.35;
        const ang = Math.acos(Math.max(-1, Math.min(1, H[0] * rt.v[0] + H[1] * rt.v[1] + H[2] * rt.v[2])));
        const height = 0.06 + ang * 0.12;
        const pts: { x: number; y: number; z: number }[] = [];
        for (let k = 0; k <= SEGMENTS; k++) {
          const u = k / SEGMENTS;
          pts.push(project(slerp(H, rt.v, u), 1 + Math.sin(Math.PI * u) * height, r, cx, cy));
        }
        // the arc: faint where it passes behind the globe
        ctx.strokeStyle = th.arc;
        ctx.lineWidth = lit === i ? 1.8 : 1.1;
        for (let k = 0; k < SEGMENTS; k++) {
          const a = pts[k],
            b = pts[k + 1];
          ctx.globalAlpha = (behind(a, r, cx, cy) ? 0.06 : lit === i ? 0.8 : 0.38) * dim;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
        // the comet: a bright head with a fading tail, looping with its own offset
        const cycle = 3.6,
          ph = reduced ? 0.999 : (t / cycle + rt.offset) % 1;
        const run = Math.min(1, ph / 0.7);
        const head = Math.floor(run * SEGMENTS);
        for (let k = Math.max(0, head - 10); k < head; k++) {
          const a = pts[k],
            b = pts[k + 1];
          if (behind(a, r, cx, cy)) continue;
          ctx.globalAlpha = (1 - (head - k) / 10) * 0.95 * dim;
          ctx.lineWidth = lit === i ? 2.8 : 2.2;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
        const end = pts[SEGMENTS];
        const front = end.z > 0;
        pins.push({ i, x: end.x, y: end.y, front });
        if (lit === i) activeEnd = end;
        if (front) {
          ctx.globalAlpha = dim;
          ctx.fillStyle = th.arc;
          ctx.beginPath();
          ctx.arc(end.x, end.y, lit === i ? 3.6 : 2.6, 0, Math.PI * 2);
          ctx.fill();
          // arrival pulse
          if (ph > 0.7) {
            const k = (ph - 0.7) / 0.3;
            ctx.globalAlpha = (1 - k) * dim;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(end.x, end.y, 3 + k * 16, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      });
      // the hub
      const h = project(H, 1, r, cx, cy);
      if (h.z > 0) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = th.text;
        ctx.beginPath();
        ctx.arc(h.x, h.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = reduced ? 0.8 : 0.5 + 0.5 * Math.sin(t * 3);
        ctx.strokeStyle = th.text;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(h.x, h.y, 9, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      hubAt = { x: h.x, y: h.y, front: h.z > 0 };
      placeTag(hubTag.current, h);
      placeTag(activeTag.current, activeEnd);
      updateHover();
    };

    const tick = (now: number) => {
      raf = 0;
      if (!alive || !visible || document.hidden) return;
      const dt = st.last ? Math.min(0.05, (now - st.last) / 1000) : 0.016;
      st.last = now;
      if (!st.drag) {
        st.yaw += st.vy * dt;
        st.tilt = clampTilt(st.tilt + st.vt * dt);
        st.vy *= Math.pow(0.05, dt);
        st.vt *= Math.pow(0.05, dt);
        const settled = now - st.idle > IDLE_MS;
        if (cfg.focus) {
          // Turn to the focus, and come back to it a moment after a drag.
          if (settled) {
            const k = Math.min(1, dt * 3);
            st.yaw += turnTo(st.yaw, cfg.focus.lon * RAD) * k;
            st.tilt += (clampTilt(cfg.focus.lat * RAD) - st.tilt) * k;
          }
        } else {
          if (settled) st.yaw += dt * 0.08;
          st.tilt = clampTilt(st.tilt + (18 * RAD - st.tilt) * Math.min(1, dt * 0.4));
        }
      }
      draw(now);
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!alive || !W) return;
      if (isReduced()) {
        cancelAnimationFrame(raf);
        raf = 0;
        return draw(performance.now());
      }
      if (!raf) {
        st.last = 0;
        raf = requestAnimationFrame(tick);
      }
    };
    // Props changed: with reduced motion jump to the new focus; otherwise let the loop ease there now.
    kick.current = (focusMoved: boolean) => {
      if (focusMoved) {
        st.idle = -Infinity;
        st.vy = st.vt = 0;
        if (isReduced() && cfg.focus) {
          st.yaw = cfg.focus.lon * RAD;
          st.tilt = clampTilt(cfg.focus.lat * RAD);
        }
      }
      start();
    };

    /** The closest visible destination or the hub to a point, with its distance; i = -1 is the hub. */
    const nearest = (x: number, y: number) => {
      let best: { i: number; x: number; y: number; d: number } | null = null;
      for (const p of pins) {
        if (!p.front) continue;
        const d = Math.hypot(p.x - x, p.y - y);
        if (!best || d < best.d) best = { i: p.i, x: p.x, y: p.y, d };
      }
      if (hubAt?.front) {
        const d = Math.hypot(hubAt.x - x, hubAt.y - y);
        if (!best || d <= best.d) best = { i: -1, x: hubAt.x, y: hubAt.y, d };
      }
      return best;
    };
    // Keeps the tooltip and the pointer cursor on whatever lies under a resting mouse, even as the globe turns.
    const updateHover = () => {
      const near = st.hx === null || st.drag ? null : nearest(st.hx, st.hy);
      const hit = near && near.d < HIT_PX ? near : null;
      const pickable = hit && (hit.i >= 0 ? cfg.onSelect : cfg.onHubSelect);
      if (pickable) el.dataset.hover = "";
      else delete el.dataset.hover;
      const index = hit && hit.i >= 0 ? hit.i : null;
      if (index !== st.hovered) {
        st.hovered = index;
        setHover(index);
      }
      const box = tip.current;
      if (!box || !hit || index === null) return;
      // Stay inside the globe box: clamp sideways, and drop below the point near the top edge.
      const w = box.offsetWidth,
        h = box.offsetHeight;
      const left = Math.max(4, Math.min(W - w - 4, hit.x - w / 2));
      const top = hit.y - h - 14 < 4 ? hit.y + 14 : hit.y - h - 14;
      box.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`;
    };
    placeTip.current = updateHover;
    const local = (e: PointerEvent) => {
      const b = cv.getBoundingClientRect();
      return { x: e.clientX - b.left, y: e.clientY - b.top };
    };
    const endDrag = () => {
      st.drag = false;
      st.moved = false;
      st.id = -1;
      st.idle = performance.now();
      delete el.dataset.dragging;
    };
    const onDown = (e: PointerEvent) => {
      // A second finger (a pinch) ends the drag and is left to the browser.
      if (!e.isPrimary) {
        if (st.drag) endDrag();
        return;
      }
      if (e.pointerType === "mouse" && e.button !== 0) return;
      cv.setPointerCapture(e.pointerId);
      st.drag = true;
      st.moved = false;
      st.id = e.pointerId;
      st.px = st.downX = e.clientX;
      st.py = st.downY = e.clientY;
      st.vy = st.vt = 0;
      st.idle = st.moveAt = performance.now();
      st.hx = null;
      updateHover();
    };
    const onMove = (e: PointerEvent) => {
      if (st.drag) {
        if (e.pointerId !== st.id) return;
        if (!st.moved && Math.hypot(e.clientX - st.downX, e.clientY - st.downY) < TAP_SLOP) return;
        if (!st.moved) {
          st.moved = true;
          el.dataset.dragging = "";
        }
        const r = radius();
        const dx = e.clientX - st.px,
          dy = e.clientY - st.py;
        st.px = e.clientX;
        st.py = e.clientY;
        st.yaw -= dx / r;
        st.tilt = clampTilt(st.tilt + dy / r);
        st.vy = (-dx / r) * 30;
        st.vt = (dy / r) * 30;
        st.idle = st.moveAt = performance.now();
        if (isReduced()) draw(performance.now());
        return;
      }
      if (e.pointerType !== "mouse") return;
      const { x, y } = local(e);
      st.hx = x;
      st.hy = y;
      updateHover();
    };
    const onUp = (e: PointerEvent) => {
      if (!st.drag || e.pointerId !== st.id) return;
      const wasTap = !st.moved;
      // Held still before letting go: no fling.
      if (performance.now() - st.moveAt > 80) st.vy = st.vt = 0;
      endDrag();
      if (cv.hasPointerCapture(e.pointerId)) cv.releasePointerCapture(e.pointerId);
      if (!wasTap) return;
      const { x, y } = local(e);
      if (e.pointerType === "mouse") {
        st.hx = x;
        st.hy = y;
      }
      const near = nearest(x, y);
      // A finger is less precise than a mouse.
      if (!near || near.d >= (e.pointerType === "mouse" ? HIT_PX : HIT_PX * 1.6)) return;
      if (near.i < 0) cfg.onHubSelect?.();
      else cfg.onSelect?.(near.i);
    };
    const onCancel = (e: PointerEvent) => {
      if (st.drag && e.pointerId === st.id) endDrag();
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      st.hx = null;
      updateHover();
    };
    cv.addEventListener("pointerdown", onDown);
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerup", onUp);
    cv.addEventListener("pointercancel", onCancel);
    cv.addEventListener("pointerleave", onLeave);
    const ro = new ResizeObserver(() => {
      size();
      draw(performance.now());
      start();
    });
    ro.observe(el);
    const io = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1]?.isIntersecting ?? true;
      if (visible) start();
    });
    io.observe(el);
    const onVis = () => !document.hidden && start();
    document.addEventListener("visibilitychange", onVis);
    const onMotion = () => start();
    query.addEventListener?.("change", onMotion);
    // A new pixel ratio (browser zoom, another monitor) with the same CSS size: rebuild the backing store.
    let dprQuery: MediaQueryList | null = null;
    const onDpr = () => {
      size();
      draw(performance.now());
      watchDpr();
    };
    const watchDpr = () => {
      dprQuery?.removeEventListener?.("change", onDpr);
      dprQuery = matchMedia(`(resolution: ${devicePixelRatio || 1}dppx)`);
      dprQuery.addEventListener?.("change", onDpr);
    };
    watchDpr();
    size();
    start();
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      kick.current = () => {};
      placeTip.current = () => {};
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      query.removeEventListener?.("change", onMotion);
      dprQuery?.removeEventListener?.("change", onDpr);
      cv.removeEventListener("pointerdown", onDown);
      cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerup", onUp);
      cv.removeEventListener("pointercancel", onCancel);
      cv.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const lit = active !== null && active >= 0 && active < places.length ? places[active] : null;
  const tipPlace = hover !== null && hover < places.length ? places[hover] : null;
  return (
    <div
      ref={host}
      className={`rg ${onSelect ? "rg--pick " : ""}${className}`}
      style={
        onServer
          ? undefined
          : {
              background: theme.ground,
              color: theme.text,
              ["--rg-muted" as string]: theme.muted,
              ["--rg-arc" as string]: theme.arc,
              ["--rg-ground" as string]: theme.ground,
              ...style,
            }
      }
    >
      <canvas
        ref={canvas}
        className="rg__canvas"
        role="img"
        aria-label={label ?? `A globe with ${places.length} flight routes from ${hub.name}`}
      />
      <span ref={hubTag} className="rg__tag rg__tag--hub" aria-hidden="true">
        {hub.name}
      </span>
      <span ref={activeTag} className="rg__tag rg__tag--active" aria-hidden="true" hidden={!lit}>
        {lit?.name}
      </span>
      <div ref={tip} className="rg__tip" aria-hidden="true" hidden={!tipPlace}>
        <strong>{tipPlace?.name}</strong>
        {tipPlace?.note && <span>{tipPlace.note}</span>}
      </div>
      <ul className="rg__sr">
        {places.map((p) => (
          <li key={p.name}>{describe(p, hub)}</li>
        ))}
      </ul>
    </div>
  );
}

export default RouteGlobe;
