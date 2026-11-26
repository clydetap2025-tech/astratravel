import type { ReactNode } from "react";

/**
 * Generated covers for places the guide has no photo of. Each place gets the drawing of what it
 * actually is (a tower, a mausoleum, a canyon, a rink, a bowl of noodles…), and a tint from its
 * part of the country, so a Caspian cliff and a Semey museum no longer look alike.
 */

export type Region = "south" | "caspian" | "west" | "centre" | "north" | "east";

export const cityRegion: Record<string, Region> = {
  almaty: "south", shymkent: "south", turkistan: "south", taraz: "south", kyzylorda: "south",
  aktau: "caspian", atyrau: "caspian", aktobe: "west", oral: "west",
  astana: "centre", karaganda: "centre", burabay: "north", pavlodar: "north", petropavl: "north", kostanay: "north",
  semey: "east", oskemen: "east",
};

const art: Record<string, ReactNode> = {
  tower: <><path d="M200 214 V96" /><path d="M176 214 L192 110 M224 214 L208 110" /><circle cx="200" cy="80" r="18" /><path d="M200 62 V40 M186 96 H214" /><path d="M120 214 H280" /></>,
  tent: <><path d="M90 214 C130 120 170 70 200 46 C230 70 270 120 310 214 Z" /><path d="M200 46 V214 M150 214 C165 150 182 98 200 60 M250 214 C235 150 218 98 200 60" /><path d="M70 214 H330" /></>,
  mosque: <><path d="M140 214 V140 H260 V214" /><path d="M150 140 C150 96 250 96 250 140" /><path d="M200 98 V78" /><path d="M100 214 V92 M300 214 V92" /><path d="M94 92 L100 72 L106 92 Z M294 92 L300 72 L306 92 Z" /><path d="M186 214 V178 A14 14 0 0 1 214 178 V214" /><path d="M70 214 H330" /></>,
  mausoleum: <><path d="M130 214 V120 H270 V214" /><path d="M150 120 C150 64 250 64 250 120" /><path d="M150 120 C162 92 238 92 250 120" /><path d="M178 214 V160 A22 22 0 0 1 222 160 V214" /><path d="M130 136 H270" /><path d="M90 214 H310" /></>,
  pyramid: <><path d="M90 214 L200 50 L310 214 Z" /><path d="M145 132 H255 M118 174 H282 M200 50 V214" /><path d="M70 214 H330" /></>,
  sphere: <><circle cx="200" cy="128" r="72" /><ellipse cx="200" cy="128" rx="72" ry="24" /><ellipse cx="200" cy="128" rx="30" ry="72" /><path d="M150 214 L170 192 M250 214 L230 192 M120 214 H280" /></>,
  museum: <><path d="M90 104 L200 62 L310 104 Z" /><path d="M100 104 H300 M110 116 H290" /><path d="M126 116 V200 M166 116 V200 M206 116 V200 M246 116 V200 M286 116 V200" /><path d="M90 200 H310 M80 214 H320" /></>,
  cathedral: <><path d="M140 214 V136 H260 V214" /><path d="M180 136 V96 H220 V136" /><path d="M182 96 C182 70 218 70 218 96" /><path d="M200 70 C196 60 204 52 200 44" /><path d="M146 136 C146 116 170 116 170 136 M230 136 C230 116 254 116 254 136" /><path d="M188 214 V176 A12 12 0 0 1 212 176 V214" /><path d="M100 214 H300" /></>,
  ruins: <><path d="M70 214 V150 L96 140 V214 M120 214 V120 H152 V172 H176 V214 M210 214 V156 H240 V136 L270 128 V214 M290 214 V166 H324 V214" /><path d="M60 214 H340" /><path d="M140 232 H260" /></>,
  canyon: <><path d="M30 120 H110 L122 150 L104 170 L130 214 M370 110 H290 L280 140 L298 160 L272 214" /><path d="M130 214 C170 190 230 190 272 214" /><path d="M150 214 C180 204 220 204 250 214" /><circle cx="320" cy="62" r="16" /></>,
  lake: <><path d="M20 160 L100 76 L150 124 L210 60 L290 140 L330 100 L380 160" /><path d="M40 182 C110 168 290 168 360 182 C290 208 110 208 40 182 Z" /><path d="M120 190 H170 M220 196 H280" /></>,
  mountains: <><circle cx="306" cy="64" r="20" /><path d="M20 212 L120 88 L170 144 L220 96 L330 212" /><path d="M104 108 L120 88 L136 108 M204 114 L220 96 L236 114" /><path d="M60 228 H340" /></>,
  rink: <><path d="M40 150 L120 80 L170 120 L230 70 L360 150" /><ellipse cx="200" cy="196" rx="150" ry="26" /><path d="M150 186 C170 178 182 196 204 188 M240 200 C252 192 268 202 280 196" /></>,
  petroglyph: <><path d="M60 214 C80 120 170 90 230 100 C300 110 340 160 340 214 Z" /><path d="M160 150 C170 132 196 132 206 150 M168 150 V176 M198 150 V176 M150 140 L160 150 M214 140 L206 150" /><circle cx="250" cy="146" r="12" /><path d="M250 158 V182 M238 168 H262 M240 196 L250 182 L260 196" /></>,
  dune: <><path d="M20 200 C90 120 150 110 210 150 C260 184 320 150 380 120" /><path d="M20 214 C120 180 260 190 380 160" /><path d="M120 128 C150 120 170 126 190 140" /><circle cx="310" cy="66" r="20" /></>,
  bazaar: <><path d="M80 214 V120 H320 V214" /><path d="M80 120 L110 84 H290 L320 120" /><path d="M110 84 V120 M150 84 V120 M190 84 V120 M230 84 V120 M270 84 V120" /><circle cx="140" cy="170" r="14" /><circle cx="176" cy="176" r="12" /><circle cx="226" cy="170" r="14" /><circle cx="262" cy="178" r="11" /><path d="M60 214 H340" /></>,
  river: <><path d="M20 120 C100 100 160 150 230 130 C300 110 340 130 380 120" /><path d="M20 160 C100 140 160 190 230 170 C300 150 340 170 380 160" /><path d="M60 214 V188 M60 188 C60 176 76 176 76 188 M150 214 V184 M300 214 V190" /><path d="M30 214 H370" /></>,
  sea: <><path d="M20 120 H380" /><path d="M20 150 C60 140 80 160 120 150 C160 140 180 160 220 150 C260 140 280 160 320 150 C350 142 370 150 380 150" /><path d="M20 180 C60 170 80 190 120 180 C160 170 180 190 220 180 C260 170 280 190 320 180" /><circle cx="300" cy="80" r="22" /><path d="M60 120 L90 96 L120 120" /></>,
  bridge: <><path d="M30 170 H370" /><path d="M110 170 V70 M290 170 V70" /><path d="M30 120 C70 120 100 90 110 70 C140 140 260 140 290 70 C300 90 330 120 370 120" /><path d="M150 170 V122 M200 170 V132 M250 170 V122" /><path d="M30 200 C100 190 300 190 370 200" /></>,
  monument: <><path d="M184 214 V90 H216 V214" /><path d="M176 90 H224 L200 50 Z" /><path d="M150 214 V196 H250 V214" /><path d="M90 214 H310" /><path d="M110 214 C120 190 140 190 150 214 M250 214 C260 190 280 190 290 214" /></>,
  park: <><circle cx="130" cy="140" r="40" /><circle cx="210" cy="120" r="52" /><circle cx="286" cy="148" r="34" /><path d="M130 180 V214 M210 172 V214 M286 182 V214" /><path d="M60 214 H340" /><path d="M150 232 C190 224 230 224 270 232" /></>,
  rocket: <><path d="M200 40 C226 70 232 120 228 170 H172 C168 120 174 70 200 40 Z" /><path d="M172 150 L150 186 H172 M228 150 L250 186 H228" /><circle cx="200" cy="110" r="12" /><path d="M188 186 C190 204 196 214 200 222 C204 214 210 204 212 186" /><path d="M110 214 V90 M110 110 H140 M290 214 V100" /></>,
  yurt: <><path d="M110 214 V156 C140 110 260 110 290 156 V214" /><path d="M110 156 H290" /><path d="M176 122 C188 114 212 114 224 122" /><path d="M120 170 L150 210 M150 170 L180 210 M220 170 L250 210 M250 170 L280 210" /><path d="M184 214 V176 H216 V214" /><path d="M80 214 H320" /></>,
  house: <><path d="M110 214 V128 L200 72 L290 128 V214" /><path d="M140 214 V164 H176 V214 M216 150 H260 V186 H216 Z M238 150 V186 M216 168 H260" /><path d="M80 214 H320" /></>,
  cave: <><path d="M40 214 C40 120 110 70 200 70 C290 70 360 120 360 214" /><path d="M140 214 V170 C140 136 260 136 260 170 V214" /><path d="M200 112 V96 M190 104 H210" /><path d="M20 214 H380" /></>,
  bowl: <><path d="M112 150 H288 C284 204 248 226 200 226 C152 226 116 204 112 150Z" /><path d="M100 150 H300 M160 128 c-12 -16 12 -24 0 -42 M200 122 c-12 -16 12 -24 0 -42 M240 128 c-12 -16 12 -24 0 -42" /></>,
  noodles: <><path d="M112 150 H288 C284 204 248 226 200 226 C152 226 116 204 112 150Z" /><path d="M100 150 H300" /><path d="M248 96 L316 150 M262 88 L326 140" /><path d="M150 150 C150 130 170 130 170 150 C170 130 190 130 190 150 C190 130 210 130 210 150 C210 130 230 130 230 150" /></>,
  cup: <><path d="M140 110 H250 V180 C250 204 230 220 206 220 H184 C160 220 140 204 140 180 Z" /><path d="M250 128 H270 C290 128 290 168 270 168 H250" /><path d="M170 92 c-10 -14 10 -20 0 -36 M210 92 c-10 -14 10 -20 0 -36" /><path d="M110 230 H290" /></>,
  beer: <><path d="M150 100 H240 V214 H150 Z" /><path d="M240 124 H264 C284 124 284 176 264 176 H240" /><path d="M150 100 C150 80 168 76 180 84 C188 70 210 70 216 84 C228 76 244 82 240 100" /><path d="M172 128 V196 M196 128 V196 M220 128 V196" /></>,
  croissant: <><path d="M90 170 C110 110 290 110 310 170 C290 160 270 166 260 180 C240 160 220 160 200 176 C180 160 160 160 140 180 C130 166 110 160 90 170 Z" /><path d="M150 150 L160 178 M200 138 V176 M250 150 L240 178" /><path d="M80 214 H320" /></>,
  plate: <><ellipse cx="200" cy="178" rx="130" ry="34" /><ellipse cx="200" cy="172" rx="90" ry="20" /><path d="M150 166 C170 150 230 150 250 166" /><path d="M326 120 V214 M74 120 V214 M66 120 V150 C66 158 82 158 82 150 V120" /></>,
};

const placeArt: Record<string, string> = {
  charyn: "canyon", kolsai: "lake", shymbulak: "mountains", bazaar: "bazaar", cathedral: "cathedral", "kok-tobe": "tower",
  ramen77: "noodles", rodem: "bowl", navat: "plate", lanzhou: "noodles", tandoor: "plate", "sadik-usta": "cup", "line-brew": "beer",
  ami: "croissant", shakespeare: "beer", dadiani: "plate",
  medeu: "rink", "big-almaty-lake": "lake", "central-museum": "museum", tamgaly: "petroglyph", "altyn-emel": "dune",
  baiterek: "tower", "khan-shatyr": "tent", "hazrat-sultan": "mosque", "peace-palace": "pyramid", "nur-alem": "sphere",
  "national-museum": "museum", "astana-opera": "museum",
  "ordabasy-square": "monument", "shymkent-dendropark": "park", "independence-park-shymkent": "park", sayram: "ruins", "aksu-zhabagly": "mountains",
  yasawi: "mausoleum", "rabiga-begim": "mausoleum", karavansaray: "bazaar", "arystan-bab": "mausoleum", otrar: "ruins", sauran: "ruins",
  "aisha-bibi": "mausoleum", "babaji-khatun": "mausoleum", karakhan: "mausoleum", "ancient-taraz": "ruins",
  "aitbay-mosque": "mosque", "syrdarya-embankment": "river", "korkyt-ata": "monument", baikonur: "rocket",
  "aktau-waterfront": "sea", "mig-monument": "monument", sherkala: "yurt", "shakpak-ata": "cave", bozzhyra: "canyon",
  "atyrau-embankment": "bridge", "atyrau-museum": "museum", "imangali-mosque": "mosque", saraishyk: "ruins",
  "nur-gasyr": "mosque", "aktobe-museum": "museum", "ilek-embankment": "river",
  "archangel-cathedral": "cathedral", "pugachev-museum": "house", "oral-embankment": "river",
  "karlag-museum": "house", "karaganda-park": "park", "miners-glory": "monument", karkaraly: "mountains",
  "burabay-lake": "lake", okzhetpes: "mountains", shchuchye: "lake", "abylai-glade": "park", "burabay-museum": "museum",
  "mashkhur-zhusup": "mosque", "annunciation-cathedral": "cathedral", "pavlodar-embankment": "river", bayanaul: "mountains",
  "abai-museum": "museum", "dostoevsky-museum": "house", "stronger-than-death": "monument", "semey-bridge": "bridge", zhidebay: "mausoleum",
  "oskemen-ethnopark": "yurt", "oskemen-embankment": "river", sibiny: "lake", "kiin-kerish": "canyon",
  "abylai-residence": "house", "ishim-embankment": "river", "petropavl-museum": "museum",
  "tobol-embankment": "river", "kostanay-museum": "museum", naurzum: "dune",
};

const fallbackArt: Record<string, string> = { nature: "mountains", culture: "museum", city: "monument", food: "bowl" };
const seedOf = (id: string) => [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);

/** The drawn cover: a regional gradient, two drifting glass droplets and the place's own drawing. */
export function PlaceCover({ id, city, category, className }: { id: string; city: string; category: string; className?: string }) {
  const seed = seedOf(id);
  const region = cityRegion[city] ?? "centre";
  const gradient = "cv-" + id;
  const drawing = art[placeArt[id] ?? fallbackArt[category] ?? "monument"];
  return <svg className={`sketch-cover region-${region}` + (className ? " " + className : "")} viewBox="0 0 400 260"
    aria-hidden="true" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" className="cover-stop-a" /><stop offset="1" className="cover-stop-b" />
      </linearGradient>
      <radialGradient id={gradient + "-drop"} cx=".35" cy=".3" r=".75">
        <stop offset="0" className="cover-drop-a" /><stop offset=".6" className="cover-drop-b" /><stop offset="1" className="cover-drop-c" />
      </radialGradient>
    </defs>
    <rect width="400" height="260" fill={`url(#${gradient})`} />
    <g className="cover-drops">
      <circle cx={60 + (seed % 7) * 40} cy={70 + (seed % 3) * 20} r={64 + (seed % 4) * 10} fill={`url(#${gradient}-drop)`} />
      <circle cx={340 - (seed % 5) * 36} cy={190 - (seed % 4) * 14} r={42 + (seed % 3) * 12} fill={`url(#${gradient}-drop)`} />
    </g>
    <g className="cover-art" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">{drawing}</g>
  </svg>;
}
