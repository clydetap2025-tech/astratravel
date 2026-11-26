/**
 * The hand-drawn Almaty panorama behind the first screen, in two layers like the Sketch City Hero
 * it replaces: pale Alatau ridges at the back, and the inked city in front (a yurt, Ascension
 * Cathedral, Hotel Kazakhstan, Esentai Tower, the Kok Tobe TV tower and its cable car, poplars and
 * the apple trees Almaty is named for). Both share one 1536 × 1024 drawing space so they line up.
 */

export const ART_W = 1536;
export const ART_H = 1024;
const GROUND = 930;

const INK = "var(--at-ink)";
const PAPER = "var(--at-paper)";

/** Back layer: the Alatau, flat washes with a soft ridge line and snow caps. */
export function AlmatySky() {
  return <svg viewBox={`0 0 ${ART_W} ${ART_H}`} preserveAspectRatio="xMaxYMax meet" aria-hidden="true" focusable="false">
    <path fill="var(--at-wash-far)" d="M0 640 L90 600 L180 520 L260 560 L360 430 L450 500 L560 380 L660 450 L760 330 L880 420 L990 300 L1100 380 L1210 270 L1320 350 L1430 290 L1536 330 V1024 H0Z" />
    <path fill="none" stroke="var(--at-ridge)" strokeWidth="2.4" strokeLinejoin="round" d="M0 640 L90 600 L180 520 L260 560 L360 430 L450 500 L560 380 L660 450 L760 330 L880 420 L990 300 L1100 380 L1210 270 L1320 350 L1430 290 L1536 330" />
    <g fill="var(--at-snow)">
      <path d="M560 380 L600 409 L584 404 L570 418 L556 402 L534 404Z" />
      <path d="M760 330 L800 360 L784 356 L770 372 L752 356 L733 351Z" />
      <path d="M990 300 L1030 330 L1012 326 L998 342 L982 324 L962 322Z" />
      <path d="M1210 270 L1250 299 L1232 295 L1218 312 L1202 294 L1182 293Z" />
      <path d="M1430 290 L1466 307 L1450 307 L1436 322 L1422 306 L1400 310Z" />
      <path d="M360 430 L392 458 L378 454 L364 468 L350 452 L333 454Z" />
    </g>
    <path fill="var(--at-wash-near)" d="M0 770 L140 708 L300 748 L470 650 L640 726 L820 628 L1000 696 L1180 610 L1360 676 L1536 624 V1024 H0Z" />
    <path fill="var(--at-wash-hill)" d="M1060 930 C1140 800 1230 720 1330 708 C1430 700 1500 760 1536 790 V1024 H1060Z" />
  </svg>;
}

function OnionDome({ x, y, size = 1, fill = "var(--at-accent-soft)" }: { x: number; y: number; size?: number; fill?: string }) {
  const s = size;
  return <g>
    <path fill={fill} stroke={INK} strokeWidth="3" strokeLinejoin="round"
      d={`M${x - 20 * s} ${y} C${x - 26 * s} ${y - 22 * s} ${x - 6 * s} ${y - 36 * s} ${x} ${y - 54 * s} C${x + 6 * s} ${y - 36 * s} ${x + 26 * s} ${y - 22 * s} ${x + 20 * s} ${y}Z`} />
    <path stroke={INK} strokeWidth="3" strokeLinecap="round" d={`M${x} ${y - 54 * s} V${y - 76 * s} M${x - 8 * s} ${y - 68 * s} H${x + 8 * s}`} />
  </g>;
}

function Poplar({ x, height, lean = 0 }: { x: number; height: number; lean?: number }) {
  return <g>
    <path stroke={INK} strokeWidth="3" strokeLinecap="round" d={`M${x} ${GROUND} V${GROUND - height * 0.28}`} />
    <path fill="var(--at-leaf)" stroke={INK} strokeWidth="3"
      d={`M${x} ${GROUND - height * 0.18} C${x - 30} ${GROUND - height * 0.4} ${x - 22 + lean} ${GROUND - height * 0.86} ${x + lean} ${GROUND - height} C${x + 22 + lean} ${GROUND - height * 0.86} ${x + 30} ${GROUND - height * 0.4} ${x} ${GROUND - height * 0.18}Z`} />
    <path stroke={INK} strokeWidth="2" strokeLinecap="round" opacity=".55"
      d={`M${x} ${GROUND - height * 0.3} L${x + lean * 0.6} ${GROUND - height * 0.82} M${x} ${GROUND - height * 0.5} l-12 -18 M${x} ${GROUND - height * 0.62} l12 -16`} />
  </g>;
}

function AppleTree({ x }: { x: number }) {
  const apples = [[-38, -150], [-6, -186], [30, -160], [52, -120], [-50, -108], [8, -126], [-22, -86]];
  return <g>
    <path fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" d={`M${x} ${GROUND} C${x - 4} ${GROUND - 40} ${x + 6} ${GROUND - 60} ${x} ${GROUND - 92} M${x} ${GROUND - 70} l26 -24 M${x} ${GROUND - 78} l-22 -20`} />
    <path fill="var(--at-leaf)" stroke={INK} strokeWidth="3"
      d={`M${x - 78} ${GROUND - 110} C${x - 96} ${GROUND - 168} ${x - 46} ${GROUND - 222} ${x} ${GROUND - 214} C${x + 52} ${GROUND - 226} ${x + 98} ${GROUND - 170} ${x + 80} ${GROUND - 112} C${x + 70} ${GROUND - 76} ${x - 66} ${GROUND - 72} ${x - 78} ${GROUND - 110}Z`} />
    {apples.map(([dx, dy]) => <circle key={dx + ":" + dy} cx={x + dx} cy={GROUND + dy} r="8.5" fill="var(--at-apple)" stroke={INK} strokeWidth="2" />)}
  </g>;
}

function Floors({ x, top, width, step = 28 }: { x: number; top: number; width: number; step?: number }) {
  const rows = Math.floor((GROUND - top - 20) / step);
  return <g stroke={INK} strokeWidth="1.6" opacity=".38">
    {Array.from({ length: rows }, (_, row) => <path key={row} d={`M${x + 8} ${top + 22 + row * step} H${x + width - 8}`} />)}
  </g>;
}

/** Front layer: the inked city. Shapes are filled with paper so nearer outlines hide further ones. */
export function AlmatyStreets() {
  const towerTop = 168;
  const towerBase = 712;
  const braces = Array.from({ length: 9 }, (_, step) => {
    const y1 = towerBase - step * 58;
    const y2 = y1 - 58;
    const half = (y: number) => 6 + ((y - towerTop) / (towerBase - towerTop)) * 30;
    return `M${1300 - half(y1)} ${y1} L${1300 + half(y2)} ${y2} M${1300 + half(y1)} ${y1} L${1300 - half(y2)} ${y2}`;
  }).join(" ");

  return <svg viewBox={`0 0 ${ART_W} ${ART_H}`} preserveAspectRatio="xMaxYMax meet" aria-hidden="true" focusable="false"
    fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Kok Tobe hill, its TV tower and the cable car down to the city */}
    <path stroke={INK} strokeWidth="3" d="M1060 930 C1140 800 1230 720 1330 708 C1430 700 1500 760 1536 790" />
    <path stroke={INK} strokeWidth="3" d={`M1264 ${towerBase} L1294 ${towerTop + 60} M1336 ${towerBase} L1306 ${towerTop + 60}`} />
    <path stroke={INK} strokeWidth="1.8" opacity=".7" d={braces} />
    <rect x="1280" y="300" width="40" height="34" rx="8" fill={PAPER} stroke={INK} strokeWidth="3" />
    <path stroke={INK} strokeWidth="3" d={`M1300 ${towerTop + 60} V${towerTop - 40}`} />
    <circle cx="1300" cy={towerTop + 20} r="7" fill="var(--at-accent-soft)" stroke={INK} strokeWidth="2.6" />
    <path stroke={INK} strokeWidth="2" d="M960 800 C1080 770 1180 738 1262 716" />
    <g fill={PAPER} stroke={INK} strokeWidth="2.4">
      <path d="M1040 783 v14" /><rect x="1026" y="796" width="28" height="22" rx="6" />
      <path d="M1170 748 v14" /><rect x="1156" y="761" width="28" height="22" rx="6" fill="var(--at-accent-soft)" />
    </g>

    {/* Esentai Tower: a glass shaft with its slanted crown */}
    <path fill={PAPER} stroke={INK} strokeWidth="3.2" d={`M846 ${GROUND} V352 L962 300 V${GROUND}Z`} />
    <g stroke={INK} strokeWidth="1.5" opacity=".42">
      {[868, 890, 912, 934].map((x) => <path key={x} d={`M${x} ${GROUND - 10} V${352 - ((x - 846) / 116) * 52 + 10}`} />)}
    </g>
    <path stroke={INK} strokeWidth="3" d="M904 326 V250" />

    {/* Hotel Kazakhstan with its crown */}
    <rect x="642" y="372" width="112" height={GROUND - 372} fill={PAPER} stroke={INK} strokeWidth="3.2" />
    <Floors x={642} top={372} width={112} step={26} />
    <path fill="var(--at-accent-soft)" stroke={INK} strokeWidth="3" d="M650 372 C664 326 732 326 746 372Z" />
    <path stroke={INK} strokeWidth="2.4" d="M674 372 V340 M698 372 V330 M722 372 V340" />

    <Poplar x={584} height={230} lean={-6} />
    <Poplar x={800} height={250} lean={5} />

    {/* Ascension Cathedral: a wooden bell tower, a tent roof and onion domes */}
    <path fill={PAPER} stroke={INK} strokeWidth="3.2" d={`M392 ${GROUND} V768 H552 V${GROUND}Z`} />
    <path fill={PAPER} stroke={INK} strokeWidth="3.2" d="M446 768 V618 H498 V768" />
    <path fill={PAPER} stroke={INK} strokeWidth="3.2" d="M440 618 L472 548 L504 618Z" />
    <OnionDome x={472} y={548} size={0.72} />
    <OnionDome x={414} y={768} size={0.82} />
    <OnionDome x={530} y={768} size={0.82} />
    <g stroke={INK} strokeWidth="2.6">
      <path d="M462 676 V650 a10 10 0 0 1 20 0 V676" />
      <path d="M412 860 V826 a10 10 0 0 1 20 0 V860 M512 860 V826 a10 10 0 0 1 20 0 V860" />
      <path d="M456 930 V880 a16 16 0 0 1 32 0 V930" />
    </g>

    {/* A yurt with its lattice wall and shanyrak */}
    <path fill={PAPER} stroke={INK} strokeWidth="3.2" d={`M150 ${GROUND} V862 C176 790 280 790 306 862 V${GROUND}Z`} />
    <path stroke={INK} strokeWidth="1.6" opacity=".5" d="M160 870 L190 925 M190 870 L220 925 M220 870 L250 925 M250 870 L280 925 M280 870 L300 908 M170 925 L200 870 M200 925 L230 870 M230 925 L260 870 M260 925 L290 870" />
    <path stroke={INK} strokeWidth="3" d="M150 862 H306 M212 812 C222 804 234 804 244 812" />
    <rect x="212" y="876" width="32" height="54" rx="3" fill="var(--at-accent-soft)" stroke={INK} strokeWidth="2.6" />

    <Poplar x={96} height={210} />
    <Poplar x={344} height={190} lean={-4} />
    <AppleTree x={1452} />

    {/* Ground, a few street strokes and a pair of birds */}
    <path stroke={INK} strokeWidth="3.2" d={`M0 ${GROUND} H${ART_W}`} />
    <path stroke={INK} strokeWidth="2" opacity=".45" d="M60 960 H200 M330 978 H520 M610 958 H760 M880 976 H1060 M1180 962 H1320" />
    <path stroke={INK} strokeWidth="2.4" d="M1010 210 q12 -12 24 0 q12 -12 24 0 M1090 250 q9 -9 18 0 q9 -9 18 0" />
  </svg>;
}
