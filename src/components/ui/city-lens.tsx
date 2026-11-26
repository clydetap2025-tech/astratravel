import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { MAP_POINTS } from "../../../data/map-points.js";
import { districts as districtPoints } from "../../../data/districts.js";

/**
 * City Lens: AstraTravel's take on the GoRide hero. A paper map of central Almaty on its real street
 * grid (Abay, Dostyk, Tole Bi, Al-Farabi…) with yellow taxis cruising the blocks. A phone floats over
 * it and works as a lens: its screen shows the street under it, larger, in the app's colours, with
 * the same cars. Drag the phone to move the pickup, tap a place to set the drop-off, then press and
 * hold to book: the nearest taxi drives to the pickup, then to the place. Every value is demo data.
 *
 * Built without Motion or lucide (the project has neither); one requestAnimationFrame loop writes
 * every moving transform directly, so React renders only when the booking state changes.
 */

export type LensPlace = { id: string; label: string; number?: number; icon: ReactNode };

export type CityLensLabels = {
  pickup: string; tapDropoff: string; rideTo: (name: string) => string; chooseRide: string;
  rides: [string, string, string]; nearby: (count: number) => string; minutes: (count: number) => string;
  tripMinutes: (count: number) => string; hold: string; holdHint: string; finding: string; coming: string;
  here: string; onTrip: string; dropped: string; rate: string; thanks: string; cancel: string;
  districts: Record<District, string>; avenues: Record<Avenue, string>; mountains: string; demo: string;
  money: (value: number) => string;
};

type District = "almaly" | "medeu" | "bostandyk" | "zhetysu" | "auezov";
type Avenue = "raiymbek" | "zhibek" | "toleBi" | "abay" | "satpayev" | "alFarabi" | "seifullin" | "abylai" | "nazarbayev" | "dostyk";
type Node = { i: number; j: number };
type Point = { x: number; y: number };
type Status = "idle" | "finding" | "coming" | "arrived" | "trip" | "dropped";
type Car = { from: Node; to: Node; t: number; heading: number; queue: Node[] };

// The drawing space; the stage covers its box with it.
const W = 1200;
const H = 720;
const BLOCK = 60;
const ZOOM = 1.7;
const PIN_Y = 0.4;
const CAR_COUNT = 11;
const CRUISE = 0.9; // blocks per second
const DISPATCH = 2.6;
const FARE = { base: 700, perBlock: 160, ride: [1, 1.4, 1.8] };
const HOLD_SECONDS = 0.7;

export { MAP_POINTS };

const AVENUES: { key: Avenue; axis: "x" | "y"; at: number; walk?: boolean }[] = [
  { key: "raiymbek", axis: "y", at: 120 }, { key: "zhibek", axis: "y", at: 180, walk: true }, { key: "toleBi", axis: "y", at: 300 },
  { key: "abay", axis: "y", at: 360 }, { key: "satpayev", axis: "y", at: 420 }, { key: "alFarabi", axis: "y", at: 540 },
  { key: "seifullin", axis: "x", at: 420 }, { key: "abylai", axis: "x", at: 540 }, { key: "nazarbayev", axis: "x", at: 660 },
  { key: "dostyk", axis: "x", at: 780 },
];

/** District centres, shared with the welcome flow so a local's pickup starts in their own district. */
const DISTRICTS = districtPoints.map(({ key, x, y }) => ({ key: key as District, x, y }));

const PARKS = [
  { x: 720, y: 200, w: 60, h: 60 }, { x: 900, y: 300, w: 120, h: 60 }, { x: 540, y: 420, w: 120, h: 60 }, { x: 300, y: 180, w: 60, h: 60 },
];

const toPoint = (node: Node): Point => ({ x: node.i * BLOCK, y: node.j * BLOCK });
const nearestNode = (point: Point): Node => ({ i: Math.round(point.x / BLOCK), j: Math.round(point.y / BLOCK) });
const same = (a: Node, b: Node) => a.i === b.i && a.j === b.j;
const MAX_I = W / BLOCK;
const MAX_J = 600 / BLOCK; // the foothills below Al-Farabi have no streets
const inside = (node: Node) => node.i >= 1 && node.i <= MAX_I - 1 && node.j >= 1 && node.j <= MAX_J;
const STEPS: Node[] = [{ i: 1, j: 0 }, { i: -1, j: 0 }, { i: 0, j: 1 }, { i: 0, j: -1 }];

function walk(a: Node, b: Node) {
  const steps: Node[] = [];
  const cursor = { ...a };
  while (cursor.i !== b.i) { cursor.i += Math.sign(b.i - cursor.i); steps.push({ ...cursor }); }
  while (cursor.j !== b.j) { cursor.j += Math.sign(b.j - cursor.j); steps.push({ ...cursor }); }
  return steps;
}

const tone = (i: number, j: number) => { const n = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return n - Math.floor(n); };

/** The street plan, drawn twice: on paper for the page, and in app colours inside the phone. */
function CityPlan({ variant, labels }: { variant: "paper" | "app"; labels: CityLensLabels }) {
  const app = variant === "app";
  const blocks: ReactNode[] = [];
  for (let i = 0; i < MAX_I; i++) {
    for (let j = 0; j < MAX_J; j++) {
      const shade = tone(i, j);
      if (!app && shade < 0.22) continue;
      blocks.push(<rect key={i + ":" + j} x={i * BLOCK + 5} y={j * BLOCK + 5} width={BLOCK - 10} height={BLOCK - 10} rx="3"
        className={app ? "cl-app-block" : "cl-paper-block"} fillOpacity={app ? 1 : 0.35 + shade * 0.6} />);
    }
  }
  return <svg className="cl-plan" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
    <rect width={W} height={H} className={app ? "cl-app-ground" : "cl-paper-ground"} />
    {blocks}
    {PARKS.map((park) => <rect key={park.x + ":" + park.y} x={park.x + 5} y={park.y + 5} width={park.w - 10} height={park.h - 10} rx="5"
      className={app ? "cl-app-park" : "cl-paper-park"} />)}
    <path className={app ? "cl-app-water" : "cl-paper-water"} strokeWidth="16" fill="none" strokeLinecap="round"
      d="M330 0 C300 140 360 230 320 340 C290 430 340 520 300 720" />
    <path className={app ? "cl-app-water" : "cl-paper-water"} strokeWidth="14" fill="none" strokeLinecap="round"
      d="M1060 720 C1010 600 1000 520 960 430 C920 330 880 200 900 0" />
    {/* Kok Tobe hill and the foothills of the Ile Alatau */}
    <ellipse cx="935" cy="470" rx="80" ry="52" className={app ? "cl-app-park" : "cl-paper-hill"} />
    <path className={app ? "cl-app-hills" : "cl-paper-hills"} d={`M0 ${H} V640 L90 610 L190 650 L300 600 L420 645 L540 598 L660 640 L780 596 L900 642 L1020 604 L1120 640 L${W} 612 V${H}Z`} />
    <g className={app ? "cl-app-street" : "cl-paper-street"}>
      {Array.from({ length: MAX_I + 1 }, (_, i) => <path key={"v" + i} d={`M${i * BLOCK} 0 V${MAX_J * BLOCK + 20}`} />)}
      {Array.from({ length: MAX_J + 1 }, (_, j) => <path key={"h" + j} d={`M0 ${j * BLOCK} H${W}`} />)}
    </g>
    <g className={app ? "cl-app-avenue" : "cl-paper-avenue"}>
      {AVENUES.map((avenue) => <path key={avenue.key} strokeDasharray={avenue.walk && !app ? "2 10" : undefined}
        d={avenue.axis === "x" ? `M${avenue.at} 0 V${MAX_J * BLOCK + 20}` : `M0 ${avenue.at} H${W}`} />)}
    </g>
    {!app && <g className="cl-paper-label">
      {AVENUES.map((avenue, index) => avenue.axis === "y"
        ? <text key={avenue.key} x={index % 2 ? 150 : 1040} y={avenue.at - 7}>{labels.avenues[avenue.key].toUpperCase()}</text>
        : <text key={avenue.key} x={avenue.at - 7} y={index % 2 ? 470 : 90} transform={`rotate(-90 ${avenue.at - 7} ${index % 2 ? 470 : 90})`}>{labels.avenues[avenue.key].toUpperCase()}</text>)}
      <text x="600" y="690" textAnchor="middle" className="cl-paper-mountains">{labels.mountains.toUpperCase()}</text>
    </g>}
    {app && <g className="cl-app-label">
      {DISTRICTS.map((district) => <text key={district.key} x={district.x} y={district.y} textAnchor="middle">{labels.districts[district.key].toUpperCase()}</text>)}
    </g>}
  </svg>;
}

function Taxi({ big = false }: { big?: boolean }) {
  return <svg className={"cl-taxi" + (big ? " cl-taxi-big" : "")} viewBox="0 0 44 24" aria-hidden="true">
    <rect x="1" y="2" width="42" height="20" rx="8" fill="#ffffff" stroke="#0a0a0a" strokeWidth="2" />
    <path d="M28 5.5h4.5c2.6 0 4.5 2.9 4.5 6.5s-1.9 6.5-4.5 6.5H28c.9-2 1.4-4.2 1.4-6.5S28.9 7.5 28 5.5Z" fill="#0a0a0a" />
    <path d="M9.5 6h3.2c-.8 1.8-1.2 3.8-1.2 6s.4 4.2 1.2 6H9.5C8 16.6 7.2 14.4 7.2 12S8 7.4 9.5 6Z" fill="#0a0a0a" fillOpacity=".85" />
    <rect x="15" y="9" width="10" height="6" rx="1.5" fill="#0a0a0a" />
  </svg>;
}

function routeD(points: Point[]) {
  return points.length < 2 ? "" : "M" + points.map((point) => point.x.toFixed(1) + " " + point.y.toFixed(1)).join(" L");
}

export function CityLens({ places, labels, highlight = [], start }: { places: LensPlace[]; labels: CityLensLabels; highlight?: string[]; start?: Point }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const lensMapRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const paperCars = useRef<(HTMLDivElement | null)[]>([]);
  const lensCars = useRef<(HTMLDivElement | null)[]>([]);
  const paperRoute = useRef<SVGPathElement>(null);
  const lensRoute = useRef<SVGPathElement>(null);
  const paperPreview = useRef<SVGPathElement>(null);
  const lensPreview = useRef<SVGPathElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);

  const [box, setBox] = useState({ w: 0, h: 0 });
  const [pickup, setPickup] = useState<Point>(() => start ? { x: start.x, y: Math.min(start.y, MAX_J * BLOCK) } : { x: 250, y: 330 });
  const [dropoff, setDropoff] = useState<string | null>(null);
  const [ride, setRide] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [rating, setRating] = useState(0);
  const [readings, setReadings] = useState({ eta: 1, nearby: 0, left: 0 });

  const scale = box.w ? Math.max(box.w / W, box.h / H) : 1;
  const offset = { x: (box.w - W * scale) / 2, y: (box.h - H * scale) / 2 };
  const pickupNode = nearestNode(pickup);
  const target = dropoff ? MAP_POINTS[dropoff] : null;
  const targetNode = target ? nearestNode(target) : null;
  const blocks = targetNode ? Math.abs(targetNode.i - pickupNode.i) + Math.abs(targetNode.j - pickupNode.j) : 0;
  const fare = (index: number) => Math.round((FARE.base + blocks * FARE.perBlock) * FARE.ride[index] / 10) * 10;
  const district = DISTRICTS.reduce((best, item) => Math.hypot(item.x - pickup.x, item.y - pickup.y) < Math.hypot(best.x - pickup.x, best.y - pickup.y) ? item : best).key;
  const dropName = places.find((place) => place.id === dropoff)?.label ?? "";

  // Everything the frame loop needs, kept outside React state.
  const live = useRef({
    cars: [] as Car[], assigned: -1, goal: null as Node | null, arrived: false, status: "idle" as Status,
    pickup: pickupNode, pickupRaw: pickup, target: targetNode, ride: 0, reduced: false, onScreen: true, scale, offset, lensW: 0, lensH: 0,
  });
  live.current.pickup = pickupNode;
  live.current.pickupRaw = pickup;
  live.current.target = targetNode;
  live.current.ride = ride;
  live.current.status = status;
  live.current.scale = scale;
  live.current.offset = offset;

  if (!live.current.cars.length) {
    const cars: Car[] = [];
    for (let k = 0; k < CAR_COUNT; k++) {
      const from = { i: 1 + ((k * 7) % (MAX_I - 2)), j: 1 + ((k * 5) % (MAX_J - 1)) };
      const to = { i: from.i + (k % 2 ? 1 : 0), j: from.j + (k % 2 ? 0 : 1) };
      cars.push({ from, to, t: (k * 0.37) % 1, heading: k % 2 ? 0 : Math.PI / 2, queue: [] });
    }
    live.current.cars = cars;
  }

  useLayoutEffect(() => {
    const stage = mapRef.current;
    const screen = screenRef.current;
    if (!stage) return;
    const measure = () => {
      setBox({ w: stage.clientWidth, h: stage.clientHeight });
      if (screen) { live.current.lensW = screen.clientWidth; live.current.lensH = screen.clientHeight; }
    };
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    if (screen) observer.observe(screen);
    measure();
    return () => observer.disconnect();
  }, []);

  // The booking timeline: search, drive to pickup, wait, drive to the place, then reset.
  useEffect(() => {
    const s = live.current;
    let timer = 0;
    if (status === "finding") timer = window.setTimeout(() => {
      let best = -1;
      let bestBlocks = Infinity;
      s.cars.forEach((car, index) => {
        const distance = Math.abs(car.to.i - s.pickup.i) + Math.abs(car.to.j - s.pickup.j) + 1 - car.t;
        if (distance < bestBlocks) { bestBlocks = distance; best = index; }
      });
      s.assigned = best;
      const car = s.cars[best];
      car.queue = walk(car.to, s.pickup);
      s.goal = s.pickup;
      s.arrived = false;
      setStatus("coming");
    }, 1200);
    if (status === "arrived") timer = window.setTimeout(() => {
      const car = s.cars[s.assigned];
      if (car && s.target) {
        car.queue = walk(car.from, s.target);
        car.to = car.queue.shift() ?? { ...car.from };
        car.t = 0;
        s.goal = s.target;
        s.arrived = same(car.from, s.target);
      }
      setStatus("trip");
    }, 1800);
    if (status === "dropped") timer = window.setTimeout(() => reset(), 6000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function reset() {
    const s = live.current;
    if (s.assigned >= 0) s.cars[s.assigned].queue = [];
    s.assigned = -1;
    s.goal = null;
    s.arrived = false;
    setRating(0);
    setStatus("idle");
  }

  // The frame loop: drive the cars, then write every moving transform.
  useEffect(() => {
    const s = live.current;
    s.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let last = performance.now();
    let lastReading = 0;
    const toScreen = (point: Point) => ({ x: s.offset.x + point.x * s.scale, y: s.offset.y + point.y * s.scale });

    const roam = (car: Car): Node => {
      const back = { i: car.from.i - car.to.i, j: car.from.j - car.to.j };
      const options = STEPS.filter((step) => !(step.i === back.i && step.j === back.j))
        .map((step) => ({ i: car.to.i + step.i, j: car.to.j + step.j })).filter(inside);
      return options.length ? options[Math.floor(Math.random() * options.length)] : { ...car.from };
    };

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const moving = !s.reduced;
      s.cars.forEach((car, index) => {
        const assigned = index === s.assigned;
        if (assigned && s.arrived) return;
        if (!moving && !assigned) return;
        let move = (assigned ? DISPATCH : CRUISE) * (moving ? dt : 1000);
        while (move > 0) {
          const remaining = 1 - car.t;
          if (move < remaining) { car.t += move; move = 0; continue; }
          move -= remaining;
          car.from = car.to;
          car.t = 0;
          const next = car.queue.shift();
          if (next) car.to = next;
          else if (assigned) { car.to = { ...car.from }; s.arrived = true; move = 0; }
          else car.to = roam(car);
        }
        if (!same(car.from, car.to)) {
          const a = toPoint(car.from);
          const b = toPoint(car.to);
          const goal = Math.atan2(b.y - a.y, b.x - a.x);
          const turn = Math.atan2(Math.sin(goal - car.heading), Math.cos(goal - car.heading));
          car.heading += moving ? turn * Math.min(1, dt * 10) : turn;
        }
      });

      // Advance the booking when the assigned car arrives.
      if (s.assigned >= 0 && s.arrived) {
        if (s.status === "coming") { s.status = "arrived"; setStatus("arrived"); }
        else if (s.status === "trip") { s.status = "dropped"; setStatus("dropped"); }
      }

      const lensScale = s.scale * ZOOM;
      const pickupPoint = s.pickupRaw;
      const lensOrigin = { x: s.lensW / 2 - pickupPoint.x * lensScale, y: s.lensH * PIN_Y - pickupPoint.y * lensScale };
      if (lensMapRef.current) lensMapRef.current.style.transform = `translate3d(${lensOrigin.x.toFixed(1)}px, ${lensOrigin.y.toFixed(1)}px, 0) scale(${lensScale.toFixed(4)})`;

      s.cars.forEach((car, index) => {
        const a = toPoint(car.from);
        const b = toPoint(car.to);
        const point = { x: a.x + (b.x - a.x) * car.t, y: a.y + (b.y - a.y) * car.t };
        const paper = paperCars.current[index];
        const lens = lensCars.current[index];
        const rotate = `rotate(${car.heading.toFixed(3)}rad)`;
        if (paper) {
          const screen = toScreen(point);
          paper.style.transform = `translate3d(${screen.x.toFixed(1)}px, ${screen.y.toFixed(1)}px, 0) ${rotate}`;
          paper.dataset.assigned = String(index === s.assigned);
        }
        if (lens) lens.style.transform = `translate3d(${point.x.toFixed(1)}px, ${point.y.toFixed(1)}px, 0) ${rotate}`;
      });

      // The route still to drive, and the dotted preview before booking.
      let route: Point[] = [];
      if (s.assigned >= 0 && s.goal && !s.arrived) {
        const car = s.cars[s.assigned];
        const a = toPoint(car.from);
        const b = toPoint(car.to);
        route = [{ x: a.x + (b.x - a.x) * car.t, y: a.y + (b.y - a.y) * car.t }, ...[car.to, ...car.queue].map(toPoint)];
      }
      const preview = s.target && (s.status === "idle" || s.status === "finding" || s.status === "coming" || s.status === "arrived")
        ? [s.pickup, ...walk(s.pickup, s.target)].map(toPoint) : [];
      const routePath = routeD(route);
      const previewPath = routeD(preview);
      paperRoute.current?.setAttribute("d", routePath);
      lensRoute.current?.setAttribute("d", routePath);
      paperPreview.current?.setAttribute("d", previewPath);
      lensPreview.current?.setAttribute("d", previewPath);

      if (now - lastReading > 400) {
        lastReading = now;
        let eta = Infinity;
        let nearby = 0;
        s.cars.forEach((car) => {
          const distance = Math.abs(car.to.i - s.pickup.i) + Math.abs(car.to.j - s.pickup.j) + 1 - car.t;
          eta = Math.min(eta, distance);
          if (distance <= 6) nearby++;
        });
        let left = 0;
        if (s.assigned >= 0 && s.goal) {
          const car = s.cars[s.assigned];
          left = s.arrived ? 0 : Math.abs(car.to.i - s.goal.i) + Math.abs(car.to.j - s.goal.j) + 1 - car.t;
        }
        setReadings((previous) => {
          const next = { eta: Math.max(1, Math.round(eta * 0.5)), nearby, left: Math.max(1, Math.round(left * 0.5)) };
          return previous.eta === next.eta && previous.nearby === next.nearby && previous.left === next.left ? previous : next;
        });
      }
      frame = s.onScreen && !document.hidden ? requestAnimationFrame(step) : 0;
    };
    const wake = () => { if (!frame && s.onScreen && !document.hidden) { last = performance.now(); frame = requestAnimationFrame(step); } };
    const observer = new IntersectionObserver((entries) => { s.onScreen = entries[0]?.isIntersecting ?? true; wake(); });
    if (stageRef.current) observer.observe(stageRef.current);
    document.addEventListener("visibilitychange", wake);
    frame = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); document.removeEventListener("visibilitychange", wake); };
  }, []);

  // Dragging the phone moves the pickup; the sheet and its buttons keep their own clicks.
  // On wide screens the phone floats over the map and follows the finger; on phones it is docked
  // under the map, so dragging its screen pans the map the way a ride app does.
  const drag = useRef<{ id: number; x: number; y: number; start: Point; docked: boolean } | null>(null);
  function limits(docked: boolean) {
    const phone = phoneRef.current;
    let x = [BLOCK, W - BLOCK];
    let y = [BLOCK, MAX_J * BLOCK];
    if (phone && !docked && box.w) {
      const pinOffset = phone.offsetHeight * 0.02 + (phone.offsetHeight * 0.96) * PIN_Y;
      const toWorldX = (screen: number) => (screen - offset.x) / scale;
      const toWorldY = (screen: number) => (screen - offset.y) / scale;
      x = [Math.max(x[0], toWorldX(phone.offsetWidth / 2 + 8)), Math.min(x[1], toWorldX(box.w - phone.offsetWidth / 2 - 8))];
      y = [Math.max(y[0], toWorldY(pinOffset + 8)), Math.min(y[1], toWorldY(box.h - (phone.offsetHeight - pinOffset) - 8))];
    }
    return { x, y };
  }
  const clampPickup = (point: Point, docked: boolean) => {
    const { x, y } = limits(docked);
    return { x: Math.min(x[1], Math.max(x[0], point.x)), y: Math.min(y[1], Math.max(y[0], point.y)) };
  };
  function onPhoneDown(event: ReactPointerEvent<HTMLDivElement>) {
    if ((event.target as Element).closest(".cl-sheet") || status !== "idle") return;
    const docked = getComputedStyle(event.currentTarget).position !== "absolute";
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, start: pickup, docked };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function onPhoneMove(event: ReactPointerEvent<HTMLDivElement>) {
    const state = drag.current;
    if (!state || state.id !== event.pointerId) return;
    const sign = state.docked ? -1 / ZOOM : 1;
    setPickup(clampPickup({
      x: state.start.x + sign * (event.clientX - state.x) / scale,
      y: state.start.y + sign * (event.clientY - state.y) / scale,
    }, state.docked));
  }
  function onMapTap(event: ReactPointerEvent<HTMLDivElement>) {
    if (status !== "idle" || (event.target as Element).closest(".cl-place")) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const docked = phoneRef.current ? getComputedStyle(phoneRef.current).position !== "absolute" : false;
    setPickup(clampPickup({ x: (event.clientX - bounds.left - offset.x) / scale, y: (event.clientY - bounds.top - offset.y) / scale }, docked));
  }
  // Keep the floating phone inside the map when the stage resizes.
  useEffect(() => {
    if (!box.w || !phoneRef.current) return;
    const docked = getComputedStyle(phoneRef.current).position !== "absolute";
    setPickup((point) => {
      const next = clampPickup(point, docked);
      return next.x === point.x && next.y === point.y ? point : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box.w, box.h]);
  function onPhoneUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (drag.current?.id === event.pointerId) drag.current = null;
  }
  function onPhoneKey(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (status !== "idle") return;
    const moves: Record<string, Point> = { ArrowLeft: { x: -BLOCK, y: 0 }, ArrowRight: { x: BLOCK, y: 0 }, ArrowUp: { x: 0, y: -BLOCK }, ArrowDown: { x: 0, y: BLOCK } };
    const move = moves[event.key];
    if (!move || (event.target as Element).closest(".cl-sheet")) return;
    event.preventDefault();
    setPickup((point) => ({ x: Math.min(W - BLOCK, Math.max(BLOCK, point.x + move.x)), y: Math.min(MAX_J * BLOCK, Math.max(BLOCK, point.y + move.y)) }));
  }

  // Press and hold to book; letting go early rolls the fill back. Enter or Space books at once.
  const hold = useRef({ start: 0, frame: 0 });
  function setFill(value: number) { fillRef.current?.style.setProperty("--fill", String(value)); }
  function book() {
    if (!dropoff) return;
    setFill(0);
    setStatus("finding");
  }
  function holdStart(event: ReactPointerEvent<HTMLButtonElement>) {
    if (status !== "idle" || !dropoff || event.button !== 0) return;
    hold.current.start = performance.now();
    const tick = (now: number) => {
      const value = Math.min(1, (now - hold.current.start) / (HOLD_SECONDS * 1000));
      setFill(value);
      if (value >= 1) { hold.current.frame = 0; book(); return; }
      hold.current.frame = requestAnimationFrame(tick);
    };
    hold.current.frame = requestAnimationFrame(tick);
  }
  function holdStop() {
    if (!hold.current.frame) return;
    cancelAnimationFrame(hold.current.frame);
    hold.current.frame = 0;
    setFill(0);
  }

  const lensPhone = useMemo(() => <CityPlan variant="app" labels={labels} />, [labels]);
  const paperPlan = useMemo(() => <CityPlan variant="paper" labels={labels} />, [labels]);
  const pickupScreen = { x: offset.x + pickup.x * scale, y: offset.y + pickup.y * scale };
  const riding = status === "trip" || status === "dropped";
  const planning = status === "idle" || status === "finding";
  const pinChip = planning ? labels.minutes(readings.eta) : status === "arrived" ? "✓" : labels.minutes(readings.left);

  return <div className="cl-root">
    <div ref={stageRef} className="cl-stage">
      <div ref={mapRef} className="cl-map" onPointerUp={onMapTap}>
      <div className="cl-paper" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}>
        {paperPlan}
        <svg className="cl-routes" viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true">
          <path ref={paperPreview} className="cl-preview" />
          <path ref={paperRoute} className="cl-route" />
        </svg>
      </div>
      {Array.from({ length: CAR_COUNT }, (_, index) => <div key={index} className="cl-car" ref={(element) => { paperCars.current[index] = element; }}><Taxi /></div>)}
      {places.map((place) => {
        const point = MAP_POINTS[place.id];
        if (!point) return null;
        return <button key={place.id} type="button" className="cl-place" data-active={dropoff === place.id || undefined}
          data-plan={highlight.includes(place.id) || undefined} disabled={!planning}
          style={{ left: offset.x + point.x * scale, top: offset.y + point.y * scale }}
          aria-pressed={dropoff === place.id} aria-label={labels.rideTo(place.label)}
          onClick={() => setDropoff((current) => current === place.id ? null : place.id)}>
          <span className="cl-place-dot">{place.number ?? place.icon}</span>
          <span className="cl-place-label">{place.label}</span>
        </button>;
      })}
      <span className="cl-pickup" aria-hidden="true" style={{ left: pickupScreen.x, top: pickupScreen.y }} />
      </div>

      <div ref={phoneRef} className="cl-phone" tabIndex={0} aria-label={labels.pickup + ": " + labels.districts[district]}
        style={{ left: pickupScreen.x, top: pickupScreen.y }}
        onPointerDown={onPhoneDown} onPointerMove={onPhoneMove} onPointerUp={onPhoneUp} onPointerCancel={onPhoneUp} onKeyDown={onPhoneKey}>
        <div className="cl-bezel">
          <div ref={screenRef} className="cl-screen">
            <div ref={lensMapRef} className="cl-lens-map">
              {lensPhone}
              <svg className="cl-routes" viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true">
                <path ref={lensPreview} className="cl-preview cl-preview-lens" />
                <path ref={lensRoute} className="cl-route cl-route-lens" />
              </svg>
              {Array.from({ length: CAR_COUNT }, (_, index) => <div key={index} className="cl-lens-car" ref={(element) => { lensCars.current[index] = element; }}><Taxi big /></div>)}
            </div>
            {!riding && <div className="cl-pin" style={{ top: PIN_Y * 100 + "%" }}>
              <span className="cl-pin-chip">{pinChip}</span><span className="cl-pin-head" /><span className="cl-pin-stem" />
            </div>}
            <div className="cl-screen-top" aria-hidden="true" />
            <div className="cl-status-bar" aria-hidden="true"><span>9:41</span><span className="cl-island" /><span>5G</span></div>
            <div className="cl-search">
              <span className="cl-search-row"><span className="cl-dot cl-dot-pickup" aria-hidden="true" />
                <span><small>{labels.pickup}</small><strong key={district} className="cl-swap">{labels.districts[district]}</strong></span></span>
              <span className="cl-search-row"><span className="cl-dot cl-dot-drop" aria-hidden="true" />
                <span className={dropoff ? "cl-strong" : "cl-muted"}>{dropoff ? dropName : labels.tapDropoff}</span></span>
            </div>
            <div className="cl-sheet" aria-live="polite">
              <span className="cl-grip" aria-hidden="true" />
              {planning && <div className="cl-sheet-body" key="plan">
                <div className="cl-sheet-head"><strong>{dropoff ? labels.rideTo(dropName) : labels.chooseRide}</strong>
                  <small>{dropoff ? labels.tripMinutes(Math.max(2, Math.round(blocks * 0.6))) : ""}</small></div>
                <div className="cl-rides" role="radiogroup" aria-label={labels.chooseRide}>
                  {labels.rides.map((name, index) => <button key={name} type="button" role="radio" aria-checked={ride === index}
                    disabled={status === "finding"} onClick={() => setRide(index)}>
                    <span>{name}</span><small>{dropoff ? labels.money(fare(index)) : labels.minutes(readings.eta + index)}</small>
                  </button>)}
                </div>
                <button type="button" className="cl-hold" disabled={!dropoff || status === "finding"} aria-label={labels.hold + ". " + labels.holdHint}
                  onPointerDown={holdStart} onPointerUp={holdStop} onPointerLeave={holdStop} onPointerCancel={holdStop}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); book(); } }}>
                  <span ref={fillRef} className="cl-hold-inner">
                    <span className="cl-hold-fill" aria-hidden="true" />
                    <span className="cl-hold-label">{status === "finding" ? labels.finding : labels.hold}</span>
                    <span className="cl-hold-label cl-hold-label-dark" aria-hidden="true">{status === "finding" ? labels.finding : labels.hold}</span>
                  </span>
                </button>
              </div>}
              {(status === "coming" || status === "arrived" || status === "trip") && <div className="cl-sheet-body" key="ride">
                <div className="cl-sheet-head"><strong>{status === "coming" ? labels.coming : status === "arrived" ? labels.here : labels.onTrip}</strong>
                  <small>{status === "arrived" ? "" : labels.minutes(readings.left)}</small></div>
                <div className="cl-driver"><span className="cl-avatar" aria-hidden="true"><Taxi /></span>
                  <span><strong>{labels.coming}</strong><small>{labels.demo.split(".")[0]}</small></span></div>
                <button type="button" className="cl-cancel" onClick={reset}>{labels.cancel}</button>
              </div>}
              {status === "dropped" && <div className="cl-sheet-body" key="done">
                <div className="cl-sheet-head"><strong>{labels.dropped}</strong><small>{labels.money(fare(ride))}</small></div>
                <div className="cl-rate"><span>{rating ? labels.thanks : labels.rate}</span>
                  <span>{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={String(value)} aria-pressed={value <= rating}
                    onClick={() => setRating(value)}>★</button>)}</span></div>
              </div>}
            </div>
          </div>
        </div>
      </div>
    </div>
    <p className="cl-note">{labels.demo}</p>
  </div>;
}
