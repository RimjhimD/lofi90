"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/** The letters printed on each split-flap drum, in drum order. */
export const FLAPS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:-/#&'+·";
/** A real drum would spin through every letter; we show at most this many so updates stay quick. */
const MAX_STEPS = 5;

/** The letters a tile shows on its way from `from` to `to` (ends on `to`). Unknown characters flip once. */
export function flapPath(from: string, to: string): string[] {
  if (from === to) return [];
  const a = FLAPS.indexOf(from);
  const b = FLAPS.indexOf(to);
  if (a < 0 || b < 0) return [to];
  const len = FLAPS.length;
  const n = Math.min((b - a + len) % len, MAX_STEPS);
  return Array.from({ length: n }, (_, i) => FLAPS[(b - n + 1 + i + len) % len]);
}

/** Fit a value into exactly `width` tiles: upper-cased, cut with "…" when too long, padded by alignment. */
export function fit(value: string, width: number, align: "left" | "right" = "left", upper = true): string {
  let v = upper ? value.toUpperCase() : value;
  if (v.length > width) v = v.slice(0, Math.max(0, width - 1)) + "…";
  return align === "right" ? v.padStart(width, " ") : v.padEnd(width, " ");
}

const HALF = "absolute inset-x-0 h-1/2 overflow-hidden [backface-visibility:hidden]";
const FACE_TOP = "top-0 rounded-t-[2px] bg-[linear-gradient(#2A2E2C,#212523)] origin-bottom";
const FACE_BOTTOM = "bottom-0 rounded-b-[2px] bg-[linear-gradient(#1C1F1E,#151817)] origin-top";

/** One half of a tile: the glyph is drawn full height and the half crops it. */
function Half({ side, c, ref, style }: { side: "top" | "bottom"; c: string; ref?: React.Ref<HTMLSpanElement>; style?: React.CSSProperties }) {
  return (
    <span ref={ref} style={style} className={`${HALF} ${side === "top" ? FACE_TOP : FACE_BOTTOM}`}>
      <span className={`absolute inset-x-0 flex h-[200%] items-center justify-center leading-none ${side === "top" ? "top-0" : "bottom-0"}`}>{c}</span>
    </span>
  );
}

interface TileProps {
  ch: string;
  /** Wait this long before the first flip (the left-to-right stagger). */
  delay: number;
  /** Time per letter. */
  stepMs: number;
  /** No flipping at all: reduced motion or a static preview. */
  still: boolean;
  /** Letter showing when the tile first appears (a new row starts blank). */
  from?: string;
  /** Freeze the tile half-way through a flip from this letter (static previews). */
  pose?: string;
}

/** A single split-flap tile. The top flap folds down over the old letter, the bottom flap lands with the new one. */
export function FlapTile({ ch, delay, stepMs, still, from, pose }: TileProps) {
  const [s, setS] = useState(() => {
    const c = from ?? ch;
    return { prev: c, cur: c, n: 0 };
  });
  const shown = useRef(s.cur);
  const top = useRef<HTMLSpanElement>(null);
  const bottom = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    shown.current = s.cur;
  });

  // Walk the drum to the new letter, one flap every stepMs. A newer letter cancels the rest of the walk.
  useEffect(() => {
    if (still) return;
    const path = flapPath(shown.current, ch);
    const timers = path.map((c, i) => window.setTimeout(() => setS((p) => ({ prev: p.cur, cur: c, n: p.n + 1 })), delay + i * stepMs));
    return () => timers.forEach(clearTimeout);
  }, [ch, still, delay, stepMs]);

  // Fold the flaps for each step.
  useEffect(() => {
    if (s.n === 0 || still) return;
    const half = Math.max(12, stepMs / 2);
    const a = top.current?.animate([{ transform: "rotateX(0deg)" }, { transform: "rotateX(-90deg)" }], { duration: half, easing: "ease-in", fill: "forwards" });
    const b = bottom.current?.animate([{ transform: "rotateX(90deg)" }, { transform: "rotateX(0deg)" }], { duration: half, delay: half, easing: "ease-out", fill: "both" });
    return () => {
      a?.cancel();
      b?.cancel();
    };
  }, [s.n, still, stepMs]);

  const cur = still ? ch : s.cur;
  const flipping = !still && s.n > 0 && s.prev !== s.cur;
  return (
    <span aria-hidden="true" className="relative mx-[0.04em] inline-block h-[1.5em] w-[0.95em] align-middle [perspective:16em]">
      <Half side="top" c={cur} />
      <Half side="bottom" c={pose ?? (flipping ? s.prev : cur)} />
      {flipping && (
        <>
          <Half key={`t${s.n}`} ref={top} side="top" c={s.prev} />
          <Half key={`b${s.n}`} ref={bottom} side="bottom" c={s.cur} style={{ transform: "rotateX(90deg)" }} />
        </>
      )}
      {pose !== undefined && <Half side="top" c={pose} style={{ transform: "rotateX(-58deg)", filter: "brightness(1.35)" }} />}
      {/* the hinge between the two halves */}
      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-black/80" />
    </span>
  );
}

/** A row of tiles spelling `text`, staggered left to right. */
export function FlapText({ text, stepMs, still, enter, pose }: { text: string; stepMs: number; still: boolean; enter?: boolean; pose?: boolean }) {
  return (
    <span className="inline-flex whitespace-pre">
      {[...text].map((c, i) => {
        const at = FLAPS.indexOf(c);
        return (
          <FlapTile
            key={i}
            ch={c}
            delay={i * stepMs * 0.6}
            stepMs={stepMs}
            still={still}
            from={enter ? " " : undefined}
            pose={pose && at > 0 ? FLAPS[(at + FLAPS.length - 2) % FLAPS.length] : undefined}
          />
        );
      })}
    </span>
  );
}

const MOTION = "(prefers-reduced-motion: reduce)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(MOTION);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
export const useReducedMotion = () => useSyncExternalStore(subscribe, () => window.matchMedia(MOTION).matches, () => false);

/** Dark text on light hex colours, white on dark ones. */
export function textOn(hex: string): string {
  let h = hex.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(h)) h = [...h].map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}/i.test(h)) return "#0B0D0C";
  const n = parseInt(h.slice(0, 6), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.25 ? "#0B0D0C" : "#FFFFFF";
}

/** The fading "this changed" wash on a cell. It starts from the cell's real age, so a re-mount doesn't restart it. */
export function Mark({ stamp, ms, color, still }: { stamp: number; ms: number; color: string; still: boolean }) {
  const el = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (still || !el.current) return;
    const a = el.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms, easing: "ease-in", fill: "forwards" });
    a.currentTime = Math.min(ms, Math.max(0, Date.now() - stamp));
    return () => a.cancel();
  }, [stamp, ms, still]);
  return (
    <span
      ref={el}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-[3px] border-l-[3px]"
      style={{ borderColor: color, background: `color-mix(in srgb, ${color} 16%, transparent)` }}
    />
  );
}

/** A tiny hash so the loading board looks random but renders the same on server and client. */
export const noise = (a: number, b: number, c: number) => {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return Math.abs(h ^ (h >>> 16));
};
