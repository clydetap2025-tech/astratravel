import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useTravel } from "../../shared/context";
import type { Api, AuthAction, Credentials, Page, Session } from "../../shared/model";
import { GlassIcon, Icon } from "../../shared/ui";

const LAST_USER = "astratravel.username";
const rememberedName = () => { try { return localStorage.getItem(LAST_USER) ?? ""; } catch { return ""; } };

/**
 * Sign in, fast: one tap without an account comes first; below it a single form that switches
 * between signing in and creating an account in place, remembers the last username, focuses the
 * first empty field and can show the password.
 */
export function Account({ session, api, page, onChange }: { session: Session; api: Api; page: Page; onChange: (session: Session) => void }) {
  const { t, errorText } = useTravel();
  const [registration, setRegistration] = useState(() => !rememberedName());
  const [busy, setBusy] = useState(false);
  const [issue, setIssue] = useState<unknown>(null);
  const [reveal, setReveal] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session.user || session.mode !== "local") return;
    (nameRef.current?.value ? passRef.current : nameRef.current)?.focus({ preventScroll: true });
  }, [registration, session.user, session.mode]);

  async function send(action: AuthAction, credentials?: Credentials) {
    if (busy) return;
    setBusy(true);
    setIssue(null);
    try {
      onChange(await api(action, credentials ?? {}));
      if (credentials?.username) { try { localStorage.setItem(LAST_USER, credentials.username); } catch { /* Optional. */ } }
    }
    catch (error) { setIssue(error); }
    finally { setBusy(false); }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void send(registration ? "register" : "login", {
      username: String(data.get("username") ?? "").trim(), password: String(data.get("password") ?? ""),
    });
  }

  if (session.user) {
    return <div className="dialog-body auth-dialog">
      <GlassIcon name="user" tone="accent" />
      <h2 id="dialog-title">{t("profile")}</h2>
      {session.user.username ? <p>{session.user.username}</p> : session.mode !== "sites" && <p>{t("demoAccount")}</p>}
      <button type="button" className="button" disabled={busy} onClick={() => void send("logout")}>{t("signOut")}</button>
      {issue != null && <p className="form-error" role="alert">{errorText(issue)}</p>}
    </div>;
  }

  return <div className="dialog-body auth-dialog">
    <h2 id="dialog-title">{t("authTitle")}</h2>
    <p>{t(session.mode === "offline" ? "offlineSignIn" : "authIntro")}</p>
    {session.mode === "sites" ? (session.canActivate ?
      <button type="button" className="button button-primary auth-fast" disabled={busy} onClick={() => void send("activate")}>{t("sitesSignIn")}</button> :
      <a className="button button-primary auth-fast" href="/signin-with-chatgpt" target="_top" onClick={() => {
        try { sessionStorage.setItem("astratravel.signin-page", page); } catch { /* Optional return location. */ }
      }}>{t("sitesSignIn")}</a>
    ) : <>
      <button type="button" className="auth-fast glass" disabled={busy} onClick={() => void send("demo")}>
        <span className="auth-fast-icon" aria-hidden="true"><Icon name="sparkles" size={20} /></span>
        <span><strong>{t("quickSignIn")}</strong><small>{t("quickSignInBody")}</small></span>
        <Icon name="arrow" size={18} />
      </button>
      {session.mode === "local" && <>
        <p className="auth-or"><span>{t("orAccount")}</span></p>
        <form className="stack-form" onSubmit={submit} noValidate={false}>
          <label className="field" htmlFor="username"><span>{t("username")}</span>
            <input ref={nameRef} id="username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false}
              defaultValue={rememberedName()} pattern={"[\\p{L}\\p{N}_\\-]{3,24}"} maxLength={24} required enterKeyHint="next"
              aria-describedby="account-rules" onInvalid={(event) => event.currentTarget.setCustomValidity(t("usernameRule"))}
              onInput={(event) => event.currentTarget.setCustomValidity("")} />
          </label>
          <label className="field" htmlFor="password"><span>{t("password")}</span>
            <span className="password-wrap">
              <input ref={passRef} id="password" name="password" type={reveal ? "text" : "password"} enterKeyHint="go"
                autoComplete={registration ? "new-password" : "current-password"} minLength={8} maxLength={128} required
                aria-describedby="account-rules" onInvalid={(event) => event.currentTarget.setCustomValidity(t("passwordRule"))}
                onInput={(event) => event.currentTarget.setCustomValidity("")} />
              <button type="button" className="password-toggle" aria-pressed={reveal} aria-label={t(reveal ? "hidePassword" : "showPassword")}
                onClick={() => setReveal((value) => !value)}><Icon name={reveal ? "eyeOff" : "eye"} size={17} /></button>
            </span>
          </label>
          <small className="field-hint" id="account-rules">{t("accountRules")}</small>
          <button className="button button-primary button-wide" type="submit" disabled={busy}>{t(busy ? "working" : registration ? "register" : "signIn")}</button>
        </form>
        <button type="button" className="auth-switch" disabled={busy} onClick={() => { setRegistration((value) => !value); setIssue(null); }}>
          {t(registration ? "haveAccount" : "noAccount")}
        </button>
      </>}
    </>}
    {issue != null && <p className="form-error" role="alert">{errorText(issue)}</p>}
  </div>;
}
