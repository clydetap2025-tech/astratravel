import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { cityById, placeById } from "../../data/catalog.js";
import { fill } from "../../data/i18n.js";
import { AdminPlaces } from "../features/admin/AdminPlaces";
import { AdminUsers } from "../features/admin/AdminUsers";
import { AdminToastContext, AdminToasts, BarChart, RankList, SkeletonRows, StatCard, useHotkey } from "../features/admin/shared";
import type { AdminToast } from "../features/admin/shared";
import { useTravel } from "../shared/context";
import type { Database, Json } from "../shared/database.types";
import type { Message, Session } from "../shared/model";
import { errorKey, supabaseClient } from "../shared/supabase";
import { EmptyState, Icon, PageHeader } from "../shared/ui";
import type { IconName } from "../shared/ui";

type Section = "overview" | "users" | "places" | "settings" | "log";
const SECTIONS: { id: Section; icon: IconName; label: Message; admin: boolean }[] = [
  { id: "overview", icon: "compass", label: "adminOverview", admin: true },
  { id: "users", icon: "user", label: "adminUsers", admin: true },
  { id: "places", icon: "pin", label: "adminPlaces", admin: false },
  { id: "settings", icon: "sun", label: "adminSettings", admin: true },
  { id: "log", icon: "clock", label: "adminLog", admin: true },
];

/**
 * #admin: visible to editors and admins. The page only hides what a role cannot use; the database checks every
 * action again (RLS and the admin_* functions), so a hidden button is not the protection.
 */
export function AdminPage({ session, onSettings }: { session: Session; onSettings: () => void }) {
  const { t } = useTravel();
  const role = session.user?.role;
  const isAdmin = role === "admin";
  const allowed = SECTIONS.filter((section) => isAdmin || (role === "editor" && !section.admin));
  const fromHash = () => (location.hash.split("/")[1] as Section | undefined);
  const [section, setSection] = useState<Section>(() => allowed.some((item) => item.id === fromHash()) ? fromHash()! : allowed[0]?.id ?? "places");
  const [toast, setToast] = useState<AdminToast | null>(null);

  useEffect(() => { history.replaceState(null, "", "#admin/" + section); }, [section]);
  useHotkey("g", () => setSection(allowed[(allowed.findIndex((item) => item.id === section) + 1) % allowed.length].id), { enabled: allowed.length > 1 });

  if (!session.user || !supabaseClient() || (role !== "admin" && role !== "editor")) {
    return <>
      <PageHeader eyebrow={t("adminPanel")} title={t("adminPanel")} />
      <EmptyState icon="lock" title={t("adminForbidden")} description={t("adminForbiddenBody")} />
    </>;
  }

  return <AdminToastContext.Provider value={(message, undo) => setToast({ message, undo, id: Date.now() })}>
    <PageHeader eyebrow={t(isAdmin ? "roleAdmin" : "roleEditor")} title={t("adminPanel")} lead={t("adminLead")} />
    <div className="admin-layout">
      <nav className="admin-nav glass" aria-label={t("adminPanel")}>
        {allowed.map((item) => <button key={item.id} type="button" className="admin-nav-item" aria-current={section === item.id ? "page" : undefined}
          onClick={() => setSection(item.id)}><Icon name={item.icon} size={17} /><span>{t(item.label)}</span></button>)}
        <p className="admin-keys"><kbd>/</kbd> {t("adminKeySearch")} · <kbd>n</kbd> {t("adminKeyNew")} · <kbd>s</kbd> {t("adminKeySave")} · <kbd>g</kbd> {t("adminKeyNext")}</p>
      </nav>
      <div className="admin-main">
        {section === "overview" && <AdminOverview />}
        {section === "users" && <AdminUsers />}
        {section === "places" && <AdminPlaces />}
        {section === "settings" && <AdminSettings onSaved={onSettings} />}
        {section === "log" && <AdminLog />}
      </div>
    </div>
    <AdminToasts toast={toast} onClose={() => setToast(null)} undoLabel={t("undo")} />
  </AdminToastContext.Provider>;
}

type Overview = {
  users_total: number; users_new_7d: number; ai_today: number; ai_week: number; limit_hit_today: number;
  cost_today_usd: number; openai_errors_today: number; openai_errors_7d: number;
  messages_by_day: { day: string; count: number }[]; top_cities: { id: string; count: number }[]; top_places: { id: string; count: number }[];
};

function AdminOverview() {
  const { t, language, number, local } = useTravel();
  const [data, setData] = useState<Overview | null>(null);
  const [issue, setIssue] = useState<Message | null>(null);
  useEffect(() => {
    void supabaseClient()!.rpc("admin_overview").then(({ data: result, error }) => {
      if (error) setIssue(errorKey(error) as Message);
      else setData(result as unknown as Overview);
    });
  }, []);
  if (issue) return <p className="form-error" role="alert">{t(issue)}</p>;
  if (!data) return <div className="stat-grid" aria-busy="true">{Array.from({ length: 6 }, (_, index) => <div key={index} className="stat-card glass skeleton-card" />)}</div>;
  const usd = new Intl.NumberFormat(language, { style: "currency", currency: "USD", maximumFractionDigits: 4 });
  return <div className="admin-section">
    <div className="stat-grid">
      <StatCard label={t("adminUsersTotal")} value={number(data.users_total)} note={fill("adminNew7d", language, data.users_new_7d)} />
      <StatCard label={t("adminAiToday")} value={number(data.ai_today)} note={fill("adminWeek", language, data.ai_week)} />
      <StatCard label={t("adminLimitHitToday")} value={number(data.limit_hit_today)} tone={data.limit_hit_today ? "warn" : undefined} />
      <StatCard label={t("adminCostToday")} value={usd.format(data.cost_today_usd)} note={t("adminCostNote")} />
      <StatCard label={t("adminErrors")} value={number(data.openai_errors_today)} note={fill("adminWeek", language, data.openai_errors_7d)} tone={data.openai_errors_today ? "warn" : undefined} />
    </div>
    <section className="glass admin-panel-card">
      <h3>{t("adminMessages14")}</h3>
      <BarChart label={t("adminMessages14")} data={data.messages_by_day.map((item) => ({ label: item.day.slice(8, 10) + "." + item.day.slice(5, 7), value: item.count }))} />
    </section>
    <div className="admin-two">
      <section className="glass admin-panel-card"><h3>{t("adminTopCities")}</h3>
        <RankList empty={t("adminNoData")} items={data.top_cities.map((item) => ({ label: cityById[item.id] ? local(cityById[item.id].name) : item.id, value: item.count }))} /></section>
      <section className="glass admin-panel-card"><h3>{t("adminTopPlaces")}</h3>
        <RankList empty={t("adminNoData")} items={data.top_places.map((item) => ({ label: placeById[item.id] ? local(placeById[item.id].title) : item.id, value: item.count }))} /></section>
    </div>
  </div>;
}

type Settings = { ai_daily_limit: number; guest_ai_daily_limit: number; ai_enabled: boolean; ai_model: string; maintenance_message: string; registration_open: boolean };

function AdminSettings({ onSaved }: { onSaved: () => void }) {
  const { t } = useTravel();
  const client = supabaseClient()!;
  const [settings, setSettings] = useState<Settings | null>(null);
  const [issue, setIssue] = useState<Message | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => {
    void client.from("app_settings").select("key, value").then(({ data }) => {
      const map = Object.fromEntries((data ?? []).map((row) => [row.key, row.value])) as Record<string, Json>;
      setSettings({
        ai_daily_limit: Number(map.ai_daily_limit ?? 15), guest_ai_daily_limit: Number(map.guest_ai_daily_limit ?? 3),
        ai_enabled: map.ai_enabled !== false, ai_model: typeof map.ai_model === "string" ? map.ai_model : "gpt-5.4-nano",
        maintenance_message: typeof map.maintenance_message === "string" ? map.maintenance_message : "", registration_open: map.registration_open !== false,
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;
    setBusy(true);
    setIssue(null);
    const rows: Database["public"]["Tables"]["app_settings"]["Insert"][] = [
      { key: "ai_daily_limit", value: Math.max(0, Math.min(1000, Math.round(settings.ai_daily_limit))) },
      { key: "guest_ai_daily_limit", value: Math.max(0, Math.min(50, Math.round(settings.guest_ai_daily_limit))) },
      { key: "ai_enabled", value: settings.ai_enabled },
      { key: "ai_model", value: settings.ai_model.trim() || "gpt-5.4-nano" },
      { key: "maintenance_message", value: settings.maintenance_message.trim() ? settings.maintenance_message.trim().slice(0, 300) : null },
      { key: "registration_open", value: settings.registration_open },
    ];
    const { error } = await client.from("app_settings").upsert(rows, { onConflict: "key" });
    setBusy(false);
    if (error) return setIssue(errorKey(error) as Message);
    setDone(true);
    onSaved();
    setTimeout(() => setDone(false), 2500);
  }

  if (!settings) return <div className="glass admin-panel-card skeleton-card" />;
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings((current) => current && { ...current, [key]: value });
  return <form className="admin-section glass admin-panel-card admin-settings" onSubmit={(event) => void save(event)}>
    <label className="field"><span>{t("adminDailyLimit")}</span>
      <input type="number" min={0} max={1000} value={settings.ai_daily_limit} onChange={(event) => set("ai_daily_limit", Number(event.target.value))} />
      <small className="field-hint">{t("adminDailyLimitHint")}</small></label>
    <label className="field"><span>{t("adminGuestLimit")}</span>
      <input type="number" min={0} max={50} value={settings.guest_ai_daily_limit} onChange={(event) => set("guest_ai_daily_limit", Number(event.target.value))} /></label>
    <label className="chip chip-check"><input type="checkbox" checked={settings.ai_enabled} onChange={(event) => set("ai_enabled", event.target.checked)} /><span className="chip-content">{t("adminAiEnabled")}</span></label>
    <label className="field"><span>{t("adminModel")}</span>
      <select value={settings.ai_model} onChange={(event) => set("ai_model", event.target.value)}>
        {["gpt-5.4-nano", "gpt-5.4-mini", "gpt-5.4"].map((model) => <option key={model} value={model}>{model}</option>)}
      </select></label>
    <label className="field"><span>{t("adminBanner")}</span>
      <textarea rows={2} maxLength={300} value={settings.maintenance_message} onChange={(event) => set("maintenance_message", event.target.value)} placeholder={t("adminBannerHint")} /></label>
    <label className="chip chip-check"><input type="checkbox" checked={settings.registration_open} onChange={(event) => set("registration_open", event.target.checked)} /><span className="chip-content">{t("adminRegistrationOpen")}</span></label>
    {issue && <p className="form-error" role="alert">{t(issue)}</p>}
    <button type="submit" className="button button-primary" disabled={busy}>{t(busy ? "working" : done ? "savedToast" : "save")}</button>
  </form>;
}

type LogRow = Database["public"]["Functions"]["admin_audit_log"]["Returns"][number];

function AdminLog() {
  const { t, language } = useTravel();
  const [actor, setActor] = useState("");
  const [table, setTable] = useState("");
  const [since, setSince] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<LogRow[] | null>(null);
  useEffect(() => {
    setRows(null);
    const timer = setTimeout(() => {
      void supabaseClient()!.rpc("admin_audit_log", { actor, table_filter: table, since: since ? new Date(since).toISOString() : undefined, page, page_size: 50 })
        .then(({ data }) => setRows(data ?? []));
    }, 250);
    return () => clearTimeout(timer);
  }, [actor, table, since, page]);
  const total = rows?.[0]?.total ?? 0;
  const changes = (row: LogRow) => {
    const before = (row.before ?? {}) as Record<string, Json>, after = (row.after ?? {}) as Record<string, Json>;
    return Object.keys({ ...before, ...after }).filter((key) => !["updated_at"].includes(key) && JSON.stringify(before[key]) !== JSON.stringify(after[key])).join(", ");
  };
  return <div className="admin-section">
    <div className="admin-toolbar">
      <label className="search-field glass"><Icon name="search" size={17} /><input type="search" value={actor} placeholder={t("adminWho")} aria-label={t("adminWho")} onChange={(event) => { setActor(event.target.value); setPage(0); }} /></label>
      <select className="admin-select" value={table} aria-label={t("adminWhat")} onChange={(event) => { setTable(event.target.value); setPage(0); }}>
        <option value="">{t("adminAllTables")}</option>
        {["places", "cities", "profiles", "app_settings"].map((name) => <option key={name} value={name}>{name}</option>)}
      </select>
      <label className="field admin-since"><span className="visually-hidden">{t("adminSince")}</span><input type="date" value={since} aria-label={t("adminSince")} onChange={(event) => { setSince(event.target.value); setPage(0); }} /></label>
    </div>
    <div className="admin-table-wrap glass">
      <table className="admin-table">
        <thead><tr><th>{t("adminWhen")}</th><th>{t("adminWho")}</th><th>{t("adminWhat")}</th><th>{t("adminRecord")}</th><th>{t("adminFields")}</th></tr></thead>
        <tbody>
          {rows === null ? <SkeletonRows columns={5} /> : rows.length === 0 ? <tr><td colSpan={5} className="admin-empty">{t("adminNoHistory")}</td></tr>
            : rows.map((row) => <tr key={row.id}>
              <td>{new Intl.DateTimeFormat(language, { dateStyle: "short", timeStyle: "short" }).format(new Date(row.created_at))}</td>
              <td>{row.actor_email ?? "SQL"}</td><td>{row.action} · {row.table_name}</td><td><code>{row.record_id}</code></td><td>{changes(row)}</td>
            </tr>)}
        </tbody>
      </table>
    </div>
    <div className="admin-pager">
      <button type="button" className="button button-small" disabled={page === 0} onClick={() => setPage((value) => value - 1)}><Icon name="back" size={15} />{t("adminPrev")}</button>
      <span>{fill("adminTotal", language, total)}</span>
      <button type="button" className="button button-small" disabled={(page + 1) * 50 >= total} onClick={() => setPage((value) => value + 1)}>{t("adminNext")}<Icon name="arrow" size={15} /></button>
    </div>
  </div>;
}
