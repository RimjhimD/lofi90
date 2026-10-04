"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from "react";

export interface TapeMeasureInputProps {
  value: number;
  /** Called live while the tape moves, always with a value on the step grid. */
  onChange: (value: number) => void;
  /** Called once a value is chosen: the hook is let go, the track is clicked or a key is pressed. */
  onSettle?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Printed after the number, e.g. "cm", "in", "mm". */
  unit?: string;
  label?: string;
  /** Colour of the tape. Ticks and numbers on it are printed dark. */
  accent?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  /** Freeze one look without interaction, for docs and tests: a value, and optionally the "being pulled" look. */
  preview?: { value: number; pulling?: boolean };
  className?: string;
}

/** Width of the metal end hook, in px. Scripted demos use it to aim at the hook. */
export const TAPE_HOOK_W = 8;
const GAP = 6;
const HIT = 32;

const SIZES = {
  sm: { h: 60, caseW: 80, tape: 20, radius: 16, num: "text-lg", unit: "text-[0.6rem]" },
  md: { h: 76, caseW: 100, tape: 26, radius: 20, num: "text-2xl", unit: "text-[0.65rem]" },
  lg: { h: 92, caseW: 120, tape: 32, radius: 24, num: "text-3xl", unit: "text-xs" },
};

/** idle: at rest · follow: the hand is on the hook · settle: snapping after release · move: sliding to a new value · zip: retracting to min */
type Mode = "idle" | "follow" | "settle" | "move" | "zip";

interface Anim {
  /** Everything runs in fractions of the track: 0 = fully in, 1 = fully out. */
  pos: number;
  vel: number;
  target: number;
  mode: Mode;
  shown: Mode;
  zipFrom: number;
  zipT0: number;
  zipDur: number;
  /** Wobble: amplitude in degrees and phase. */
  amp: number;
  ph: number;
  last: number;
  raf: number;
  grab: number;
  moveT: number;
  emitted: number;
  range: string;
}

const SPRING = { settle: { k: 260, z: 0.36 }, move: { k: 150, z: 0.62 } };
const RELEASE_KICK = 110; // px/s, so every release lands with the same small bounce

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const decimals = (n: number) => (String(n).split(".")[1] ?? "").length;

/** The smallest of 1, 2, 5 × 10ⁿ that is at least x. */
function nice(x: number) {
  const p = 10 ** Math.floor(Math.log10(x));
  return [1, 2, 5, 10].map((m) => m * p).find((v) => v >= x - 1e-9) ?? 10 * p;
}

function zip(a: Anim) {
  a.mode = "zip";
  a.zipFrom = a.pos;
  a.zipT0 = -1; // the clock starts on the first frame, so a stale frame time can't fling it
  a.zipDur = 140 + 340 * Math.min(1, a.pos);
}

function run(a: Anim, frame: RefObject<(t: number) => void>) {
  if (a.raf) return;
  a.last = performance.now();
  a.raf = requestAnimationFrame((t) => frame.current(t));
}

/**
 * A number input you pull out like a metal tape measure. Drag the hook to pull the tape out or push it
 * back; the readout on the case counts as it goes and the tape snaps to the nearest step with a small
 * bounce when you let go. Click the track to jump, use the arrow keys, or go back to min and it zips in.
 */
export function TapeMeasureInput({
  value,
  onChange,
  onSettle,
  min = 0,
  max = 200,
  step = 1,
  unit = "cm",
  label = "Length",
  accent = "#C6FF3D",
  size = "md",
  disabled = false,
  preview,
  className = "",
}: TapeMeasureInputProps) {
  const labelId = useId();
  const s = SIZES[size];
  const span = Math.max(max - min, 1e-9);
  const dec = decimals(step);
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const snap = (v: number) => clamp(Number((min + Math.round((v - min) / step) * step).toFixed(dec)));
  const fmt = (v: number) => v.toFixed(dec);
  const locked = disabled || !!preview;

  const [pos, setPos] = useState(value);
  const [wob, setWob] = useState(0);
  const [phase, setPhase] = useState<Mode>("idle");
  const [trackW, setTrackW] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const caseEl = useRef<HTMLDivElement>(null);
  const usableRef = useRef(1);
  const frame = useRef<(t: number) => void>(() => {});
  const anim = useRef<Anim>({
    pos: (value - min) / span,
    vel: 0,
    target: (value - min) / span,
    mode: "idle",
    shown: "idle",
    zipFrom: 0,
    zipT0: 0,
    zipDur: 0,
    amp: 0,
    ph: 0,
    last: 0,
    raf: 0,
    grab: 0,
    moveT: 0,
    emitted: value,
    range: `${min}:${max}`,
  });

  const latest = useRef({ min, max });
  useEffect(() => {
    latest.current = { min, max };
  });

  // One animation frame: springs, the zip, and the wobble all live here and write state once per frame.
  useEffect(() => {
    frame.current = (t: number) => {
      const a = anim.current;
      a.raf = 0;
      const still = reduced();
      const dt = Math.min(0.034, Math.max(0.001, (t - a.last) / 1000));
      a.last = t;
      const before = a.pos;

      if (a.mode === "zip") {
        if (a.zipT0 < 0) a.zipT0 = t;
        const u = still ? 1 : Math.min(1, Math.max(0, (t - a.zipT0) / a.zipDur));
        a.pos = a.zipFrom + (a.target - a.zipFrom) * u * u * u; // ease-in: it gathers speed and slams home
        a.vel = (a.pos - before) / dt;
        if (u >= 1) {
          a.pos = a.target;
          a.vel = 0;
          a.mode = "idle";
          if (!still)
            caseEl.current?.animate(
              [{ transform: "none" }, { transform: "translateX(-4px) rotate(-2deg)" }, { transform: "translateX(1px)" }, { transform: "none" }],
              { duration: 260, easing: "ease-out" },
            );
        }
      } else if (a.mode === "settle" || a.mode === "move") {
        if (still) {
          a.pos = a.target;
          a.vel = 0;
          a.mode = "idle";
        } else {
          const { k, z } = SPRING[a.mode];
          a.vel += (-k * (a.pos - a.target) - 2 * Math.sqrt(k) * z * a.vel) * dt;
          a.pos += a.vel * dt;
          if (Math.abs(a.pos - a.target) < 4e-4 && Math.abs(a.vel) < 4e-3) {
            a.pos = a.target;
            a.vel = 0;
            a.mode = "idle";
          }
        }
      } else if (a.mode === "follow" && t - a.moveT > 60) {
        a.vel *= Math.exp(-dt * 12); // the hand is holding still
      }

      // Fast moves make the thin metal flex: a quick, decaying sway about the slot.
      if (still) a.amp = 0;
      else {
        const speed = Math.abs(a.vel) * usableRef.current;
        a.amp = Math.max(a.amp * Math.exp(-dt * 4), Math.min(1.6, Math.max(0, speed - 100) / 450));
        a.ph += dt * Math.PI * 2 * 7.5;
      }

      const { min: lo, max: hi } = latest.current;
      setPos(lo + a.pos * Math.max(hi - lo, 1e-9));
      setWob(a.amp < 0.02 ? 0 : a.amp * Math.sin(a.ph));
      if (a.shown !== a.mode) {
        a.shown = a.mode;
        setPhase(a.mode);
      }
      if (a.mode !== "idle" || a.amp >= 0.02) run(a, frame);
      else a.amp = 0;
    };
  });

  useEffect(() => () => cancelAnimationFrame(anim.current.raf), []);

  // Measure the track so ticks and the hook use real pixels.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setTrackW(el.offsetWidth);
      usableRef.current = Math.max(1, el.offsetWidth - TAPE_HOOK_W - GAP);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // A new value from outside (keys, the parent, a track click): slide there, or zip in if it is min.
  useEffect(() => {
    const a = anim.current;
    const f = (value - min) / Math.max(max - min, 1e-9);
    const range = `${min}:${max}`;
    if (a.range !== range) {
      a.range = range;
      a.pos = a.target = f;
      a.vel = 0;
      a.mode = "idle";
      run(a, frame);
      return;
    }
    if (a.mode === "follow") return;
    if (Math.abs(a.target - f) < 1e-6 && (a.mode !== "idle" || Math.abs(a.pos - f) < 1e-6)) return;
    a.target = f;
    if (f <= 1e-6 && a.pos > 0.002) zip(a);
    else a.mode = "move";
    run(a, frame);
  }, [value, min, max]);

  /** Pointer position in the track's own (unscaled) pixels, so it also works inside a zoomed preview. */
  function toPx(clientX: number) {
    const el = track.current!;
    const r = el.getBoundingClientRect();
    const scale = r.width / (el.offsetWidth || 1) || 1;
    return { px: (clientX - r.left) / scale, usable: Math.max(1, el.offsetWidth - TAPE_HOOK_W - GAP) };
  }

  function settleOn(v: number, fromDrag: boolean) {
    const a = anim.current;
    const f = (v - min) / span;
    a.target = f;
    if (v <= min && a.pos > 0.002) zip(a);
    else if (fromDrag) {
      const dir = Math.abs(f - a.pos) > 0.01 ? Math.sign(f - a.pos) : Math.sign(a.vel) || 1;
      a.vel = a.vel * 0.3 + (dir * RELEASE_KICK) / usableRef.current;
      a.mode = "settle";
    } else a.mode = "move";
    if (v !== a.emitted) {
      a.emitted = v;
      onChange(v);
    }
    onSettle?.(v);
    run(a, frame);
  }

  function grab(e: PointerEvent<HTMLDivElement>) {
    if (locked || e.button > 0) return;
    e.stopPropagation();
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // scripted demos send pointer ids the browser does not know; they don't need capture
    }
    if (e.isTrusted) e.currentTarget.focus({ preventScroll: true });
    const a = anim.current;
    const { px, usable } = toPx(e.clientX);
    a.grab = px - Math.max(0, a.pos) * usable;
    a.mode = "follow";
    a.target = a.pos;
    a.emitted = value;
    a.moveT = e.timeStamp;
    run(a, frame);
  }

  function drag(e: PointerEvent<HTMLDivElement>) {
    const a = anim.current;
    if (a.mode !== "follow") return;
    const { px, usable } = toPx(e.clientX);
    let f = (px - a.grab) / usable;
    if (f > 1) f = 1 + (f - 1) * 0.18; // past the end the tape fights back
    f = Math.max(0, Math.min(1.06, f));
    const now = e.timeStamp;
    const dt = Math.max(0.008, (now - a.moveT) / 1000);
    a.vel = a.vel * 0.5 + ((f - a.pos) / dt) * 0.5;
    a.pos = f;
    a.moveT = now;
    const v = snap(min + Math.min(1, f) * span);
    if (v !== a.emitted) {
      a.emitted = v;
      onChange(v);
    }
    run(a, frame);
  }

  function release() {
    const a = anim.current;
    if (a.mode !== "follow") return;
    settleOn(snap(min + Math.min(1, a.pos) * span), true);
  }

  function jump(e: PointerEvent<HTMLDivElement>) {
    if (locked || e.button > 0 || (e.target as HTMLElement).closest("[data-tape-hook]")) return;
    const { px, usable } = toPx(e.clientX);
    anim.current.emitted = value;
    settleOn(snap(min + Math.max(0, Math.min(1, (px - TAPE_HOOK_W / 2) / usable)) * span), false);
  }

  function key(e: KeyboardEvent<HTMLDivElement>) {
    if (locked) return;
    const big = step * 10;
    const by: Record<string, number> = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: big, PageDown: -big };
    let v: number;
    if (e.key === "Home") v = min;
    else if (e.key === "End") v = max;
    else if (e.key in by) v = snap(value + by[e.key] * (e.shiftKey && e.key.startsWith("Arrow") ? 10 : 1));
    else return;
    e.preventDefault();
    anim.current.emitted = value;
    if (v !== value) settleOn(v, false);
  }

  const usable = Math.max(0, trackW - TAPE_HOOK_W - GAP);
  const shownValue = preview ? clamp(preview.value) : pos;
  const tapeLen = Math.min(1.06, Math.max(0, (shownValue - min) / span)) * usable;
  const tapeTop = Math.round(s.h - s.tape - s.h * 0.16);
  const pulling = preview ? !!preview.pulling : phase === "follow";
  const active = preview ? !!preview.pulling : phase !== "idle";
  const readout = preview ? clamp(preview.value) : phase === "idle" || phase === "settle" ? value : snap(pos);
  const now = preview ? clamp(preview.value) : value;

  // The printed scale. A mark's number is min + its distance from the hook, so the number at the slot
  // is always the reading (like adding the case length on a real tape).
  const scale = useMemo(() => {
    if (usable < 20) return null;
    const ppu = usable / span;
    const minor = nice(5.5 / ppu);
    const major = [5, 10, 20, 50, 100].map((m) => nice(minor * m)).find((m) => m * ppu >= 30) ?? minor * 100;
    const w = usable + 24;
    const ticks: { x: number; big: boolean; label?: string }[] = [];
    const first = Math.ceil(min / minor - 1e-9);
    for (let i = first; i * minor <= max + 1e-9 && ticks.length < 1200; i++) {
      const at = i * minor;
      const x = w - (at - min) * ppu;
      const big = Math.abs(at / major - Math.round(at / major)) < 1e-6;
      ticks.push({ x, big, label: big && w - x > 12 ? String(Number(at.toFixed(6))) : undefined });
    }
    return { w, ticks };
  }, [usable, span, min, max]);

  return (
    <div className={`w-full select-none ${disabled ? "opacity-50" : ""} ${className}`}>
      <div className="mb-2 flex items-baseline justify-between gap-3 text-xs">
        <span id={labelId} className="font-semibold text-[var(--k-text,#E9EDE8)]">
          {label}
        </span>
        <span className="font-mono text-[0.65rem] text-[var(--k-mute,#8A938D)]">
          {fmt(min)}–{fmt(max)} {unit}
        </span>
      </div>

      <div className="flex items-stretch" style={{ height: s.h }}>
        {/* the case */}
        <div
          ref={caseEl}
          aria-hidden="true"
          className="relative z-10 shrink-0 border border-[var(--k-line,#3A433F)] bg-[var(--k-panel-2,#181D1B)] shadow-[0_10px_30px_-14px_var(--k-shadow,rgba(0,0,0,.9))]"
          style={{ width: s.caseW, borderRadius: s.radius }}
        >
          <div
            className="absolute inset-x-2 top-2 flex items-baseline justify-center gap-0.5 rounded-[10px] border border-[var(--k-line,#3A433F)] bg-[var(--k-bg,#0E1110)] px-1.5 shadow-[inset_0_1px_4px_var(--k-shadow,rgba(0,0,0,.9))]"
            style={{ height: Math.round(s.h * 0.5), alignItems: "center" }}
          >
            <span
              className={`font-mono font-bold leading-none tabular-nums transition-colors duration-200 ${s.num} ${active ? "text-[var(--k-acc-text,#C6FF3D)]" : "text-[var(--k-text,#E9EDE8)]"}`}
            >
              {fmt(readout)}
            </span>
            <span className={`font-semibold text-[var(--k-mute,#8A938D)] ${s.unit}`}>{unit}</span>
          </div>
          {/* screw */}
          <span className="absolute bottom-2 left-2.5 grid h-2.5 w-2.5 place-items-center rounded-full border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)]">
            <span className="h-px w-1.5 rotate-[35deg] bg-[var(--k-mute,#8A938D)]" />
          </span>
          <span className="absolute bottom-2.5 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full" style={{ background: accent, opacity: 0.85 }} />
          {/* the slot the tape comes out of */}
          <span
            className="absolute -right-px w-1.5 rounded-l-sm bg-[var(--k-bg,#0E1110)]"
            style={{ top: tapeTop - 3, height: s.tape + 6 }}
          />
        </div>

        {/* the track the tape runs along */}
        <div
          ref={track}
          data-tape-track
          onPointerDown={jump}
          className={`relative min-w-0 flex-1 touch-pan-y ${locked ? (disabled ? "cursor-not-allowed" : "") : "cursor-pointer"}`}
        >
          {/* where the tape can reach */}
          <span
            aria-hidden="true"
            className="absolute left-0 border-t-2 border-dotted border-[var(--k-line,#3A433F)]"
            style={{ top: tapeTop + s.tape / 2 - 1, width: usable + TAPE_HOOK_W }}
          />
          <span
            aria-hidden="true"
            className="absolute w-0.5 rounded-full bg-[var(--k-line,#3A433F)]"
            style={{ left: usable + TAPE_HOOK_W / 2 - 1, top: tapeTop - 4, height: s.tape + 8 }}
          />
          <span
            aria-hidden="true"
            className="absolute -translate-x-full pr-1 font-mono text-[0.6rem] leading-none text-[var(--k-mute,#8A938D)]"
            style={{ left: usable + TAPE_HOOK_W / 2, top: tapeTop - 14 }}
          >
            {fmt(max)}
          </span>

          {/* tape + hook, swaying together about the slot */}
          <div className="absolute inset-0" style={{ transform: wob ? `rotate(${wob}deg)` : undefined, transformOrigin: `0px ${tapeTop + s.tape / 2}px` }}>
            <div
              aria-hidden="true"
              className="absolute overflow-hidden shadow-[0_6px_14px_-6px_var(--k-shadow,rgba(0,0,0,.9))]"
              style={{ left: -14, top: tapeTop, width: tapeLen + 14, height: s.tape, background: accent }}
            >
              {scale && (
                <svg className="absolute right-0 top-0" width={scale.w} height={s.tape}>
                  {scale.ticks.map((t, i) => (
                    <line key={i} x1={t.x} x2={t.x} y1={0} y2={s.tape * (t.big ? 0.5 : 0.26)} stroke="#0B0D0C" strokeOpacity={t.big ? 0.85 : 0.55} strokeWidth={t.big ? 1.4 : 1} />
                  ))}
                  {scale.ticks.map((t, i) =>
                    t.label ? (
                      <text key={`l${i}`} x={t.x} y={s.tape - 3} textAnchor="middle" fontSize={Math.max(8, Math.round(s.tape * 0.36))} fontWeight={700} fill="#0B0D0C" className="font-mono">
                        {t.label}
                      </text>
                    ) : null,
                  )}
                </svg>
              )}
              {/* a curved-metal sheen */}
              <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.35),transparent_45%,rgba(0,0,0,.14))]" />
            </div>

            {/* the end hook: what you grab */}
            <div
              role="slider"
              data-tape-hook
              tabIndex={locked ? -1 : 0}
              aria-labelledby={labelId}
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuenow={now}
              aria-valuetext={`${fmt(now)} ${unit}`}
              aria-orientation="horizontal"
              aria-disabled={disabled || undefined}
              onPointerDown={grab}
              onPointerMove={drag}
              onPointerUp={release}
              onPointerCancel={release}
              onLostPointerCapture={release}
              onKeyDown={key}
              className={`group absolute top-0 h-full touch-none rounded-md outline-none ${locked ? (disabled ? "cursor-not-allowed" : "") : pulling ? "cursor-grabbing" : "cursor-grab"}`}
              style={{ left: tapeLen + TAPE_HOOK_W / 2 - HIT / 2, width: HIT }}
            >
              <span
                className={`absolute rounded-[3px] bg-[linear-gradient(180deg,#EEF1EF,#A3ABA6_55%,#6F7773)] shadow-[0_2px_5px_rgba(0,0,0,.4)] ring-offset-2 ring-offset-[var(--k-bg,#0E1110)] transition-transform duration-150 group-focus-visible:ring-2 group-focus-visible:ring-[var(--k-acc-text,#C6FF3D)] ${pulling ? "scale-y-110" : ""}`}
                style={{
                  left: HIT / 2 - TAPE_HOOK_W / 2,
                  top: tapeTop - 7,
                  width: TAPE_HOOK_W,
                  height: s.tape + 14,
                  boxShadow: pulling ? `0 0 0 3px ${accent}55, 0 2px 5px rgba(0,0,0,.4)` : undefined,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
