import { useEffect, useRef, useState } from "react";
import { cityById } from "../../../data/catalog.js";
import { fill } from "../../../data/i18n.js";
import { useTravel } from "../../shared/context";
import type { Database, Json } from "../../shared/database.types";
import type { Message, Role } from "../../shared/model";
import { errorKey, supabaseClient } from "../../shared/supabase";
import { Icon } from "../../shared/ui";
import { BarChart, SkeletonRows, useAdminToast, useDebounced, useHotkey } from "./shared";

type UserRow = Database["public"]["Functions"]["admin_users"]["Returns"][number];
type Detail = {
  email: string; created_at: string; last_sign_in_at: string | null; confirmed_at: string | null;
  used_today: number; limit_today: number;
  profile: { origin: string | null; city_id: string | null; visitor: string | null; display_name: string | null };
  messages_by_day: { day: string; count: number }[];
  history: { at: string; actor: string | null; before: Record<string, Json>; after: Record<string, Json> }[];
};
const PAGE = 25;

/** Users: search by e-mail or name, filters, sorting, pages; actions per row and for a selection; a card per user. */
export function AdminUsers() {
  const { t, language, country } = useTravel();
  const toast = useAdminToast();
  const client = supabaseClient()!;
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [limitHit, setLimitHit] = useState(false);
  const [sort, setSort] = useState("created_desc");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<UserRow[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<UserRow | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [issue, setIssue] = useState<Message | null>(null);
  const [reload, setReload] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const query = useDebounced(search);
  useHotkey("/", () => searchRef.current?.focus());

  useEffect(() => {
    let live = true;
    setRows(null);
    void client.rpc("admin_users", { search: query, role_filter: role, blocked_only: blockedOnly, limit_hit_only: limitHit, sort, page, page_size: PAGE })
      .then(({ data, error }) => { if (!live) return; if (error) setIssue(errorKey(error) as Message); setRows(data ?? []); });
    return () => { live = false; };
  }, [query, role, blockedOnly, limitHit, sort, page, reload]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return setDetail(null);
    void client.rpc("admin_user_detail", { user_id: open.id }).then(({ data }) => setDetail(data as unknown as Detail));
  }, [open, reload]); // eslint-disable-line react-hooks/exhaustive-deps

  const total = rows?.[0]?.total ?? 0;
  const date = (value: string | null) => value ? new Intl.DateTimeFormat(language, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";

  /** Changes privileged profile fields of some users; the old values come back with "Undo". */
  async function update(ids: string[], changes: Database["public"]["Tables"]["profiles"]["Update"], done: Message) {
    const before = (rows ?? []).filter((row) => ids.includes(row.id));
    const { error } = await client.from("profiles").update(changes).in("id", ids);
    if (error) return setIssue(errorKey(error) as Message);
    setReload((value) => value + 1);
    toast(fill(done, language, ids.length), async () => {
      for (const row of before) {
        await client.from("profiles").update({
          role: row.role, blocked_at: row.blocked_at, blocked_reason: row.blocked_reason, ai_daily_limit: row.ai_daily_limit,
        }).eq("id", row.id);
      }
      setReload((value) => value + 1);
    });
  }

  function block(ids: string[]) {
    const reason = prompt(t("adminBlockReason"));
    if (reason === null) return;
    void update(ids, { blocked_at: new Date().toISOString(), blocked_reason: reason.slice(0, 300) || null }, "adminBlockedN");
  }
  const unblock = (ids: string[]) => void update(ids, { blocked_at: null, blocked_reason: null }, "adminUnblockedN");
  const resetToday = (ids: string[]) => void update(ids, { ai_reset_at: new Date().toISOString() }, "adminResetN");
  function setRoleFor(ids: string[], next: Role) {
    if (next === "admin" && !confirm(t("adminConfirmAdmin"))) return;
    void update(ids, { role: next }, "adminRoleN");
  }
  function setLimitFor(ids: string[]) {
    const value = prompt(t("adminLimitPrompt"));
    if (value === null) return;
    const number = value.trim() === "" ? null : Math.max(0, Math.min(1000, Math.round(Number(value))));
    if (number !== null && Number.isNaN(number)) return;
    void update(ids, { ai_daily_limit: number }, "adminLimitN");
  }
  async function sendReset(email: string) {
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: location.origin + "/?reset=1" });
    if (error) return setIssue(errorKey(error) as Message);
    toast(t("adminResetSent"));
  }

  const ids = [...selected];
  const allOnPage = rows?.length ? rows.every((row) => selected.has(row.id)) : false;

  return <div className="admin-section">
    <div className="admin-toolbar">
      <label className="search-field glass"><Icon name="search" size={17} />
        <input ref={searchRef} type="search" value={search} placeholder={t("adminSearchUsers")} aria-label={t("adminSearchUsers")}
          onChange={(event) => { setSearch(event.target.value); setPage(0); }} />
        <kbd>/</kbd>
      </label>
      <select className="admin-select" value={role} aria-label={t("adminRole")} onChange={(event) => { setRole(event.target.value); setPage(0); }}>
        <option value="">{t("adminAllRoles")}</option>
        <option value="user">{t("roleUser")}</option><option value="editor">{t("roleEditor")}</option><option value="admin">{t("roleAdmin")}</option>
      </select>
      <label className="chip chip-check"><input type="checkbox" checked={blockedOnly} onChange={(event) => { setBlockedOnly(event.target.checked); setPage(0); }} /><span className="chip-content">{t("adminBlockedOnly")}</span></label>
      <label className="chip chip-check"><input type="checkbox" checked={limitHit} onChange={(event) => { setLimitHit(event.target.checked); setPage(0); }} /><span className="chip-content">{t("adminLimitHit")}</span></label>
      <select className="admin-select" value={sort} aria-label={t("adminSort")} onChange={(event) => setSort(event.target.value)}>
        <option value="created_desc">{t("adminSortNew")}</option><option value="created_asc">{t("adminSortOld")}</option>
        <option value="seen_desc">{t("adminSortSeen")}</option><option value="used_desc">{t("adminSortUsed")}</option><option value="email_asc">{t("adminSortEmail")}</option>
      </select>
    </div>
    {ids.length > 0 && <div className="admin-bulk glass" role="region" aria-label={t("adminSelection")}>
      <strong>{fill("adminSelected", language, ids.length)}</strong>
      <button type="button" className="button button-small" onClick={() => block(ids)}>{t("adminBlock")}</button>
      <button type="button" className="button button-small" onClick={() => unblock(ids)}>{t("adminUnblock")}</button>
      <button type="button" className="button button-small" onClick={() => resetToday(ids)}>{t("adminResetToday")}</button>
      <button type="button" className="button button-small" onClick={() => setLimitFor(ids)}>{t("adminSetLimit")}</button>
      <button type="button" className="button button-small" onClick={() => setSelected(new Set())}>{t("adminClearSelection")}</button>
    </div>}
    {issue && <p className="form-error" role="alert">{t(issue)}</p>}
    <div className="admin-table-wrap glass">
      <table className="admin-table">
        <thead><tr>
          <th><input type="checkbox" checked={allOnPage} aria-label={t("adminSelectPage")} onChange={(event) => setSelected((current) => {
            const next = new Set(current);
            for (const row of rows ?? []) { if (event.target.checked) next.add(row.id); else next.delete(row.id); }
            return next;
          })} /></th>
          <th>{t("email")}</th><th>{t("adminRole")}</th><th>{t("adminStatus")}</th><th>{t("adminAiToday")}</th><th>{t("adminLastSeen")}</th><th><span className="visually-hidden">{t("adminActions")}</span></th>
        </tr></thead>
        <tbody>
          {rows === null ? <SkeletonRows columns={7} /> : rows.length === 0 ? <tr><td colSpan={7} className="admin-empty">{t("adminNoUsers")}</td></tr>
            : rows.map((row) => <tr key={row.id} aria-selected={open?.id === row.id || undefined}>
              <td><input type="checkbox" checked={selected.has(row.id)} aria-label={row.email} onChange={(event) => setSelected((current) => {
                const next = new Set(current);
                if (event.target.checked) next.add(row.id); else next.delete(row.id);
                return next;
              })} /></td>
              <td><button type="button" className="text-link" onClick={() => setOpen(row)}>{row.email}</button>{row.display_name && <small className="muted"> · {row.display_name}</small>}</td>
              <td><select className="admin-select admin-select-small" value={row.role} aria-label={t("adminRole")} onChange={(event) => setRoleFor([row.id], event.target.value as Role)}>
                <option value="user">{t("roleUser")}</option><option value="editor">{t("roleEditor")}</option><option value="admin">{t("roleAdmin")}</option>
              </select></td>
              <td>{row.blocked_at ? <span className="badge badge-warn" title={row.blocked_reason ?? ""}>{t("adminBlocked")}</span> : <span className="badge">{t("adminActive")}</span>}</td>
              <td><span data-full={row.used_today >= row.limit_today || undefined} className="usage">{row.used_today} / {row.limit_today}</span>{row.ai_daily_limit !== null && <small className="muted"> {t("adminOwnLimit")}</small>}</td>
              <td>{date(row.last_seen_at)}</td>
              <td className="admin-row-actions">
                <button type="button" className="icon-button" aria-label={t(row.blocked_at ? "adminUnblock" : "adminBlock")} title={t(row.blocked_at ? "adminUnblock" : "adminBlock")}
                  onClick={() => row.blocked_at ? unblock([row.id]) : block([row.id])}><Icon name="lock" size={15} /></button>
                <button type="button" className="icon-button" aria-label={t("adminResetToday")} title={t("adminResetToday")} onClick={() => resetToday([row.id])}><Icon name="clock" size={15} /></button>
                <button type="button" className="icon-button" aria-label={t("adminSetLimit")} title={t("adminSetLimit")} onClick={() => setLimitFor([row.id])}><Icon name="sparkles" size={15} /></button>
                <button type="button" className="icon-button" aria-label={t("adminSendReset")} title={t("adminSendReset")} onClick={() => void sendReset(row.email)}><Icon name="external" size={15} /></button>
              </td>
            </tr>)}
        </tbody>
      </table>
    </div>
    <div className="admin-pager">
      <button type="button" className="button button-small" disabled={page === 0} onClick={() => setPage((value) => value - 1)}><Icon name="back" size={15} />{t("adminPrev")}</button>
      <span>{fill("adminPageOf", language, page + 1, Math.max(1, Math.ceil(total / PAGE)))} · {fill("adminTotal", language, total)}</span>
      <button type="button" className="button button-small" disabled={(page + 1) * PAGE >= total} onClick={() => setPage((value) => value + 1)}>{t("adminNext")}<Icon name="arrow" size={15} /></button>
    </div>
    {open && <aside className="admin-drawer glass" aria-label={open.email}>
      <div className="admin-drawer-head"><h3>{open.email}</h3><button type="button" className="icon-button" aria-label={t("close")} onClick={() => setOpen(null)}><Icon name="x" /></button></div>
      {!detail ? <div className="skeleton-list" aria-hidden="true"><span /><span /><span /></div> : <>
        <dl className="admin-facts">
          <dt>{t("adminCreated")}</dt><dd>{date(detail.created_at)}</dd>
          <dt>{t("adminLastSignIn")}</dt><dd>{date(detail.last_sign_in_at)}</dd>
          <dt>{t("adminConfirmed")}</dt><dd>{detail.confirmed_at ? date(detail.confirmed_at) : t("no")}</dd>
          <dt>{t("origin")}</dt><dd>{detail.profile.origin ? country(detail.profile.origin) : "—"}</dd>
          <dt>{t("city")}</dt><dd>{detail.profile.city_id && cityById[detail.profile.city_id] ? cityById[detail.profile.city_id].name[language] : "—"}</dd>
          <dt>{t("adminAiToday")}</dt><dd>{detail.used_today} / {detail.limit_today}</dd>
        </dl>
        <h4>{t("adminMessages14")}</h4>
        <BarChart label={t("adminMessages14")} data={detail.messages_by_day.map((item) => ({ label: item.day.slice(8, 10), value: item.count }))} />
        <h4>{t("adminHistory")}</h4>
        {detail.history.length === 0 ? <p className="muted">{t("adminNoHistory")}</p> : <ul className="admin-history">{detail.history.map((item) => <li key={item.at}>
          <small>{date(item.at)} · {item.actor ?? "SQL"}</small>
          <span>{Object.keys(item.after).filter((key) => JSON.stringify(item.after[key]) !== JSON.stringify(item.before[key]))
            .map((key) => key + ": " + JSON.stringify(item.before[key]) + " → " + JSON.stringify(item.after[key])).join("; ")}</span>
        </li>)}</ul>}
        <button type="button" className="button button-small" onClick={() => void sendReset(open.email)}><Icon name="external" size={15} />{t("adminSendReset")}</button>
      </>}
    </aside>}
  </div>;
}
