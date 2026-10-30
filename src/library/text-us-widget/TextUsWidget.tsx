"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { COUNTRIES, caretAt, countDialable, exampleFor, parsePhone, sameDigits, textOn, type Country } from "./phone";

export { COUNTRIES, type Country } from "./phone";

export type TextUsState = "closed" | "open" | "filling" | "invalid" | "sending" | "sent" | "error" | "disabled" | "offline";

/** What onSend receives. */
export interface TextUsPayload {
  name: string;
  /** E.164, e.g. "+14155550134". */
  phone: string;
  /** ISO code of the country picked for the number. */
  country: string;
  message: string;
  consent: true;
  /** The exact consent wording the visitor saw, for your SMS opt-in records. */
  consentText: string;
  /** The page the visitor was on. */
  page: string;
  /** ISO time the message was sent. */
  timestamp: string;
}

export interface TextUsWidgetProps {
  /** Send the message to your CRM or webhook. Throw or reject to show the error state; the text is kept. */
  onSend: (payload: TextUsPayload) => Promise<void | { id?: string }> | void;
  /** Runs after onSend succeeds, with whatever it returned. */
  onSent?: (payload: TextUsPayload, result?: { id?: string }) => void;
  onError?: (error: unknown) => void;
  onStateChange?: (state: TextUsState) => void;
  onOpenChange?: (open: boolean) => void;
  businessName?: string;
  /** The number your replies come from, shown in the confirmation. */
  businessNumber?: string;
  replyTime?: string;
  /** Out of hours: shown instead of the reply time, e.g. "We're closed. We'll text you at 9 AM." Sending still works. */
  closedHint?: string;
  /** ISO code picked first in the country list. */
  defaultCountry?: string;
  countries?: Country[];
  /** Your own consent wording. {business} is filled in. */
  consentText?: string;
  /** "checkbox": a required tick box. "implied": pressing Send agrees, the line sits under the button. */
  consentMode?: "checkbox" | "implied";
  position?: "bottom-right" | "bottom-left";
  /** "window" pins it to the screen corner; "parent" keeps it inside a positioned parent. */
  container?: "window" | "parent";
  /** Open by itself once, after this many ms (true = 1200). Skipped if the visitor closed it this session. */
  openOnLoad?: boolean | number;
  /** Start with these filled in, e.g. a signed-in customer's name and number. A saved draft wins. */
  defaultValues?: { name?: string; phone?: string; message?: string };
  /** Team faces in the header. */
  team?: { name: string; src?: string }[];
  labels?: Partial<TextUsLabels>;
  /** Hex colour of the bubble, send button and sent message. Text on it is picked for contrast. */
  accent?: string;
  size?: "sm" | "md" | "lg";
  maxLength?: number;
  /** sessionStorage key for the draft. false turns drafts off. */
  draftKey?: string | false;
  disabled?: boolean;
  /** Draw one state still with sample data. Nothing runs. */
  previewState?: TextUsState;
  className?: string;
}

/** Every visible and announced string. Placeholders in braces ({business}, {phone}, {from}, {example}, {n}, {max}) are filled in. */
const DEFAULT_LABELS = {
  open: "Text us",
  disabled: "Texting is off",
  close: "Close",
  intro: "Leave your number and message. We reply by text, so you can close this page.",
  name: "Name",
  namePlaceholder: "Your first name",
  phone: "Mobile number",
  country: "Country code",
  message: "Message",
  messagePlaceholder: "How can we help?",
  counter: "{n}/{max}",
  consentCheckbox: "I agree to get text messages from {business} about my enquiry. Msg & data rates may apply. Msg frequency varies. Reply STOP to opt out, HELP for help.",
  consentImplied: "By sending, you agree to get text messages from {business} about your enquiry. Msg & data rates may apply. Msg frequency varies. Reply STOP to opt out, HELP for help.",
  send: "Send text",
  sending: "Sending…",
  retry: "Try again",
  errName: "Please add your name.",
  errPhoneEmpty: "Add your mobile number so we can text you back.",
  errPhone: "That number looks incomplete. Try {example}.",
  errMessage: "Please write a short message.",
  errConsent: "Please tick the box so we're allowed to text you.",
  error: "We couldn't send that. Your message is still here, so you can try again.",
  sentTitle: "Sent. Check your phone.",
  delivered: "Delivered to {business}",
  sentTo: "We'll text you at {phone}.",
  sentToFrom: "We'll text you at {phone} from {from}.",
  editNumber: "Wrong number? Edit",
  another: "New message",
  announceOpen: "Text us form opened.",
  announceSending: "Sending your message.",
  announceSent: "Message sent. We'll text you at {phone}.",
  announceInvalid: "Some details need fixing before we can send.",
};
export type TextUsLabels = typeof DEFAULT_LABELS;

const SIZES = {
  sm: { panel: "w-[290px]", text: "text-[13px]", pill: "h-11 px-4 text-sm", round: "size-11", pad: "px-2.5 py-1.5" },
  md: { panel: "w-[330px]", text: "text-sm", pill: "h-12 px-5 text-[0.95rem]", round: "size-12", pad: "px-3 py-2" },
  lg: { panel: "w-[370px]", text: "text-[15px]", pill: "h-14 px-6 text-base", round: "size-14", pad: "px-3.5 py-2.5" },
};

type Phase = "form" | "sending" | "sent" | "error";
interface Draft { name: string; phone: string; country: string; message: string; consent: boolean }
interface View { open: boolean; phase: Phase; form: Draft; showErrors: boolean; phoneBlurred: boolean; sent: { message: string; phone: string } | null }

const SAMPLE: Draft = { name: "Mia", phone: "(415) 555-0134", country: "US", message: "Hi! Can I book a cut and colour this Saturday?", consent: true };
function sampleView(s: TextUsState): View {
  const base: View = { open: true, phase: "form", form: SAMPLE, showErrors: false, phoneBlurred: false, sent: null };
  if (s === "closed" || s === "disabled") return { ...base, open: false };
  if (s === "open" || s === "offline") return { ...base, form: { ...SAMPLE, name: "", phone: "", message: "", consent: false } };
  if (s === "filling") return { ...base, form: { ...SAMPLE, message: "Hi! Can I book a cut", consent: false } };
  if (s === "invalid") return { ...base, form: { ...SAMPLE, phone: "(415) 555-01" }, phoneBlurred: true };
  if (s === "sent") return { ...base, phase: "sent", sent: { message: SAMPLE.message, phone: "+1 415 555 0134" } };
  return { ...base, phase: s === "sending" ? "sending" : "error" };
}

const MOTION = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (cb: () => void) => {
  const m = window.matchMedia(MOTION);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
/** Fill a template with React nodes, e.g. a bold phone number. */
function rich(s: string, vars: Record<string, ReactNode>): ReactNode[] {
  return s.split(/(\{\w+\})/g).map((part, i) => {
    const k = part.slice(1, -1);
    return part.startsWith("{") && k in vars ? <b key={i} className="font-semibold text-[var(--k-text,#E9EDE8)]">{vars[k]}</b> : part;
  });
}
const tint = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

const ChatIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[1.15em] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
  </svg>
);
const CloseIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[1.1em]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

/**
 * A floating "Text us" bubble that turns a website chat into a text conversation. The visitor leaves a name,
 * a mobile number and a message; onSend passes it to your CRM, and the reply reaches them by SMS, so the
 * lead isn't lost when they close the tab.
 */
export function TextUsWidget({
  onSend,
  onSent,
  onError,
  onStateChange,
  onOpenChange,
  businessName = "our team",
  businessNumber,
  replyTime = "We usually reply in a few minutes",
  closedHint,
  defaultCountry = "US",
  countries = COUNTRIES,
  consentText,
  consentMode = "checkbox",
  position = "bottom-right",
  container = "window",
  openOnLoad = false,
  defaultValues,
  team,
  labels,
  accent = "#C6FF3D",
  size = "md",
  maxLength = 320,
  draftKey = "text-us-draft",
  disabled = false,
  previewState,
  className = "",
}: TextUsWidgetProps) {
  const t = { ...DEFAULT_LABELS, ...labels };
  const uid = useId();
  const reduced = useSyncExternalStore(subscribeMotion, () => window.matchMedia(MOTION).matches, () => false);
  const inline = !!previewState;
  const start = countries.find((c) => c.code === defaultCountry) ?? countries[0];
  const sz = SIZES[size];
  const left = position === "bottom-left";

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("form");
  const [form, setForm] = useState<Draft>(() => {
    const p = parsePhone(defaultValues?.phone ?? "", start, countries);
    return { name: defaultValues?.name ?? "", phone: p.display, country: p.country.code, message: (defaultValues?.message ?? "").slice(0, maxLength), consent: false };
  });
  const [showErrors, setShowErrors] = useState(false);
  const [phoneBlurred, setPhoneBlurred] = useState(false);
  const [sent, setSent] = useState<View["sent"]>(null);
  const [fly, setFly] = useState<{ text: string; top: number; left: number; width: number; rise: number } | null>(null);

  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const bubble = useRef<HTMLButtonElement>(null);
  const nameEl = useRef<HTMLInputElement>(null);
  const phoneEl = useRef<HTMLInputElement>(null);
  const msgEl = useRef<HTMLTextAreaElement>(null);
  const consentEl = useRef<HTMLInputElement>(null);
  const sentHeading = useRef<HTMLHeadingElement>(null);
  const caret = useRef<number | null>(null);
  const draftLoaded = useRef(false);
  const focusOnOpen = useRef(false);
  const closing = useRef(false);
  const latest = useRef({ onSend, onSent, onError, onStateChange, onOpenChange, openPanel: ((focus: boolean) => void focus) as (focus: boolean) => void });

  const v: View = inline ? sampleView(previewState) : { open: open && !disabled, phase, form, showErrors, phoneBlurred, sent };
  const country = countries.find((c) => c.code === v.form.country) ?? start;
  const parsed = parsePhone(v.form.phone, country, countries);
  const consentLine = fill(consentText ?? (consentMode === "checkbox" ? t.consentCheckbox : t.consentImplied), { business: businessName });
  const invalid = {
    name: !v.form.name.trim(),
    phone: !parsed.valid,
    message: !v.form.message.trim(),
    consent: consentMode === "checkbox" && !v.form.consent,
  };
  const shown = {
    name: v.showErrors && invalid.name,
    phone: (v.showErrors || (v.phoneBlurred && !!v.form.phone)) && invalid.phone,
    message: v.showErrors && invalid.message,
    consent: v.showErrors && invalid.consent,
  };
  const hasContent = !!(v.form.name || v.form.phone || v.form.message);
  const state: TextUsState = inline
    ? previewState
    : disabled
      ? "disabled"
      : !open
        ? "closed"
        : phase !== "form"
          ? phase
          : Object.values(shown).some(Boolean)
            ? "invalid"
            : hasContent
              ? "filling"
              : closedHint
                ? "offline"
                : "open";
  const busy = v.phase === "sending";

  function openPanel(focus: boolean) {
    if (disabled || inline || open) return;
    if (!draftLoaded.current) {
      draftLoaded.current = true;
      const raw = draftKey ? storage()?.getItem(draftKey) : null;
      try {
        const d = raw ? (JSON.parse(raw) as Partial<Draft>) : null;
        if (d) setForm((f) => ({ name: String(d.name ?? f.name), phone: String(d.phone ?? f.phone), country: countries.some((c) => c.code === d.country) ? String(d.country) : f.country, message: String(d.message ?? f.message).slice(0, maxLength), consent: !!d.consent }));
      } catch {
        /* a broken draft is ignored */
      }
    }
    if (phase === "sent") {
      setPhase("form");
      setSent(null);
    }
    focusOnOpen.current = focus;
    setOpen(true);
    latest.current.onOpenChange?.(true);
  }

  function closePanel() {
    if (!open || closing.current) return;
    if (draftKey) storage()?.setItem(`${draftKey}:closed`, "1");
    const done = () => {
      closing.current = false;
      setOpen(false);
      latest.current.onOpenChange?.(false);
      bubble.current?.focus();
    };
    const el = panel.current;
    if (!el || reduced) return done();
    closing.current = true;
    el.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(.85) translateY(8px)" }], { duration: 160, easing: "ease-in", fill: "forwards" }).finished.then(done, done);
  }

  useEffect(() => {
    latest.current = { onSend, onSent, onError, onStateChange, onOpenChange, openPanel };
  });

  useEffect(() => {
    if (!inline) latest.current.onStateChange?.(state);
  }, [state, inline]);

  // Open once by itself, unless the visitor already closed it in this session.
  useEffect(() => {
    if (!openOnLoad || inline || disabled) return;
    if (draftKey && storage()?.getItem(`${draftKey}:closed`)) return;
    const id = window.setTimeout(() => latest.current.openPanel(false), typeof openOnLoad === "number" ? openOnLoad : 1200);
    return () => clearTimeout(id);
  }, [openOnLoad, inline, disabled, draftKey]);

  // Keep the draft for this browser tab, so closing the panel (or the page) loses nothing.
  useEffect(() => {
    if (!draftKey || inline || !draftLoaded.current) return;
    storage()?.setItem(draftKey, JSON.stringify(form));
  }, [form, draftKey, inline]);

  // The panel grows out of the bubble's corner, then the first empty field gets focus.
  useLayoutEffect(() => {
    const el = panel.current;
    if (!open || !el) return;
    if (!reduced) el.animate([{ opacity: 0, transform: "scale(.6) translateY(12px)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: "cubic-bezier(.2,.8,.2,1.1)" });
    if (focusOnOpen.current) (!nameEl.current?.value ? nameEl : !phoneEl.current?.value ? phoneEl : msgEl).current?.focus();
    focusOnOpen.current = false;
  }, [open, reduced]);

  // Put the caret back where it was after the number is reformatted.
  useLayoutEffect(() => {
    const el = phoneEl.current;
    const n = caret.current;
    if (n === null || !el) return;
    caret.current = null;
    if (document.activeElement === el) {
      const i = caretAt(el.value, n);
      el.setSelectionRange(i, i);
    }
  });

  // The form is replaced by the confirmation: move focus to it so keyboard users aren't dropped.
  useEffect(() => {
    if (phase !== "sent" || !open) return;
    const a = document.activeElement;
    if (!a || a === document.body || root.current?.contains(a)) sentHeading.current?.focus({ preventScroll: true });
  }, [phase, open]);

  function onPhone(el: HTMLInputElement) {
    let raw = el.value;
    let at = el.selectionStart ?? raw.length;
    // Backspace over a space or bracket removes the digit before it, so the caret never gets stuck.
    if (raw.length < form.phone.length && sameDigits(raw, form.phone)) {
      const i = raw.slice(0, at).search(/\d(?=\D*$)/);
      if (i >= 0) {
        raw = raw.slice(0, i) + raw.slice(i + 1);
        at = i;
      }
    }
    caret.current = countDialable(raw.slice(0, at));
    const p = parsePhone(raw, country, countries);
    setForm((f) => ({ ...f, phone: p.display, country: p.country.code }));
  }

  function onCountry(code: string) {
    const c = countries.find((x) => x.code === code) ?? start;
    setForm((f) => ({ ...f, country: c.code, phone: parsed.nsn ? parsePhone(parsed.nsn, c, countries).display : "" }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || disabled || inline) return;
    if (invalid.name || invalid.phone || invalid.message || invalid.consent) {
      setShowErrors(true);
      (invalid.name ? nameEl : invalid.phone ? phoneEl : invalid.message ? msgEl : consentEl).current?.focus();
      return;
    }
    const payload: TextUsPayload = {
      name: form.name.trim(),
      phone: parsed.e164,
      country: country.code,
      message: form.message.trim(),
      consent: true,
      consentText: consentLine,
      page: window.location.href,
      timestamp: new Date().toISOString(),
    };
    const box = msgEl.current?.getBoundingClientRect();
    const base = root.current?.getBoundingClientRect();
    const lid = panel.current?.getBoundingClientRect();
    setPhase("sending");
    try {
      const result = await latest.current.onSend(payload);
      setSent({ message: payload.message, phone: parsed.pretty });
      setPhase("sent");
      setShowErrors(false);
      setPhoneBlurred(false);
      setForm((f) => ({ ...f, message: "" }));
      // Measured on screen; divide by any CSS scale on an ancestor so the bubble lines up inside zoomed previews.
      const k = base && root.current?.offsetWidth ? base.width / root.current.offsetWidth || 1 : 1;
      if (!reduced && box && base) setFly({ text: payload.message, top: (box.top - base.top) / k, left: (box.left - base.left) / k, width: box.width / k, rise: (box.top - (lid?.top ?? base.top)) / k + 80 });
      latest.current.onSent?.(payload, result || undefined);
    } catch (err) {
      setPhase("error");
      latest.current.onError?.(err);
    }
  }

  function backToForm(field: "phone" | "message") {
    if (field === "phone" && sent) setForm((f) => ({ ...f, message: sent.message }));
    setPhase("form");
    setSent(null);
    requestAnimationFrame(() => {
      const el = (field === "phone" ? phoneEl : msgEl).current;
      el?.focus();
      if (field === "phone") el?.select();
    });
  }

  // The sent message lifts off and leaves through the top of the panel.
  const flyRef = (el: HTMLDivElement | null) => {
    if (!el || !fly || el.dataset.flown) return;
    el.dataset.flown = "1";
    el.animate(
      [
        { transform: "none", opacity: 1 },
        { transform: "translateY(-16px) scale(1.03)", opacity: 1, offset: 0.25 },
        { transform: `translateY(${-fly.rise}px) scale(.55)`, opacity: 0 },
      ],
      { duration: 950, easing: "cubic-bezier(.5,0,.3,1)", fill: "forwards" },
    ).finished.then(() => setFly(null), () => setFly(null));
  };
  const appearRef = (el: HTMLDivElement | null) => {
    if (!el || inline || reduced || el.dataset.shown) return;
    el.dataset.shown = "1";
    el.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 320, delay: 380, easing: "ease-out", fill: "backwards" });
  };

  const onAccent: CSSProperties = { background: accent, color: textOn(accent) };
  const ring = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)]";
  const field = `block w-full rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-bg,#0E1110)] ${sz.pad} text-[var(--k-text,#E9EDE8)] placeholder:text-[var(--k-mute,#8A938D)] transition-colors hover:border-[var(--k-mute,#8A938D)] focus-visible:border-[var(--k-acc-text,#C6FF3D)] focus-visible:outline-none aria-invalid:border-[var(--k-err-text,#FF8A7A)] read-only:opacity-70`;
  const ghost = `rounded-md font-semibold text-[var(--k-acc-text,#C6FF3D)] underline-offset-2 hover:underline ${ring}`;
  const err = (id: string, on: boolean, text: string) => on && <p id={id} className="mt-1 text-xs font-semibold text-[var(--k-err-text,#FF8A7A)]">{text}</p>;
  const still = (value: string, placeholder: string, bad: boolean, multi = false) => (
    <span aria-invalid={bad || undefined} className={`${field} ${multi ? "min-h-[4.6rem] whitespace-pre-wrap" : "truncate"}`}>
      {value || <span className="text-[var(--k-mute,#8A938D)]">{placeholder}</span>}
    </span>
  );
  const Btn = inline ? "span" : "button";
  const announce = { open: t.announceOpen, offline: t.announceOpen, sending: t.announceSending, sent: fill(t.announceSent, { phone: sent?.phone ?? "" }), error: t.error, invalid: t.announceInvalid }[state as string] ?? "";
  const ids = { title: `${uid}-t`, panel: `${uid}-p`, name: `${uid}-n`, phone: `${uid}-ph`, cc: `${uid}-cc`, msg: `${uid}-m`, count: `${uid}-c`, consent: `${uid}-ok` };
  const placeholder = exampleFor(country);

  const header = (
    <div className="flex items-center gap-3 border-b border-[var(--k-line,#3A433F)] px-4 py-3">
      {team?.length ? (
        <span className="flex shrink-0 pl-2" aria-hidden="true">
          {team.slice(0, 3).map((m) => (
            <span key={m.name} title={m.name} className="-ml-2 grid size-8 place-items-center rounded-full border-2 border-[var(--k-panel,#121614)] bg-cover bg-center text-[11px] font-bold" style={m.src ? { backgroundImage: `url("${m.src}")` } : { background: tint(accent, 30), color: "var(--k-text,#E9EDE8)" }}>
              {m.src ? "" : m.name.slice(0, 1).toUpperCase()}
            </span>
          ))}
        </span>
      ) : (
        <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full" style={onAccent}>
          <ChatIcon />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h2 id={ids.title} className="truncate font-bold leading-tight">{businessName}</h2>
        <p className={`mt-0.5 flex items-center gap-1.5 text-xs ${closedHint ? "text-[var(--k-warn-text,#FFB547)]" : "text-[var(--k-mute,#8A938D)]"}`}>
          <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${closedHint ? "bg-[var(--k-warn-text,#FFB547)]" : "bg-[#3FCB73]"}`} />
          {closedHint ?? replyTime}
        </p>
      </div>
      <Btn {...(inline ? {} : { type: "button" as const, onClick: closePanel, "aria-label": t.close })} className={`grid size-8 shrink-0 place-items-center rounded-md text-[var(--k-mute,#8A938D)] transition-colors hover:bg-[var(--k-panel-2,#181D1B)] hover:text-[var(--k-text,#E9EDE8)] ${ring}`}>
        <CloseIcon />
      </Btn>
    </div>
  );

  const sentView = v.sent && (
    <div ref={appearRef} className="px-4 py-4">
      <div className="flex flex-col items-end gap-1">
        <p className="max-w-[85%] rounded-2xl rounded-br-md px-3 py-2 leading-snug" style={onAccent}>{v.sent.message}</p>
        <p className="text-[11px] text-[var(--k-mute,#8A938D)]"><span aria-hidden="true">✓ </span>{fill(t.delivered, { business: businessName })}</p>
      </div>
      <div className="mt-4 flex items-start gap-3 rounded-xl border border-[var(--k-line,#3A433F)] bg-[var(--k-panel-2,#181D1B)] p-3">
        <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full text-[var(--k-text,#E9EDE8)]" style={{ background: tint(accent, 22) }}>
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M10.5 18h3" /></svg>
        </span>
        <div className="min-w-0">
          <h3 ref={sentHeading} tabIndex={-1} className="font-bold outline-none">{t.sentTitle}</h3>
          <p className="mt-0.5 text-[var(--k-mute,#8A938D)]">{rich(businessNumber ? t.sentToFrom : t.sentTo, { phone: <span className="whitespace-nowrap">{v.sent.phone}</span>, from: <span className="whitespace-nowrap">{businessNumber}</span> })}</p>
          {closedHint && <p className="mt-1 text-xs text-[var(--k-warn-text,#FFB547)]">{closedHint}</p>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <Btn {...(inline ? {} : { type: "button" as const, onClick: () => backToForm("phone") })} className={ghost}>{t.editNumber}</Btn>
        <Btn {...(inline ? {} : { type: "button" as const, onClick: () => backToForm("message") })} className={`${ghost} text-[var(--k-mute,#8A938D)]`}>{t.another}</Btn>
      </div>
    </div>
  );

  const formView = (
    <form noValidate onSubmit={submit} aria-busy={busy || undefined} className="space-y-3 px-4 py-4">
      <p className="text-[var(--k-mute,#8A938D)]">{t.intro}</p>
      <div>
        <label htmlFor={ids.name} className="mb-1 block text-xs font-semibold">{t.name}</label>
        {inline ? still(v.form.name, t.namePlaceholder, shown.name) : (
          <input ref={nameEl} id={ids.name} value={form.name} readOnly={busy} autoComplete="name" placeholder={t.namePlaceholder} aria-invalid={shown.name || undefined} aria-describedby={shown.name ? `${ids.name}-e` : undefined}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={field} />
        )}
        {err(`${ids.name}-e`, shown.name, t.errName)}
      </div>
      <div>
        <label htmlFor={ids.phone} className="mb-1 block text-xs font-semibold">{t.phone}</label>
        <div className="flex gap-2">
          {inline ? (
            <span className={`${field} w-auto shrink-0`}>{country.flag} +{country.dial}</span>
          ) : (
            <select id={ids.cc} aria-label={t.country} value={country.code} disabled={busy} onChange={(e) => onCountry(e.target.value)} className={`${field} w-auto shrink-0 cursor-pointer pr-1`}>
              {countries.map((c) => <option key={c.code} value={c.code}>{c.flag} +{c.dial} {c.name}</option>)}
            </select>
          )}
          {inline ? still(v.form.phone, placeholder, shown.phone) : (
            <input ref={phoneEl} id={ids.phone} type="tel" inputMode="tel" autoComplete="tel" value={form.phone} readOnly={busy} placeholder={placeholder} aria-invalid={shown.phone || undefined} aria-describedby={shown.phone ? `${ids.phone}-e` : undefined}
              onChange={(e) => onPhone(e.target)} onBlur={() => setPhoneBlurred(true)} onFocus={() => setPhoneBlurred(false)} className={`${field} min-w-0 tabular-nums`} />
          )}
        </div>
        {err(`${ids.phone}-e`, shown.phone, v.form.phone ? fill(t.errPhone, { example: placeholder }) : t.errPhoneEmpty)}
      </div>
      <div>
        <label htmlFor={ids.msg} className="mb-1 block text-xs font-semibold">{t.message}</label>
        {inline ? still(v.form.message, t.messagePlaceholder, shown.message, true) : (
          <textarea ref={msgEl} id={ids.msg} rows={3} value={form.message} readOnly={busy} maxLength={maxLength} placeholder={t.messagePlaceholder} aria-invalid={shown.message || undefined} aria-describedby={`${ids.count}${shown.message ? ` ${ids.msg}-e` : ""}`}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && (e.metaKey || e.ctrlKey) && e.currentTarget.form?.requestSubmit()} className={`${field} resize-none`} />
        )}
        <div className="mt-1 flex items-start justify-between gap-2">
          <span>{err(`${ids.msg}-e`, shown.message, t.errMessage)}</span>
          <span id={ids.count} className="shrink-0 text-[11px] tabular-nums text-[var(--k-mute,#8A938D)]">{fill(t.counter, { n: v.form.message.length, max: maxLength })}</span>
        </div>
      </div>
      {consentMode === "checkbox" && (
        <div>
          <label className="flex cursor-pointer items-start gap-2 text-[11px] leading-snug text-[var(--k-mute,#8A938D)]">
            {inline ? (
              <span aria-hidden="true" className="mt-0.5 grid size-4 shrink-0 place-items-center rounded border border-[var(--k-line,#3A433F)] text-[10px] font-bold" style={v.form.consent ? onAccent : undefined}>{v.form.consent ? "✓" : ""}</span>
            ) : (
              <input ref={consentEl} id={ids.consent} type="checkbox" checked={form.consent} disabled={busy} aria-invalid={shown.consent || undefined} aria-describedby={shown.consent ? `${ids.consent}-e` : undefined}
                onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))} style={{ accentColor: accent }} className={`mt-0.5 size-4 shrink-0 cursor-pointer rounded ${ring}`} />
            )}
            <span>{consentLine}</span>
          </label>
          {err(`${ids.consent}-e`, shown.consent, t.errConsent)}
        </div>
      )}
      {v.phase === "error" && (
        <p className="rounded-lg border px-3 py-2 text-xs font-semibold text-[var(--k-err-text,#FF8A7A)]" style={{ borderColor: tint("var(--k-err-text,#FF8A7A)", 45), background: tint("var(--k-err-text,#FF8A7A)", 10) }}>{t.error}</p>
      )}
      <Btn {...(inline ? {} : { type: "submit" as const, "aria-disabled": busy || undefined })} style={onAccent}
        className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-bold shadow-[0_8px_24px_-12px_var(--k-shadow,rgba(0,0,0,.9))] transition-[filter,transform] ${busy ? "cursor-progress" : "hover:brightness-110 active:translate-y-px active:brightness-95"} ${ring}`}>
        {busy && <span aria-hidden="true" className="size-3.5 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin" />}
        {busy ? t.sending : v.phase === "error" ? t.retry : t.send}
      </Btn>
      {consentMode === "implied" && <p className="text-[11px] leading-snug text-[var(--k-mute,#8A938D)]">{consentLine}</p>}
    </form>
  );

  const off = state === "disabled";
  return (
    <div
      ref={root}
      inert={inline || undefined}
      data-state={state}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation();
          closePanel();
        }
      }}
      className={`${inline ? "relative inline-flex" : `${container === "window" ? "fixed" : "absolute"} inset-3 z-50 flex justify-end sm:inset-4 pointer-events-none`} flex-col gap-3 ${left ? "items-start" : "items-end"} ${sz.text} text-[var(--k-text,#E9EDE8)] ${className}`}
    >
      {v.open && (
        <div
          ref={panel}
          id={ids.panel}
          role={inline ? undefined : "dialog"}
          aria-labelledby={inline ? undefined : ids.title}
          style={{ transformOrigin: left ? "bottom left" : "bottom right" }}
          className={`pointer-events-auto ${sz.panel} max-w-full overflow-y-auto rounded-2xl border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] shadow-[0_24px_60px_-20px_var(--k-shadow,rgba(0,0,0,.9))] ${inline ? "" : "min-h-0 max-h-[620px] shrink"}`}
        >
          {header}
          {v.phase === "sent" ? sentView : formView}
        </div>
      )}
      {fly && (
        <div ref={flyRef} aria-hidden="true" className="pointer-events-none absolute flex justify-end" style={{ top: fly.top, left: fly.left, width: fly.width }}>
          <span className="line-clamp-2 max-w-[85%] rounded-2xl rounded-br-md px-3 py-2 leading-snug shadow-lg" style={onAccent}>{fly.text}</span>
        </div>
      )}
      <Btn
        {...(inline ? {} : { ref: bubble, type: "button" as const, disabled, onClick: () => (open ? closePanel() : openPanel(true)), "aria-expanded": open, "aria-controls": open ? ids.panel : undefined, "aria-label": open ? t.close : undefined })}
        style={off ? undefined : onAccent}
        className={`pointer-events-auto inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-bold shadow-[0_12px_30px_-10px_var(--k-shadow,rgba(0,0,0,.9))] transition-[transform,filter,box-shadow] ${v.open ? sz.round : sz.pill} ${off ? "cursor-not-allowed border border-[var(--k-line,#3A433F)] bg-[var(--k-panel-2,#181D1B)] text-[var(--k-mute,#8A938D)] shadow-none" : "hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:brightness-95"} ${ring}`}
      >
        {v.open ? <CloseIcon /> : (<><ChatIcon /><span>{off ? t.disabled : t.open}</span></>)}
      </Btn>
      {!inline && <p role="status" aria-live="polite" className="sr-only">{announce}</p>}
    </div>
  );
}
