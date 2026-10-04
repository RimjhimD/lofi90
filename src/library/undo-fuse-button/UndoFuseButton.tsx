"use client";

import { useEffect, useId, useRef, useState } from "react";

export type FuseState = "idle" | "burning" | "done" | "undone";

export interface FuseLabels {
  idle: string;
  /** Shown while the fuse burns. {s} is replaced with the seconds left. */
  burning: string;
  paused: string;
  done: string;
  undone: string;
}

export interface UndoFuseButtonProps {
  /** Runs when the fuse burns out, i.e. the user did not undo. */
  onCommit: () => void | Promise<void>;
  /** Runs when the user cancels before the fuse burns out. */
  onUndo?: () => void;
  /** Runs when the button is pressed and the fuse is lit. */
  onStart?: () => void;
  /** How long the fuse burns, in milliseconds. */
  delayMs?: number;
  /** Override any text. */
  labels?: Partial<FuseLabels>;
  disabled?: boolean;
  /** Show one state without running anything. "burning" is drawn about 60% burnt. */
  previewState?: FuseState;
  /** Button colour before it is pressed. */
  color?: string;
  /** Colour of the burning fuse. */
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
  done: "Deleted",
  undone: "Kept",
};

/** Dark text on light colours, white on dark ones, so any button colour stays readable. */
function textOn(hex: string): string {
  const n = parseInt(hex.replace("#", ""), 16);
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
  delayMs = 5000,
  labels,
  disabled = false,
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
  const latest = useRef({ onCommit, onUndo, onStart });
  useEffect(() => {
    latest.current = { onCommit, onUndo, onStart };
  });

  const state = previewState ?? live;
  const progress = previewState === "burning" ? 0.6 : state === "burning" ? 1 - left / delayMs : 0;

  // Keep the fuse rectangle the same size as the button.
  useEffect(() => {
    const el = btn.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.borderBoxSize[0].inlineSize + 4, h: e.borderBoxSize[0].blockSize + 4 }));
    ro.observe(el, { box: "border-box" });
    return () => ro.disconnect();
  }, []);

  // Burn: a short timer that only advances while not paused.
  useEffect(() => {
    if (previewState || live !== "burning") return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      if (!held && !document.hidden) setLeft((l) => Math.max(0, l - (now - last)));
      last = now;
    }, 50);
    return () => clearInterval(id);
  }, [live, held, previewState]);

  // Burnt out: commit.
  useEffect(() => {
    if (previewState || live !== "burning" || left > 0) return;
    const t = window.setTimeout(() => {
      setLive("done");
      void latest.current.onCommit();
      if (!reducedMotion()) btn.current?.animate([{ filter: "brightness(1.6)" }, { filter: "none" }], { duration: 380 });
    }, 0);
    return () => clearTimeout(t);
  }, [left, live, previewState]);

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
    if (disabled || previewState) return;
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

  const seconds = Math.ceil(left / 1000);
  const label =
    state === "burning"
      ? held && !previewState
        ? text.paused
        : text.burning.replace("{s}", String(previewState ? Math.ceil(delayMs * 0.4 / 1000) : seconds))
      : state === "done"
        ? `${text.done} ✓`
        : state === "undone"
          ? `${text.undone} ↺`
          : text.idle;

  const tone =
    state === "burning"
      ? "bg-[#FFB547]/10 text-[#E9EDE8]"
      : state === "done"
        ? "bg-[#181D1B] text-[#E9EDE8]"
        : state === "undone"
          ? "bg-[#C6FF3D]/15 text-[#C6FF3D]"
          : "";

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
        aria-describedby={statusId}
        style={state === "idle" && !disabled ? { background: color, color: textOn(color) } : undefined}
        className={`relative ${SIZES[size]} rounded-lg border border-[#3A433F] font-bold shadow-[0_10px_30px_-14px_rgba(0,0,0,.9)] transition-[background-color,color,box-shadow,transform] duration-150 hover:-translate-x-px hover:-translate-y-px hover:shadow-[0_10px_30px_-14px_rgba(0,0,0,.9)] active:translate-x-px active:translate-y-px active:shadow-[0_10px_30px_-14px_rgba(0,0,0,.9)] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#C6FF3D] disabled:cursor-not-allowed disabled:bg-[#181D1B] disabled:text-[#8A938D] disabled:shadow-none ${tone}`}
      >
        {label}
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
              <circle ref={spark} r="5" fill="#FFF3C4" className={`drop-shadow-[0_0_8px_#FFB547] ${sparkStyle === "pulse" ? "motion-safe:animate-pulse" : ""}`} />
            )}
          </svg>
        )}
      </button>
      <p id={statusId} role="status" aria-live="polite" className="min-h-5 text-center text-xs font-semibold text-[#8A938D]">
        {state === "burning"
          ? held && !previewState
            ? "Paused while you're here. Click or press Esc to undo."
            : "Click again or press Esc to undo."
          : state === "done"
            ? "Done. The undo window has closed."
            : state === "undone"
              ? "Cancelled. Nothing was changed."
              : ""}
      </p>
    </div>
  );
}
