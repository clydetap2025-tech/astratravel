import type { ReactNode } from "react";

/**
 * AstraTravel icons, drawn for this app on a 24 px grid: a 1.7 px rounded outline over a soft
 * "glass" body (the same shape filled at low opacity, see .icon-body in styles). Every icon has the
 * same optical weight, so they line up in buttons, chips and lists.
 */
type Shape = { body?: ReactNode; line: ReactNode };
const both = (d: string, extra: ReactNode = null): Shape => ({ body: <path d={d} />, line: <><path d={d} />{extra}</> });
const ring = (cx: number, cy: number, r: number, extra: ReactNode = null): Shape => ({
  body: <circle cx={cx} cy={cy} r={r} />, line: <><circle cx={cx} cy={cy} r={r} />{extra}</>,
});
const box = (x: number, y: number, w: number, h: number, rx: number, extra: ReactNode = null): Shape => ({
  body: <rect x={x} y={y} width={w} height={h} rx={rx} />, line: <><rect x={x} y={y} width={w} height={h} rx={rx} />{extra}</>,
});

const PLANE = "M12 2.6c.9 0 1.5 1 1.5 2.4v4.1l7 4.1v1.9l-7-2v4.3l2.3 1.8v1.6L12 19.9l-3.8.9v-1.6l2.3-1.8v-4.3l-7 2v-1.9l7-4.1V5c0-1.4.6-2.4 1.5-2.4Z";

const shapes = {
  compass: ring(12, 12, 9, <path d="M15.6 8.4 13.3 13.3 8.4 15.6l2.3-4.9Z" />),
  plane: { body: <path d={PLANE} transform="rotate(45 12 12)" />, line: <path d={PLANE} transform="rotate(45 12 12)" /> },
  heart: both("M12 20.2s-7.8-4.6-7.8-10.3A4.4 4.4 0 0 1 12 7.2a4.4 4.4 0 0 1 7.8 2.7c0 5.7-7.8 10.3-7.8 10.3Z"),
  sparkles: both("M10 3.5l1.6 4.9 4.9 1.6-4.9 1.6L10 16.5l-1.6-4.9L3.5 10l4.9-1.6Z", <path d="M18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8Z" />),
  globe: ring(12, 12, 9, <path d="M3 12h18M12 3c-3.6 4.8-3.6 13.2 0 18M12 3c3.6 4.8 3.6 13.2 0 18M4.2 7.5h15.6M4.2 16.5h15.6" />),
  pin: both("M12 21.5s-6.8-6.2-6.8-11.6a6.8 6.8 0 0 1 13.6 0c0 5.4-6.8 11.6-6.8 11.6Z", <circle cx="12" cy="9.9" r="2.4" />),
  chevron: { line: <path d="m6.5 9.5 5.5 5.5 5.5-5.5" /> },
  user: { body: <><circle cx="12" cy="8" r="3.8" /><path d="M4.5 20.5c.8-3.8 3.9-6 7.5-6s6.7 2.2 7.5 6Z" /></>,
    line: <><circle cx="12" cy="8" r="3.8" /><path d="M4.5 20.5c.8-3.8 3.9-6 7.5-6s6.7 2.2 7.5 6" /></> },
  search: ring(10.5, 10.5, 6.5, <path d="m15.3 15.3 5.2 5.2" />),
  mountain: both("M2.5 19.5 9 8l3.6 6.2L15.2 10l6.3 9.5Z", <path d="m7.3 11.4 1.7 1.3 1.6-1.3" />),
  food: both("M3.5 12h17a8.5 8.5 0 0 1-17 0Z", <path d="M8 20.5h8M13 9.2 19.5 3M10.6 9.2 16.2 3.6" />),
  landmark: both("M6 20v-8a6 6 0 0 1 12 0v8Z", <path d="M4 20h16M12 6V3.5M10 20v-3.5a2 2 0 0 1 4 0V20M6 12.5h12" />),
  city: { body: <path d="M4.5 20V10h5v10ZM11.5 20V4.5l6 2.5V20Z" />,
    line: <><path d="M4.5 20V10h5v10M11.5 20V4.5l6 2.5V20M3 20h18" /><path d="M14 9.5h1M14 12.5h1M14 15.5h1M6.5 13h1M6.5 16h1" /></> },
  clock: ring(12, 12, 9, <path d="M12 7.5V12l3 2" />),
  x: { line: <path d="m6.5 6.5 11 11m0-11-11 11" /> },
  check: { line: <path d="m5 12.5 4.2 4.2L19 7" /> },
  swap: { line: <path d="M4 8h14m-3.5-3.5L18 8l-3.5 3.5M20 16H6m3.5-3.5L6 16l3.5 3.5" /> },
  calendar: box(3.5, 5, 17, 15.5, 3, <path d="M3.5 10h17M8 3v4M16 3v4" />),
  sort: { line: <path d="M7 4v16m-3.5-3.5L7 20l3.5-3.5M17 20V4m-3.5 3.5L17 4l3.5 3.5" /> },
  info: ring(12, 12, 9, <path d="M12 11v5.5M12 7.6v.1" />),
  lock: box(5, 10.5, 14, 10, 2.5, <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5V17" />),
  route: { body: <><circle cx="6" cy="18" r="2.4" /><circle cx="18" cy="6" r="2.4" /></>,
    line: <><circle cx="6" cy="18" r="2.4" /><circle cx="18" cy="6" r="2.4" /><path d="M8.4 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.6" /></> },
  download: { line: <path d="M12 4v11m-4.5-4.5L12 15l4.5-4.5M4.5 16.5v2a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2" /> },
  coin: ring(12, 12, 9, <path d="M8.5 8h7M8.5 10.7h7M12 10.7v5.8" />),
  map: both("M3.5 5.5 9 3.5l6 2 5.5-2v15l-5.5 2-6-2-5.5 2Z", <path d="M9 3.5v15M15 5.5v15" />),
  sun: ring(12, 12, 4, <path d="M12 2.5v2.2m0 14.6v2.2M4.6 4.6l1.6 1.6m11.6 11.6 1.6 1.6M2.5 12h2.2m14.6 0h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" />),
  moon: both("M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"),
  auto: { body: <path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" />, line: <circle cx="12" cy="12" r="8.5" /> },
  home: both("M5 10.5 12 4.5l7 6V20H5Z", <path d="M3 12l9-7.7 9 7.7M10 20v-5h4v5" />),
  suitcase: box(3.5, 7, 17, 13, 2.5, <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M8 7v13M16 7v13" />),
  arrow: { line: <path d="M5 12h14m-5.5-5.5L19 12l-5.5 5.5" /> },
  back: { line: <path d="M19 12H5m5.5 5.5L5 12l5.5-5.5" /> },
  eye: both("M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z", <circle cx="12" cy="12" r="3" />),
  eyeOff: { line: <path d="M3 3l18 18M10.6 6.1A9.6 9.6 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-2.6 3.4M6.2 7.6C3.9 9.3 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1M9.9 9.9a3 3 0 0 0 4.2 4.2" /> },
  share: { body: <><circle cx="18" cy="5.5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="18.5" r="2.5" /></>,
    line: <><circle cx="18" cy="5.5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="18.5" r="2.5" /><path d="m8.2 10.8 7.6-4.1m-7.6 6.5 7.6 4.1" /></> },
  flag: both("M5.5 4.5h11l-2 4 2 4h-11Z", <path d="M5.5 21V4.5" />),
  plus: { line: <path d="M12 5v14M5 12h14" /> },
  up: { line: <path d="m6.5 14.5 5.5-5.5 5.5 5.5" /> },
  down: { line: <path d="m6.5 9.5 5.5 5.5 5.5-5.5" /> },
  trash: both("M6.5 7h11l-1 13h-9Z", <path d="M4 7h16M9.5 7V4.5h5V7M10 11v5.5M14 11v5.5" />),
  camera: box(3, 7, 18, 13, 3, <><path d="M8.5 7 10 4.5h4L15.5 7" /><circle cx="12" cy="13.5" r="3.5" /></>),
  external: { line: <path d="M14 4h6v6m0-6-9 9m7 1v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" /> },
  directions: both("M3.5 11 20.5 3.5 13 20.5l-1.8-7.7Z"),
  keyboard: box(2.5, 6, 19, 12, 2.5, <path d="M6 10h.01M9 10h.01M12 10h.01M15 10h.01M18 10h.01M7.5 14h9" />),
} satisfies Record<string, Shape>;

export type IconName = keyof typeof shapes;

export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  const shape: Shape = shapes[name];
  return <svg className={"icon" + (className ? " " + className : "")} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    {shape.body && <g className="icon-body">{shape.body}</g>}
    <g className="icon-line" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{shape.line}</g>
  </svg>;
}

/** An icon set in a small glass tile, tinted by `tone` (a category, or "ink" for neutral). */
export function GlassIcon({ name, tone = "ink", size = 22 }: { name: IconName; tone?: string; size?: number }) {
  return <span className={"glass-icon tone-" + tone} aria-hidden="true"><Icon name={name} size={size} /></span>;
}
