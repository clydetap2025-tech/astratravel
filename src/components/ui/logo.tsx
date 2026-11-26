/**
 * The AstraTravel mark: a drop of liquid glass with a star inside. Drawn inline so it takes the
 * theme's colours and can move: the star turns on hover and the glint sweeps when a page changes.
 */
export function Logo({ size = 32 }: { size?: number }) {
  return <svg className="logo-mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <rect className="logo-tile" width="64" height="64" rx="16" />
    <path className="logo-drop" d="M32 8 C32 8 49 25.5 49 38 A17 17 0 0 1 15 38 C15 25.5 32 8 32 8Z" />
    <path className="logo-star" d="M32 26 L34.4 35.6 L44 38 L34.4 40.4 L32 50 L29.6 40.4 L20 38 L29.6 35.6Z" />
    <path className="logo-glint" d="M22.5 31.5 C23.5 27.5 26 23.5 28 21" />
  </svg>;
}
