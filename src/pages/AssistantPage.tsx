import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { cityById, placeById } from "../../data/catalog.js";
import { fill } from "../../data/i18n.js";
import { useTravel } from "../shared/context";
import { tripCity } from "../shared/geo";
import type { Message, Session } from "../shared/model";
import { accessToken, supabaseClient } from "../shared/supabase";
import type { LimitStatus } from "../shared/sync";
import { EmptyState, Icon, PageHeader } from "../shared/ui";

const MAX = 2000;
const CONTEXT_KEY = "astratravel.chat-context";
export type ChatContext = { placeId?: string; cityId?: string; route?: string[] };
type Line = { id: string; role: "user" | "assistant"; content: string; failed?: boolean };
type Conversation = { id: string; title: string | null; updated_at: string; shared_with_support: boolean };

/** Opens the chat with something to talk about: a place, a city, or the visitor's own route. */
export function askAstra(context: ChatContext) {
  try { sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(context)); } catch { /* Optional. */ }
  location.hash = "assistant";
}

function takeContext(): ChatContext {
  try {
    const value = JSON.parse(sessionStorage.getItem(CONTEXT_KEY) ?? "null") as ChatContext | null;
    sessionStorage.removeItem(CONTEXT_KEY);
    return value ?? {};
  } catch { return {}; }
}

function useCountdown(until: string | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [until]);
  if (!until) return "";
  const rest = Math.max(0, new Date(until).getTime() - now);
  const h = Math.floor(rest / 3600000), m = Math.floor((rest % 3600000) / 60000), s = Math.floor((rest % 60000) / 1000);
  return [h, m, s].map((part) => String(part).padStart(2, "0")).join(":");
}

/**
 * #assistant: Astra AI chat. The daily limit is always on screen above the input; it comes from the database
 * (ai_limit_status) and the server takes a message from it before asking OpenAI, so the browser cannot skip it.
 */
export function AssistantPage({ session, limit, onLimit, onSignIn }: {
  session: Session; limit: LimitStatus | null; onLimit: (limit: LimitStatus | null) => void; onSignIn: () => void;
}) {
  const { t, language, local, preferences, saved } = useTravel();
  const client = supabaseClient();
  const signedIn = Boolean(session.user?.id && client);
  const guest = !signedIn && session.mode === "supabase" && Boolean(session.guestChat) && session.ai !== false;
  const [context, setContext] = useState<ChatContext>(() => {
    const given = takeContext();
    return { cityId: given.cityId ?? (given.placeId ? placeById[given.placeId]?.city : tripCity(preferences)), placeId: given.placeId, route: given.route };
  });
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [issue, setIssue] = useState<Message | null>(null);
  const [guestLeft, setGuestLeft] = useState<number | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">("chat");
  const controller = useRef<AbortController | null>(null);
  const listEnd = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const countdown = useCountdown(limit && limit.left === 0 ? limit.resetsAt : undefined);

  useEffect(() => {
    if (!signedIn || !client) return;
    void client.from("ai_conversations").select("id, title, updated_at, shared_with_support").order("updated_at", { ascending: false }).limit(50)
      .then(({ data }) => setConversations(data ?? []));
  }, [signedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { listEnd.current?.scrollIntoView({ block: "end" }); }, [lines]);
  useEffect(() => () => controller.current?.abort(), []);

  async function open(id: string) {
    if (!client || busy) return;
    setActive(id);
    setMobileView("chat");
    setIssue(null);
    const { data } = await client.from("ai_messages").select("id, role, content").eq("conversation_id", id).order("id");
    setLines((data ?? []).map((row) => ({ id: String(row.id), role: row.role as Line["role"], content: row.content })));
  }

  function startNew() {
    if (busy) return;
    setActive(null);
    setLines([]);
    setIssue(null);
    setMobileView("chat");
    input.current?.focus();
  }

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const message = draft.trim();
    if (!message || message.length > MAX || busy) return;
    if (signedIn && limit && limit.left <= 0) return;
    setBusy(true);
    setIssue(null);
    setDraft("");
    const userLine: Line = { id: "u" + Date.now(), role: "user", content: message };
    const answerId = "a" + Date.now();
    const history = lines.filter((line) => !line.failed).slice(-6).map(({ role, content }) => ({ role, content }));
    setLines((current) => [...current, userLine, { id: answerId, role: "assistant", content: "" }]);
    const abort = new AbortController();
    controller.current = abort;
    let answered = "";
    try {
      const token = await accessToken();
      const response = await fetch("/api/chat", {
        method: "POST", signal: abort.signal,
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
        body: JSON.stringify({
          message, language, conversationId: active, guest: !signedIn, history: signedIn ? undefined : history,
          context: { ...context, route: context.route ?? [], visitor: preferences.visitor, origin: preferences.origin, district: preferences.district },
        }),
      });
      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}));
        if (data.error === "ai_daily_limit") {
          if (signedIn && limit) onLimit({ ...limit, left: 0, resetsAt: data.resetsAt ?? limit.resetsAt });
          if (!signedIn) setGuestLeft(0);
        }
        if (data.conversationId && !active) setActive(data.conversationId);
        throw new Error(typeof data.error === "string" ? data.error : "request_error");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let index;
        while ((index = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, index).trim();
          buffer = buffer.slice(index + 1);
          if (!line) continue;
          const event = JSON.parse(line) as { type: string; text?: string; left?: number; conversationId?: string; error?: string };
          if (event.type === "start" || event.type === "done") {
            if (event.conversationId && event.conversationId !== active) {
              setActive(event.conversationId);
              setConversations((list) => list && !list.some((item) => item.id === event.conversationId)
                ? [{ id: event.conversationId!, title: message.slice(0, 80), updated_at: new Date().toISOString(), shared_with_support: false }, ...list] : list);
            }
            if (typeof event.left === "number") {
              if (signedIn && limit) onLimit({ ...limit, left: event.left });
              if (!signedIn) setGuestLeft(event.left);
            }
          } else if (event.type === "delta" && event.text) {
            answered += event.text;
            setLines((current) => current.map((item) => item.id === answerId ? { ...item, content: answered } : item));
          } else if (event.type === "error") {
            if (typeof event.left === "number") {
              if (signedIn && limit) onLimit({ ...limit, left: event.left });
              if (!signedIn) setGuestLeft(event.left);
            }
            throw new Error(event.error ?? "ai_unavailable");
          }
        }
      }
    } catch (error) {
      if (abort.signal.aborted) {
        // Stopped: keep what came so far.
        if (!answered) setLines((current) => current.filter((item) => item.id !== answerId));
      } else {
        const key = error instanceof Error ? error.message : "request_error";
        setIssue((["ai_daily_limit", "account_blocked", "ai_disabled", "too_many", "unauthorized", "ai_unavailable", "invalid_input"].includes(key) ? key : "chatFailed") as Message);
        setLines((current) => current.filter((item) => item.id !== answerId).map((item) => item.id === userLine.id ? { ...item, failed: true } : item));
        if (!answered) setDraft(message);
      }
    } finally {
      controller.current = null;
      setBusy(false);
    }
  }

  function onKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send();
    }
  }

  async function toggleShare(conversation: Conversation) {
    if (!client) return;
    const next = !conversation.shared_with_support;
    setConversations((list) => list?.map((item) => item.id === conversation.id ? { ...item, shared_with_support: next } : item) ?? list);
    const { error } = await client.from("ai_conversations").update({ shared_with_support: next }).eq("id", conversation.id);
    if (error) setConversations((list) => list?.map((item) => item.id === conversation.id ? { ...item, shared_with_support: !next } : item) ?? list);
  }

  async function remove(conversation: Conversation) {
    if (!client || !confirm(t("chatDeleteConfirm"))) return;
    const { error } = await client.from("ai_conversations").delete().eq("id", conversation.id);
    if (error) return setIssue("request_error");
    setConversations((list) => list?.filter((item) => item.id !== conversation.id) ?? list);
    if (active === conversation.id) startNew();
  }

  const contextChips = useMemo(() => {
    const chips: { key: keyof ChatContext; label: string }[] = [];
    if (context.placeId && placeById[context.placeId]) chips.push({ key: "placeId", label: local(placeById[context.placeId].title) });
    if (context.cityId && cityById[context.cityId]) chips.push({ key: "cityId", label: local(cityById[context.cityId].name) });
    if (context.route?.length) chips.push({ key: "route", label: fill("chatRouteChip", language, context.route.length) });
    return chips;
  }, [context, language]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = conversations?.find((item) => item.id === active);
  const activeConversation = active ? current : undefined;
  const header = <PageHeader eyebrow="Astra AI" title={t("assistant")} lead={t("assistantLead")} />;

  if (session.mode !== "supabase" || session.ai === false || (!signedIn && !guest)) {
    return <>{header}
      <EmptyState icon="sparkles" title={t(session.ai === false && session.mode === "supabase" ? "aiUnavailable" : "chatNeedsAccount")}
        description={fill("authPerk", language, limit?.limit ?? 15)}>
        {session.mode === "supabase" && <button type="button" className="button button-primary" onClick={onSignIn}><Icon name="user" size={17} />{t("signIn")}</button>}
      </EmptyState>
    </>;
  }

  const left = signedIn ? limit?.left ?? null : guestLeft;
  const total = signedIn ? limit?.limit ?? null : null;
  const exhausted = signedIn ? (limit?.left ?? 1) <= 0 : guestLeft === 0;
  const blocked = signedIn && limit?.blocked;
  const disabled = signedIn && limit && !limit.enabled;

  return <>{header}
    <div className="assistant-layout" data-view={mobileView}>
      {signedIn && <aside className="assistant-list glass" aria-label={t("chatHistory")}>
        <div className="assistant-list-head">
          <h2>{t("chatHistory")}</h2>
          <button type="button" className="button button-small button-primary" onClick={startNew} disabled={busy}><Icon name="plus" size={16} />{t("chatNew")}</button>
        </div>
        {conversations === null ? <div className="skeleton-list" aria-hidden="true"><span /><span /><span /></div>
          : conversations.length === 0 ? <p className="muted">{t("chatHistoryEmpty")}</p>
          : <ul>{conversations.map((item) => <li key={item.id}>
            <button type="button" className="assistant-thread" aria-current={item.id === active || undefined} onClick={() => void open(item.id)}>
              <strong>{item.title || t("chatUntitled")}</strong>
              <small>{new Intl.DateTimeFormat(language, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(item.updated_at))}</small>
            </button>
          </li>)}</ul>}
      </aside>}
      <section className="assistant-chat glass" aria-label={t("assistant")}>
        {signedIn && <div className="assistant-chat-head">
          <button type="button" className="button button-small assistant-back" onClick={() => setMobileView("list")}><Icon name="back" size={16} />{t("chatHistory")}</button>
          {activeConversation && <div className="assistant-chat-tools">
            <button type="button" className="button button-small" aria-pressed={activeConversation.shared_with_support} onClick={() => void toggleShare(activeConversation)}
              title={t("chatShareHint")}><Icon name="flag" size={15} />{t(activeConversation.shared_with_support ? "chatShared" : "chatShare")}</button>
            <button type="button" className="icon-button" aria-label={t("chatDelete")} onClick={() => void remove(activeConversation)}><Icon name="trash" size={16} /></button>
          </div>}
        </div>}
        <div className="assistant-messages" aria-live="polite">
          {lines.length === 0 && <div className="assistant-hello">
            <Icon name="sparkles" size={26} />
            <p>{t("chatHello")}</p>
            <div className="assistant-suggestions">
              {(["chatSuggest1", "chatSuggest2", "chatSuggest3"] as Message[]).map((key) => <button key={key} type="button" className="chip" onClick={() => { setDraft(t(key)); input.current?.focus(); }}>
                <span className="chip-content">{t(key)}</span></button>)}
            </div>
          </div>}
          {lines.map((line) => <div key={line.id} className={"bubble bubble-" + line.role + (line.failed ? " bubble-failed" : "")}>
            {line.content || <span className="typing" aria-label={t("chatTyping")}><i /><i /><i /></span>}
          </div>)}
          <div ref={listEnd} />
        </div>
        {issue && <p className="form-error chat-error" role="alert">{t(issue)}</p>}
        {contextChips.length > 0 && <div className="chat-context" aria-label={t("chatContext")}>
          {contextChips.map((chip) => <span key={chip.key} className="chip chat-context-chip"><span className="chip-content">{chip.label}
            <button type="button" className="chip-remove" aria-label={t("remove") + ": " + chip.label} onClick={() => setContext((value) => ({ ...value, [chip.key]: undefined }))}><Icon name="x" size={13} /></button>
          </span></span>)}
          {!context.route?.length && saved.route.length > 0 && <button type="button" className="chip" onClick={() => setContext((value) => ({ ...value, route: saved.route }))}>
            <span className="chip-content"><Icon name="plus" size={13} />{t("chatAddRoute")}</span></button>}
        </div>}
        {blocked ? <div className="limit-card glass"><Icon name="lock" size={20} /><p>{t("account_blocked")}</p></div>
          : disabled ? <div className="limit-card glass"><Icon name="info" size={20} /><p>{t("ai_disabled")}</p></div>
          : exhausted ? <div className="limit-card glass" role="status">
            <Icon name="clock" size={20} />
            <div>
              <p>{signedIn ? fill("limitExhausted", language, total ?? 15) : t("guestLimitExhausted")}</p>
              {countdown && <p className="limit-countdown">{fill("limitCountdown", language, countdown)}</p>}
              {!signedIn && <button type="button" className="button button-small button-primary" onClick={onSignIn}>{t("signIn")}</button>}
              <a className="text-link" href="#planner">{t("openPlanner")}</a>
            </div>
          </div>
          : <form className="assistant-input" onSubmit={(event) => void send(event)}>
            <p className="limit-line" data-low={left !== null && left <= 3 || undefined}>
              {left === null ? t(signedIn ? "limitLoading" : "guestLimitIntro")
                : signedIn ? fill("limitLeft", language, left, total ?? "") : fill("guestLimitLeft", language, left)}
              <span> · {t("aiResetsAlmaty")}</span>
            </p>
            {!signedIn && <p className="field-hint">{fill("authPerk", language, limit?.limit ?? 15)} <button type="button" className="text-link" onClick={onSignIn}>{t("signIn")}</button></p>}
            <div className="assistant-input-row">
              <label className="visually-hidden" htmlFor="chat-input">{t("chatPlaceholder")}</label>
              <textarea ref={input} id="chat-input" value={draft} maxLength={MAX} rows={2} placeholder={t("chatPlaceholder")}
                onChange={(event) => setDraft(event.target.value)} onKeyDown={onKey} disabled={busy} />
              {busy
                ? <button type="button" className="button" onClick={() => controller.current?.abort()}><Icon name="x" size={16} />{t("chatStop")}</button>
                : <button type="submit" className="button button-primary" disabled={!draft.trim()}><Icon name="arrow" size={16} />{t("chatSend")}</button>}
            </div>
            <small className="char-count" data-over={draft.length > MAX - 100 || undefined}>{draft.length} / {MAX}</small>
          </form>}
      </section>
    </div>
  </>;
}
