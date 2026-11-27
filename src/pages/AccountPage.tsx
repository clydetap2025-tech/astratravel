import { useState } from "react";
import type { FormEvent } from "react";
import { languages, origins } from "../../data/catalog.js";
import { districts } from "../../data/districts.js";
import { fill } from "../../data/i18n.js";
import { useTravel } from "../shared/context";
import type { Language, Message, Session, Visitor } from "../shared/model";
import { errorKey, supabaseClient } from "../shared/supabase";
import type { LimitStatus } from "../shared/sync";
import { EmptyState, Icon, PageHeader, Section, SelectField } from "../shared/ui";

const DELETE_WORD: Record<Language, string> = { ru: "УДАЛИТЬ", kk: "ЖОЮ", en: "DELETE", ja: "削除" };

/** "AI today: N of 15 left", with when it renews. */
export function AiTodayCard({ limit }: { limit: LimitStatus | null }) {
  const { t, language } = useTravel();
  if (!limit) return null;
  return <div className="ai-today glass" data-low={limit.left <= 3 || undefined}>
    <Icon name="sparkles" size={20} />
    <div><strong>{fill("aiTodayLeft", language, limit.left, limit.limit)}</strong><small>{t("aiResetsAlmaty")}</small></div>
    <a className="button button-small" href="#assistant">{t("assistantOpen")}</a>
  </div>;
}

/** #account: name, language, country, guest or local, district, password, sign out everywhere, delete the account. */
export function AccountPage({ session, limit, onSignIn, onProfileName, onSignedOut }: {
  session: Session; limit: LimitStatus | null; onSignIn: () => void; onProfileName: (name: string) => void; onSignedOut: () => void;
}) {
  const { t, language, preferences, updatePreferences, country, notify } = useTravel();
  const client = supabaseClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [issue, setIssue] = useState<{ where: string; key: Message } | null>(null);
  const [confirmWord, setConfirmWord] = useState("");
  const user = session.user;

  if (!user || !client || !user.id) {
    return <>
      <PageHeader eyebrow={t("accountPage")} title={t("accountTitle")} lead={fill("authPerk", language, limit?.limit ?? 15)} />
      <EmptyState icon="user" title={t("accountSignedOut")} description={t("accountSignedOutBody")}>
        <button type="button" className="button button-primary" onClick={onSignIn}><Icon name="user" size={17} />{t("signIn")}</button>
      </EmptyState>
    </>;
  }
  const uid = user.id;

  async function run(where: string, job: () => Promise<{ error: unknown } | void>, done?: Message) {
    setBusy(where);
    setIssue(null);
    try {
      const result = await job();
      if (result && result.error) setIssue({ where, key: errorKey(result.error) as Message });
      else if (done) notify(t(done));
    } catch (error) {
      setIssue({ where, key: errorKey(error) as Message });
    } finally {
      setBusy(null);
    }
  }

  function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get("display_name") ?? "").trim().slice(0, 60);
    void run("name", async () => {
      const result = await client!.from("profiles").update({ display_name: name || null }).eq("id", uid);
      if (!result.error) onProfileName(name);
      return result;
    }, "savedToast");
  }

  function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("new_password") ?? "");
    if (password !== String(data.get("repeat_password") ?? "")) return setIssue({ where: "password", key: "passwordsDiffer" });
    void run("password", async () => {
      const result = await client!.auth.updateUser({ password });
      if (!result.error) form.reset();
      return result;
    }, "passwordChanged");
  }

  const issueFor = (where: string) => issue?.where === where && <p className="form-error" role="alert">{t(issue.key)}</p>;
  const word = DELETE_WORD[language];

  return <>
    <PageHeader eyebrow={t("accountPage")} title={user.displayName || t("accountTitle")} lead={user.email ?? undefined} />
    <AiTodayCard limit={limit} />
    <div className="account-grid">
      <Section id="account-profile" title={t("accountAbout")}>
        <form className="stack-form glass account-card" onSubmit={saveName}>
          <label className="field" htmlFor="display_name"><span>{t("displayName")}</span>
            <input id="display_name" name="display_name" defaultValue={user.displayName ?? ""} maxLength={60} autoComplete="nickname" />
          </label>
          <button type="submit" className="button button-primary" disabled={busy === "name"}>{t(busy === "name" ? "working" : "save")}</button>
          {issueFor("name")}
        </form>
        <div className="stack-form glass account-card">
          <SelectField id="account-language" label={t("language")} icon="globe" value={language} onChange={(value) => updatePreferences({ language: value as Language })}>
            {(Object.keys(languages) as Language[]).map((code) => <option key={code} value={code}>{languages[code]}</option>)}
          </SelectField>
          <fieldset className="field"><legend className="field-label">{t("accountWho")}</legend>
            <div className="segmented" role="radiogroup" aria-label={t("accountWho")}>
              {(["guest", "local"] as Visitor[]).map((value) => <button key={value} type="button" role="radio" aria-checked={preferences.visitor === value}
                onClick={() => updatePreferences({ visitor: value, ...(value === "guest" ? { district: "" } : { origin: "" }) })}>
                <span>{t(value === "guest" ? "visitorGuest" : "visitorLocal")}</span></button>)}
            </div>
          </fieldset>
          {preferences.visitor === "guest" && <SelectField id="account-origin" label={t("origin")} icon="plane" value={preferences.origin} onChange={(value) => updatePreferences({ origin: value })}>
            <option value="">{t("chooseCountry")}</option>
            {origins.map((code) => <option key={code} value={code}>{country(code)}</option>)}
          </SelectField>}
          {preferences.visitor === "local" && <SelectField id="account-district" label={t("district")} icon="home" value={preferences.district} onChange={(value) => updatePreferences({ district: value })}>
            <option value="">{t("chooseDistrict")}</option>
            {districts.map((district) => <option key={district.key} value={district.key}>{district.name[language]}</option>)}
          </SelectField>}
          <small className="field-hint">{t("accountSyncedHint")}</small>
        </div>
      </Section>
      <Section id="account-security" title={t("accountSecurity")}>
        <form className="stack-form glass account-card" onSubmit={changePassword}>
          <label className="field" htmlFor="new_password"><span>{t("newPassword")}</span>
            <input id="new_password" name="new_password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
          </label>
          <label className="field" htmlFor="repeat_password"><span>{t("repeatPassword")}</span>
            <input id="repeat_password" name="repeat_password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
          </label>
          <button type="submit" className="button" disabled={busy === "password"}>{t(busy === "password" ? "working" : "changePassword")}</button>
          {issueFor("password")}
        </form>
        <div className="stack-form glass account-card">
          <button type="button" className="button" disabled={busy === "global"} onClick={() => void run("global", async () => {
            const result = await client.auth.signOut({ scope: "global" });
            if (!result.error) onSignedOut();
            return result;
          })}><Icon name="lock" size={16} />{t("signOutEverywhere")}</button>
          {issueFor("global")}
        </div>
        <form className="stack-form glass account-card danger-zone" onSubmit={(event) => {
          event.preventDefault();
          if (confirmWord.trim().toUpperCase() !== word.toUpperCase()) return;
          void run("delete", async () => {
            const result = await client.rpc("delete_my_account");
            if (!result.error) { await client.auth.signOut({ scope: "local" }); onSignedOut(); notify(t("accountDeleted")); }
            return result;
          });
        }}>
          <h3>{t("deleteAccount")}</h3>
          <p>{t("deleteAccountBody")}</p>
          <label className="field" htmlFor="confirm_delete"><span>{fill("deleteTypeWord", language, word)}</span>
            <input id="confirm_delete" value={confirmWord} onChange={(event) => setConfirmWord(event.target.value)} autoComplete="off" spellCheck={false} />
          </label>
          <button type="submit" className="button button-danger" disabled={busy === "delete" || confirmWord.trim().toUpperCase() !== word.toUpperCase()}>
            <Icon name="trash" size={16} />{t("deleteAccount")}
          </button>
          {issueFor("delete")}
        </form>
      </Section>
    </div>
    <p className="legal-links"><a href="#privacy">{t("privacy")}</a> · <a href="#terms">{t("terms")}</a></p>
  </>;
}

/** #reset: the page the password e-mail opens. Supabase has signed the visitor in for this; they set a new password. */
export function ResetPage({ signedIn }: { signedIn: boolean }) {
  const { t, notify } = useTravel();
  const client = supabaseClient();
  const [busy, setBusy] = useState(false);
  const [issue, setIssue] = useState<Message | null>(null);
  const [reveal, setReveal] = useState(false);
  if (!client || !signedIn) {
    return <>
      <PageHeader eyebrow={t("accountPage")} title={t("resetTitle")} />
      <EmptyState icon="lock" title={t("resetExpired")} description={t("resetExpiredBody")} />
    </>;
  }
  return <>
    <PageHeader eyebrow={t("accountPage")} title={t("resetTitle")} lead={t("resetLead")} />
    <form className="stack-form glass account-card reset-card" onSubmit={(event) => {
      event.preventDefault();
      const password = String(new FormData(event.currentTarget).get("new_password") ?? "");
      setBusy(true);
      setIssue(null);
      void client.auth.updateUser({ password }).then(({ error }) => {
        setBusy(false);
        if (error) return setIssue(errorKey(error) as Message);
        notify(t("passwordChanged"));
        location.hash = "account";
      });
    }}>
      <label className="field" htmlFor="new_password"><span>{t("newPassword")}</span>
        <span className="password-wrap">
          <input id="new_password" name="new_password" type={reveal ? "text" : "password"} autoComplete="new-password" minLength={8} maxLength={128} required autoFocus />
          <button type="button" className="password-toggle" aria-pressed={reveal} aria-label={t(reveal ? "hidePassword" : "showPassword")}
            onClick={() => setReveal((value) => !value)}><Icon name={reveal ? "eyeOff" : "eye"} size={17} /></button>
        </span>
      </label>
      <small className="field-hint">{t("passwordRule")}</small>
      <button type="submit" className="button button-primary button-wide" disabled={busy}>{t(busy ? "working" : "saveNewPassword")}</button>
      {issue && <p className="form-error" role="alert">{t(issue)}</p>}
    </form>
  </>;
}
