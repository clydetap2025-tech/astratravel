import { cities } from "./kazakhstan.js";

/** One airport per city in the guide, keyed by IATA code. */
export const airports = Object.fromEntries(cities.map((city) => [city.airport, { city: city.name, latitude: city.lat, longitude: city.lng }]));

const regionalDirects = new Set(["CIT-SCO", "GUW-SCO"]);
const defaultFlight = { from: "NQZ", to: "ALA", passengers: 1 };

export function addDays(date, amount) {
  const utc = new Date(date + "T12:00:00Z");
  utc.setUTCDate(utc.getUTCDate() + amount);
  return utc.toISOString().slice(0, 10);
}

export function todayInKazakhstan() {
  return new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export const defaultFlightSearch = () => ({ ...defaultFlight, date: addDays(todayInKazakhstan(), 1) });

export function isFlightSearch(search) {
  if (!search || !Object.hasOwn(airports, search.from) || !Object.hasOwn(airports, search.to) || search.from === search.to) return false;
  if (!Number.isInteger(search.passengers) || search.passengers < 1 || search.passengers > 6) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(search.date)) return false;
  const parsed = new Date(search.date + "T12:00:00Z");
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === search.date;
}

function flightMinutes(from, to) {
  const start = airports[from];
  const end = airports[to];
  const km = Math.hypot((start.latitude - end.latitude) * 111, (start.longitude - end.longitude) * 75);
  return Math.round((42 + km / 12) / 5) * 5;
}

export function demoFlights(search) {
  if (!isFlightSearch(search)) return [];
  const { from, to, date, passengers } = search;
  const pair = [from, to].sort().join("-");
  const hasDirect = [from, to].some((code) => code === "ALA" || code === "NQZ") || regionalDirects.has(pair);
  const transit = ["NQZ", "ALA", "CIT"].find((code) => code !== from && code !== to);
  const flightTime = flightMinutes(from, to);
  const connectionTime = flightMinutes(from, transit) + 85 + flightMinutes(transit, to);
  const dateSeed = Math.floor(Date.parse(date + "T12:00:00Z") / 86400000);
  const datePremium = ((dateSeed + from.charCodeAt(0) + to.charCodeAt(1)) % 7) * 900;
  const base = 9900 + flightTime * 150 + datePremium;
  const options = [
    { id: "kc-morning", carrier: "Air Astana", code: "KC", departure: 8 * 60 + 25, duration: flightTime, price: base + 4100 },
    { id: "fs-noon", carrier: "FlyArystan", code: "FS", departure: 12 * 60 + 5, duration: flightTime + 5, price: base },
    { id: "dv-evening", carrier: "SCAT", code: "DV", departure: 18 * 60 + 40, duration: flightTime + 10, price: base + 1800 },
  ];
  const connections = [
    { id: "kc-transfer", carrier: "Air Astana", code: "KC", departure: 10 * 60 + 15, duration: connectionTime, price: base + 6700, transit },
    { id: "fs-transfer", carrier: "FlyArystan", code: "FS", departure: 17 * 60 + 30, duration: connectionTime + 30, price: base + 4800, transit },
  ];
  const schedule = hasDirect ? [...options, connections[0]] : connections;
  return schedule.map((flight) => ({
    ...flight,
    key: [from, to, date, passengers, flight.id].join("."),
    search,
    arrival: flight.departure + flight.duration,
    total: flight.price * passengers,
  }));
}

export function clock(minutes) {
  return [Math.floor(minutes % 1440 / 60), minutes % 60].map((part) => String(part).padStart(2, "0")).join(":");
}
