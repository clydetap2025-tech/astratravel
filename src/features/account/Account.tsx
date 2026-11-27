import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { fill } from "../../../data/i18n.js";
import { useTravel } from "../../shared/context";
import type { Api, Page, Session } from "../../shared/model";
import { errorKey, supabaseClient } from "../../shared/supabase";
import { GlassIcon, Icon } from "../../shared/ui";
import type { Message } from "../../shared/model";

const LAST_EMAIL = "astratravel.email";
const RESEND_SECONDS = 60;
const rememberedEmail = () => { try { return localStorage.getItem(LAST_EMAIL) ?? ""; } catch { return ""; } };

/** Where the confirmation and magic-link e-mails bring the visitor back; the page is restored after sign-in. */
export function returnUrl(flag?: string) {
  return location.origin + "/" + (flag ? "?" + flag + "=1" : "");
}

/** The usual web mail for an address, so "Open mail" lands in the inbox. */
function mailboxFor(email: string) {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  if (domain === "gmail.com" || domain === "googlemail.com") return "https://mail.google.com/";
  if (["mail.ru", "inbox.ru", "list.ru", "bk.ru"].includes(domain)) return "https://e.mail.ru/";
  if (domain.startsWith("yandex.") || domain === "ya.ru") return "https://mail.yandex.ru/";
  if (["outlook.com", "hotmail.com", "live.com"].includes(domain)) return "https://outlook.live.com/mail/";
  if (domain === "icloud.com" || domain === "me.com") return "https://www.icloud.com/mail";
  return "mailto:";
}

type Method = "link" | "password";
type Sent = { email: string; kind: "signup" | "link" | "reset" };

/**
 * Sign in, fast: "Continue with Google" first, then one e-mail field that either gets a magic link or takes a
 * password (a switch), "Forgot password?", readable errors, show-password, autofocus and Enter to send.
 * After signing up: "Check your mail" with "Open mail" and a resend button once a minute.
 */
export function Account({ session, api, page, onChange, aiLimit, registrationOpen, onClose }: {
  session: Session; api: Api; page: Page; onChange: (session: Session) => void;
  aiLimit: number; registrationOpen: boolean; onClose: () => void;
}) {
  const { t, language, errorText } = useTravel();
  const [method, setMethod] = useState<Method>("link");
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [issue, setIssue] = useState<Message | null>(null);
  const [reveal, setReveal] = useState(false);
  const [sent, setSent] = useState<Sent | null>(null);
  const [wait, setWait] = useState(0);
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const client = supabaseClient();

  useEffect(() => {
    if (session.user || sent) return;
    (emailRef.current?.value ? passRef.current ?? emailRef.current : emailRef.current)?.focus({ preventScroll: true });
  }, [method, session.user, sent]);

  useEffect(() => {
    if (!wait) return;
    const timer = setTimeout(() => setWait((value) => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  function remember(email: string) {
    try { localStorage.setItem(LAST_EMAIL, email); sessionStorage.setItem("astratravel.signin-page", page); } catch { /* Optional. */ }
  }

  async function run(job: () => Promise<{ error: unknown } | void>) {
    if (busy) return;
    setBusy(true);
    setIssue(null);
    try {
      const result = await job();
      if (result && result.error) setIssue(errorKey(result.error) as Message);
    } catch (error) {
      setIssue(errorKey(error) as Message);
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client) return;
    const data = new FormData(event.currentTarget);
    // A hidden field people never see; bots fill it in.
    if (String(data.get("website") ?? "")) return;
    const email = String(data.get("email") ?? "").trim().toLowerCase();
    const password = String(data.get("password") ?? "");
    remember(email);
    void run(async () => {
      if (method === "link") {
        const result = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: returnUrl(), shouldCreateUser: registrationOpen, data: { language } } });
        if (!result.error) { setSent({ email, kind: "link" }); setWait(RESEND_SECONDS); }
        return result;
      }
      if (creating) {
        const result = await client.auth.signUp({ email, password, options: { emailRedirectTo: returnUrl("confirmed"), data: { language } } });
        if (!result.error && !result.data.session) { setSent({ email, kind: "signup" }); setWait(RESEND_SECONDS); }
        return result;
      }
      return client.auth.signInWithPassword({ email, password });
    });
  }

  function forgot() {
    const email = emailRef.current?.value.trim().toLowerCase() ?? "";
    if (!client) return;
    if (!email || !emailRef.current?.checkValidity()) { setIssue("authEmailFirst"); emailRef.current?.focus(); return; }
    remember(email);
    void run(async () => {
      const result = await client.auth.resetPasswordForEmail(email, { redirectTo: returnUrl("reset") });
      if (!result.error) { setSent({ email, kind: "reset" }); setWait(RESEND_SECONDS); }
      return result;
    });
  }

  function resend() {
    if (!client || !sent || wait) return;
    void run(async () => {
      const result = sent.kind === "signup" ? await client.auth.resend({ type: "signup", email: sent.email, options: { emailRedirectTo: returnUrl("confirmed") } })
        : sent.kind === "reset" ? await client.auth.resetPasswordForEmail(sent.email, { redirectTo: returnUrl("reset") })
        : await client.auth.signInWithOtp({ email: sent.email, options: { emailRedirectTo: returnUrl(), shouldCreateUser: registrationOpen } });
      if (!result.error) setWait(RESEND_SECONDS);
      return result;
    });
  }

  function google() {
    if (!client) return;
    try { sessionStorage.setItem("astratravel.signin-page", page); } catch { /* Optional. */ }
    void run(() => client.auth.signInWithOAuth({ provider: "google", options: { redirectTo: returnUrl() } }));
  }

  if (session.user) {
    const role = session.user.role;
    return <div className="dialog-body auth-dialog">
      <GlassIcon name="user" tone="accent" />
      <h2 id="dialog-title">{t("profile")}</h2>
      <p>{session.user.displayName || session.user.email || session.user.username || t("demoAccount")}</p>
      {session.mode === "supabase" && <div className="auth-links">
        <a className="button button-wide" href="#account" onClick={onClose}><Icon name="user" size={17} />{t("accountPage")}</a>
        <a className="button button-wide" href="#assistant" onClick={onClose}><Icon name="sparkles" size={17} />{t("assistant")}</a>
        {(role === "admin" || role === "editor") && <a className="button button-wide" href="#admin" onClick={onClose}><Icon name="lock" size={17} />{t("adminPanel")}</a>}
      </div>}
      <button type="button" className="button button-primary button-wide" disabled={busy} onClick={() => void run(async () => {
        if (client) await client.auth.signOut();
        onChange({ ...session, user: null });
      })}>{t("signOut")}</button>
      {issue && <p className="form-error" role="alert">{t(issue)}</p>}
    </div>;
  }

  if (sent) {
    const title = sent.kind === "reset" ? "authResetSent" : sent.kind === "link" ? "authLinkSent" : "authCheckMail";
    return <div className="dialog-body auth-dialog" aria-live="polite">
      <GlassIcon name="check" tone="accent" />
      <h2 id="dialog-title">{t(title)}</h2>
      <p>{fill("authSentTo", language, sent.email)}</p>
      <a className="button button-primary button-wide" href={mailboxFor(sent.email)} target="_blank" rel="noopener"><Icon name="external" size={16} />{t("authOpenMail")}</a>
      <button type="button" className="button button-wide" disabled={busy || wait > 0} onClick={resend}>
        {wait > 0 ? fill("authResendIn", language, wait) : t("authResend")}
      </button>
      <button type="button" className="auth-switch" onClick={() => { setSent(null); setIssue(null); }}>{t("authOtherEmail")}</button>
      {issue && <p className="form-error" role="alert">{t(issue)}</p>}
    </div>;
  }

  if (session.mode === "sites") {
    return <div className="dialog-body auth-dialog">
      <h2 id="dialog-title">{t("authTitle")}</h2>
      <p>{t("authIntro")}</p>
      {session.canActivate
        ? <button type="button" className="button button-primary auth-fast" disabled={busy} onClick={() => void run(async () => { onChange(await api("activate", {})); })}>{t("sitesSignIn")}</button>
        : <a className="button button-primary auth-fast" href="/signin-with-chatgpt" target="_top" onClick={() => {
          try { sessionStorage.setItem("astratravel.signin-page", page); } catch { /* Optional return location. */ }
        }}>{t("sitesSignIn")}</a>}
    </div>;
  }

  if (session.mode !== "supabase" || !client) {
    return <div className="dialog-body auth-dialog">
      <GlassIcon name="lock" tone="accent" />
      <h2 id="dialog-title">{t("authTitle")}</h2>
      <p>{t(session.mode === "offline" ? "offlineSignIn" : "authNotConfigured")}</p>
    </div>;
  }

  return <div className="dialog-body auth-dialog">
    <h2 id="dialog-title">{t(creating && method === "password" ? "authCreateTitle" : "authTitle")}</h2>
    <p className="auth-perk"><Icon name="sparkles" size={16} />{fill("authPerk", language, aiLimit)}</p>
    <button type="button" className="auth-fast glass" disabled={busy} onClick={google}>
      <span className="auth-fast-icon" aria-hidden="true"><Icon name="globe" size={20} /></span>
      <span><strong>{t("authGoogle")}</strong><small>{t("authGoogleBody")}</small></span>
      <Icon name="arrow" size={18} />
    </button>
    <p className="auth-or"><span>{t("authOrEmail")}</span></p>
    <div className="segmented auth-method" role="radiogroup" aria-label={t("authMethod")}>
      {(["link", "password"] as Method[]).map((value) => <button key={value} type="button" role="radio" aria-checked={method === value}
        onClick={() => { setMethod(value); setIssue(null); }}><span>{t(value === "link" ? "authMethodLink" : "authMethodPassword")}</span></button>)}
    </div>
    <form className="stack-form" onSubmit={submit}>
      <label className="field" htmlFor="email"><span>{t("email")}</span>
        <input ref={emailRef} id="email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false}
          defaultValue={rememberedEmail()} maxLength={254} required enterKeyHint={method === "link" ? "send" : "next"} />
      </label>
      <label className="honeypot" htmlFor="website" aria-hidden="true">Website<input id="website" name="website" tabIndex={-1} autoComplete="off" /></label>
      {method === "password" && <label className="field" htmlFor="password"><span>{t("password")}</span>
        <span className="password-wrap">
          <input ref={passRef} id="password" name="password" type={reveal ? "text" : "password"} enterKeyHint="go"
            autoComplete={creating ? "new-password" : "current-password"} minLength={8} maxLength={128} required
            onInvalid={(event) => event.currentTarget.setCustomValidity(t("passwordRule"))}
            onInput={(event) => event.currentTarget.setCustomValidity("")} />
          <button type="button" className="password-toggle" aria-pressed={reveal} aria-label={t(reveal ? "hidePassword" : "showPassword")}
            onClick={() => setReveal((value) => !value)}><Icon name={reveal ? "eyeOff" : "eye"} size={17} /></button>
        </span>
      </label>}
      {method === "password" && creating && <small className="field-hint">{t("passwordRule")}</small>}
      <button className="button button-primary button-wide" type="submit" disabled={busy}>
        {t(busy ? "working" : method === "link" ? "authGetLink" : creating ? "register" : "signIn")}
      </button>
    </form>
    {method === "password" && <div className="auth-row">
      {(registrationOpen || creating) && <button type="button" className="auth-switch" disabled={busy} onClick={() => { setCreating((value) => !value); setIssue(null); }}>
        {t(creating ? "haveAccount" : "noAccount")}
      </button>}
      {!creating && <button type="button" className="auth-switch" disabled={busy} onClick={forgot}>{t("authForgot")}</button>}
    </div>}
    {!registrationOpen && <p className="field-hint">{t("authRegistrationClosed")}</p>}
    {issue && <p className="form-error" role="alert">{issue === "request_error" ? errorText(new Error("request_error")) : t(issue)}</p>}
  </div>;
}
