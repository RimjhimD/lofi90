"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { askTabNotifications, chime, iconDataUrl, notifyNow, notifySupported, pageTitle, restoreTab, TabIconSvg, writeTab, type TabColors, type TabIcon } from "./tab";

export { askTabNotifications } from "./tab";
export type { TabIcon } from "./tab";

export type TabProgressStatus = "idle" | "running" | "done" | "error" | "cancelled";
export type TabProgressPreview = "idle" | "running" | "indeterminate" | "done" | "error" | "cancelled" | "disabled";

export interface TabProgressLabels {
  idle: string;
  idleHint: string;
  done: string;
  doneHint: string;
  error: string;
  errorHint: string;
  cancelled: string;
  cancelledHint: string;
  /** Under the bar while the length is unknown. */
  working: string;
  /** Under the bar until there is enough data for a time estimate. */
  measuring: string;
  /** {t} is replaced with the time left, e.g. "12s" or "1m 20s". */
  eta: string;
  /** Under the bar when `disabled` locks Cancel. */
  locked: string;
  cancel: string;
  retry: string;
  /** Tab title while running. {p} = whole percent, {label} = the label prop, {title} = the page's own title. */
  titleRunning: string;
  titleWorking: string;
  titleDone: string;
  titleError: string;
  notifyTitle: string;
  notifyBody: string;
  notifyErrorTitle: string;
  notifyAsk: string;
  notifyOn: string;
  notifyBlocked: string;
  /** Read out at the start and every 25%. {p} = percent. */
  announceProgress: string;
  announceStart: string;
  previewNow: string;
  previewAway: string;
  previewOff: string;
  /** The two neighbour tabs in the mock tab strip. */
  otherTabA: string;
  otherTabB: string;
  /** Page title used where the real one can't be read (server render, previews). */
  pageTitle: string;
}

export interface TabProgressLoaderProps {
  /** 0–100, or null when the length is unknown (the tab icon spins). */
  progress: number | null;
  status: TabProgressStatus;
  /** What is happening, e.g. "Exporting report". Shown in the page and the tab title. */
  label?: string;
  /** When the browser tab shows progress: only while the user is on another tab, always, or never. */
  tabMode?: "hidden-only" | "always" | "off";
  /** Send a system notification when the job ends while the tab is hidden. Permission is asked from a click. */
  notify?: boolean;
  /** Play a short, quiet chime when done. */
  sound?: boolean;
  /** Shows a Cancel button while running. */
  onCancel?: () => void;
  /** Shows a Try again button after an error. */
  onRetry?: () => void;
  /** Replaces the error hint, e.g. the server's message. */
  errorMessage?: string;
  /** Locks Cancel, e.g. when the job can no longer be stopped. */
  disabled?: boolean;
  variant?: "bar" | "ring";
  /** Draw a small mock browser tab strip that mirrors the real tab. */
  tabPreview?: boolean;
  /** Render one state without running anything; the real tab is never touched. "running" uses `progress` if given, else 42%. */
  previewState?: TabProgressPreview;
  labels?: Partial<TabProgressLabels>;
  accent?: string;
  doneColor?: string;
  errorColor?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const DEFAULT_LABELS: TabProgressLabels = {
  idle: "Ready to export",
  idleHint: "Start it, then switch tabs. This tab keeps you posted.",
  done: "Report ready",
  doneHint: "Your file is ready to open.",
  error: "Export failed",
  errorHint: "Something went wrong. Nothing was saved.",
  cancelled: "Export cancelled",
  cancelledHint: "Stopped. Nothing was saved.",
  working: "Working on it. This can take a minute.",
  measuring: "Working out the time left…",
  eta: "About {t} left",
  locked: "Almost done. It can't be stopped now.",
  cancel: "Cancel",
  retry: "Try again",
  titleRunning: "{p}% · {label}",
  titleWorking: "Working · {label}",
  titleDone: "✓ Ready · {title}",
  titleError: "Failed · {label}",
  notifyTitle: "Export ready",
  notifyBody: "Click to go back to the tab.",
  notifyErrorTitle: "Export failed",
  notifyAsk: "Notify me when it's done",
  notifyOn: "You'll get a notification when it's done.",
  notifyBlocked: "Notifications are blocked. The tab icon still shows ✓.",
  announceProgress: "{p}% done.",
  announceStart: "{label} started.",
  previewNow: "Your browser tab right now",
  previewAway: "Your browser tab when you switch away",
  previewOff: "Tab updates are off",
  otherTabA: "Inbox",
  otherTabB: "Music",
  pageTitle: "Dashboard",
};

const SIZES = {
  sm: { box: "max-w-[300px] p-3 text-xs", head: "text-sm", bar: "h-1.5", ring: 40, btn: "px-2 py-1 text-[0.7rem]" },
  md: { box: "max-w-[380px] p-4 text-xs", head: "text-[0.95rem]", bar: "h-2", ring: 52, btn: "px-2.5 py-1 text-xs" },
  lg: { box: "max-w-[460px] p-5 text-sm", head: "text-lg", bar: "h-2.5", ring: 64, btn: "px-3 py-1.5 text-sm" },
};

/** Tab writes at most this often (4 per second). */
const TAB_MS = 250;
/** With tabMode "always", a finished tab keeps ✓ this long if the user is already looking. */
const HOLD_MS = 4000;

const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m));
const clamp = (p: number) => Math.max(0, Math.min(100, p));
const fmt = (s: number) => (s < 60 ? `${Math.max(1, Math.ceil(s))}s` : `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`);

const subVisibility = (cb: () => void) => {
  document.addEventListener("visibilitychange", cb);
  return () => document.removeEventListener("visibilitychange", cb);
};
const subMotion = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const noSub = () => () => {};

/** What the tab shows for a status: its title and icon, or null for the page's own. */
function tabFace(status: TabProgressStatus, progress: number | null, label: string, title: string, t: TabProgressLabels, angle: number, still: boolean): { title: string; icon: TabIcon } | null {
  if (status === "running" && progress == null) return { title: fill(t.titleWorking, { label, title }), icon: still ? { kind: "wait" } : { kind: "spin", angle } };
  if (status === "running") {
    const p = Math.floor(clamp(progress ?? 0));
    return { title: fill(t.titleRunning, { p, label, title }), icon: { kind: "ring", p } };
  }
  if (status === "done") return { title: fill(t.titleDone, { label, title }), icon: { kind: "done" } };
  if (status === "error") return { title: fill(t.titleError, { label, title }), icon: { kind: "error" } };
  return null;
}

/**
 * A progress loader for long jobs that keeps reporting in the browser tab itself: the favicon becomes a filling
 * ring and the title reads "42% · Exporting report", so people can work elsewhere and still see it finish.
 */
export function TabProgressLoader({
  progress,
  status: liveStatus,
  label = "Exporting report",
  tabMode = "hidden-only",
  notify = false,
  sound = false,
  onCancel,
  onRetry,
  errorMessage,
  disabled = false,
  variant = "bar",
  tabPreview = false,
  previewState,
  labels,
  accent = "#C6FF3D",
  doneColor = "#2FB863",
  errorColor = "#E5484D",
  size = "md",
  className = "",
}: TabProgressLoaderProps) {
  const t = { ...DEFAULT_LABELS, ...labels };
  const colors: TabColors = { accent, done: doneColor, error: errorColor };
  const sz = SIZES[size];
  const headId = useId();
  const [me] = useState(() => Symbol("tab-progress"));
  const hiddenNow = useSyncExternalStore(subVisibility, () => document.hidden, () => false);
  const reduced = useSyncExternalStore(subMotion, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => false);
  const realTitle = useSyncExternalStore(noSub, () => pageTitle(), () => t.pageTitle);
  const perm = useSyncExternalStore(noSub, () => (notifySupported() ? Notification.permission : "unsupported"), () => "unsupported");
  const [, setAsked] = useState(0);

  // Preview states map onto a status and a fixed progress.
  const status: TabProgressStatus = previewState ? (previewState === "indeterminate" || previewState === "disabled" ? "running" : previewState) : liveStatus;
  const pct = previewState ? (previewState === "running" ? (typeof progress === "number" ? clamp(progress) : 42) : previewState === "disabled" ? 92 : previewState === "done" ? 100 : previewState === "indeterminate" ? null : 0) : progress == null ? null : clamp(progress);
  const locked = disabled || previewState === "disabled";
  const hidden = !previewState && hiddenNow;

  // "seen" = the user has had a look at the finished result, so the tab can go back to normal.
  const [track, setTrack] = useState({ status, hidden, seen: false });
  const [eta, setEta] = useState<number | null>(null);
  if (track.status !== status || track.hidden !== hidden) {
    let seen = track.seen;
    if (track.status !== status) {
      seen = tabMode === "hidden-only" && !hidden; // finished while watching: nothing to point out
      setEta(null);
    } else if (track.hidden && !hidden) seen = true; // came back to the tab
    setTrack({ status, hidden, seen });
  }
  const finished = status === "done" || status === "error";
  const live = !previewState && tabMode !== "off";
  const showFace = live && (status === "running" ? tabMode === "always" || hidden : finished && !track.seen);

  // Spinning favicon for unknown length: 4 frames a second, only while it is on show.
  const [angle, setAngle] = useState(0);
  const spinning = showFace && status === "running" && pct == null && !reduced;
  useEffect(() => {
    if (!spinning) return;
    const id = window.setInterval(() => setAngle((a) => (a + 45) % 360), TAB_MS);
    return () => clearInterval(id);
  }, [spinning]);

  const face = tabFace(status, pct, label, previewState ? t.pageTitle : realTitle, t, previewState ? 30 : angle, reduced);
  const faceKey = showFace && face ? `${face.title}|${JSON.stringify(face.icon)}|${accent}${doneColor}${errorColor}` : "";

  // Write the real tab, throttled to 4 updates a second; restore it when there is nothing to show.
  const writes = useRef({ last: 0, timer: 0 });
  const faceRef = useRef(face);
  useEffect(() => {
    faceRef.current = face;
  });
  useEffect(() => {
    if (previewState) return;
    const w = writes.current;
    if (!faceKey) {
      restoreTab(me);
      return;
    }
    const apply = () => {
      const f = faceRef.current;
      if (!f) return;
      w.last = performance.now();
      writeTab(me, f.title, iconDataUrl(f.icon, { accent, done: doneColor, error: errorColor }));
    };
    const wait = TAB_MS - (performance.now() - w.last);
    if (wait <= 0) apply();
    else w.timer = window.setTimeout(apply, wait);
    return () => clearTimeout(w.timer);
  }, [faceKey, previewState, me, accent, doneColor, errorColor]);
  useEffect(() => () => restoreTab(me), [me]);

  // Finished while kept on screen (tabMode "always"): hold ✓ a moment, then put the tab back.
  useEffect(() => {
    if (!live || !finished || track.seen || hidden) return;
    const id = window.setTimeout(() => setTrack((s) => ({ ...s, seen: true })), HOLD_MS);
    return () => clearTimeout(id);
  }, [live, finished, track.seen, hidden]);

  // Notification and chime when the job ends.
  const latest = useRef({ notify, sound, t, label });
  useEffect(() => {
    latest.current = { notify, sound, t, label };
  });
  const prev = useRef(status);
  useEffect(() => {
    const was = prev.current;
    prev.current = status;
    if (previewState || was !== "running" || !(status === "done" || status === "error")) return;
    const l = latest.current;
    if (l.notify && document.hidden) notifyNow(status === "done" ? l.t.notifyTitle : l.t.notifyErrorTitle, status === "done" ? l.t.notifyBody : fill(l.t.titleError, { label: l.label, title: pageTitle() }));
    if (l.sound && status === "done") chime();
  }, [status, previewState]);

  // Time left, from the measured rate over the last 10 seconds. Updated twice a second, not every tick.
  const pRef = useRef(pct);
  useEffect(() => {
    pRef.current = pct;
  });
  useEffect(() => {
    if (previewState || status !== "running") return;
    const samples: { at: number; p: number }[] = [];
    const id = window.setInterval(() => {
      const p = pRef.current;
      const at = performance.now();
      if (p == null) return setEta(null);
      samples.push({ at, p });
      while (samples.length > 2 && at - samples[0].at > 10000) samples.shift();
      const rate = (p - samples[0].p) / (at - samples[0].at);
      setEta(samples.length > 2 && rate > 0 ? (100 - p) / rate / 1000 : null);
    }, 500);
    return () => clearInterval(id);
  }, [status, previewState]);

  // Sliding segment for the unknown-length bar.
  const seg = useRef<HTMLDivElement>(null);
  const sliding = status === "running" && pct == null && variant === "bar" && !reduced;
  useEffect(() => {
    if (!sliding || !seg.current) return;
    const a = seg.current.animate([{ transform: "translateX(-110%)" }, { transform: "translateX(290%)" }], { duration: 1400, iterations: Infinity, easing: "ease-in-out" });
    return () => a.cancel();
  }, [sliding]);

  async function ask() {
    await askTabNotifications();
    setAsked((n) => n + 1);
  }

  /* ---------- text ---------- */
  const shown = pct == null ? null : Math.round(pct);
  const head = status === "running" ? label : status === "done" ? t.done : status === "error" ? t.error : status === "cancelled" ? t.cancelled : t.idle;
  const sub =
    status === "running"
      ? locked
        ? t.locked
        : pct == null
          ? t.working
          : previewState
            ? fill(t.eta, { t: fmt(20) })
            : eta != null
              ? fill(t.eta, { t: fmt(eta) })
              : t.measuring
      : status === "done"
        ? t.doneHint
        : status === "error"
          ? errorMessage || t.errorHint
          : status === "cancelled"
            ? t.cancelledHint
            : t.idleHint;
  const milestone = shown == null ? null : Math.floor(shown / 25) * 25;
  const announce =
    status === "running"
      ? milestone
        ? fill(t.announceProgress, { p: milestone })
        : fill(t.announceStart, { label })
      : status === "idle"
        ? ""
        : `${head}. ${sub}`;

  const tone = status === "done" ? doneColor : status === "error" ? errorColor : accent;
  const pctText = status === "done" ? "100%" : status === "running" && shown != null ? `${shown}%` : "";
  const barWidth = status === "done" ? 100 : status === "running" && shown != null ? shown : status === "error" || status === "cancelled" ? (pct ?? 0) : 0;

  const btn = `rounded-md border border-[var(--k-line,#3A433F)] bg-[var(--k-panel-2,#181D1B)] ${sz.btn} font-semibold text-[var(--k-text,#E9EDE8)] transition-[border-color,transform,background-color] duration-150`;
  const btnLive = "hover:border-[var(--k-acc-text,#C6FF3D)] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[var(--k-line,#3A433F)]";
  const action =
    status === "running" && onCancel ? { text: t.cancel, run: onCancel, off: locked } : status === "error" && onRetry ? { text: t.retry, run: onRetry, off: false } : status === "running" && previewState ? { text: t.cancel, run: undefined, off: locked } : null;

  /* ---------- mock tab strip ---------- */
  const mockFace = previewState ? face : showFace ? face : live && status === "running" ? face : null;
  const caption = previewState ? t.previewAway : tabMode === "off" ? t.previewOff : showFace ? t.previewNow : t.previewAway;
  const mockTitle = mockFace?.title ?? (previewState ? t.pageTitle : realTitle);

  const ringR = 20;
  const circ = 2 * Math.PI * ringR;

  return (
    <div className={`flex w-full flex-col items-stretch gap-3 ${sz.box.split(" ")[0]} ${className}`}>
      {tabPreview && (
        <div aria-hidden="true" className="overflow-hidden rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-panel-2,#181D1B)]">
          <div className="flex gap-1 px-1.5 pt-1.5">
            <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-t-md px-2 py-1.5 text-[0.7rem] text-[var(--k-mute,#8A938D)]">
              <span className="size-3 shrink-0 rounded-full bg-[#3DA9FF]" />
              <span className="truncate">{t.otherTabA}</span>
            </div>
            <div className="flex min-w-0 flex-[1.6] items-center gap-1.5 rounded-t-md border border-b-0 border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] px-2 py-1.5 text-[0.7rem] font-semibold text-[var(--k-text,#E9EDE8)]">
              <TabIconSvg icon={mockFace?.icon ?? null} colors={colors} />
              <span className="truncate">{mockTitle}</span>
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-t-md px-2 py-1.5 text-[0.7rem] text-[var(--k-mute,#8A938D)]">
              <span className="size-3 shrink-0 rounded-[3px] bg-[#FF6B57]" />
              <span className="truncate">{t.otherTabB}</span>
            </div>
          </div>
          <p className="border-t border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] px-2.5 py-1 text-[0.65rem] font-medium text-[var(--k-mute,#8A938D)]">{caption}</p>
        </div>
      )}

      <section
        aria-labelledby={headId}
        aria-busy={status === "running" || undefined}
        className={`${sz.box} w-full rounded-xl border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] text-[var(--k-text,#E9EDE8)] shadow-[0_10px_30px_-14px_var(--k-shadow,rgba(0,0,0,.9))]`}
      >
        <div className={`flex gap-3 ${variant === "ring" ? "items-center" : "flex-col"}`}>
          {variant === "ring" ? (
            <div
              role="progressbar"
              aria-labelledby={headId}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={status === "running" && shown != null ? shown : status === "done" ? 100 : undefined}
              aria-valuetext={status === "running" ? (shown == null ? t.working : `${shown}%`) : head}
              className="relative shrink-0"
              style={{ width: sz.ring, height: sz.ring }}
            >
              <svg viewBox="0 0 48 48" className={`size-full -rotate-90 ${status === "running" && pct == null ? "motion-safe:animate-spin" : ""}`} aria-hidden="true">
                <circle cx="24" cy="24" r={ringR} fill="none" stroke="var(--k-line,#3A433F)" strokeWidth="4" />
                <circle
                  cx="24"
                  cy="24"
                  r={ringR}
                  fill="none"
                  stroke={tone}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${(status === "running" && pct == null ? 30 : barWidth) * (circ / 100)} ${circ}`}
                  className="transition-[stroke-dasharray] duration-300 motion-reduce:transition-none"
                />
              </svg>
              <span className="absolute inset-0 grid place-items-center text-[0.7rem] font-bold tabular-nums">
                {status === "done" ? "✓" : status === "error" ? "!" : pctText}
              </span>
            </div>
          ) : null}

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <h3 id={headId} className={`${sz.head} truncate font-semibold`}>
                {head}
              </h3>
              {variant === "bar" && <span className="font-mono text-xs font-bold tabular-nums text-[var(--k-text,#E9EDE8)]">{pctText}</span>}
            </div>

            {variant === "bar" && (
              <div
                role="progressbar"
                aria-labelledby={headId}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={status === "running" && shown != null ? shown : status === "done" ? 100 : undefined}
                aria-valuetext={status === "running" ? (shown == null ? t.working : `${shown}%`) : head}
                className={`relative mt-2.5 ${sz.bar} overflow-hidden rounded-full bg-[var(--k-panel-2,#181D1B)] ring-1 ring-inset ring-[var(--k-line,#3A433F)]`}
              >
                {status === "running" && pct == null ? (
                  <div ref={seg} className={`absolute inset-y-0 left-0 w-[35%] rounded-full ${reduced ? "opacity-60" : ""}`} style={{ background: tone }} />
                ) : (
                  <div className="h-full rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none" style={{ width: `${barWidth}%`, background: tone, opacity: status === "cancelled" ? 0.4 : 1 }} />
                )}
              </div>
            )}

            <div className="mt-2 flex min-h-7 items-center justify-between gap-3">
              <p className={status === "error" ? "text-[var(--k-err-text,#FF8A7A)]" : "text-[var(--k-mute,#8A938D)]"}>{sub}</p>
              {action &&
                (previewState ? (
                  <span aria-hidden="true" className={`${btn} shrink-0 ${action.off ? "opacity-50" : ""}`}>
                    {action.text}
                  </span>
                ) : (
                  <button type="button" onClick={action.run} disabled={action.off} className={`${btn} ${btnLive} shrink-0`}>
                    {action.text}
                  </button>
                ))}
            </div>
          </div>
        </div>

        {notify && !previewState && status !== "done" && status !== "cancelled" && perm !== "unsupported" && (
          <div className="mt-2 border-t border-[var(--k-line,#3A433F)] pt-2 text-[var(--k-mute,#8A938D)]">
            {perm === "default" ? (
              <button type="button" onClick={ask} className={`${btn} ${btnLive}`}>
                🔔 {t.notifyAsk}
              </button>
            ) : (
              <p>{perm === "granted" ? t.notifyOn : t.notifyBlocked}</p>
            )}
          </div>
        )}

        {!previewState && (
          <p role="status" aria-live="polite" className="sr-only">
            {announce}
          </p>
        )}
      </section>
    </div>
  );
}
