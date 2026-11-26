/**
 * Geometry and drawing for the Route Globe: unit vectors on a sphere, the view rotation, great-circle
 * interpolation, and a dotted land layer drawn on a 2D canvas.
 *
 * Conventions: a point is [x, y, z] on the unit sphere with x to the east at longitude 90°, y to the
 * north pole and z towards longitude 0. A view is (yaw, tilt): the longitude and latitude, in radians,
 * that face the viewer. After rotate(), x points right, y up and z towards the viewer (z > 0 is the
 * near side).
 */

export type Vec3 = [number, number, number];

export type GlobeView = {
  cx: number;
  cy: number;
  r: number;
  yaw: number;
  tilt: number;
  /** Size of the drawing area in CSS px, so dots outside it are skipped. */
  w?: number;
  h?: number;
};

const RAD = Math.PI / 180;

/** A longitude and latitude in degrees as a unit vector. */
export function toVec(lon: number, lat: number): Vec3 {
  const la = lat * RAD;
  const lo = lon * RAD;
  const c = Math.cos(la);
  return [c * Math.sin(lo), Math.sin(la), c * Math.cos(lo)];
}

/** Turns a point into view space: yaw brings that longitude to the front, tilt that latitude. */
export function rotate(v: Vec3, yaw: number, tilt: number): Vec3 {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  const x = v[0] * cy - v[2] * sy;
  const z1 = v[0] * sy + v[2] * cy;
  return [x, v[1] * ct - z1 * st, v[1] * st + z1 * ct];
}

/** The point a fraction u of the way along the great circle from a to b. */
export function slerp(a: Vec3, b: Vec3, u: number): Vec3 {
  const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const omega = Math.acos(dot);
  const s = Math.sin(omega);
  if (s < 1e-6) {
    // The same place (or exact antipodes): a straight blend, pushed back onto the sphere.
    const x = a[0] + (b[0] - a[0]) * u;
    const y = a[1] + (b[1] - a[1]) * u;
    const z = a[2] + (b[2] - a[2]) * u;
    const l = Math.hypot(x, y, z) || 1;
    return [x / l, y / l, z / l];
  }
  const ka = Math.sin((1 - u) * omega) / s;
  const kb = Math.sin(u * omega) / s;
  return [a[0] * ka + b[0] * kb, a[1] * ka + b[1] * kb, a[2] * ka + b[2] * kb];
}

/**
 * Where the land is: an equirectangular 256 × 128 bitmap, one bit per cell, 1 = land, rows from the
 * north pole down, columns from 180° W eastwards. Taken from the world map that ships with cobe
 * (MIT), the globe library this site used before.
 */
const MASK_W = 256;
const MASK_H = 128;
const MASK =
  "////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////Dj///////6n////////////////////////////////8AAACAAAAgP8AP////////////////////////////8AAAP/gAAAAAAA+gf//////////////////////////wAAAfQAAAAAAAADg////////////////////g//////AAAAQAAAAGYAAAf8H//////////////////4AJ////8AAAAAAAAD4AAP//4AAfn/////////x/////4AB////wAAAAAAAAcAAL///gKAef////////+H/////8zD///+AAAAAAAAHAHH/////8A/AAO//P/+AAM//////+H///wAAAAAIAAcA//////////uAA/gP//z/5//////4f//+AAAAB/8AAB73//////////9/+D////////////w///gAAAAf//mf//f////////////+H////////////D//gAAAAD///f////////////////5////////////4P/4A/AAA/3+P////////////////CAf///////+8T/Af8AD8AAH+f/////////////////4AP////////ghTwA/gAAAAB/n//////////////////wA////////8APwAB8AAAAAP+f///////////////z/gAB/sX/////gA/mAAwAAAAA/4///////////////8OAAABeAD/////AD/8AAAAAAMBPB/////////////+ABwAAABkAH/////gH/wAAAAAAwDcf/////////////gAfAAAAQAAH/////wf/gAAAAADgPB/////////////4AB4AAAAAAAH/////3//wAAAAB3A///////////////8AHAAAAAAAAP/////P//gAAAAHeP///////////////8AYAAAAAAAAf///////8AAAAAB7////////////////wBAAAAAAAAA///////+YAAAAABf///////////////9gAAAAAAAAAB////v//DwAAAAAf/////5//////////0AAAAAAAAAAD///+P/8HAAAAAA/////+B/////////+QAAAAAAAAAAP////v/+AAAAAAB///9nwHf////////wAAAAAAAAAAB////2/9gAAAAAAH/v/ifj9////////+OAAAAAAAAAAH//////AAAAAAAP8nP8AfH/////////w4AAAAAAAAAAf/////8AAAAAAB/wnP3x+P////////4AAAAAAAAAAAA//////AAAAAAAH+CG7//4/////////AYAAAAAAAAAAD/////4AAAAAAAfwARn//j///////wYBgAAAAAAAAAAH/////AAAAAAAA+AmGf//P///////4wMAAAAAAAAAAAP////8AAAAAAAAj/AAF//////////DHwAAAAAAAAAAA/////gAAAAAAAH/8AAH/////////4J8AAAAAAAAAAAA////8AAAAAAAA//8GAf/////////wOAAAAAAAAAAAAB////AAAAAAAAH//8/L//////////gQAAAAAAAAAAAAG//+8AAAAAAAAf//////////////+AAAAAAAAAAAAAAP/8AYAAAAAAAD//////+////////4AAAAAAAAAAAAAAX/gBgAAAAAAA/////9/5////////AAAAAAAAAAAAAAAv+ACAAAAAAAD/////7/wf//////4AAAAAAAAAAAAAADf4AAAAAAAAAf/////v/uB//////IAAAAAAAAAAAAAAE/gBgAAAAAAD//////f/8B/////5gAAAAAAAAAAAAAAB+ADwAAAAAAP/////8//wH//f/+AAAAAAAAAAAAAAAAH4MBgAAAAAA//////7//AH/w/8gAAAAAAAAAAAAAAAAfxwA4AAAAAD//////n/4AP+B/mAAAAAAAAAAAAAAAAAf+ABAAAAAAP//////P/AA/gH/AGAAAAAAAAAAAAAAAAP4AAAAAAAA//////8/wAD8AX+AYAAAAAAAAAAAAAAAAD+AAAAAAAD//////78AAPgAf8BgAAAAAAAAAAAAAAAAD4AAAAAAAP///////AAAeAA/wDAAAAAAAAAAAAAAAAADgAAAAAAA///////gAAB4ACfADAAAAAAAAAAAAAAAAAGD+wAAAAB///////+AADgAI4AQAAAAAAAAAAAAAAAAAP//gAAAAD///////wAANAAhABQAAAAAAAAAAAAAAAAAb//AAAAAH///////AAAMADAAHAAAAAAAAAAAAAAAAAAH//AAAAAP//////4AAAwAGAMMAAAAAAAAAAAAAAAAAAf//gAAAAOw/////gAAAADcB4AAAAAAAAAAAAAAAAAAB///AAAAAAAf///8AAAAAOwPAAAAAAAAAAAAAAAAAAAP//8AAAAAAB////gAAAAAfB8AAAAAAAAAAAAAAAAAAB///4AAAAAAP///4AAAAAA8fzoAAAAAAAAAAAAAAAAAP///4AAAAAA//+/AAAAAABx/MGAAAAAAAAAAAAAAAAA////4AAAAAD//78AAAAAADz7gNgAAAAAAAAAAAAAAAB////+AAAAAH///gAAAAAAPHuO/4AAAAAAAAAAAAAAAP////8AAAAAP//8AAAAAAAYAcA/wAAAAAAAAAAAAAAAf////4AAAAAf//wAAAAAAAcAAA/sAAAAAAAAAAAAAAB/////gAAAAB///AAAAAAAA+AAD+AAAAAAAAAAAAAAAD////+AAAAAH//8AAAAAAAAADADMAAAAAAAAAAAAAAAP////wAAAAAP//4AAAAAAAAAAAAYAAAAAAAAAAAAAAAf///+AAAAAA///gAAAAAAAAAA4QAAAAAAAAAAAAAAAA////4AAAAAH//+DAAAAAAAAAPjAAAAAAAAAAAAAAAAD////gAAAAA///4cAAAAAAAAH+GAAAAAAAAAAAAAAAAH///8AAAAAD///jwAAAAAAAA/88AAAAAAAAAAAAAAAAH///wAAAAAP//4fAAAAAAAAH//wAAAgAAAAAAAAAAAAP///AAAAAAf//B4AAAAAAAA///gAAAAAAAAAAAAAAAA///4AAAAAB//4HgAAAAAAAf///AAAAAAAAAAAAAAAAD///gAAAAAD//gcAAAAAAAD///+AEAAAAAAAAAAAAAAP//8AAAAAAP//BwAAAAAAAf///8AAAAAAAAAAAAAAAA//+AAAAAAA//4HAAAAAAAB////wAAAAAAAAAAAAAAAH//wAAAAAAD//AAAAAAAAAH////gAAAAAAAAAAAAAAAf//AAAAAAAH/4AAAAAAAAAf///+AAAAAAAAAAAAAAAB//4AAAAAAAf/gAAAAAAAAB////4AAAAAAAAAAAAAAAH//AAAAAAAA/8AAAAAAAAAD////gAAAAAAAAAAAAAAAf/4AAAAAAAB/gAAAAAAAAAP///+AAAAAAAAAAAAAAAB//gAAAAAAAH8AAAAAAAAAA/gf/wAAAAAAAAAAAAAAAP/8AAAAAAAAdAAAAAAAAAADgAv/AAAAAAAAAAAAAAAA//AAAAAAAAAAAAAAAAAAAAAAAf4AAQAAAAAAAAAAAAD/8AAAAAAAAAAAAAAAAAAAAAAB/gAAgAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAB4AADgAAAAAAAAAAAB/wAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAH+AAAAAAAAAAAAAAAAAAAAAAAAHAADAAAAAAAAAAAAAfwAAAAAAAAAAAAAAAAAAAAAAAAYAAcAAAAAAAAAAAAA/AAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAHwAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAfgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwAAAAAAAAAAAAAAAAAHwAAAAAAAAAAAAAAAAAAAAAA8AAAAAAAAAAAAAAAAAg/gGB8AAAAAAAAAAAAAAAAAAfgAAAAAAAAAAAAfwAD///////8AAAAAAAAAAAAAAAAB/AAAAAAAAAAAA///8f////////4AAAAAAAAAAAAAAD/4AAAAAAAAPAf///////////////AAAAAAAAAAAAAAP/gAAAAA/////////////////////8AAAAAAAAAD/4D//AAAAA//////////////////////8AAAAABv/3P////4AAAAP//////////////////////wAAAA//////////4AAAH//////////////////////wAAAB///////////+AAH//////////////////////+AMA//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////w==";

let maskBits: Uint8Array | null = null;
function mask() {
  if (maskBits) return maskBits;
  const text = atob(MASK);
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
  return (maskBits = bytes);
}

/**
 * Whether a longitude and latitude in degrees is on land. The bitmap counts the Arctic sea ice as land: above 79° N only
 * Greenland and Ellesmere Island are kept, and the ice off Alaska and Siberia (north of 71° N there) is left out.
 */
export function isLand(lon: number, lat: number) {
  if (lat > 79 && !(lon > -95 && lon < -15 && lat < 84)) return false;
  if (lat > 71 && (lon < -128 || lon > 108)) return false;
  const x = Math.min(MASK_W - 1, Math.max(0, Math.floor(((lon + 180) / 360) * MASK_W)));
  const y = Math.min(MASK_H - 1, Math.max(0, Math.floor(((90 - lat) / 180) * MASK_H)));
  return ((mask()[y * (MASK_W >> 3) + (x >> 3)] >> (7 - (x & 7))) & 1) === 1;
}

const dotCache = new Map<number, Float32Array>();

/**
 * Evenly spread points over the whole sphere (a Fibonacci lattice of `count`), keeping those on land,
 * packed as x, y, z triples. Cached per count.
 */
export function landDots(count: number): Float32Array {
  const cached = dotCache.get(count);
  if (cached) return cached;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const y = 1 - (2 * (i + 0.5)) / count;
    const ring = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const x = Math.cos(theta) * ring;
    const z = Math.sin(theta) * ring;
    const lat = Math.asin(y) / RAD;
    const lon = Math.atan2(x, z) / RAD;
    if (isLand(lon, lat)) out.push(x, y, z);
  }
  const dots = new Float32Array(out);
  dotCache.set(count, dots);
  return dots;
}

const BANDS = 6;
let bands: Float32Array[] = [];
let bandSize = 0;

/**
 * Draws the globe: a soft glow round the rim, a faint body, and the land as dots that fade towards
 * the edge. Only the near side is drawn; the far side would only add noise behind the routes.
 */
export function drawGlobe(
  ctx: CanvasRenderingContext2D,
  dots: Float32Array,
  view: GlobeView,
  land: string,
  dotSize: number,
  glow: string,
) {
  const { cx, cy, r, yaw, tilt } = view;
  const w = view.w ?? Infinity;
  const h = view.h ?? Infinity;

  // Glow round the rim and a faint body, lit from the upper left.
  ctx.globalAlpha = 1;
  const halo = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.22);
  halo.addColorStop(0, glow);
  halo.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.22, 0, Math.PI * 2);
  ctx.fill();
  const body = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.05, cx, cy, r);
  body.addColorStop(0, glow);
  body.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Sort the near-side dots into a few brightness bands, then fill each band in one path.
  const n = dots.length / 3;
  if (bandSize < n) {
    bandSize = n;
    bands = Array.from({ length: BANDS }, () => new Float32Array(n * 2));
  }
  const fill = new Array<number>(BANDS).fill(0);
  const cyaw = Math.cos(yaw);
  const syaw = Math.sin(yaw);
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  const pad = dotSize * 2;
  for (let i = 0; i < n; i++) {
    const vx = dots[i * 3];
    const vy = dots[i * 3 + 1];
    const vz = dots[i * 3 + 2];
    const z1 = vx * syaw + vz * cyaw;
    const z = vy * st + z1 * ct;
    if (z <= 0.02) continue;
    const sx = cx + (vx * cyaw - vz * syaw) * r;
    const sy = cy - (vy * ct - z1 * st) * r;
    if (sx < -pad || sy < -pad || sx > w + pad || sy > h + pad) continue;
    const b = Math.min(BANDS - 1, Math.floor(Math.sqrt(z) * BANDS));
    const k = fill[b]++ * 2;
    bands[b][k] = sx;
    bands[b][k + 1] = sy;
  }
  ctx.fillStyle = land;
  const radius = dotSize / 2;
  for (let b = 0; b < BANDS; b++) {
    const count = fill[b];
    if (!count) continue;
    const band = bands[b];
    const depth = (b + 0.5) / BANDS;
    ctx.globalAlpha = 0.12 + 0.78 * depth;
    const size = radius * (0.7 + 0.3 * depth);
    ctx.beginPath();
    for (let k = 0; k < count * 2; k += 2) {
      ctx.moveTo(band[k] + size, band[k + 1]);
      ctx.arc(band[k], band[k + 1], size, 0, Math.PI * 2);
    }
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** A unit vector back to longitude and latitude in degrees. */
export function toLonLat(v: Vec3) {
  return { lon: Math.atan2(v[0], v[2]) / RAD, lat: Math.asin(Math.max(-1, Math.min(1, v[1]))) / RAD };
}
