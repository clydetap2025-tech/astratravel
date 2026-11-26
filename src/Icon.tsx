const shapes = {
  compass: <><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/></>,
  plane: <><path d="M17 21v-8l5 2v-2l-5-4V5.5a2 2 0 0 0-4 0V9l-5 4v2l5-2v8l-2 1v1l4-.7 4 .7v-1l-2-1Z" transform="translate(-3 -1)"/></>,
  heart: <><path d="M20.8 4.6a5.3 5.3 0 0 0-7.5 0L12 5.9l-1.3-1.3a5.3 5.3 0 0 0-7.5 7.5l1.3 1.3L12 21l7.5-7.6 1.3-1.3a5.3 5.3 0 0 0 0-7.5Z"/></>,
  sparkles: <><path d="M9.5 3 11 8.5l5.5 1.5-5.5 1.5L9.5 17 8 11.5 2.5 10 8 8.5 9.5 3Z"/><path d="M18 12.5 19 16l3.5 1-3.5 1-1 3.5-1-3.5-3.5-1 3.5-1 1-3.5ZM18.5 2v5M16 4.5h5"/></>,
  globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18-3-3-3-15 0-18Z"/></>,
  pin: <><path d="M19 10c0 5.2-7 10.8-7 10.8s-7-5.6-7-10.8a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.4"/></>,
  chevron: <><path d="m6 9 6 6 6-6"/></>,
  user: <><circle cx="12" cy="8" r="3.6"/><path d="M4.5 21v-1.5a5.5 5.5 0 0 1 5.5-5.5h4a5.5 5.5 0 0 1 5.5 5.5V21"/></>,
  search: <><circle cx="10.8" cy="10.8" r="6.3"/><path d="m16 16 4 4"/></>,
  mountain: <><path d="m2 20 7.5-13 4 7 2.5-4.5L22 20H2ZM7 11.5l2.5 2 2.5-2"/></>,
  food: <><path d="M4 3v5a3 3 0 0 0 6 0V3M7 3v18M15 13h4V3c-3 2-4 5-4 10Zm4 0v8"/></>,
  landmark: <><path d="m3 9 9-6 9 6H3Zm2 12h14M7 11v6m5-6v6m5-6v6M3 19h18"/></>,
  city: <><path d="M3 21h18V10l-6-3v14M3 21V7l7-4 5 3M6 9h1m3 0h1m-5 4h1m3 0h1m-5 4h1m3 0h1m7-4h1m-1 4h1"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  x: <><path d="m6 6 12 12M18 6 6 18"/></>,
  check: <><path d="m5 12 4 4L19 6"/></>,
  swap: <><path d="M3 7h17m-4-4 4 4-4 4M21 17H4m4-4-4 4 4 4"/></>,
  calendar: <><rect x="4" y="6" width="16" height="15" rx="2"/><path d="M8 3v6m8-6v6M4 11h16"/></>,
  sort: <><path d="M8 4v16m-4-4 4 4 4-4m4 4V4m-4 4 4-4 4 4"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3m-4 5v2"/></>,
  route: <><circle cx="5" cy="18" r="2"/><circle cx="19" cy="6" r="2"/><path d="M7 18h8a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h8"/></>,
  download: <><path d="M12 3v12m-4-4 4 4 4-4M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/></>,
  coin: <><circle cx="12" cy="12" r="9"/><path d="M8.5 8h7m-7 2.5h7M12 10.5V16"/></>,
  map: <><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16"/></>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2m0 14.6v2.2M4.6 4.6l1.6 1.6m11.6 11.6 1.6 1.6M2.5 12h2.2m14.6 0h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/></>,
  moon: <><path d="M20 14.6A8.2 8.2 0 0 1 9.4 4a8.2 8.2 0 1 0 10.6 10.6Z"/></>,
  auto: <><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17Z" fill="currentColor"/></>,
  home: <><path d="m3.5 11 8.5-7 8.5 7"/><path d="M5.5 9.5V20h13V9.5M10 20v-5.5h4V20"/></>,
  suitcase: <><rect x="3.5" y="7" width="17" height="13" rx="2.5"/><path d="M9 7V5.2A1.7 1.7 0 0 1 10.7 3.5h2.6A1.7 1.7 0 0 1 15 5.2V7M3.5 12.5h17M8 7v13m8-13v13"/></>,
  arrow: <><path d="M5 12h14m-5-5 5 5-5 5"/></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/></>,
  eyeOff: <><path d="M3 3l18 18M10.6 6.1A9.6 9.6 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-2.6 3.4M6.2 7.6C3.9 9.3 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1M9.9 9.9a3 3 0 0 0 4.2 4.2"/></>,
};

export type IconName = keyof typeof shapes;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name]}</svg>;
}
