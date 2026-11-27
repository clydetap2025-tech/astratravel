import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { m } from "motion/react";
import type { Theme } from "../../shared/model";

/**
 * A liquid-glass capsule with the three themes side by side, so any of them is one tap away and
 * the current one is always visible. A drop of glass slides to the chosen icon; the icons act it
 * out (the sun turns, the moon swings, the half-disc flips); the page itself changes in a circle
 * that spreads from the tap (handled by the caller through the View Transitions API).
 */
const options: { value: Theme; path: ReactNode }[] = [
  { value: "light", path: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.2m0 14.6v2.2M4.6 4.6l1.6 1.6m11.6 11.6 1.6 1.6M2.5 12h2.2m14.6 0h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" /></> },
  { value: "system", path: <><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17Z" fill="currentColor" /></> },
  { value: "dark", path: <path d="M20 14.6A8.2 8.2 0 0 1 9.4 4a8.2 8.2 0 1 0 10.6 10.6Z" /> },
];

export function ThemeSwitch({ value, labels, onChange }: {
  value: Theme; labels: Record<Theme, string>; onChange: (theme: Theme, event: ReactMouseEvent) => void;
}) {
  return <div className="theme-switch" role="radiogroup" aria-label={labels.system.split(":")[0]}>
    {options.map((option) => {
      const on = value === option.value;
      return <button key={option.value} type="button" role="radio" aria-checked={on} aria-label={labels[option.value]} title={labels[option.value]}
        className="theme-option" data-theme-option={option.value} onClick={(event) => { if (!on) onChange(option.value, event); }}>
        {on && <m.span layoutId="theme-drop" className="theme-drop" transition={{ type: "spring", stiffness: 520, damping: 34, mass: 0.7 }} aria-hidden="true" />}
        <svg className="theme-glyph" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{option.path}</svg>
      </button>;
    })}
  </div>;
}
