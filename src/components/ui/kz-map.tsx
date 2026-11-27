import { cities } from "../../../data/kazakhstan.js";

/**
 * A schematic outline of Kazakhstan with every city in the guide, the current one lit. The border
 * is simplified to a few dozen points; it locates cities, it is not a survey map.
 */
export const BORDER: [number, number][] = [
  [46.5, 48.4], [47.3, 50.4], [49.9, 51.6], [52.6, 51.5], [55.2, 50.7], [57, 51], [59.9, 50.7], [61.3, 52.3], [60.3, 54], [65, 54.6],
  [69.2, 55.4], [73.2, 54.1], [76.3, 54.3], [77.7, 53.4], [80, 50.9], [83.2, 51], [87.2, 49.2], [85.4, 47.1], [83, 47.2], [80.4, 45.1],
  [80, 42.9], [76.3, 42.9], [74, 43.2], [71, 42.5], [69.1, 41.2], [66.6, 41.4], [63.2, 43.6], [61, 44.3], [58.3, 45.6], [56, 45.1],
  [55.6, 41.3], [53, 42], [52.5, 41.8], [51.2, 43.2], [52.2, 44.8], [50.2, 46], [49.1, 46.4], [47.4, 47.2],
];
const W = 320;
const H = 170;
const x = (lng: number) => ((lng - 46) / (88 - 46)) * (W - 16) + 8;
const y = (lat: number) => ((55.8 - lat) / (55.8 - 40.6)) * (H - 16) + 8;

export function KzMap({ current, onPick, label }: { current: string; onPick?: (id: string) => void; label: (id: string) => string }) {
  const here = cities.find((city) => city.id === current);
  return <svg className="kz-map" viewBox={`0 0 ${W} ${H}`} role="group" aria-label={here ? label(here.id) : undefined}>
    <path className="kz-land" d={"M" + BORDER.map(([lng, lat]) => x(lng).toFixed(1) + " " + y(lat).toFixed(1)).join(" L") + "Z"} />
    {cities.map((city) => <g key={city.id} className={"kz-city" + (city.id === current ? " is-on" : "")}
      transform={`translate(${x(city.lng).toFixed(1)} ${y(city.lat).toFixed(1)})`}>
      {onPick ? <a href="#places" onClick={(event) => { event.preventDefault(); onPick(city.id); }} aria-label={label(city.id)}>
        <circle r="9" className="kz-hit" /><circle r={city.id === current ? 5 : 3} />
      </a> : <circle r={city.id === current ? 5 : 3} />}
      {city.id === current && <circle r="11" className="kz-ring" />}
    </g>)}
  </svg>;
}
