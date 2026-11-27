import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Icon } from "../../shared/ui";

/** "Saved" with "Undo": the admin panel's own toast. */
export type AdminToast = { message: string; undo?: () => void; id: number };
export const AdminToastContext = createContext<(message: string, undo?: () => void) => void>(() => {});
export const useAdminToast = () => useContext(AdminToastContext);

export function AdminToasts({ toast, onClose, undoLabel }: { toast: AdminToast | null; onClose: () => void; undoLabel: string }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onClose, toast.undo ? 7000 : 3000);
    return () => clearTimeout(timer);
  }, [toast]); // eslint-disable-line react-hooks/exhaustive-deps
  return <div className="toast-region admin-toasts" role="status" aria-live="polite">
    {toast && <div className="toast glass" key={toast.id}>
      <Icon name="check" size={18} /><span>{toast.message}</span>
      {toast.undo && <button type="button" className="toast-link" onClick={() => { toast.undo?.(); onClose(); }}>{undoLabel}</button>}
    </div>}
  </div>;
}

/** A single-key shortcut that does nothing while the person types in a field. */
export function useHotkey(key: string, run: (event: KeyboardEvent) => void, options: { ctrl?: boolean; enabled?: boolean } = {}) {
  useEffect(() => {
    if (options.enabled === false) return;
    function onKey(event: KeyboardEvent) {
      const typing = event.target instanceof HTMLElement && (event.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName));
      if (options.ctrl) {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === key) { event.preventDefault(); run(event); }
        return;
      }
      if (typing || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === key) { event.preventDefault(); run(event); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
}

/** Bars without a chart library: one SVG, a label under every other bar and the value on top. */
export function BarChart({ data, label }: { data: { label: string; value: number }[]; label: string }) {
  const max = Math.max(1, ...data.map((item) => item.value));
  const width = 560, height = 180, gap = 6, bar = (width - gap * (data.length - 1)) / Math.max(1, data.length);
  return <svg className="bar-chart" viewBox={`0 0 ${width} ${height + 34}`} role="img" aria-label={label}>
    {data.map((item, index) => {
      const h = Math.round((item.value / max) * height);
      const x = index * (bar + gap);
      return <g key={item.label + index}>
        <rect x={x} y={height - h} width={bar} height={Math.max(h, 1)} rx={4} className="bar" />
        {item.value > 0 && <text x={x + bar / 2} y={height - h - 5} textAnchor="middle" className="bar-value">{item.value}</text>}
        {(index % 2 === 0 || data.length <= 8) && <text x={x + bar / 2} y={height + 20} textAnchor="middle" className="bar-label">{item.label}</text>}
      </g>;
    })}
  </svg>;
}

/** Horizontal bars for "popular" lists. */
export function RankList({ items, empty }: { items: { label: string; value: number }[]; empty: string }) {
  if (!items.length) return <p className="muted">{empty}</p>;
  const max = Math.max(...items.map((item) => item.value));
  return <ol className="rank-list">{items.map((item) => <li key={item.label}>
    <span className="rank-label">{item.label}</span>
    <meter min={0} max={max} value={item.value} aria-label={item.label} />
    <span className="rank-value">{item.value}</span>
  </li>)}</ol>;
}

export function StatCard({ label, value, note, tone }: { label: string; value: ReactNode; note?: ReactNode; tone?: "warn" }) {
  return <div className="stat-card glass" data-tone={tone}>
    <span className="stat-label">{label}</span>
    <strong className="stat-value">{value}</strong>
    {note && <small>{note}</small>}
  </div>;
}

/** Rows that keep their height while loading, so the table does not jump. */
export function SkeletonRows({ columns, rows = 6 }: { columns: number; rows?: number }) {
  return <>{Array.from({ length: rows }, (_, row) => <tr key={row} className="skeleton-row" aria-hidden="true">
    {Array.from({ length: columns }, (_, column) => <td key={column}><span /></td>)}
  </tr>)}</>;
}

export function useDebounced<T>(value: T, delay = 250) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return settled;
}
