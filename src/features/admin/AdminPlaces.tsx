import { useEffect, useMemo, useRef, useState } from "react";
import { categories, cities, cityById, languages } from "../../../data/catalog.js";
import { fill } from "../../../data/i18n.js";
import { useTravel } from "../../shared/context";
import type { Database } from "../../shared/database.types";
import type { Language, Message } from "../../shared/model";
import { errorKey, supabaseClient } from "../../shared/supabase";
import { CategoryIcon, Icon } from "../../shared/ui";
import { SkeletonRows, useAdminToast, useDebounced, useHotkey } from "./shared";

type Row = Database["public"]["Tables"]["places"]["Row"];
type Localized = Record<Language, string>;
type Draft = Omit<Row, "title" | "summary" | "tip" | "address" | "location" | "created_at" | "updated_at"> & {
  title: Localized; summary: Localized; tip: Localized; address: Localized; location: Localized; isNew?: boolean;
};
const TEXTS = ["title", "summary", "tip", "address", "location"] as const;
const ZONES = ["center", "outskirts", "hill", "mountains", "daytrip"] as const;
const LANGS = Object.keys(languages) as Language[];
const empty = (): Localized => ({ ru: "", kk: "", en: "", ja: "" });
const draftKey = (id: string) => "astratravel.admin-draft." + id;
const SIX_MONTHS = 1000 * 3600 * 24 * 182;
const today = () => new Date().toISOString().slice(0, 10);

function toDraft(row: Row): Draft {
  const text = (value: unknown) => ({ ...empty(), ...(value && typeof value === "object" ? value as Partial<Localized> : {}) });
  return { ...row, title: text(row.title), summary: text(row.summary), tip: text(row.tip), address: text(row.address), location: text(row.location) };
}

function newDraft(city: string): Draft {
  return {
    id: "", city_id: city, category: "city", zone: "center", minutes: 60, cost_kzt: null, title: empty(), summary: empty(), tip: empty(),
    address: empty(), location: empty(), map_query: "", source_url: "https://", has_photo: false, map_x: null, map_y: null, sort_order: 999,
    is_published: false, checked_at: null, photo_url: null, photo_author: null, photo_license: null, photo_page: null, photo_kind: null,
    lat: null, lng: null, twogis_url: null, isNew: true,
  };
}

/** What goes to the database: the editable columns only. */
function payload(draft: Draft) {
  const { isNew: _isNew, ...rest } = draft;
  void _isNew;
  return {
    ...rest,
    map_query: rest.map_query || rest.title.ru,
    photo_url: rest.photo_url || null, photo_author: rest.photo_author || null, photo_license: rest.photo_license || null,
    photo_page: rest.photo_page || null, twogis_url: rest.twogis_url || null,
  };
}

/** Crops a picture to 4:3 in the browser and returns WebP, at most 1600 px wide. */
async function cropToWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const ratio = 4 / 3;
  let width = bitmap.width, height = Math.round(bitmap.width / ratio);
  if (height > bitmap.height) { height = bitmap.height; width = Math.round(height * ratio); }
  const scale = Math.min(1, 1600 / width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, (bitmap.width - width) / 2, (bitmap.height - height) / 2, width, height, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("crop")), "image/webp", 0.86));
}

/** A dot on a box around Kazakhstan (lat 40–56, lng 46–88), to see at a glance whether the coordinates are right. */
function CoordPreview({ lat, lng, label }: { lat: number | null; lng: number | null; label: string }) {
  const inside = lat !== null && lng !== null && lat >= 40 && lat <= 56 && lng >= 46 && lng <= 88;
  const x = inside ? ((lng! - 46) / 42) * 300 : 0;
  const y = inside ? ((56 - lat!) / 16) * 120 : 0;
  return <div className="coord-preview">
    <svg viewBox="0 0 300 120" role="img" aria-label={label}>
      <rect x="0.5" y="0.5" width="299" height="119" rx="10" className="coord-box" />
      {cities.map((city) => <circle key={city.id} cx={((city.lng - 46) / 42) * 300} cy={((56 - city.lat) / 16) * 120} r="2" className="coord-city" />)}
      {inside && <circle cx={x} cy={y} r="6" className="coord-pin" />}
    </svg>
    {lat !== null && lng !== null && <a className="text-link" href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`} target="_blank" rel="noopener">
      <Icon name="map" size={14} />OpenStreetMap</a>}
  </div>;
}

/** Places and cities: a table with search and filters, and an editor with tabs per language, photo upload, preview and autosave. */
export function AdminPlaces() {
  const { t, language, price, span } = useTravel();
  const toast = useAdminToast();
  const client = supabaseClient()!;
  const [rows, setRows] = useState<Row[] | null>(null);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [noPhoto, setNoPhoto] = useState(false);
  const [stale, setStale] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [original, setOriginal] = useState<string>("");
  const [tab, setTab] = useState<Language>("ru");
  const [busy, setBusy] = useState(false);
  const [issue, setIssue] = useState<Message | null>(null);
  const [reload, setReload] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const query = useDebounced(search).trim().toLowerCase();
  const dirty = draft !== null && JSON.stringify(draft) !== original;

  useEffect(() => {
    void client.from("places").select("*").order("city_id").order("sort_order").then(({ data, error }) => {
      if (error) setIssue(errorKey(error) as Message);
      setRows(data ?? []);
    });
  }, [reload]); // eslint-disable-line react-hooks/exhaustive-deps

  // Unsaved changes: autosave a draft in this browser and warn before leaving.
  useEffect(() => {
    if (!draft || !dirty) return;
    const timer = setTimeout(() => { try { localStorage.setItem(draftKey(draft.id || "new"), JSON.stringify(draft)); } catch { /* Optional. */ } }, 600);
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => { clearTimeout(timer); window.removeEventListener("beforeunload", warn); };
  }, [draft, dirty]);

  useHotkey("/", () => searchRef.current?.focus());
  useHotkey("n", () => edit(null));
  useHotkey("s", () => void save(), { ctrl: true, enabled: Boolean(draft) });
  useHotkey("s", () => void save(), { enabled: Boolean(draft) });
  useHotkey("Escape", () => close(), { enabled: Boolean(draft) });

  const list = useMemo(() => (rows ?? []).filter((row) => {
    const title = row.title as Localized;
    if (query && !(row.id.includes(query) || LANGS.some((code) => title[code]?.toLowerCase().includes(query)))) return false;
    if (city && row.city_id !== city) return false;
    if (category && row.category !== category) return false;
    if (noPhoto && row.photo_url) return false;
    if (stale && row.checked_at && Date.now() - new Date(row.checked_at).getTime() < SIX_MONTHS) return false;
    return true;
  }), [rows, query, city, category, noPhoto, stale]);

  function edit(row: Row | null) {
    if (dirty && !confirm(t("adminUnsavedLeave"))) return;
    const base = row ? toDraft(row) : newDraft(city || "almaty");
    setOriginal(JSON.stringify(base));
    let saved: Draft | null = null;
    try { saved = JSON.parse(localStorage.getItem(draftKey(row?.id ?? "new")) ?? "null"); } catch { /* Optional. */ }
    if (saved && JSON.stringify(saved) !== JSON.stringify(base) && confirm(t("adminRestoreDraft"))) setDraft(saved);
    else setDraft(base);
    setTab("ru");
    setIssue(null);
  }

  function close() {
    if (dirty && !confirm(t("adminUnsavedLeave"))) return;
    setDraft(null);
  }

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => current && { ...current, [key]: value });
  const setText = (key: typeof TEXTS[number], value: string) => setDraft((current) => current && { ...current, [key]: { ...current[key], [tab]: value } });

  async function save() {
    if (!draft || busy) return;
    const missing = TEXTS.some((key) => key !== "location" && LANGS.some((code) => !draft[key][code].trim()));
    if (!/^[a-z0-9-]{2,40}$/.test(draft.id)) return setIssue("adminBadId");
    if (missing) return setIssue("adminFillLanguages");
    if (draft.photo_url && (!draft.photo_author?.trim() || !draft.photo_license?.trim())) return setIssue("adminPhotoCredit");
    setBusy(true);
    setIssue(null);
    const before = rows?.find((row) => row.id === draft.id) ?? null;
    const body = payload(draft);
    const result = draft.isNew ? await client.from("places").insert(body).select().single() : await client.from("places").update(body).eq("id", draft.id).select().single();
    setBusy(false);
    if (result.error) return setIssue(errorKey(result.error) as Message);
    try { localStorage.removeItem(draftKey(draft.isNew ? "new" : draft.id)); } catch { /* Optional. */ }
    const savedDraft = toDraft(result.data);
    setDraft(savedDraft);
    setOriginal(JSON.stringify(savedDraft));
    setReload((value) => value + 1);
    toast(t("savedToast"), before ? async () => {
      const { created_at: _c, updated_at: _u, ...restore } = before;
      void _c; void _u;
      await client.from("places").update(restore).eq("id", before.id);
      setDraft(null);
      setReload((value) => value + 1);
    } : undefined);
  }

  /** Undo the last change of this place, whoever made it, from the audit log. */
  async function undoLast() {
    if (!draft || draft.isNew) return;
    const { data, error } = await client.from("audit_log").select("before, created_at").eq("table_name", "places").eq("record_id", draft.id)
      .eq("action", "update").order("created_at", { ascending: false }).limit(1);
    if (error || !data?.[0]?.before) return setIssue(error ? errorKey(error) as Message : "adminNothingToUndo");
    if (!confirm(fill("adminUndoConfirm", language, new Intl.DateTimeFormat(language, { dateStyle: "medium", timeStyle: "short" }).format(new Date(data[0].created_at))))) return;
    const { created_at: _c, updated_at: _u, ...restore } = data[0].before as unknown as Row;
    void _c; void _u;
    const result = await client.from("places").update(restore).eq("id", draft.id).select().single();
    if (result.error) return setIssue(errorKey(result.error) as Message);
    const restored = toDraft(result.data);
    setDraft(restored);
    setOriginal(JSON.stringify(restored));
    setReload((value) => value + 1);
    toast(t("adminUndone"));
  }

  async function upload(file: File | undefined) {
    if (!file || !draft) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 15 * 1024 * 1024) return setIssue("adminPhotoType");
    setBusy(true);
    try {
      const blob = await cropToWebp(file);
      if (blob.size > 5 * 1024 * 1024) throw new Error("adminPhotoType");
      const path = (draft.id || "new") + "/" + Date.now() + ".webp";
      const { error } = await client.storage.from("place-photos").upload(path, blob, { contentType: "image/webp", upsert: false });
      if (error) throw error;
      const url = client.storage.from("place-photos").getPublicUrl(path).data.publicUrl;
      setDraft((current) => current && { ...current, photo_url: url, photo_kind: current.photo_kind ?? "place", has_photo: true });
    } catch (error) {
      setIssue(error instanceof Error && error.message === "adminPhotoType" ? "adminPhotoType" : errorKey(error) as Message);
    } finally {
      setBusy(false);
    }
  }

  return <div className="admin-section admin-places" data-editing={draft ? true : undefined}>
    <div className="admin-toolbar">
      <label className="search-field glass"><Icon name="search" size={17} />
        <input ref={searchRef} type="search" value={search} placeholder={t("adminSearchPlaces")} aria-label={t("adminSearchPlaces")} onChange={(event) => setSearch(event.target.value)} />
        <kbd>/</kbd>
      </label>
      <select className="admin-select" value={city} aria-label={t("city")} onChange={(event) => setCity(event.target.value)}>
        <option value="">{t("adminAllCities")}</option>
        {cities.map((item) => <option key={item.id} value={item.id}>{item.name[language]}</option>)}
      </select>
      <select className="admin-select" value={category} aria-label={t("categories")} onChange={(event) => setCategory(event.target.value)}>
        <option value="">{t("adminAllCategories")}</option>
        {categories.map((item) => <option key={item} value={item}>{t(item as Message)}</option>)}
      </select>
      <label className="chip chip-check"><input type="checkbox" checked={noPhoto} onChange={(event) => setNoPhoto(event.target.checked)} /><span className="chip-content">{t("adminNoPhoto")}</span></label>
      <label className="chip chip-check"><input type="checkbox" checked={stale} onChange={(event) => setStale(event.target.checked)} /><span className="chip-content">{t("adminStale")}</span></label>
      <button type="button" className="button button-small button-primary" onClick={() => edit(null)}><Icon name="plus" size={15} />{t("adminNewPlace")} <kbd>n</kbd></button>
    </div>
    {issue && !draft && <p className="form-error" role="alert">{t(issue)}</p>}
    <div className="admin-split">
      <div className="admin-table-wrap glass">
        <table className="admin-table">
          <thead><tr><th>{t("adminPlace")}</th><th>{t("city")}</th><th>{t("adminPhoto")}</th><th>{t("adminChecked")}</th><th>{t("adminPublished")}</th></tr></thead>
          <tbody>
            {rows === null ? <SkeletonRows columns={5} /> : list.length === 0 ? <tr><td colSpan={5} className="admin-empty">{t("adminNoPlaces")}</td></tr>
              : list.map((row) => <tr key={row.id} aria-selected={draft?.id === row.id || undefined}>
                <td><button type="button" className="text-link" onClick={() => edit(row)}><CategoryIcon category={row.category} size={15} />{(row.title as Localized)[language]}</button></td>
                <td>{cityById[row.city_id]?.name[language] ?? row.city_id}</td>
                <td>{row.photo_url ? <Icon name="camera" size={15} /> : <span className="badge badge-warn">{t("adminNoPhotoShort")}</span>}</td>
                <td>{row.checked_at ?? <span className="muted">—</span>}</td>
                <td>{row.is_published ? <Icon name="check" size={15} /> : <span className="badge">{t("adminHidden")}</span>}</td>
              </tr>)}
          </tbody>
        </table>
      </div>
      {draft && <form className="admin-editor glass" onSubmit={(event) => { event.preventDefault(); void save(); }} aria-label={t("adminEditPlace")}>
        <div className="admin-drawer-head">
          <h3>{draft.isNew ? t("adminNewPlace") : draft.title[language] || draft.id}{dirty && <span className="badge badge-warn">{t("adminUnsaved")}</span>}</h3>
          <button type="button" className="icon-button" aria-label={t("close")} onClick={close}><Icon name="x" /></button>
        </div>
        <div className="admin-form-grid">
          <label className="field"><span>ID</span>
            <input value={draft.id} disabled={!draft.isNew} pattern="[a-z0-9-]{2,40}" required onChange={(event) => set("id", event.target.value.toLowerCase())} />
          </label>
          <label className="field"><span>{t("city")}</span>
            <select value={draft.city_id} onChange={(event) => set("city_id", event.target.value)}>
              {cities.map((item) => <option key={item.id} value={item.id}>{item.name[language]}</option>)}
            </select>
          </label>
          <label className="field"><span>{t("categories")}</span>
            <select value={draft.category} onChange={(event) => set("category", event.target.value as Draft["category"])}>
              {categories.map((item) => <option key={item} value={item}>{t(item as Message)}</option>)}
            </select>
          </label>
          <label className="field"><span>{t("adminZone")}</span>
            <select value={draft.zone} onChange={(event) => set("zone", event.target.value as Draft["zone"])}>
              {ZONES.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
            </select>
          </label>
          <label className="field"><span>{t("adminMinutes")}</span>
            <input type="number" min={15} max={720} step={5} value={draft.minutes} onChange={(event) => set("minutes", Number(event.target.value))} />
          </label>
          <label className="field"><span>{t("adminPrice")}</span>
            <input type="number" min={0} step={100} value={draft.cost_kzt ?? ""} placeholder={t("priceUnknown")}
              onChange={(event) => set("cost_kzt", event.target.value === "" ? null : Math.max(0, Number(event.target.value)))} />
          </label>
        </div>
        <div className="segmented admin-lang-tabs" role="tablist" aria-label={t("language")}>
          {LANGS.map((code) => <button key={code} type="button" role="tab" aria-selected={tab === code} aria-checked={tab === code}
            data-missing={TEXTS.some((key) => key !== "location" && !draft[key][code].trim()) || undefined}
            onClick={() => setTab(code)}><span>{languages[code]}</span></button>)}
        </div>
        <div className="admin-texts" role="tabpanel" lang={tab}>
          <label className="field"><span>{t("adminTitle")}</span><input value={draft.title[tab]} maxLength={120} onChange={(event) => setText("title", event.target.value)} /></label>
          <label className="field"><span>{t("adminSummary")}</span><textarea rows={3} value={draft.summary[tab]} maxLength={400} onChange={(event) => setText("summary", event.target.value)} /></label>
          <label className="field"><span>{t("adminTip")}</span><textarea rows={2} value={draft.tip[tab]} maxLength={300} onChange={(event) => setText("tip", event.target.value)} /></label>
          <label className="field"><span>{t("adminAddress")}</span><input value={draft.address[tab]} maxLength={160} onChange={(event) => setText("address", event.target.value)} /></label>
          <label className="field"><span>{t("adminLocation")}</span><input value={draft.location[tab]} maxLength={120} onChange={(event) => setText("location", event.target.value)} /></label>
        </div>
        <div className="admin-form-grid">
          <label className="field"><span>{t("adminLat")}</span>
            <input type="number" step="0.000001" min={-90} max={90} value={draft.lat ?? ""} onChange={(event) => set("lat", event.target.value === "" ? null : Number(event.target.value))} /></label>
          <label className="field"><span>{t("adminLng")}</span>
            <input type="number" step="0.000001" min={-180} max={180} value={draft.lng ?? ""} onChange={(event) => set("lng", event.target.value === "" ? null : Number(event.target.value))} /></label>
          <label className="field"><span>2GIS</span>
            <input type="url" value={draft.twogis_url ?? ""} placeholder="https://2gis.kz/…" onChange={(event) => set("twogis_url", event.target.value || null)} /></label>
          <label className="field"><span>{t("adminSource")}</span>
            <input type="url" value={draft.source_url} required onChange={(event) => set("source_url", event.target.value)} /></label>
        </div>
        <CoordPreview lat={draft.lat} lng={draft.lng} label={t("adminCoordPreview")} />
        <fieldset className="admin-photo">
          <legend>{t("adminPhoto")}</legend>
          {draft.photo_url && <img src={draft.photo_url.startsWith("/") ? draft.photo_url : draft.photo_url} alt="" width={240} height={180} />}
          <label className="button button-small"><Icon name="camera" size={15} />{t("adminUpload")}
            <input type="file" accept="image/webp,image/jpeg,image/png" className="visually-hidden" onChange={(event) => void upload(event.target.files?.[0])} />
          </label>
          <small className="field-hint">{t("adminUploadHint")}</small>
          <div className="admin-form-grid">
            <label className="field"><span>{t("adminPhotoAuthor")} *</span><input value={draft.photo_author ?? ""} maxLength={200} onChange={(event) => set("photo_author", event.target.value || null)} /></label>
            <label className="field"><span>{t("adminPhotoLicense")} *</span><input value={draft.photo_license ?? ""} maxLength={80} placeholder="CC BY-SA 4.0" onChange={(event) => set("photo_license", event.target.value || null)} /></label>
            <label className="field"><span>{t("adminPhotoPage")}</span><input type="url" value={draft.photo_page ?? ""} onChange={(event) => set("photo_page", event.target.value || null)} /></label>
            <label className="field"><span>{t("adminPhotoKind")}</span>
              <select value={draft.photo_kind ?? "place"} onChange={(event) => set("photo_kind", event.target.value)}>
                <option value="place">{t("adminKindPlace")}</option><option value="city">{t("photoOfCity")}</option><option value="dish">{t("photoOfDish")}</option>
              </select></label>
          </div>
        </fieldset>
        <div className="admin-checks">
          <label className="chip chip-check"><input type="checkbox" checked={draft.is_published} onChange={(event) => set("is_published", event.target.checked)} /><span className="chip-content">{t("adminPublished")}</span></label>
          <button type="button" className="button button-small" onClick={() => set("checked_at", today())}><Icon name="check" size={15} />{t("adminCheckedToday")}</button>
          {draft.checked_at && <small className="muted">{t("adminChecked")}: {draft.checked_at}</small>}
        </div>
        <h4>{t("adminPreview")}</h4>
        <article className="place-card admin-preview glass">
          {draft.photo_url ? <img className="place-image" src={draft.photo_url} alt="" width={320} height={240} /> : <div className="admin-preview-blank"><CategoryIcon category={draft.category} size={28} /></div>}
          <div className="place-card-body">
            <small className="muted">{cityById[draft.city_id]?.name[language]}</small>
            <h3>{draft.title[language] || "—"}</h3>
            <p>{draft.summary[language]}</p>
            <p className="place-meta"><Icon name="clock" size={14} />{span(draft.minutes)} · {price(draft.cost_kzt)}</p>
          </div>
        </article>
        {issue && <p className="form-error" role="alert">{t(issue)}</p>}
        <div className="admin-editor-actions">
          <button type="submit" className="button button-primary" disabled={busy || !dirty}>{t(busy ? "working" : "save")} <kbd>s</kbd></button>
          {!draft.isNew && <button type="button" className="button" onClick={() => void undoLast()}><Icon name="back" size={15} />{t("adminUndoLast")}</button>}
          <button type="button" className="button" onClick={close}>{t("close")}</button>
        </div>
      </form>}
    </div>
  </div>;
}
