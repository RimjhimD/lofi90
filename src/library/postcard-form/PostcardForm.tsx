"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { CSS, DEFAULT_LABELS, Postmark, textOn } from "./parts";

export type PostcardStatus = "idle" | "sending" | "mailbox" | "sent" | "error";
export type PostcardPreview = "empty" | "filled" | "invalid" | "sending" | "mailbox" | "sent" | "error";
export type PostcardField = "message" | "name" | "email" | "topic";
export interface PostcardValues {
  message: string;
  name: string;
  email: string;
  /** "" when no topic was picked or no topics were given. */
  topic: string;
}

/** Every word on the card, so it can be translated. Counts come in as numbers. */
export interface PostcardLabels {
  title: string;
  /** Printed recipient on the address side. Empty string hides it. */
  to: string;
  from: string;
  message: string;
  messagePlaceholder: string;
  name: string;
  namePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  topic: string;
  topicPlaceholder: string;
  /** Accessible name and visible hint of the stamp (the submit button). */
  stamp: string;
  /** Stamp name while posting. */
  stampBusy: string;
  /** The little picture and value printed on the stuck stamp. */
  stampArt: string;
  stampValue: string;
  /** Word arched inside the postmark. */
  postmark: string;
  date: (d: Date) => string;
  ago: (ms: number) => string;
  restored: (ago: string) => string;
  discard: string;
  saved: string;
  counter: (count: number, max: number) => string;
  /** Announced once when the message gets close to the limit, and once at the limit. */
  nearLimit: (max: number) => string;
  atLimit: (max: number) => string;
  errName: string;
  errEmailRequired: string;
  errEmail: string;
  errMessage: string;
  errShort: (min: number, count: number) => string;
  invalid: (count: number) => string;
  sending: string;
  mailbox: string;
  takeBack: string;
  error: string;
  tryAgain: string;
  sent: string;
  sentNote: string;
  writeAnother: string;
}

export interface PostcardFormProps {
  /** Send the card. Resolve when it's delivered; reject to show the error with Try again (the words stay). */
  onSend: (values: PostcardValues) => Promise<void>;
  /** localStorage key for the draft. Use a different key per form on the same site. */
  draftKey?: string;
  /** Shows an optional topic select when given. */
  topics?: string[];
  minMessageLength?: number;
  maxLength?: number;
  labels?: Partial<PostcardLabels>;
  /** Stamp and postmark ink colour. Hex colours get readable text on the stamp. */
  accent?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  /** Force the network state. By default it follows navigator.onLine and the online/offline events. */
  online?: boolean;
  /** Show one state without running anything or touching storage. */
  previewState?: PostcardPreview;
  onDraftSave?: (values: PostcardValues) => void;
  onDraftRestore?: (values: PostcardValues, savedAt: number) => void;
  onInvalid?: (fields: PostcardField[]) => void;
  /** Sent while offline: the card waits in the mailbox until the network is back. */
  onQueue?: (values: PostcardValues) => void;
  onError?: (error: unknown) => void;
  className?: string;
}

const EMPTY: PostcardValues = { message: "", name: "", email: "", topic: "" };
const ORDER: PostcardField[] = ["message", "name", "email", "topic"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SIZES = {
  sm: { card: "max-w-[600px] text-[0.82rem]", pad: "p-4", stamp: "h-[76px] w-[64px]", gap: "pr-[76px]", title: "text-lg", rows: 5 },
  md: { card: "max-w-[700px] text-sm", pad: "p-5", stamp: "h-[90px] w-[76px]", gap: "pr-[90px]", title: "text-xl", rows: 6 },
  lg: { card: "max-w-[820px] text-base", pad: "p-6", stamp: "h-[104px] w-[88px]", gap: "pr-[104px]", title: "text-2xl", rows: 7 },
};
const SAMPLE = { message: "Hi! I loved the open studio last week. Do you run weekend classes for beginners? I'd like two spots.", name: "Maya Ortiz", email: "maya@example.com" };

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasContent = (v: PostcardValues) => Object.values(v).some((s) => s.trim() !== "");
const noop = () => () => {};
const onNetwork = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

/**
 * A contact form laid out as a postcard. It keeps a draft in localStorage so a refresh loses nothing, checks each
 * field as you leave it, waits in a "mailbox" while offline and sends by itself when the network is back.
 * The stamp in the corner is the submit button.
 */
export function PostcardForm({
  onSend,
  draftKey = "postcard-form",
  topics,
  minMessageLength = 10,
  maxLength = 1000,
  labels,
  accent = "#3DD9FF",
  size = "md",
  disabled = false,
  online,
  previewState,
  onDraftSave,
  onDraftRestore,
  onInvalid,
  onQueue,
  onError,
  className = "",
}: PostcardFormProps) {
  const t = { ...DEFAULT_LABELS, ...labels };
  const sz = SIZES[size];
  const id = useId();
  const preview = !!previewState;
  const hasTopics = !!topics?.length;

  const [values, setValues] = useState<PostcardValues>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<PostcardField, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<PostcardField, boolean>>>({});
  const [live, setLive] = useState<PostcardStatus>("idle");
  const [restored, setRestored] = useState("");
  const [note, setNote] = useState("");
  const [savedAt, setSavedAt] = useState(0);

  const messageRef = useRef<HTMLTextAreaElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const topicRef = useRef<HTMLSelectElement>(null);
  const focusField = (k: PostcardField) => ({ message: messageRef, name: nameRef, email: emailRef, topic: topicRef })[k].current?.focus();
  const stampRef = useRef<HTMLButtonElement>(null);
  const afterRef = useRef<HTMLButtonElement>(null);
  const ready = useRef(false); // the stored draft has been read, so saving can't wipe it first
  const dirty = useRef(false); // the person typed since the last restore/send
  const inflight = useRef(false);
  const alive = useRef(true);
  const valuesRef = useRef(values);
  const latest = useRef({ onSend, onDraftSave, onDraftRestore, onError });
  useEffect(() => {
    latest.current = { onSend, onDraftSave, onDraftRestore, onError };
    valuesRef.current = values;
  });
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const browserOnline = useSyncExternalStore(onNetwork, () => navigator.onLine, () => true);
  const net = online ?? browserOnline;
  const today = useSyncExternalStore(noop, () => t.date(new Date()), () => "");

  // Preview: fixed content, no storage, no timers.
  const pv = previewState;
  const shown: PostcardValues =
    pv === "empty" ? EMPTY : pv === "invalid" ? { message: "Hi!", name: SAMPLE.name, email: "maya@example", topic: "" } : pv ? { ...SAMPLE, topic: topics?.[0] ?? "" } : values;
  const shownErrors = pv === "invalid" ? { message: t.errShort(minMessageLength, 3), email: t.errEmail } : pv ? {} : errors;
  const status: PostcardStatus = pv ? (pv === "empty" || pv === "filled" || pv === "invalid" ? "idle" : pv) : live;
  const shownNote = pv === "invalid" ? t.invalid(2) : pv ? "" : note;
  const editing = status === "idle" || status === "error";
  const locked = disabled || preview || !editing;

  // Read the draft after mount (never during render, so server and client HTML match).
  useEffect(() => {
    if (preview) return;
    ready.current = false;
    const timer = window.setTimeout(() => {
      ready.current = true;
      let saved: { values?: Partial<PostcardValues>; savedAt?: number } | null = null;
      try {
        saved = JSON.parse(window.localStorage.getItem(draftKey) ?? "null");
      } catch {
        saved = null;
      }
      if (!saved?.values) return;
      const v = saved.values;
      const draft: PostcardValues = {
        message: String(v.message ?? "").slice(0, maxLength),
        name: String(v.name ?? ""),
        email: String(v.email ?? ""),
        topic: topics?.includes(String(v.topic)) ? String(v.topic) : "",
      };
      if (!hasContent(draft)) return;
      const at = Number(saved.savedAt) || Date.now();
      setValues(draft);
      setRestored(t.restored(t.ago(Date.now() - at)));
      latest.current.onDraftRestore?.(draft, at);
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- read once per key; labels/topics changing later must not re-restore
  }, [draftKey, preview]);

  // Save the draft ~400 ms after the last keystroke. Kept while in the mailbox, so closing the tab loses nothing.
  useEffect(() => {
    if (preview || !ready.current || !dirty.current || !(editing || status === "mailbox")) return;
    const timer = window.setTimeout(() => {
      try {
        if (hasContent(values)) window.localStorage.setItem(draftKey, JSON.stringify({ values, savedAt: Date.now() }));
        else window.localStorage.removeItem(draftKey);
      } catch {
        return; // storage full or blocked: the form still works, it just can't keep a draft
      }
      setSavedAt(Date.now());
      latest.current.onDraftSave?.(values);
    }, 400);
    return () => clearTimeout(timer);
  }, [values, draftKey, preview, editing, status]);

  // Fade the "Draft saved" mark out again.
  useEffect(() => {
    if (!savedAt) return;
    const timer = window.setTimeout(() => setSavedAt(0), 1600);
    return () => clearTimeout(timer);
  }, [savedAt]);

  async function send(v: PostcardValues) {
    if (inflight.current) return; // the online event and a click can't both send it
    inflight.current = true;
    setLive("sending");
    setNote("");
    try {
      await latest.current.onSend(v);
      // Delivered: clear the draft even if the person already left, so it is never restored and sent twice.
      try {
        window.localStorage.removeItem(draftKey);
      } catch {
        /* nothing to clear */
      }
      dirty.current = false;
      if (!alive.current) return;
      setRestored("");
      setLive("sent");
    } catch (err) {
      if (!alive.current) return;
      setLive("error");
      latest.current.onError?.(err);
    } finally {
      inflight.current = false;
    }
  }

  // Waiting in the mailbox: the moment the network is back, send it. Only once.
  useEffect(() => {
    if (preview || live !== "mailbox" || !net) return;
    const timer = window.setTimeout(() => send(valuesRef.current), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- send reads refs only
  }, [live, net, preview]);

  // Move focus to the next useful control after the card is posted or bounced.
  useEffect(() => {
    if (preview) return;
    if (live === "sent") afterRef.current?.focus();
    if (live === "error") afterRef.current?.focus();
  }, [live, preview]);

  function check(k: PostcardField, v: PostcardValues): string {
    if (k === "name") return v.name.trim() ? "" : t.errName;
    if (k === "email") return !v.email.trim() ? t.errEmailRequired : EMAIL.test(v.email.trim()) ? "" : t.errEmail;
    if (k === "message") {
      const n = v.message.trim().length;
      return n === 0 ? t.errMessage : n < minMessageLength ? t.errShort(minMessageLength, n) : "";
    }
    return "";
  }

  function change(k: PostcardField, value: string) {
    if (locked) return;
    dirty.current = true;
    const next = { ...values, [k]: value };
    setValues(next);
    if (touched[k] || errors[k]) {
      const nextErrors = { ...errors, [k]: check(k, next) };
      setErrors(nextErrors);
      if (!ORDER.some((f) => nextErrors[f])) setNote("");
    }
  }

  function blur(k: PostcardField) {
    if (locked || !values[k].trim()) return; // an untouched empty field isn't an error yet
    setTouched((x) => ({ ...x, [k]: true }));
    setErrors((e) => ({ ...e, [k]: check(k, values) }));
  }

  function submit(e?: FormEvent) {
    e?.preventDefault();
    if (locked || inflight.current) return;
    const nextErrors = Object.fromEntries(ORDER.map((k) => [k, check(k, values)])) as Record<PostcardField, string>;
    const bad = ORDER.filter((k) => nextErrors[k]);
    setErrors(nextErrors);
    setTouched({ message: true, name: true, email: true, topic: true });
    if (bad.length) {
      setNote(t.invalid(bad.length));
      focusField(bad[0]);
      if (!reducedMotion())
        stampRef.current?.animate([{ transform: "translateX(0)" }, { transform: "translateX(-6px) rotate(-4deg)" }, { transform: "translateX(5px) rotate(3deg)" }, { transform: "translateX(-3px)" }, { transform: "none" }], { duration: 380 });
      onInvalid?.(bad);
      return;
    }
    setNote("");
    if (!net) {
      setLive("mailbox");
      onQueue?.(values);
      return;
    }
    void send(values);
  }

  function discard() {
    try {
      window.localStorage.removeItem(draftKey);
    } catch {
      /* nothing stored */
    }
    dirty.current = false;
    setValues(EMPTY);
    setErrors({});
    setTouched({});
    setRestored("");
    setNote("");
    messageRef.current?.focus();
  }

  function writeAnother() {
    discard();
    setLive("idle");
    window.setTimeout(() => messageRef.current?.focus(), 0);
  }

  const ink = `color-mix(in srgb, ${accent} 42%, #0E1A2A)`;
  const count = shown.message.length;
  const near = count >= Math.floor(maxLength * 0.9);
  const counterLive = count >= maxLength ? t.atLimit(maxLength) : near ? t.nearLimit(maxLength) : "";
  const stuck = status !== "idle";
  const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B3A6B]";
  const field = `w-full border-0 border-b border-dashed border-[#8E8A7C] bg-transparent px-0.5 py-1.5 text-[#1E2320] placeholder:text-[#63675E] transition-colors hover:border-[#3E3B33] focus:border-solid focus:border-[#1B3A6B] focus:outline-none read-only:cursor-default aria-invalid:border-solid aria-invalid:border-[#B42318]`;
  const small = `mb-0.5 block font-mono text-[0.68em] font-bold uppercase tracking-[0.14em] text-[#5A5E57]`;
  const errText = (k: PostcardField) =>
    shownErrors[k] ? (
      <p id={`${id}-${k}-err`} className={`mt-1 text-[0.85em] font-semibold text-[#B42318]`}>
        {shownErrors[k]}
      </p>
    ) : null;
  const described = (k: PostcardField, extra = "") => [shownErrors[k] ? `${id}-${k}-err` : "", extra].filter(Boolean).join(" ") || undefined;
  const btn = `rounded-md border border-[#1E2320] px-2.5 py-1 text-[0.85em] font-bold text-[#1E2320] transition hover:bg-[#1E2320] hover:text-[#F7F2E5] active:translate-y-px ${focusRing}`;

  if (status === "sent") {
    return (
      <div className={`@container w-full ${sz.card} ${className}`}>
        <style href="pcf-card" precedence="default">{CSS}</style>
        <div role="status" className={`flex flex-col items-center gap-2 rounded-xl border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] ${sz.pad} text-center text-[var(--k-text,#E9EDE8)] shadow-[0_14px_36px_-16px_var(--k-shadow,rgba(0,0,0,.9))]`}>
          <div aria-hidden="true" className="relative h-20 w-full max-w-[260px]">
            <div className="absolute inset-x-0 top-0 h-7 rounded-md bg-[linear-gradient(#E2C46D,#A8862F)] shadow-[inset_0_-2px_0_rgba(0,0,0,.25)]">
              <div className="absolute inset-x-6 top-2.5 h-2 rounded-full bg-[#141210] shadow-[inset_0_2px_3px_rgba(0,0,0,.8)]" />
            </div>
            {!preview && (
              <div className="absolute inset-x-12 bottom-0 top-[14px] overflow-hidden">
                <div className="pcf-slide pcf-paper relative h-full rounded-sm shadow-md">
                  <span className="absolute right-1.5 top-1.5 h-5 w-4 rounded-[2px]" style={{ background: accent }} />
                </div>
              </div>
            )}
          </div>
          <Postmark ink={`color-mix(in srgb, ${accent} 70%, var(--k-text,#E9EDE8))`} date={today} word={t.postmark} className="pcf-thud -mt-6 h-16 w-28" />
          <p className="text-[1.25em] font-bold">{t.sent}</p>
          <p className="text-[var(--k-mute,#8A938D)]">{t.sentNote}</p>
          <button
            ref={afterRef}
            type="button"
            onClick={preview ? undefined : writeAnother}
            className="mt-1 rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-panel-2,#181D1B)] px-3 py-1.5 font-bold transition hover:-translate-y-px hover:border-[var(--k-acc-text,#C6FF3D)] active:translate-y-px focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)]"
          >
            {t.writeAnother}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`@container w-full ${sz.card} ${className}`}>
      <style href="pcf-card" precedence="default">{CSS}</style>
      <form
        noValidate
        onSubmit={submit}
        aria-busy={status === "sending" || undefined}
        aria-label={t.title}
        className={`pcf-paper relative rounded-md border border-[#D8CFB6] text-[#1E2320] shadow-[0_18px_40px_-18px_var(--k-shadow,rgba(0,0,0,.9)),0_2px_0_#E6DDC5] ${disabled ? "opacity-60" : ""}`}
      >
        <fieldset disabled={disabled} className={`grid min-w-0 gap-4 ${sz.pad} @[560px]:grid-cols-[1.2fr_1fr] @[560px]:gap-0`}>
          {/* message half: lined paper */}
          <div className="min-w-0 @[560px]:border-r @[560px]:border-[#CFC5AA] @[560px]:pr-5">
            <h3 className={`${sz.gap} @[560px]:pr-0 mb-2 font-serif ${sz.title} font-bold italic leading-tight`}>{t.title}</h3>
            {restored && !preview && (
              <p className={`mb-2 flex flex-wrap items-center gap-x-2 rounded bg-[#1B3A6B]/10 px-2 py-1 text-[0.85em] text-[#1B3A6B]`}>
                <span>{restored}</span>
                <span aria-hidden="true">·</span>
                <button type="button" onClick={discard} className={`font-bold underline underline-offset-2 hover:no-underline ${focusRing}`}>{t.discard}</button>
              </p>
            )}
            <label htmlFor={`${id}-message`} className={small}>{t.message}</label>
            <textarea
              ref={messageRef}
              id={`${id}-message`}
              name="message"
              rows={sz.rows}
              maxLength={maxLength}
              value={shown.message}
              readOnly={locked}
              placeholder={t.messagePlaceholder}
              aria-required="true"
              aria-invalid={!!shownErrors.message || undefined}
              aria-describedby={described("message", `${id}-count`)}
              onChange={(e) => change("message", e.target.value)}
              onBlur={() => blur("message")}
              onKeyDown={(e) => e.key === "Enter" && (e.metaKey || e.ctrlKey) && e.currentTarget.form?.requestSubmit()}
              className={`pcf-lined block w-full resize-y bg-transparent px-1 font-serif text-[1.05em] text-[#1E2320] placeholder:text-[#63675E] read-only:cursor-default focus:outline-2 focus:outline-offset-2 focus:outline-[#1B3A6B] aria-invalid:outline-2 aria-invalid:outline-[#B42318]/60`}
            />
            {errText("message")}
            <p className={`mt-1 flex justify-between gap-2 font-mono text-[0.75em] text-[#5A5E57]`}>
              <span aria-hidden="true" className={`transition-opacity duration-300 ${savedAt ? "opacity-100" : "opacity-0"}`}>{t.saved}</span>
              <span id={`${id}-count`} className={near ? "font-bold text-[#92400E]" : ""}>{t.counter(count, maxLength)}</span>
            </p>
            <span role="status" className="sr-only">{preview ? "" : counterLive}</span>
          </div>

          {/* address half */}
          <div className="min-w-0 space-y-3 @[560px]:pl-5">
            <div className={`${sz.gap} min-h-[1.5em]`}>
              {t.to && <p className="font-serif text-[1.05em] font-semibold">{t.to}</p>}
              <p className={`${small} mt-2`}>{t.from}</p>
            </div>
            <div>
              <label htmlFor={`${id}-name`} className={small}>{t.name}</label>
              <input ref={nameRef} id={`${id}-name`} name="name" autoComplete="name" value={shown.name} readOnly={locked} placeholder={t.namePlaceholder} aria-required="true" aria-invalid={!!shownErrors.name || undefined} aria-describedby={described("name")} onChange={(e) => change("name", e.target.value)} onBlur={() => blur("name")} className={field} />
              {errText("name")}
            </div>
            <div>
              <label htmlFor={`${id}-email`} className={small}>{t.email}</label>
              <input ref={emailRef} id={`${id}-email`} name="email" type="email" autoComplete="email" inputMode="email" value={shown.email} readOnly={locked} placeholder={t.emailPlaceholder} aria-required="true" aria-invalid={!!shownErrors.email || undefined} aria-describedby={described("email")} onChange={(e) => change("email", e.target.value)} onBlur={() => blur("email")} className={field} />
              {errText("email")}
            </div>
            {hasTopics && (
              <div>
                <label htmlFor={`${id}-topic`} className={small}>{t.topic}</label>
                <select ref={topicRef} id={`${id}-topic`} name="topic" value={shown.topic} disabled={locked && !disabled} onChange={(e) => change("topic", e.target.value)} className={`${field} cursor-pointer disabled:cursor-default disabled:opacity-100`}>
                  <option value="">{t.topicPlaceholder}</option>
                  {topics!.map((x) => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </fieldset>

        {/* status strip along the bottom edge */}
        <div className={`flex min-h-6 flex-wrap items-center gap-x-3 gap-y-1 px-5 pb-3 text-[0.88em] font-semibold ${status === "error" ? `text-[#B42318]` : status === "mailbox" ? "text-[#92400E]" : `text-[#5A5E57]`}`}>
          <span role="status" aria-live="polite">
            {status === "sending" ? t.sending : status === "mailbox" ? `📮 ${t.mailbox}` : status === "idle" ? shownNote : ""}
          </span>
          {status === "error" && <span role="alert">{t.error}</span>}
          {status === "error" && (
            <button
              ref={afterRef}
              type="button"
              disabled={disabled}
              onClick={
                preview
                  ? undefined
                  : () => {
                      stampRef.current?.focus(); // this button goes away while it sends; an invalid field takes focus instead
                      submit();
                    }
              }
              className={btn}
            >
              {t.tryAgain}
            </button>
          )}
          {status === "mailbox" && (
            <button
              type="button"
              disabled={disabled}
              onClick={
                preview
                  ? undefined
                  : () => {
                      setLive("idle");
                      messageRef.current?.focus(); // back to writing; this button goes away
                    }
              }
              className={btn}
            >
              {t.takeBack}
            </button>
          )}
        </div>

        {/* the stamp: the submit button, pinned to the top-right corner */}
        <button
          ref={stampRef}
          type="submit"
          disabled={disabled}
          aria-disabled={!disabled && locked ? true : undefined}
          aria-label={status === "sending" ? t.stampBusy : t.stamp}
          className={`group absolute right-3 top-3 ${sz.stamp} ${focusRing} ${locked ? "cursor-default" : "cursor-pointer"}`}
        >
          {stuck ? (
            <span className="block size-full rotate-[3deg]">
              <span className="pcf-stick pcf-perf block size-full p-[5px] shadow-[0_2px_4px_rgba(0,0,0,.25)]">
                <span className="flex size-full flex-col items-center justify-between py-1 font-mono font-black" style={{ background: accent, color: textOn(accent) }}>
                  <span aria-hidden="true" className="text-[0.72em] leading-none">{t.stampValue}</span>
                  <span aria-hidden="true" className="text-[1.9em] leading-none">{t.stampArt}</span>
                  <span aria-hidden="true" className="h-0.5 w-3/5 bg-current opacity-50" />
                </span>
              </span>
            </span>
          ) : (
            <span className={`flex size-full items-center justify-center rounded-[3px] border-2 border-dashed border-[#8E8A7C] px-1 text-center font-mono text-[0.62em] font-bold uppercase leading-tight tracking-wider text-[#5A5E57] transition ${locked ? "" : "group-hover:-rotate-3 group-hover:border-solid group-hover:bg-white/60 group-hover:text-[#1E2320] group-active:scale-95"}`}>
              {t.stamp}
            </span>
          )}
        </button>
        {status === "sending" && (
          <Postmark ink={ink} date={today} word={t.postmark} inking className="pcf-thud pointer-events-none absolute right-[14px] top-[48px] h-[60px] w-[96px] mix-blend-multiply" />
        )}
      </form>
    </div>
  );
}
