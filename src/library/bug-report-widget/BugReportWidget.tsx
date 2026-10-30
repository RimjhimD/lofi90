"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type RefObject } from "react";
import { ITEM_KEYS, SAMPLE_CONTEXT, captureConsole, captureFetch, captureTrail, collect as collectContext, describe, makeId, matchesShortcut, previewLines, textOn, toMarkdown } from "./context";
import type { BugReport, ConsoleEntry, Crumb, ItemKey, NetworkEntry, ReportContext, Severity } from "./context";

export type { BugReport, ReportContext, Severity, ItemKey } from "./context";
export type BugReportLabelOverrides = LabelOverrides;

export type BugReportState = "idle" | "picking" | "picked" | "filling" | "invalid" | "submitting" | "sent" | "failed" | "disabled";

type LabelOverrides = Partial<Omit<BugReportLabels, "items" | "severities">> & { items?: Partial<Record<ItemKey, string>>; severities?: Partial<Record<Severity, string>> };

export interface BugReportWidgetProps {
  /** Send the report. Return a reference id (or { id }) to show it; throw or reject to show the retry state. */
  onSubmit: (report: BugReport) => Promise<string | { id?: string } | void> | string | void;
  /** Keyboard shortcut that starts a report, e.g. "Alt+Shift+B". An empty string turns it off. */
  shortcut?: string;
  /** Start a report from outside (edge-triggered: false → true starts pick mode). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Called whenever the live state changes (idle, picking, picked, filling, invalid, submitting, sent, failed, disabled). */
  onStateChange?: (state: BugReportState) => void;
  /** What is recorded in the background while the widget is mounted. Network (a fetch wrapper) is opt-in. */
  collect?: { console?: boolean; network?: boolean; breadcrumbs?: boolean };
  /** Keep query-string values in the page URL. Off by default, since URLs often carry tokens or emails. */
  fullUrl?: boolean;
  /** Only pick inside this element (it must be positioned and contain the widget). The overlays stay inside it too. */
  contained?: RefObject<HTMLElement | null>;
  labels?: LabelOverrides;
  /** Hex accent for the button, highlight and send button; text colour on it is picked for contrast. */
  accent?: string;
  size?: "sm" | "md" | "lg";
  /** Corner for the floating button. */
  position?: "bottom-right" | "bottom-left";
  /** How dark the page dims while picking, 0–80 (%). */
  dim?: number;
  /** Hide the floating button when you open it with `open` or the shortcut only. */
  showTrigger?: boolean;
  disabled?: boolean;
  /** Draw one state statically with sample data, without touching the page. */
  previewState?: BugReportState;
  className?: string;
}

/** Every visible and announced string. {n}/{m}/{id}/{label} are filled in. */
const DEFAULT_LABELS = {
  trigger: "Report a problem",
  pickHint: "Click the part that's broken",
  pickKeys: "Tab moves · Enter picks · S skips · Esc cancels",
  skip: "Skip",
  cancel: "Cancel",
  selected: "Selected",
  continue: "Describe it",
  pickAgain: "Pick again",
  pickOne: "Point at it",
  title: "Report a problem",
  noElement: "No element picked",
  happened: "What happened?",
  happenedPlaceholder: "I clicked Apply coupon and nothing changed.",
  expected: "What did you expect?",
  optional: "optional",
  severity: "How bad is it?",
  /** Section titles in the Markdown copy. */
  mdSeverity: "Severity",
  mdEnvironment: "Environment",
  severities: { blocker: "Blocks me", major: "Major", minor: "Minor", cosmetic: "Looks off" } as Record<Severity, string>,
  email: "Your email",
  required: "Please say what happened.",
  emailInvalid: "That email doesn't look right.",
  attached: "Attached for the developer",
  attachedCount: "{n} of {m}",
  attachedHint: "Untick anything you'd rather not send. Typed values aren't read and emails or tokens in logs are hidden, but check the console lines first.",
  items: { page: "Page", element: "Element", screen: "Screen", browser: "Browser", time: "Time", console: "Console errors", network: "Failed requests", breadcrumbs: "Steps before" } as Record<ItemKey, string>,
  none: "None recorded",
  send: "Send report",
  sending: "Sending…",
  retry: "Try again",
  failed: "Couldn't send the report. Your text is kept, try again.",
  sent: "Report sent",
  sentBody: "Thanks. Your reference is {id}.",
  copyMarkdown: "Copy as Markdown",
  copied: "Copied as Markdown.",
  copyFailed: "Couldn't copy. Use Download JSON instead.",
  download: "Download JSON",
  close: "Close",
  done: "Done",
  pickingAnnounce: "Pick mode. Point at the broken part and click it. Tab moves between controls, Enter picks, S skips, Escape cancels.",
  pickedAnnounce: "Selected {label}.",
  cancelled: "Report cancelled.",
};
export type BugReportLabels = typeof DEFAULT_LABELS;

const mergeLabels = (l?: LabelOverrides): BugReportLabels => ({ ...DEFAULT_LABELS, ...l, items: { ...DEFAULT_LABELS.items, ...l?.items }, severities: { ...DEFAULT_LABELS.severities, ...l?.severities } });

/** The same GitHub-issue-ready Markdown that "Copy as Markdown" makes, e.g. to post the report to your tracker. */
export function reportToMarkdown(report: BugReport, labels?: LabelOverrides): string {
  const t = mergeLabels(labels);
  return toMarkdown(report, { ...t.items, severity: t.mdSeverity, environment: t.mdEnvironment, expected: t.expected, happened: t.happened });
}

const SEVERITIES: Severity[] = ["blocker", "major", "minor", "cosmetic"];
const PICKABLE = "a, button, input, select, textarea, label, summary, [role], [data-testid]";
const TABBABLE = "a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex='-1']), [data-testid]";
const TRIGGER = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-base" };
const DIALOG = { sm: "w-[min(100%,22rem)] text-xs", md: "w-[min(100%,28rem)] text-sm", lg: "w-[min(100%,34rem)] text-[0.95rem]" };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ring = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)]";
const ghost = `rounded-md border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] px-2.5 py-1 font-semibold text-[var(--k-text,#E9EDE8)] transition-colors hover:border-[var(--k-acc-text,#C6FF3D)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 ${ring}`;
const field = `mt-1 w-full rounded-md border border-[var(--k-line,#3A433F)] bg-[var(--k-panel-2,#181D1B)] px-2.5 py-1.5 text-[var(--k-text,#E9EDE8)] placeholder:text-[var(--k-mute,#8A938D)] hover:border-[var(--k-mute,#8A938D)] aria-invalid:border-[var(--k-err-text,#FF8A7A)] ${ring}`;

interface Target { el: Element | null; label: string; x: number; y: number; w: number; h: number; flip: boolean }
const PREVIEW_TARGET: Target = { el: null, label: SAMPLE_CONTEXT.element!.label, x: 150, y: 86, w: 108, h: 30, flip: true };

/** Where an element sits relative to the overlay layer (the window when not contained). */
function measure(el: Element, layer: HTMLElement | null): Target {
  const r = el.getBoundingClientRect();
  const o = layer?.getBoundingClientRect() ?? { left: 0, top: 0, width: window.innerWidth };
  // Tags on the right half hang leftwards so they never run off the edge.
  return { el, label: describe(el), x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height, flip: r.left + r.width / 2 - o.left > o.width / 2 };
}

/**
 * "Report a problem" for staging sites and client review. The reporter points at the broken element and writes one line;
 * the report carries the page, a unique selector, screen, browser, time, recent console errors, failed requests and the
 * clicks that led there. Every item can be unticked before sending.
 */
export function BugReportWidget({ onSubmit, shortcut = "Alt+Shift+B", open, onOpenChange, onStateChange, collect = {}, fullUrl = false, contained, labels, accent = "#C6FF3D", size = "md",
  position = "bottom-right", dim = 45, showTrigger = true, disabled = false, previewState, className = "" }: BugReportWidgetProps) {
  const text = mergeLabels(labels);
  const uid = useId();
  const root = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const desc = useRef<HTMLTextAreaElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstAction = useRef<HTMLButtonElement>(null);
  const logs = useRef<{ console: ConsoleEntry[]; network: NetworkEntry[]; breadcrumbs: Crumb[] }>({ console: [], network: [], breadcrumbs: [] });
  const alive = useRef(true);

  const [phase, setPhase] = useState<"idle" | "picking" | "picked" | "dialog">("idle");
  const [send, setSend] = useState<"filling" | "submitting" | "sent" | "failed">("filling");
  const [target, setTarget] = useState<Target | null>(null);
  const [ctx, setCtx] = useState<ReportContext>({});
  const [include, setInclude] = useState<Record<ItemKey, boolean>>(() => Object.fromEntries(ITEM_KEYS.map((k) => [k, true])) as Record<ItemKey, boolean>);
  const [form, setForm] = useState({ description: "", expected: "", severity: "major" as Severity, email: "" });
  const [showErrors, setShowErrors] = useState(false);
  const [refId, setRefId] = useState("");
  const [announce, setAnnounce] = useState("");
  const [seenOpen, setSeenOpen] = useState(false);

  const wantConsole = collect.console ?? true;
  const wantNetwork = collect.network ?? false;
  const wantTrail = collect.breadcrumbs ?? true;
  const inline = !!previewState;
  const pos = contained ? "absolute" : "fixed";

  // Controlled open: false → true starts a report, true → false closes it (derived during render, no effect).
  if (open !== undefined && open !== seenOpen) {
    setSeenOpen(open);
    if (open && phase === "idle" && !disabled) setPhase("picking");
    if (!open && phase !== "idle") setPhase("idle");
  }

  const errors = { description: !form.description.trim(), email: !!form.email.trim() && !EMAIL.test(form.email.trim()) };
  const filling: BugReportState = showErrors && (errors.description || errors.email) ? "invalid" : "filling";
  const live: BugReportState = disabled ? "disabled" : phase !== "dialog" ? phase : send === "filling" ? filling : send;
  const state = previewState ?? live;
  const sample = { description: state === "invalid" ? "" : "I typed SAVE10 and clicked Apply coupon. Nothing happened and the total stayed the same.", expected: "", severity: "major" as Severity, email: "" };
  const view = inline ? { ctx: SAMPLE_CONTEXT, target: state === "picking" || state === "picked" ? PREVIEW_TARGET : null, form: sample, refId: "BR-K3F9QZ", showErrors: state === "invalid" } : { ctx, target, form, refId, showErrors };
  const viewErrors = inline ? { description: state === "invalid", email: false } : errors;

  const onState = useRef(onStateChange);
  useEffect(() => {
    onState.current = onStateChange;
  });
  useEffect(() => {
    if (!inline) onState.current?.(live);
  }, [live, inline]);

  // Background capture, installed on mount and fully undone on unmount.
  useEffect(() => {
    alive.current = true;
    const keep = <T,>(list: T[], item: T, max: number) => {
      list.push(item);
      if (list.length > max) list.splice(0, list.length - max);
    };
    const undo: (() => void)[] = [];
    if (previewState) return;
    if (wantConsole) undo.push(captureConsole((e) => keep(logs.current.console, e, 20)));
    if (wantNetwork) undo.push(captureFetch((e) => keep(logs.current.network, e, 20)));
    if (wantTrail) undo.push(captureTrail(() => contained?.current ?? document.body, () => root.current, (c) => keep(logs.current.breadcrumbs, c, 30)));
    return () => {
      alive.current = false;
      undo.forEach((u) => u());
    };
  }, [wantConsole, wantNetwork, wantTrail, contained, previewState]);

  // Latest handlers for the window listeners below, so those listeners don't re-attach every render.
  const fns = useRef({ choose: ((el: Element) => void el) as (el: Element) => void, cancel: () => {}, skip: () => {}, start: () => {}, idle: true, blocked: false });
  useEffect(() => {
    fns.current = { choose, cancel, skip: () => openDialog(null), start, idle: phase === "idle", blocked: disabled || inline };
  });

  // Keyboard shortcut.
  useEffect(() => {
    if (!shortcut || inline) return;
    const onKey = (e: KeyboardEvent) => {
      if (!matchesShortcut(e, shortcut) || fns.current.blocked || !fns.current.idle) return;
      e.preventDefault();
      fns.current.start();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcut, inline]);

  // Pick mode: hover highlights, click picks, and the page's own handlers never see those clicks.
  useEffect(() => {
    if (phase !== "picking" || inline) return;
    const scope = () => contained?.current ?? document.body;
    let current: Element | null = null;
    const pickable = (t: EventTarget | null): Element | null => {
      if (!(t instanceof Element) || root.current?.contains(t) || !scope().contains(t)) return null;
      const near = t.closest(PICKABLE);
      return near && scope().contains(near) && !root.current?.contains(near) ? near : t;
    };
    const show = (el: Element | null) => {
      current = el;
      setTarget(el ? measure(el, layer.current) : null);
    };
    const onMove = (e: PointerEvent) => {
      const el = pickable(e.target);
      if (el !== current) show(el);
    };
    const block = (e: Event) => {
      const el = pickable(e.target);
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "click") fns.current.choose(el);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fns.current.cancel();
      else if (e.key === "Enter" && current) fns.current.choose(current);
      else if (e.key.toLowerCase() === "s" && !e.ctrlKey && !e.metaKey && !e.altKey) fns.current.skip();
      else if (e.key === "Tab") {
        const list = [...scope().querySelectorAll(TABBABLE)].filter((el) => !root.current?.contains(el) && el.getClientRects().length > 0);
        if (!list.length) return;
        const i = current ? list.indexOf(current) : -1;
        const next = list[(i + (e.shiftKey ? -1 : 1) + list.length) % list.length];
        next.scrollIntoView({ block: "nearest", inline: "nearest" });
        show(next);
        setAnnounce(`${describe(next)} (${list.indexOf(next) + 1}/${list.length})`);
      } else return;
      e.preventDefault();
      e.stopPropagation();
    };
    const types = ["pointerdown", "mousedown", "pointerup", "mouseup", "click", "dblclick", "auxclick", "contextmenu"];
    types.forEach((t) => window.addEventListener(t, block, true));
    window.addEventListener("pointermove", onMove, true);
    window.addEventListener("keydown", onKey, true);
    return () => {
      types.forEach((t) => window.removeEventListener(t, block, true));
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [phase, inline, contained]);

  // Keep the highlight on its element while the page scrolls or resizes.
  useEffect(() => {
    if ((phase !== "picking" && phase !== "picked") || inline) return;
    let raf = 0;
    const again = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setTarget((t) => (t?.el ? measure(t.el, layer.current) : t)));
    };
    window.addEventListener("scroll", again, true);
    window.addEventListener("resize", again);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", again, true);
      window.removeEventListener("resize", again);
    };
  }, [phase, inline]);

  // Move focus where the person needs it next.
  const wasIdle = useRef(true);
  useEffect(() => {
    if (inline) return;
    if (phase === "picked") firstAction.current?.focus();
    else if (phase === "dialog" && send === "sent") firstAction.current?.focus();
    else if (phase === "dialog" && send === "filling" && !dialog.current?.contains(document.activeElement)) desc.current?.focus();
    else if (phase === "idle" && !wasIdle.current) triggerRef.current?.focus();
    wasIdle.current = phase === "idle";
  }, [phase, send, inline]);

  function start() {
    if (disabled || inline) return;
    setTarget(null);
    setPhase("picking");
    setAnnounce(text.pickingAnnounce);
    onOpenChange?.(true);
  }
  function choose(el: Element) {
    setTarget(measure(el, layer.current));
    setPhase("picked");
    setAnnounce(text.pickedAnnounce.replace("{label}", describe(el)));
  }
  function openDialog(el: Element | null) {
    const c = collectContext(el, logs.current, fullUrl);
    if (!wantConsole) c.console = undefined;
    if (!wantNetwork) c.network = undefined;
    if (!wantTrail) c.breadcrumbs = undefined;
    setCtx(c);
    if (!refId || send === "sent") setRefId(makeId());
    setSend("filling");
    setPhase("dialog");
  }
  function cancel() {
    setPhase("idle");
    setTarget(null);
    setAnnounce(text.cancelled);
    onOpenChange?.(false);
  }
  function finish() {
    setForm({ description: "", expected: "", severity: "major", email: "" });
    setShowErrors(false);
    setSend("filling");
    setRefId("");
    cancel();
    setAnnounce("");
  }

  const report = (): BugReport => ({
    id: view.refId,
    description: view.form.description.trim(),
    expected: view.form.expected.trim(),
    severity: view.form.severity,
    email: view.form.email.trim() || undefined,
    context: Object.fromEntries(ITEM_KEYS.filter((k) => include[k] && view.ctx[k] !== undefined).map((k) => [k, view.ctx[k]])) as ReportContext,
  });
  const markdown = () => reportToMarkdown(report(), labels);

  async function submit(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (inline || send === "submitting") return;
    if (errors.description || errors.email) {
      setShowErrors(true);
      setAnnounce(errors.description ? text.required : text.emailInvalid);
      (errors.description ? desc : emailRef).current?.focus();
      return;
    }
    setSend("submitting");
    setAnnounce(text.sending);
    const r = report();
    try {
      const res = await onSubmit(r);
      if (!alive.current) return;
      const id = typeof res === "string" ? res : res && typeof res === "object" && res.id ? String(res.id) : r.id;
      setRefId(id);
      setSend("sent");
      setAnnounce(text.sentBody.replace("{id}", id));
    } catch {
      if (!alive.current) return;
      setSend("failed");
      setAnnounce(text.failed);
    }
  }

  function copy() {
    const md = markdown();
    if (!navigator.clipboard) return setAnnounce(text.copyFailed);
    navigator.clipboard.writeText(md).then(
      () => setAnnounce(text.copied),
      () => setAnnounce(text.copyFailed),
    );
  }
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(report(), null, 2)], { type: "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `${view.refId || "bug-report"}.json` });
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Focus trap + Esc for the dialog.
  function onDialogKey(e: ReactKeyboardEvent) {
    if (inline) return;
    if (e.key === "Escape") {
      e.stopPropagation();
      if (send === "submitting") return; // closing mid-send would let a second send start
      return send === "sent" ? finish() : cancel();
    }
    if (e.key !== "Tab" || !dialog.current) return;
    const f = [...dialog.current.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]):not([type=radio]), input[type=radio]:checked, textarea:not([disabled]), summary, a[href]")].filter((el) => el.getClientRects().length > 0);
    if (!f.length) return;
    const [first, last] = [f[0], f[f.length - 1]];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  const accentFill = { background: accent, color: textOn(accent) };
  const shade = `rgba(0,0,0,${Math.min(80, Math.max(0, dim)) / 100})`;
  const corner = position === "bottom-left" ? "left-4" : "right-4";
  const bar = `flex flex-wrap items-center gap-2 rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] px-3 py-2 text-xs text-[var(--k-text,#E9EDE8)] shadow-[0_14px_40px_-16px_var(--k-shadow,rgba(0,0,0,.9))]`;
  const barPos = inline ? "mt-2" : `${pos} left-1/2 z-[61] w-max max-w-[calc(100%-1.5rem)] -translate-x-1/2`;
  const t = view.target;
  const shown = ITEM_KEYS.filter((k) => view.ctx[k] !== undefined);
  const ticked = shown.filter((k) => include[k]).length;
  const busy = state === "submitting";
  const off = disabled || state === "disabled";


  return (
    <div ref={root} data-bug-report-widget="" data-state={state} className={`${inline ? "relative flex flex-col items-center" : ""} ${className}`}>
      {(state === "idle" || state === "disabled") && showTrigger && (
        <button
          ref={triggerRef}
          type="button"
          onClick={start}
          disabled={off}
          aria-keyshortcuts={shortcut || undefined}
          title={shortcut ? `${text.trigger} (${shortcut})` : undefined}
          style={off ? undefined : accentFill}
          className={`${inline ? "" : `${pos} bottom-4 ${corner} z-[60]`} ${TRIGGER[size]} inline-flex items-center gap-2 rounded-full border border-[var(--k-line,#3A433F)] font-bold shadow-[0_10px_30px_-12px_var(--k-shadow,rgba(0,0,0,.9))] transition-[transform,filter,box-shadow] hover:-translate-y-px hover:brightness-110 active:translate-y-px active:brightness-95 disabled:cursor-not-allowed disabled:bg-[var(--k-panel-2,#181D1B)] disabled:text-[var(--k-mute,#8A938D)] disabled:shadow-none ${ring}`}
        >
          <svg aria-hidden="true" viewBox="0 0 16 16" className="size-[1.1em]" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M3 14V2.5h8.5l-1.6 3 1.6 3H3" strokeLinejoin="round" />
          </svg>
          {text.trigger}
        </button>
      )}

      {(state === "picking" || state === "picked") && (
        <>
          <div ref={layer} aria-hidden="true" className={`pointer-events-none overflow-hidden ${inline ? "relative h-36 w-72 rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-bg,#0E1110)]" : `${pos} inset-0 z-[55]`}`} style={t ? undefined : { background: shade }}>
            {inline && (
              <div className="p-3 text-[10px] text-[var(--k-mute,#8A938D)]">
                <p className="font-bold text-[var(--k-text,#E9EDE8)]">Checkout</p>
                <div className="mt-2 h-2 w-40 rounded bg-[var(--k-panel-2,#181D1B)]" />
                <div className="mt-1.5 h-2 w-28 rounded bg-[var(--k-panel-2,#181D1B)]" />
                <div className="absolute left-3 top-[86px] h-[30px] w-[128px] rounded border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)]" />
                <span className="absolute left-[150px] top-[86px] grid h-[30px] w-[108px] place-items-center rounded bg-[var(--k-panel-2,#181D1B)] font-bold text-[var(--k-text,#E9EDE8)]">Apply coupon</span>
              </div>
            )}
            {t && (
              <div className="absolute rounded-[3px] motion-safe:transition-all motion-safe:duration-100" style={{ left: t.x, top: t.y, width: t.w, height: t.h, outline: `2px solid ${accent}`, outlineOffset: 2, boxShadow: `0 0 0 9999px ${shade}` }}>
                <span className={`absolute ${t.flip ? "right-0" : "left-0"} max-w-[min(20rem,80vw)] truncate whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-bold ${t.y < 30 ? "top-full mt-1.5" : "bottom-full mb-1.5"}`} style={accentFill}>
                  {t.label}
                </span>
              </div>
            )}
          </div>
          {state === "picking" ? (
            <div className={`${bar} ${barPos} ${inline ? "" : "top-3"}`}>
              <span className="font-bold">{text.pickHint}</span>
              <span className="text-[var(--k-mute,#8A938D)] max-sm:hidden">{text.pickKeys}</span>
              <button type="button" className={ghost} onClick={() => openDialog(null)}>{text.skip}</button>
              <button type="button" className={ghost} onClick={cancel}>{text.cancel}</button>
            </div>
          ) : (
            <div className={`${bar} ${barPos} ${inline ? "" : "bottom-4"}`} onKeyDown={(e) => e.key === "Escape" && !inline && cancel()}>
              <span className="max-w-56 truncate">
                <span className="text-[var(--k-mute,#8A938D)]">{text.selected}: </span>
                <b>{t?.label}</b>
              </span>
              <button ref={firstAction} type="button" style={accentFill} className={`rounded-md px-2.5 py-1 font-bold hover:brightness-110 active:translate-y-px ${ring}`} onClick={() => openDialog(target?.el ?? null)}>
                {text.continue}
              </button>
              <button type="button" className={ghost} onClick={start}>{text.pickAgain}</button>
              <button type="button" className={ghost} onClick={cancel}>{text.cancel}</button>
            </div>
          )}
        </>
      )}

      {["filling", "invalid", "submitting", "sent", "failed"].includes(state) && (
        <div className={inline ? "w-full" : `${pos} inset-0 z-[60] flex items-center justify-center p-3`} style={inline ? undefined : { background: shade }}>
          <div
            ref={dialog}
            role={inline ? undefined : "dialog"}
            aria-modal={inline ? undefined : true}
            aria-labelledby={inline ? undefined : `${uid}-t`}
            onKeyDown={onDialogKey}
            className={`${DIALOG[size]} ${inline ? "mx-auto" : "max-h-full"} overflow-auto rounded-xl border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] text-[var(--k-text,#E9EDE8)] shadow-[0_24px_60px_-20px_var(--k-shadow,rgba(0,0,0,.9))]`}
          >
            <div className="flex items-center justify-between gap-2 border-b border-[var(--k-line,#3A433F)] px-4 py-2.5">
              <h2 id={`${uid}-t`} className="font-bold">{state === "sent" ? text.sent : text.title}</h2>
              <button type="button" aria-label={text.close} disabled={busy} className={`${ghost} px-2`} onClick={state === "sent" ? finish : cancel}>✕</button>
            </div>

            {state === "sent" ? (
              <div className="space-y-3 p-4">
                <p className="flex items-center gap-2 font-semibold">
                  <span aria-hidden="true" className="grid size-6 place-items-center rounded-full font-bold" style={accentFill}>✓</span>
                  {text.sentBody.replace("{id}", view.refId)}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button ref={firstAction} type="button" style={accentFill} className={`rounded-md px-3 py-1.5 font-bold hover:brightness-110 active:translate-y-px ${ring}`} onClick={finish}>{text.done}</button>
                  <button type="button" className={ghost} onClick={copy}>{text.copyMarkdown}</button>
                  <button type="button" className={ghost} onClick={download}>{text.download}</button>
                </div>
              </div>
            ) : (
              <form noValidate onSubmit={submit} className="space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-2 rounded-md bg-[var(--k-panel-2,#181D1B)] px-2.5 py-2">
                  {view.ctx.element ? (
                    <span className="min-w-0 flex-1">
                      <b className="block truncate">{view.ctx.element.label}</b>
                      <code className="block truncate text-[0.85em] text-[var(--k-mute,#8A938D)]">{view.ctx.element.selector}</code>
                    </span>
                  ) : (
                    <span className="flex-1 text-[var(--k-mute,#8A938D)]">{text.noElement}</span>
                  )}
                  <button type="button" className={ghost} disabled={busy} onClick={start}>{view.ctx.element ? text.pickAgain : text.pickOne}</button>
                </div>
                <fieldset disabled={busy} className="min-w-0 space-y-3">
                  <label className="block font-semibold">
                    {text.happened} <span aria-hidden="true" className="text-[var(--k-err-text,#FF8A7A)]">*</span>
                    <textarea
                      ref={desc}
                      rows={3}
                      required
                      value={view.form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder={text.happenedPlaceholder}
                      aria-invalid={(view.showErrors && viewErrors.description) || undefined}
                      aria-describedby={view.showErrors && viewErrors.description ? `${uid}-de` : undefined}
                      className={`${field} font-normal`}
                    />
                  </label>
                  {view.showErrors && viewErrors.description && <p id={`${uid}-de`} className="-mt-2 text-[0.9em] font-semibold text-[var(--k-err-text,#FF8A7A)]">{text.required}</p>}
                  <label className="block font-semibold">
                    {text.expected} <span className="font-normal text-[var(--k-mute,#8A938D)]">({text.optional})</span>
                    <textarea rows={2} value={view.form.expected} onChange={(e) => setForm((f) => ({ ...f, expected: e.target.value }))} className={`${field} font-normal`} />
                  </label>
                  <div role="radiogroup" aria-labelledby={`${uid}-s`}>
                    <p id={`${uid}-s`} className="font-semibold">{text.severity}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {SEVERITIES.map((s) => (
                        <label key={s} className="cursor-pointer rounded-full border border-[var(--k-line,#3A433F)] px-2.5 py-1 font-semibold transition-colors hover:border-[var(--k-mute,#8A938D)] has-checked:border-transparent has-checked:bg-[var(--brw-acc)] has-checked:text-[var(--brw-on)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-[var(--k-acc-text,#C6FF3D)]" style={{ "--brw-acc": accent, "--brw-on": textOn(accent) } as CSSProperties}>
                          <input type="radio" name={`${uid}-sev`} value={s} checked={view.form.severity === s} onChange={() => setForm((f) => ({ ...f, severity: s }))} className="sr-only" />
                          {text.severities[s]}
                        </label>
                      ))}
                    </div>
                  </div>
                  <label className="block font-semibold">
                    {text.email} <span className="font-normal text-[var(--k-mute,#8A938D)]">({text.optional})</span>
                    <input
                      ref={emailRef}
                      type="email"
                      autoComplete="email"
                      value={view.form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      aria-invalid={(view.showErrors && viewErrors.email) || undefined}
                      aria-describedby={view.showErrors && viewErrors.email ? `${uid}-ee` : undefined}
                      className={`${field} font-normal`}
                    />
                  </label>
                  {view.showErrors && viewErrors.email && <p id={`${uid}-ee`} className="-mt-2 text-[0.9em] font-semibold text-[var(--k-err-text,#FF8A7A)]">{text.emailInvalid}</p>}
                  <details className="rounded-md border border-[var(--k-line,#3A433F)]">
                    <summary className={`cursor-pointer rounded-md px-2.5 py-1.5 font-semibold hover:bg-[var(--k-panel-2,#181D1B)] ${ring}`}>
                      {text.attached} <span className="font-normal text-[var(--k-mute,#8A938D)]">({text.attachedCount.replace("{n}", String(ticked)).replace("{m}", String(shown.length))})</span>
                    </summary>
                    <div className="space-y-2 border-t border-[var(--k-line,#3A433F)] px-2.5 py-2">
                      <p className="text-[0.9em] text-[var(--k-mute,#8A938D)]">{text.attachedHint}</p>
                      {shown.map((k) => {
                        const lines = previewLines(view.ctx, k);
                        return (
                          <label key={k} className="flex cursor-pointer gap-2">
                            <input type="checkbox" checked={include[k]} onChange={(e) => setInclude((x) => ({ ...x, [k]: e.target.checked }))} className={`mt-0.5 size-4 shrink-0 ${ring}`} style={{ accentColor: accent }} />
                            <span className={`min-w-0 flex-1 ${include[k] ? "" : "line-through opacity-60"}`}>
                              <b>{text.items[k]}</b>
                              {(lines.length ? lines : [text.none]).map((l, i) => (
                                <span key={i} className="block truncate font-mono text-[0.85em] text-[var(--k-mute,#8A938D)]">{l}</span>
                              ))}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </details>
                </fieldset>
                {state === "failed" && <p className="text-[0.9em] font-semibold text-[var(--k-err-text,#FF8A7A)]">{text.failed}</p>}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button type="button" className={ghost} onClick={copy}>{text.copyMarkdown}</button>
                  <button type="button" className={ghost} onClick={download}>{text.download}</button>
                  <button type="submit" aria-busy={busy || undefined} aria-disabled={busy || undefined} style={accentFill} className={`ml-auto inline-flex items-center gap-2 rounded-md px-3 py-1.5 font-bold hover:brightness-110 active:translate-y-px aria-disabled:cursor-wait aria-disabled:opacity-80 ${ring}`}>
                    {busy && <span aria-hidden="true" className="size-3 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin" />}
                    {busy ? text.sending : state === "failed" ? text.retry : text.send}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      <p role="status" aria-live="polite" className="sr-only">{inline ? "" : announce}</p>
    </div>
  );
}
