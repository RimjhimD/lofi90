"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { BOTTOM_BULB, EMPTY_RATE, GLASS, RateMeter, TOP_BULB, fill, formatBytes, sandLevels, textOn, type RateSnapshot } from "./hourglass";

export type UploadStatus = "idle" | "uploading" | "paused" | "offline" | "done" | "error";

export interface HourglassLabels {
  /** Accessible name of the progress bar. {file} is the file name. */
  progressLabel: string;
  idle: string;
  /** Announced when the upload starts or carries on. {file} is the file name. */
  uploading: string;
  /** Shown while the total size is unknown. */
  indeterminate: string;
  paused: string;
  offline: string;
  done: string;
  error: string;
  /** {sent} and {total} are formatted sizes. */
  sentOf: string;
  /** Used when the total is unknown. {sent} is a formatted size. */
  sentOnly: string;
  /** {pct} is a whole number. */
  percent: string;
  /** {speed} is a formatted size. */
  speed: string;
  /** Shown until there are enough speed samples to trust a time left. */
  working: string;
  /** Shown when no bytes have moved for a few seconds. */
  stalled: string;
  lessThan5: string;
  /** {n} is a number of seconds. */
  seconds: string;
  /** {n} is a number of minutes. */
  minutes: string;
  /** {h} hours and {m} minutes. */
  hours: string;
  /** Used when etaStyle is "clock". {t} is like 1:05. */
  clock: string;
  lessThan5Spoken: string;
  secondsSpoken: string;
  minutesSpoken: string;
  hoursSpoken: string;
  /** What screen readers hear for the bar. {pct} and {eta} (time left or the state). */
  valueText: string;
  pause: string;
  resume: string;
  retry: string;
  cancel: string;
}

export interface HourglassPreview {
  status: UploadStatus;
  /** 0..1. Leave out (or null) to show an upload of unknown size. */
  progress?: number | null;
  /** File size in bytes for the preview. Default 12 MB. */
  total?: number;
  /** Bytes per second for the preview. Default 1.4 MB/s. */
  speed?: number;
}

export interface HourglassUploadLoaderProps {
  /** Bytes sent so far. */
  loaded: number;
  /** File size in bytes. 0 (or not finite) means unknown: the sand trickles in a loop. */
  total: number;
  status: UploadStatus;
  fileName?: string;
  /** Shows a Pause button while uploading. */
  onPause?: () => void;
  /** Shows a Resume button while paused. */
  onResume?: () => void;
  /** Shows a Retry button after an error. */
  onRetry?: () => void;
  /** Shows a Cancel button while the upload is not finished. */
  onCancel?: () => void;
  /** Error text from your upload, shown instead of labels.error. */
  errorMessage?: string;
  /** Turns the buttons off, e.g. while your app is busy reacting to one. */
  disabled?: boolean;
  labels?: Partial<HourglassLabels>;
  /** Sand colour. */
  accent?: string;
  /** "words": about 40s left. "clock": 0:40 left. */
  etaStyle?: "words" | "clock";
  size?: "sm" | "md" | "lg";
  /** Render one state, frozen, without measuring anything. */
  previewState?: HourglassPreview;
  className?: string;
}

export const DEFAULT_HOURGLASS_LABELS: HourglassLabels = {
  progressLabel: "Upload of {file}",
  idle: "Ready to upload",
  uploading: "Uploading {file}.",
  indeterminate: "Uploading…",
  paused: "Paused",
  offline: "Paused · no connection. It'll continue when you're back.",
  done: "Uploaded",
  error: "The upload stopped. Your file is fine, try again.",
  sentOf: "{sent} of {total}",
  sentOnly: "{sent} sent",
  percent: "{pct}%",
  speed: "{speed}/s",
  working: "working it out…",
  stalled: "Nothing is moving. Waiting for the network…",
  lessThan5: "less than 5s left",
  seconds: "about {n}s left",
  minutes: "about {n} min left",
  hours: "about {h} h {m} min left",
  clock: "{t} left",
  lessThan5Spoken: "less than 5 seconds left",
  secondsSpoken: "about {n} seconds left",
  minutesSpoken: "about {n} minutes left",
  hoursSpoken: "about {h} hours {m} minutes left",
  valueText: "{pct}%, {eta}",
  pause: "Pause",
  resume: "Resume",
  retry: "Retry",
  cancel: "Cancel",
};

const SIZES = {
  sm: { box: 112, card: "max-w-[16rem] gap-2 p-3 text-xs", name: "text-sm" },
  md: { box: 150, card: "max-w-[19rem] gap-3 p-4 text-sm", name: "text-base" },
  lg: { box: 190, card: "max-w-[23rem] gap-3.5 p-5 text-base", name: "text-lg" },
};

/** How far the hourglass leans in each state. Offline lies on its side; done makes a full turn. */
const TILT: Record<UploadStatus, number> = { idle: 0, uploading: 0, paused: -12, offline: 90, done: 360, error: 0 };

const MOTION = "(prefers-reduced-motion: reduce)";
const onMotionChange = (cb: () => void) => {
  const m = window.matchMedia(MOTION);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

function etaText(sec: number, l: HourglassLabels, style: "words" | "clock", spoken: boolean) {
  if (sec < 5) return spoken ? l.lessThan5Spoken : l.lessThan5;
  if (style === "clock" && !spoken) {
    const s = Math.ceil(sec);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const pad = (x: number) => String(x).padStart(2, "0");
    return fill(l.clock, { t: h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}` });
  }
  // Round once, then split, so it never says "60s", "60 min" or "1 h 60 min".
  const secs = sec < 20 ? Math.round(sec) : Math.round(sec / 5) * 5;
  if (secs < 60) return fill(spoken ? l.secondsSpoken : l.seconds, { n: secs });
  const mins = Math.max(1, Math.round(sec / 60));
  if (mins < 60) return fill(spoken ? l.minutesSpoken : l.minutes, { n: mins });
  return fill(spoken ? l.hoursSpoken : l.hours, { h: Math.floor(mins / 60), m: mins % 60 });
}

/**
 * An upload indicator that can't lie. The sand in an hourglass is the real progress: the top bulb holds the
 * bytes still to send, the bottom pile the bytes sent. Speed is measured on a steady clock and smoothed, so
 * the time left counts down calmly and only says a number once it has one. Offline, it tips onto its side.
 */
export function HourglassUploadLoader({
  loaded,
  total,
  status,
  fileName = "",
  onPause,
  onResume,
  onRetry,
  onCancel,
  errorMessage,
  disabled = false,
  labels,
  accent = "#FFB547",
  etaStyle = "words",
  size = "md",
  previewState,
  className = "",
}: HourglassUploadLoaderProps) {
  const l = { ...DEFAULT_HOURGLASS_LABELS, ...labels };
  const uid = `hg${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const reduced = useSyncExternalStore(onMotionChange, () => window.matchMedia(MOTION).matches, () => false);
  const [rate, setRate] = useState<RateSnapshot>(EMPTY_RATE);
  const meter = useRef<RateMeter | null>(null);
  const shaker = useRef<HTMLDivElement>(null);
  /** True while keyboard/pointer focus is on one of the buttons, so it can be rescued if they go away. */
  const focusInRow = useRef(false);
  const latest = useRef({ loaded, total });
  useEffect(() => {
    latest.current = { loaded, total };
  });

  // Measure speed on a steady half-second clock, not on progress events, so a stalled line shows up as
  // slowing down instead of freezing the last number. Paused time is never counted.
  useEffect(() => {
    if (previewState || status !== "uploading") return;
    const m = (meter.current ??= new RateMeter());
    m.resume(performance.now(), latest.current.loaded);
    const tick = () => setRate(m.sample(performance.now(), latest.current.loaded, latest.current.total));
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 500);
    return () => {
      clearTimeout(first);
      clearInterval(id);
      m.pause();
    };
  }, [status, previewState]);

  const st = previewState?.status ?? status;

  // A short shake when the glass cracks.
  useEffect(() => {
    if (st !== "error" || reduced || previewState) return;
    shaker.current?.animate(
      [{ transform: "translateX(0)" }, { transform: "translateX(-5px)" }, { transform: "translateX(4px)" }, { transform: "translateX(-2px)" }, { transform: "translateX(0)" }],
      { duration: 380, easing: "ease-out" },
    );
  }, [st, reduced, previewState]);

  const pvTotal = previewState?.total ?? 12_000_000;
  const tot = previewState ? (previewState.progress == null ? 0 : pvTotal) : total;
  const known = Number.isFinite(tot) && tot > 0;
  const sent = previewState ? (previewState.progress ?? 0.35) * pvTotal : Math.max(0, loaded);
  const p = st === "done" ? 1 : known ? Math.min(1, sent / tot) : 0;
  const pct = Math.floor(p * 100);
  const stats: RateSnapshot = previewState
    ? (() => {
        const speed = previewState.speed ?? 1_400_000;
        return { speed, eta: known ? Math.max(0, tot - sent) / speed : null, ready: true, stalled: false };
      })()
    : rate;

  const moving = st === "uploading";
  const looping = moving && !known && !reduced;
  const { top, bottom } = known || st === "done" ? sandLevels(p) : sandLevels(0.5);
  const sz = SIZES[size];
  const fileLabel = fileName || "file";

  const etaShort = known && stats.ready && stats.eta !== null ? etaText(stats.eta, l, etaStyle, false) : null;
  const etaSpoken = known && stats.ready && stats.eta !== null ? etaText(stats.eta, l, etaStyle, true) : null;
  const speedText = stats.speed !== null && stats.speed > 0 ? fill(l.speed, { speed: formatBytes(stats.speed) }) : null;

  const message =
    st === "uploading"
      ? stats.stalled
        ? l.stalled
        : known
          ? [speedText, etaShort ?? l.working].filter(Boolean).join(" · ")
          : [l.indeterminate, speedText].filter(Boolean).join(" · ")
      : st === "paused"
        ? l.paused
        : st === "offline"
          ? l.offline
          : st === "done"
            ? l.done
            : st === "error"
              ? errorMessage || l.error
              : l.idle;
  // Announced only when the state changes (or the line stalls), never on every byte.
  const announce =
    st === "uploading" ? (stats.stalled ? l.stalled : fill(l.uploading, { file: fileLabel })) : st === "error" ? errorMessage || l.error : message;
  const stateWord = st === "uploading" ? (etaSpoken ?? l.working) : st === "error" ? errorMessage || l.error : st === "offline" ? l.offline : message;
  const valueText = known ? fill(l.valueText, { pct, eta: stateWord }) : `${fill(l.sentOnly, { sent: formatBytes(sent) })}, ${stateWord}`;

  const tone =
    st === "error"
      ? "text-[var(--k-err-text,#FF8A7A)]"
      : st === "offline" || (moving && stats.stalled)
        ? "text-[var(--k-warn-text,#FFD08A)]"
        : st === "done"
          ? "text-[var(--k-acc-text,#C6FF3D)]"
          : "text-[var(--k-mute,#8A938D)]";

  const turn = reduced ? "none" : st === "done" ? "transform 1s cubic-bezier(.34,1.5,.64,1)" : "transform .55s cubic-bezier(.34,1.4,.64,1)";
  const btn =
    "min-h-9 rounded-lg border border-[var(--k-line,#3A433F)] px-3 py-1.5 font-semibold transition-[transform,filter,border-color,background-color] duration-150 hover:-translate-y-px hover:brightness-110 active:translate-y-px active:brightness-95 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:brightness-100";
  const plain = `${btn} bg-[var(--k-panel-2,#181D1B)] text-[var(--k-text,#E9EDE8)] hover:border-[var(--k-mute,#8A938D)]`;
  const main = { background: accent, color: textOn(accent), borderColor: "transparent" };
  const live = !previewState;
  // One stable main button whose label and action change, so focus stays put when Pause becomes Resume.
  // Offline still offers Pause: it stops the automatic carry-on when the connection returns.
  const primary =
    (st === "uploading" || st === "offline") && onPause
      ? { label: l.pause, run: onPause, strong: false }
      : st === "paused" && onResume
        ? { label: l.resume, run: onResume, strong: true }
        : st === "error" && onRetry
          ? { label: l.retry, run: onRetry, strong: true }
          : null;
  const showCancel = !!onCancel && st !== "done" && st !== "idle";
  const hasButtons = !!primary || showCancel;

  // The buttons went away (done, cancelled) while focused: put focus on the hourglass, not the page body.
  useEffect(() => {
    if (!focusInRow.current || hasButtons) return;
    focusInRow.current = false;
    if (!document.activeElement || document.activeElement === document.body) shaker.current?.focus();
  }, [hasButtons]);

  return (
    <div
      className={`flex w-full flex-col items-center rounded-xl border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] text-[var(--k-text,#E9EDE8)] shadow-[0_10px_30px_-14px_var(--k-shadow,rgba(0,0,0,.9))] ${sz.card} ${className}`}
    >
      <div
        ref={shaker}
        role="progressbar"
        aria-label={fill(l.progressLabel, { file: fileLabel })}
        aria-valuemin={known ? 0 : undefined}
        aria-valuemax={known ? 100 : undefined}
        aria-valuenow={known ? pct : undefined}
        aria-valuetext={valueText}
        aria-busy={moving || undefined}
        tabIndex={-1}
        className="relative grid shrink-0 place-items-center rounded-lg focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)]"
        style={{ width: sz.box, height: sz.box }}
      >
        <div style={{ transform: `rotate(${TILT[st]}deg)`, transition: turn }} className="grid place-items-center">
          <svg viewBox="0 0 100 160" width={(sz.box * 100) / 160} height={sz.box} aria-hidden="true" className="overflow-visible">
            <defs>
              <clipPath id={`${uid}t`}>
                <path d={TOP_BULB} />
              </clipPath>
              <clipPath id={`${uid}b`}>
                <path d={BOTTOM_BULB} />
              </clipPath>
            </defs>
            <path d={GLASS} style={{ fill: "var(--k-panel-2,#181D1B)" }} />
            {/* bytes still to send */}
            <g clipPath={`url(#${uid}t)`}>
              {looping ? (
                <path d="M0 0 Q50 5 100 0 V100 H0 Z" fill={accent} transform="translate(0 40)">
                  <animateTransform attributeName="transform" type="translate" values="0 40;0 64;0 40" dur="4s" repeatCount="indefinite" />
                </path>
              ) : (
                <path
                  d={moving ? "M0 0 Q50 6 100 0 V100 H0 Z" : "M0 0 H100 V100 H0 Z"}
                  fill={accent}
                  style={{ transform: `translateY(${top}px)`, transition: reduced ? "none" : "transform .5s linear" }}
                />
              )}
            </g>
            {/* bytes sent: a little mound */}
            <g clipPath={`url(#${uid}b)`}>
              {looping ? (
                <path d="M0 5 Q50 -5 100 5 V100 H0 Z" fill={accent} opacity={0.92} transform="translate(0 128)">
                  <animateTransform attributeName="transform" type="translate" values="0 128;0 104;0 128" dur="4s" repeatCount="indefinite" />
                </path>
              ) : (
                <path
                  d="M0 5 Q50 -5 100 5 V100 H0 Z"
                  fill={accent}
                  opacity={0.92}
                  style={{ transform: `translateY(${p > 0 ? bottom - 3 : 150}px)`, transition: reduced ? "none" : "transform .5s linear" }}
                />
              )}
            </g>
            {/* the falling stream */}
            {moving && p < 1 && (
              <line x1="50" y1="78" x2="50" y2={looping ? 118 : bottom - 1} stroke={accent} strokeWidth="1.6" strokeLinecap="round" strokeDasharray={reduced ? undefined : "2 3"}>
                {!reduced && <animate attributeName="stroke-dashoffset" from="0" to="-10" dur="0.45s" repeatCount="indefinite" />}
              </line>
            )}
            <path d="M27 22 C27 40 35 54 43 66" fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="2.5" strokeLinecap="round" />
            <path d={GLASS} fill="none" style={{ stroke: "var(--k-text,#E9EDE8)" }} strokeOpacity="0.6" strokeWidth="2" strokeLinejoin="round" />
            {st === "error" && (
              <path
                d="M66 24 L58 37 L63 43 L54 60 M58 37 L49 34 M63 43 L71 47"
                fill="none"
                style={{ stroke: "var(--k-err-text,#FF8A7A)" }}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {/* wooden frame */}
            <rect x="15" y="16" width="3" height="128" style={{ fill: "var(--k-mute,#8A938D)" }} />
            <rect x="82" y="16" width="3" height="128" style={{ fill: "var(--k-mute,#8A938D)" }} />
            <rect x="10" y="6" width="80" height="10" rx="3" style={{ fill: "var(--k-mute,#8A938D)" }} />
            <rect x="10" y="144" width="80" height="10" rx="3" style={{ fill: "var(--k-mute,#8A938D)" }} />
          </svg>
        </div>
        <span
          aria-hidden="true"
          className="absolute bottom-1 right-1 grid size-8 place-items-center rounded-full text-base font-black shadow-[0_6px_16px_-6px_var(--k-shadow,rgba(0,0,0,.9))]"
          style={{
            background: accent,
            color: textOn(accent),
            transform: st === "done" ? "scale(1)" : "scale(0)",
            transition: reduced ? "none" : `transform .35s cubic-bezier(.34,1.8,.64,1) ${st === "done" ? ".7s" : "0s"}`,
          }}
        >
          ✓
        </span>
      </div>

      <div className="w-full min-w-0 text-center">
        <div className="flex items-baseline justify-center gap-2">
          <p className={`min-w-0 truncate font-bold ${sz.name}`} title={fileName}>
            {fileName}
          </p>
          {known && <span className="shrink-0 font-mono font-bold tabular-nums">{fill(l.percent, { pct })}</span>}
        </div>
        <p className="font-mono tabular-nums text-[var(--k-text,#E9EDE8)] opacity-90">
          {known ? fill(l.sentOf, { sent: formatBytes(st === "done" ? tot : sent), total: formatBytes(tot) }) : fill(l.sentOnly, { sent: formatBytes(sent) })}
        </p>
        <p className={`mt-1 min-h-5 font-semibold ${tone}`}>
          {st === "done" && <span aria-hidden="true">✓ </span>}
          {message}
        </p>
      </div>

      {hasButtons && (
        <div
          className="flex flex-wrap justify-center gap-2"
          onFocus={() => (focusInRow.current = true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) focusInRow.current = false;
          }}
        >
          {primary && (
            <button key="primary" type="button" className={primary.strong ? btn : plain} style={primary.strong ? main : undefined} disabled={disabled} onClick={live ? primary.run : undefined}>
              {primary.label}
            </button>
          )}
          {showCancel && (
            <button key="cancel" type="button" className={plain} disabled={disabled} onClick={live ? onCancel : undefined}>
              {l.cancel}
            </button>
          )}
        </div>
      )}

      <p role="status" aria-live="polite" className="sr-only">
        {announce}
      </p>
    </div>
  );
}
