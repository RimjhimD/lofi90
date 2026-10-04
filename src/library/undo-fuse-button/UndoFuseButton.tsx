"use client";

import { useEffect, useId, useRef, useState } from "react";

export type FuseState = "idle" | "burning" | "committing" | "done" | "undone";

export interface FuseLabels {
  idle: string;
  /** Shown while the fuse burns. {s} is replaced with the seconds left. */
  burning: string;
  paused: string;
  /** Shown while an async onCommit is still running. */
  committing: string;
  done: string;
  undone: string;
  /** Mark after the done label. Empty string hides it. */
  doneMark: string;
  /** Mark after the undone label. Empty string hides it. */
  undoneMark: string;
  /** Status line while the fuse burns. */
  hint: string;
  /** Status line while the fuse waits under the pointer. */
  pausedHint: string;
  /** Announced at the start and when 3 and 1 seconds are left. {s} is replaced with the seconds left. */
  countdown: string;
  doneHint: string;
  undoneHint: string;
  /** Status line for a few seconds after onCommit fails. */
  error: string;
}

export interface UndoFuseButtonProps {
  /** Runs when the fuse burns out, i.e. the user did not undo. Return a promise to show the committing state until it settles. */
  onCommit: () => void | Promise<void>;
  /** Runs when onCommit throws or its promise rejects. The button goes back to idle. */
  onError?: (error: unknown) => void;
  /** Runs when the user cancels before the fuse burns out. */
  onUndo?: () => void;
  /** Runs when the button is pressed and the fuse is lit. */
  onStart?: () => void;
  /** How long the fuse burns, in milliseconds. */
  delayMs?: number;
  /** Override any text. */
  labels?: Partial<FuseLabels>;
  disabled?: boolean;
  /** Force the committing (loading) look, e.g. while the parent is still saving. */
  pending?: boolean;
  /** Show one state without running anything. "burning" is drawn about 60% burnt. */
  previewState?: FuseState;
  /** Button colour before it is pressed (also tints the undone state). Hex colours get automatic text contrast. */
  color?: string;
  /** Colour of the burning fuse, its spark and the burning tint. */
  fuseColor?: string;
  /** How the spark moves: a pulsing glow, a steady glow, or no spark at all. */
  spark?: "pulse" | "steady" | "none";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = { sm: "min-w-[180px] px-3.5 py-2 text-sm", md: "min-w-[230px] px-5 py-3 text-[0.95rem]", lg: "min-w-[280px] px-6 py-4 text-lg" };

const DEFAULT_LABELS: FuseLabels = {
  idle: "Delete",
  burning: "Deleting in {s}s · undo",
  paused: "Paused · move away to resume",
  committing: "Deleting…",
  done: "Deleted",
  undone: "Kept",
  doneMark: "✓",
  undoneMark: "↺",
  hint: "Click again or press Esc to undo.",
  pausedHint: "Paused while you're here. Click or press Esc to undo.",
  countdown: "Seconds left to undo: {s}.",
  doneHint: "Done. The undo window has closed.",
  undoneHint: "Cancelled. Nothing was changed.",
  error: "That didn't work. Nothing was changed.",
};

const ERROR_MS = 4000;

/** A faint wash of any CSS colour, so tints follow the colour props. */
const tint = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;

/** Dark text on light colours, white on dark ones, so any hex button colour stays readable. Other colours get dark text. */
function textOn(hex: string): string {
  let h = hex.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3,4}$/i.test(h)) h = [...h.slice(0, 3)].map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(h)) return "#0B0D0C";
  const n = parseInt(h.slice(0, 6), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.25 ? "#0B0D0C" : "#FFFFFF";
}

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * A destructive button with a built-in undo window. Press it and a fuse burns around its own border;
 * press again (or Esc) before the fuse reaches the end and nothing happens. The fuse waits while the pointer
 * is on the button and while the tab is hidden, so it never finishes while you're not looking.
 */
export function UndoFuseButton({
  onCommit,
  onUndo,
  onStart,
  onError,
  delayMs = 5000,
  labels,
  disabled = false,
  pending = false,
  previewState,
  color = "#C6FF3D",
  fuseColor = "#FFB547",
  spark: sparkStyle = "pulse",
  size = "md",
  className = "",
}: UndoFuseButtonProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const statusId = useId();
  const btn = useRef<HTMLButtonElement>(null);
  const fuse = useRef<SVGRectElement>(null);
  const spark = useRef<SVGCircleElement>(null);
  const [live, setLive] = useState<FuseState>("idle");
  const [held, setHeld] = useState(false);
  const [left, setLeft] = useState(delayMs);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [failed, setFailed] = useState(false);
  const failTimer = useRef(0);
  const latest = useRef({ onCommit, onUndo, onStart, onError });
  useEffect(() => {
    latest.current = { onCommit, onUndo, onStart, onError };
  });
  useEffect(() => () => clearTimeout(failTimer.current), []);

  const state = previewState ?? (pending ? "committing" : live);
  // Pressing does nothing once it has run, while it runs, or when switched off.
  const locked = disabled || pending || !!previewState || live === "done" || live === "committing";
  const progress = previewState === "burning" ? 0.6 : state === "burning" ? 1 - left / delayMs : 0;

  // Keep the fuse rectangle the same size as the button.
  useEffect(() => {
    const el = btn.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.borderBoxSize[0].inlineSize + 4, h: e.borderBoxSize[0].blockSize + 4 }));
    ro.observe(el, { box: "border-box" });
    return () => ro.disconnect();
  }, []);

  // Switched off while burning: put the fuse out. Nothing is committed and the window starts fresh next time.
  useEffect(() => {
    if (!disabled || previewState || live !== "burning") return;
    const t = window.setTimeout(() => {
      setLive("idle");
      setLeft(delayMs);
    }, 0);
    return () => clearTimeout(t);
  }, [disabled, live, previewState, delayMs]);

  // Burn: a short timer that only advances while not paused.
  useEffect(() => {
    if (previewState || disabled || live !== "burning") return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      if (!held && !document.hidden) setLeft((l) => Math.max(0, l - (now - last)));
      last = now;
    }, 50);
    return () => clearInterval(id);
  }, [live, held, previewState, disabled]);

  // Burnt out: commit. An async onCommit shows "committing" until it settles; a failure goes back to idle.
  useEffect(() => {
    if (previewState || disabled || live !== "burning" || left > 0) return;
    const succeed = () => {
      setLive("done");
      if (!reducedMotion()) btn.current?.animate([{ filter: "brightness(1.6)" }, { filter: "none" }], { duration: 380 });
    };
    const fail = (err: unknown) => {
      setLive("idle");
      setFailed(true);
      clearTimeout(failTimer.current);
      failTimer.current = window.setTimeout(() => setFailed(false), ERROR_MS);
      latest.current.onError?.(err);
    };
    const t = window.setTimeout(() => {
      let result: void | Promise<void>;
      try {
        result = latest.current.onCommit();
      } catch (err) {
        fail(err);
        return;
      }
      if (!(result instanceof Promise)) return succeed();
      setLive("committing");
      result.then(succeed, fail);
    }, 0);
    return () => clearTimeout(t);
  }, [left, live, previewState, disabled]);

  // Move the spark to the burning end of the fuse.
  useEffect(() => {
    const r = fuse.current;
    const s = spark.current;
    if (!r || !s || !box.w) return;
    const total = r.getTotalLength();
    const p = r.getPointAtLength(total * progress);
    s.setAttribute("cx", String(p.x));
    s.setAttribute("cy", String(p.y));
  }, [progress, box]);

  function press() {
    if (locked) return;
    clearTimeout(failTimer.current);
    setFailed(false);
    if (live === "burning") {
      setLive("undone");
      latest.current.onUndo?.();
      if (!reducedMotion()) btn.current?.animate([{ transform: "scale(.96)" }, { transform: "scale(1)" }], { duration: 220 });
      return;
    }
    setLeft(delayMs);
    setLive("burning");
    latest.current.onStart?.();
  }

  const seconds = previewState ? Math.ceil((delayMs * 0.4) / 1000) : Math.ceil(left / 1000);
  // Coarse countdown for screen readers: the text only changes at the start, at 3s and at 1s, so it isn't read every tick.
  const startSeconds = Math.ceil(delayMs / 1000);
  const mark = seconds <= 1 ? 1 : seconds <= 3 ? Math.min(3, startSeconds) : startSeconds;
  const label =
    state === "burning"
      ? held && !previewState
        ? text.paused
        : text.burning.replace("{s}", String(seconds))
      : state === "committing"
        ? text.committing
        : state === "done"
          ? text.done
          : state === "undone"
            ? text.undone
            : text.idle;
  const labelMark = state === "done" ? text.doneMark : state === "undone" ? text.undoneMark : "";

  const tone =
    state === "burning"
      ? "text-[var(--k-text,#E9EDE8)]"
      : state === "done" || state === "committing"
        ? "bg-[var(--k-panel-2,#181D1B)] text-[var(--k-text,#E9EDE8)]"
        : state === "undone"
          ? "text-[var(--k-acc-text,#C6FF3D)]"
          : "";
  const fill =
    state === "idle" && !disabled
      ? { background: color, color: textOn(color) }
      : state === "burning"
        ? { background: tint(fuseColor, 10) }
        : state === "undone"
          ? { background: tint(color, 15) }
          : undefined;
  // Hover lifts and brightens, press sinks; only while pressing still does something.
  const motion = locked
    ? "cursor-not-allowed"
    : "hover:-translate-x-px hover:-translate-y-px hover:brightness-110 hover:shadow-[0_14px_32px_-12px_var(--k-shadow,rgba(0,0,0,.9))] active:translate-x-px active:translate-y-px active:brightness-95 active:shadow-[0_4px_12px_-8px_var(--k-shadow,rgba(0,0,0,.9))]";

  return (
    <div className={`inline-flex flex-col items-center gap-2 ${className}`}>
      <button
        ref={btn}
        type="button"
        onClick={press}
        onPointerEnter={() => setHeld(true)}
        onPointerLeave={() => setHeld(false)}
        onKeyDown={(e) => e.key === "Escape" && live === "burning" && press()}
        disabled={disabled}
        aria-disabled={!disabled && (pending || live === "done" || live === "committing") ? true : undefined}
        aria-busy={state === "committing" || undefined}
        aria-describedby={statusId}
        style={fill}
        className={`relative ${SIZES[size]} rounded-lg border border-[var(--k-line,#3A433F)] font-bold shadow-[0_10px_30px_-14px_var(--k-shadow,rgba(0,0,0,.9))] transition-[background-color,color,box-shadow,transform,filter] duration-150 ${motion} focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--k-acc-text,#C6FF3D)] disabled:bg-[var(--k-panel-2,#181D1B)] disabled:text-[var(--k-mute,#8A938D)] disabled:shadow-none ${tone}`}
      >
        {state === "committing" && (
          <span aria-hidden="true" className="mr-2 inline-block size-3 rounded-full border-2 border-current border-t-transparent align-[-1px] motion-safe:animate-spin" />
        )}
        {label}
        {labelMark && <span aria-hidden="true"> {labelMark}</span>}
        {state === "burning" && box.w > 0 && (
          <svg aria-hidden="true" className="pointer-events-none absolute -left-[4px] -top-[4px] overflow-visible" width={box.w} height={box.h}>
            {/* the fuse that is left, from the spark to the end */}
            <rect
              ref={fuse}
              x="1.5"
              y="1.5"
              width={box.w - 3}
              height={box.h - 3}
              rx="9"
              fill="none"
              stroke={fuseColor}
              strokeWidth="3"
              pathLength={1}
              strokeDasharray={`${1 - progress} 1`}
              strokeDashoffset={-progress}
            />
            {sparkStyle !== "none" && (
              <circle
                ref={spark}
                r="5"
                style={{ fill: `color-mix(in srgb, ${fuseColor} 30%, #fff)`, filter: `drop-shadow(0 0 8px ${fuseColor})` }}
                className={sparkStyle === "pulse" ? "motion-safe:animate-pulse" : ""}
              />
            )}
          </svg>
        )}
      </button>
      <p id={statusId} role="status" aria-live="polite" className="min-h-5 text-center text-xs font-semibold text-[var(--k-mute,#8A938D)]">
        {state === "burning"
          ? held && !previewState
            ? text.pausedHint
            : `${text.hint} ${text.countdown.replace("{s}", String(mark))}`
          : state === "done"
            ? text.doneHint
            : state === "undone"
              ? text.undoneHint
              : state === "idle" && failed
                ? text.error
                : ""}
      </p>
    </div>
  );
}
