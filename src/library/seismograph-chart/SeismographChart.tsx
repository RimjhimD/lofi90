"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent } from "react";
import { clockTime, DEFAULT_LABELS, fill, nearestIndex, niceRange, plainNumber, smoothPath, textOn, type Reading, type SeismographLabels } from "./seismo";

export type { Reading, SeismographLabels } from "./seismo";
export type SeismographState = "live" | "paused" | "spike" | "empty" | "stale" | "loading";

export interface SeismographChartProps {
  /** Readings, oldest first. Controlled: the parent appends new ones. */
  points: Reading[];
  /** Chart name, e.g. "Signups per minute". */
  label: string;
  /** How much time fits on the paper at once. */
  windowMs?: number;
  /** How far back you can scrub while paused. Older readings are ignored (trim them in the parent too). */
  historyMs?: number;
  /** Fixed scale. Leave out for an automatic one that fits the visible readings. */
  min?: number;
  max?: number;
  /** Crossing above this marks a spike. */
  threshold?: number;
  unit?: string;
  formatValue?: (v: number) => string;
  formatTime?: (t: number) => string;
  /** Fires once per new upward crossing of threshold (not for readings already there when the chart mounts). */
  onSpike?: (point: Reading) => void;
  /** Controlled pause. Leave out to let the chart manage it. */
  paused?: boolean;
  defaultPaused?: boolean;
  onPausedChange?: (paused: boolean) => void;
  /** No reading for this long shows the stale state. */
  staleAfterMs?: number;
  /** How often the screen-reader summary is announced while live. 0 turns it off. */
  announceEveryMs?: number;
  /** Rows in the "Show as table" view. */
  tableRows?: number;
  loading?: boolean;
  labels?: Partial<SeismographLabels>;
  /** Ink colour of the line and pen. */
  accent?: string;
  /** Red ink for spikes and the alert line. */
  spikeColor?: string;
  size?: "sm" | "md" | "lg";
  /** Draw one state without running anything. */
  previewState?: SeismographState;
  className?: string;
}

const SIZES = {
  sm: { h: 150, title: "text-xs", value: "text-xl", pad: "p-3" },
  md: { h: 200, title: "text-sm", value: "text-2xl", pad: "p-4" },
  lg: { h: 260, title: "text-base", value: "text-3xl", pad: "p-5" },
};
const TOP = 18;
const BOTTOM = 12;
const DRUM = 26;
const ARM = 46;

type Freeze = { end: number; cursor: number; at: number };

/** Read only from event handlers and effects. */
const wallClock = () => Date.now();

const motionQuery = "(prefers-reduced-motion: reduce)";
const onMotionChange = (cb: () => void) => {
  const m = window.matchMedia(motionQuery);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

/**
 * A live streaming line chart drawn like a seismograph: a pen on the right writes onto paper that scrolls left.
 * Pause it to scrub back through history, crossings over the threshold get a red-ink mark, and a table view and
 * calm announcements keep it usable without seeing it.
 */
export function SeismographChart({
  points,
  label,
  windowMs = 60000,
  historyMs = 300000,
  min,
  max,
  threshold,
  unit = "",
  formatValue = plainNumber,
  formatTime = clockTime,
  onSpike,
  paused,
  defaultPaused = false,
  onPausedChange,
  staleAfterMs = 10000,
  announceEveryMs = 30000,
  tableRows = 10,
  loading = false,
  labels,
  accent = "#C6FF3D",
  spikeColor = "#FF5D5D",
  size = "md",
  previewState,
  className = "",
}: SeismographChartProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const sz = SIZES[size];
  const H = sz.h;
  const uid = useId();
  const reduced = useSyncExternalStore(onMotionChange, () => window.matchMedia(motionQuery).matches, () => false);
  const [W, setW] = useState(560);
  const [innerPaused, setInnerPaused] = useState(defaultPaused);
  const [freeze, setFreeze] = useState<Freeze | null>(null);
  const [clock, setClock] = useState(0);
  const [announce, setAnnounce] = useState("");
  const [table, setTable] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const paper = useRef<SVGGElement>(null);
  const grid = useRef<SVGPatternElement>(null);
  const tail = useRef<SVGLineElement>(null);
  const arm = useRef<SVGLineElement>(null);
  const tip = useRef<SVGCircleElement>(null);
  const drag = useRef<{ x: number; base: Freeze } | null>(null);
  const latest = useRef({ onSpike, summary: "" });

  // Only the last historyMs of readings matter.
  const hist = useMemo(() => {
    if (!points.length) return points;
    const from = points[points.length - 1].t - historyMs;
    const i = points.findIndex((p) => p.t >= from);
    return i > 0 ? points.slice(i) : points;
  }, [points, historyMs]);
  const has = hist.length > 0 && !loading;
  const last = hist[hist.length - 1];
  const lastT = last?.t ?? 0;

  const isPaused = previewState ? previewState === "paused" && has : has && (paused ?? innerPaused);
  const fz: Freeze | null = !isPaused
    ? null
    : previewState
      ? { end: lastT, at: lastT, cursor: hist[Math.floor(hist.length * 0.6)].t }
      : (freeze ?? { end: lastT, cursor: lastT, at: lastT });
  const end = fz ? fz.end : lastT;
  // Keep the frozen view in step with the pause, however it was set (button, keys, or the parent's paused prop):
  // take a snapshot when a pause starts without one, drop it the moment the chart is no longer paused.
  if (!previewState && isPaused && !freeze) setFreeze({ end: lastT, cursor: lastT, at: lastT });
  if (!previewState && !isPaused && freeze) setFreeze(null);

  const staleSecs = previewState === "stale" ? Math.round(staleAfterMs / 1000) + 2 : clock && has ? Math.round((clock - lastT) / 1000) : 0;
  const stale = has && !isPaused && (previewState === "stale" || (!previewState && clock > 0 && clock - lastT > staleAfterMs));

  // Geometry: the pen sits left of the drum; time runs right to left at k px per ms.
  const penX = W - DRUM - ARM;
  const k = penX / windowMs;
  const plotH = H - TOP - BOTTOM;
  const pivotY = TOP + plotH / 2;
  const inView = useMemo(() => hist.filter((p) => p.t >= end - windowMs && p.t <= end), [hist, end, windowMs]);
  const { lo, hi, ticks } = useMemo(() => niceRange(inView.map((p) => p.v), min, max, threshold), [inView, min, max, threshold]);
  const yOf = (v: number) => Math.min(TOP + plotH + 4, Math.max(TOP - 4, TOP + (1 - (v - lo) / (hi - lo)) * plotH));
  const target = stale || !has ? pivotY : yOf(last.v);

  const path = useMemo(() => {
    const y = (v: number) => Math.min(TOP + plotH + 4, Math.max(TOP - 4, TOP + (1 - (v - lo) / (hi - lo)) * plotH));
    return smoothPath(hist.map((p, i) => ({ x: (p.t - lastT) * k, y: y(p.v), gap: i > 0 && p.t - hist[i - 1].t > staleAfterMs })));
  }, [hist, lastT, k, lo, hi, plotH, staleAfterMs]);

  // A spike is a reading above the threshold right after one at or below it: one mark per crossing.
  const spikes = useMemo(() => (threshold == null ? [] : hist.filter((p, i) => i > 0 && p.v > threshold && hist[i - 1].v <= threshold)), [hist, threshold]);
  const lastSpike = spikes[spikes.length - 1];
  const spiking = previewState === "spike" || (!previewState && !isPaused && !stale && !!lastSpike && lastT - lastSpike.t < 3000);

  const unitV = (v: number) => `${formatValue(v)}${unit}`;
  const shown = fz && has ? hist[nearestIndex(hist, fz.cursor)] : last;
  const values = inView.map((p) => p.v);
  const summary = !has
    ? fill(text.emptySummary, { label })
    : fill(text.summary, {
        label,
        v: unitV(shown.v),
        low: unitV(Math.min(...values, shown.v)),
        high: unitV(Math.max(...values, shown.v)),
        n: spikes.filter((s) => s.t >= end - windowMs && s.t <= end).length,
      });
  const state: SeismographState = previewState ?? (loading ? "loading" : !has ? "empty" : isPaused ? "paused" : stale ? "stale" : spiking ? "spike" : "live");

  // Values the animation loop reads; it never causes a render.
  const geo = useRef({ penX, k, lastT, target, y: target, vel: 0, cellMs: windowMs / 12, kick: false, live: false });
  const fired = useRef<number | null>(null);

  useEffect(() => {
    latest.current = { onSpike, summary };
  });

  // Fit the paper to the box width.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // New crossings: fire onSpike once each and give the needle a hard swing. Readings present at mount are history, not news.
  // Seeded the first time real data is present, so history that arrives after a loading or empty start never fires.
  useEffect(() => {
    if (previewState || !has) return;
    if (fired.current === null) {
      fired.current = lastT;
      return;
    }
    for (const s of spikes) {
      if (s.t <= fired.current) continue;
      latest.current.onSpike?.(s);
      if (geo.current.live) geo.current.kick = true; // only a moving needle kicks; a paused or still one would kick much later
    }
    fired.current = Math.max(fired.current, lastT);
  }, [spikes, lastT, previewState, has]);

  // A one-second clock for the stale check.
  useEffect(() => {
    if (previewState || !has) return;
    const id = window.setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(id);
  }, [previewState, has]);

  // A calm summary every few seconds for screen readers, never every reading.
  useEffect(() => {
    if (previewState || !has || isPaused || !announceEveryMs) return;
    const id = window.setInterval(() => setAnnounce(latest.current.summary), announceEveryMs);
    return () => clearInterval(id);
  }, [previewState, has, isPaused, announceEveryMs]);

  /** Move the paper, grid, pen and needle to the given paper time. Direct DOM writes, so it can run every frame. */
  function paint(now: number) {
    const g = geo.current;
    const tx = g.penX - (now - g.lastT) * g.k;
    paper.current?.setAttribute("transform", `translate(${tx.toFixed(2)} 0)`);
    const cell = g.cellMs * g.k;
    const off = (((g.penX - (now % g.cellMs) * g.k) % cell) + cell) % cell;
    grid.current?.setAttribute("patternTransform", `translate(${off.toFixed(2)} 0)`);
    tail.current?.setAttribute("x2", ((now - g.lastT) * g.k).toFixed(2));
    tail.current?.setAttribute("y2", g.y.toFixed(2));
    arm.current?.setAttribute("y2", g.y.toFixed(2));
    tip.current?.setAttribute("cy", g.y.toFixed(2));
  }

  const animate = !previewState && has && !isPaused && !reduced;
  // Keep the loop's numbers current and repaint right after every render, before the browser draws.
  useLayoutEffect(() => {
    const g = geo.current;
    Object.assign(g, { penX, k, lastT, target, cellMs: windowMs / 12, live: animate && !stale });
    if (!animate) {
      g.kick = false;
      g.y = target;
      g.vel = 0;
      paint(fz ? fz.at : lastT);
      if (fz) paper.current?.setAttribute("transform", `translate(${(penX - (fz.end - lastT) * k).toFixed(2)} 0)`);
    } else paint(Math.max(Date.now(), lastT));
  });

  // The paper scrolls on requestAnimationFrame with real time, so motion is smooth between readings.
  // It stops while off screen or while the tab is hidden.
  useEffect(() => {
    const el = box.current;
    if (!animate || !el) return;
    let raf = 0;
    let onScreen = true;
    const step = () => {
      raf = 0;
      if (!onScreen || document.hidden) return;
      const g = geo.current;
      if (g.kick) {
        g.kick = false;
        g.vel -= plotH * 0.22; // the needle overshoots upward on a spike
      }
      const tremble = Math.sin(performance.now() / 90) * 0.5;
      g.vel = (g.vel + (g.target + tremble - g.y) * 0.14) * 0.8;
      g.y += g.vel;
      paint(Math.max(Date.now(), g.lastT));
      raf = requestAnimationFrame(step);
    };
    const wake = () => {
      if (!raf && onScreen && !document.hidden) raf = requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      wake();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", wake);
    wake();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", wake);
    };
  }, [animate, plotH]);

  // ----- pause, scrub, live -----
  const setPausedValue = (v: boolean) => {
    if (paused === undefined) setInnerPaused(v);
    onPausedChange?.(v);
  };
  /** The frozen view to work from, pausing first if needed. Event handlers only. */
  function frozen(cursor = lastT): Freeze {
    if (fz) return fz;
    const at = Math.max(wallClock(), lastT);
    setPausedValue(true);
    setAnnounce(fill(text.pausedAnnounce, { time: formatTime(lastT) }));
    return { end: at, cursor, at };
  }
  const clampEnd = (e: number, base: Freeze) => Math.min(base.at, Math.max(Math.min(base.at, hist[0].t + windowMs), e));
  /** Put the crosshair on a reading and scroll just enough to keep it on the paper. */
  function moveTo(t: number, base: Freeze) {
    let e = base.end;
    if (t > e) e = t;
    if (t < e - windowMs * 0.95) e = t + windowMs * 0.9;
    setFreeze({ ...base, end: clampEnd(e, base), cursor: t });
  }
  function goLive() {
    setFreeze(null);
    setPausedValue(false);
    setAnnounce(text.liveAnnounce);
  }
  const interactive = has && !previewState;

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    if (!interactive) return;
    if (e.key === " ") {
      e.preventDefault();
      if (fz) goLive();
      else setFreeze(frozen());
      return;
    }
    if (!fz && e.key !== "ArrowLeft") return;
    const i = nearestIndex(hist, fz ? fz.cursor : lastT);
    const jump = e.shiftKey ? 10 : 1;
    const to: Record<string, number> = { ArrowLeft: i - jump, ArrowRight: i + jump, Home: 0, End: hist.length - 1 };
    if (e.key === "Escape") return goLive();
    if (!(e.key in to)) return;
    e.preventDefault();
    moveTo(hist[Math.max(0, Math.min(hist.length - 1, to[e.key]))].t, frozen());
  }
  const localX = (e: PointerEvent) => {
    const r = svg.current?.getBoundingClientRect();
    return r && r.width ? ((e.clientX - r.left) * W) / r.width : 0;
  };
  /** The reading under paper x when the paper ends at endT. */
  const cursorAt = (x: number, endT: number) => hist[nearestIndex(hist, endT - (penX - Math.min(x, penX)) / k)].t;
  function onDown(e: PointerEvent<SVGSVGElement>) {
    if (!interactive || e.button !== 0) return;
    const base = frozen();
    const x = localX(e);
    drag.current = { x, base };
    e.currentTarget.setPointerCapture(e.pointerId);
    setFreeze({ ...base, cursor: cursorAt(x, base.end) });
  }
  function onMove(e: PointerEvent<SVGSVGElement>) {
    const d = drag.current;
    const base = d ? d.base : fz;
    if (!interactive || !base) return;
    const x = localX(e);
    const e2 = d ? clampEnd(d.base.end - (x - d.x) / k, d.base) : base.end;
    setFreeze({ ...base, end: e2, cursor: cursorAt(x, e2) });
  }
  const onUp = () => {
    drag.current = null;
  };

  // ----- drawing -----
  const frozenNow = fz ? fz.at : lastT;
  const tx = fz ? penX - (fz.end - lastT) * k : penX;
  const cursor = fz && has ? shown : null;
  const cx = cursor ? penX - (fz!.end - cursor.t) * k : 0;
  const rows = (fz ? hist.slice(0, nearestIndex(hist, fz.cursor) + 1) : hist).slice(-tableRows).reverse();
  const recentSpikes = spikes.slice(-4).reverse();
  const outline = { paintOrder: "stroke", stroke: "var(--k-panel,#121614)", strokeWidth: 4, strokeLinejoin: "round" } as const;
  const btn =
    "rounded-md border border-[var(--k-line,#3A433F)] bg-[var(--k-panel-2,#181D1B)] px-2.5 py-1 text-xs font-bold text-[var(--k-text,#E9EDE8)] transition-[transform,border-color,filter] hover:border-[var(--k-acc-text,#C6FF3D)] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[var(--k-line,#3A433F)]";
  const chip =
    state === "paused"
      ? ["text-[var(--k-text,#E9EDE8)]", text.pausedChip]
      : state === "stale"
        ? ["text-[var(--k-warn-text,#FFD08A)]", fill(text.stale, { s: staleSecs })]
        : state === "spike"
          ? ["text-[var(--k-err-text,#FF8F7E)]", text.spikeChip]
          : state === "live"
            ? ["text-[var(--k-acc-text,#C6FF3D)]", text.liveChip]
            : null;

  return (
    <figure
      aria-busy={state === "loading" || undefined}
      className={`w-full min-w-0 rounded-xl border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] text-[var(--k-text,#E9EDE8)] shadow-[0_10px_30px_-14px_var(--k-shadow,rgba(0,0,0,.9))] ${sz.pad} ${className}`}
    >
      <div className="mb-2 flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
        <figcaption className="min-w-0">
          <span className={`block font-bold uppercase tracking-wider text-[var(--k-mute,#8A938D)] ${sz.title}`}>{label}</span>
          <span className={`font-mono font-bold tabular-nums ${sz.value}`}>{has ? unitV(shown.v) : "—"}</span>
          {fz && has && <span className="ml-2 font-mono text-xs text-[var(--k-mute,#8A938D)]">{fill(text.at, { time: formatTime(shown.t) })}</span>}
        </figcaption>
        <div className="flex flex-wrap items-center gap-2">
          {chip && (
            <span className={`inline-flex items-center gap-1.5 font-mono text-xs font-bold ${chip[0]}`}>
              <span aria-hidden="true" className={`size-2 rounded-full bg-current ${state === "live" || state === "spike" ? "motion-safe:animate-pulse" : ""}`} />
              {chip[1]}
            </span>
          )}
          {fz ? (
            <button type="button" onClick={goLive} disabled={!interactive} style={{ background: accent, color: textOn(accent) }} className={`${btn} border-transparent`}>
              {text.live}
            </button>
          ) : (
            <button type="button" onClick={() => setFreeze(frozen())} disabled={!interactive} className={btn}>
              {text.pause}
            </button>
          )}
          <button type="button" aria-expanded={table} aria-controls={`${uid}-table`} onClick={() => setTable((v) => !v)} disabled={!has} className={btn}>
            {table ? text.hideTable : text.showTable}
          </button>
        </div>
      </div>

      <div
        ref={box}
        role="img"
        tabIndex={interactive ? 0 : -1}
        aria-label={summary}
        aria-describedby={`${uid}-hint`}
        onKeyDown={onKey}
        className="relative rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)]"
      >
        <svg
          ref={svg}
          aria-hidden="true"
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height={H}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className={`block touch-pan-y select-none overflow-hidden rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-bg,#0E1110)] ${interactive ? "cursor-grab active:cursor-grabbing" : ""}`}
        >
          <defs>
            <pattern ref={grid} id={`${uid}-grid`} width={(windowMs / 12) * k} height={H} patternUnits="userSpaceOnUse">
              <line x1="0.5" x2="0.5" y1="0" y2={H} stroke="var(--k-line,#3A433F)" strokeOpacity="0.55" />
            </pattern>
            <clipPath id={`${uid}-clip`}>
              <rect x="0" y="0" width={penX} height={H} />
            </clipPath>
          </defs>
          <rect x="0" y="0" width={W - DRUM} height={H} fill={`url(#${uid}-grid)`} />
          {has &&
            ticks.map((v) => (
            <g key={v}>
              <line x1="0" x2={W - DRUM} y1={yOf(v)} y2={yOf(v)} stroke="var(--k-line,#3A433F)" strokeOpacity="0.55" strokeDasharray="2 4" />
              <text x="5" y={yOf(v) - 3} fontSize="9" className="font-mono" style={{ ...outline, fill: "var(--k-mute,#8A938D)" }}>
                {formatValue(v)}
              </text>
            </g>
          ))}
          {threshold != null && has && (
            <g>
              <line x1="0" x2={penX} y1={yOf(threshold)} y2={yOf(threshold)} stroke={spikeColor} strokeOpacity="0.8" strokeDasharray="6 4" />
              <text x={10 + Math.max(...ticks.map((v) => formatValue(v).length)) * 5.5} y={yOf(threshold) - 4} fontSize="9" fontWeight="700" style={{ ...outline, fill: "var(--k-err-text,#FF8F7E)" }}>
                {fill(text.threshold, { v: formatValue(threshold) })}
              </text>
            </g>
          )}

          {has && (
            <g clipPath={`url(#${uid}-clip)`}>
              <g ref={paper} transform={`translate(${tx.toFixed(2)} 0)`}>
                <path d={path} fill="none" stroke="var(--k-text,#E9EDE8)" strokeOpacity="0.22" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d={path} fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                {!stale && <line ref={tail} x1="0" y1={yOf(last.v)} x2={(frozenNow - lastT) * k} y2={target} stroke={accent} strokeWidth="2.2" strokeLinecap="round" />}
                {spikes.map((s) => {
                  const x = (s.t - lastT) * k;
                  const left = x > -130; // near the pen: label goes left of the mark, otherwise right, so it never runs off an edge
                  return (
                    <g key={s.t}>
                      <line x1={x} x2={x} y1="0" y2="10" stroke={spikeColor} strokeWidth="3" />
                      <circle cx={x} cy={yOf(s.v)} r="3.5" fill={spikeColor} />
                      <text x={left ? x - 6 : x + 6} y={Math.max(TOP + 10, yOf(s.v) - 6)} textAnchor={left ? "end" : "start"} fontSize="10" fontWeight="700" style={{ ...outline, fill: "var(--k-err-text,#FF8F7E)" }}>
                        {fill(text.spike, { v: formatValue(s.v), time: formatTime(s.t) })}
                      </text>
                    </g>
                  );
                })}
              </g>
            </g>
          )}

          {cursor && (
            <g pointerEvents="none">
              <line x1={cx} x2={cx} y1="0" y2={H} stroke="var(--k-text,#E9EDE8)" strokeOpacity="0.6" strokeDasharray="3 3" />
              <circle cx={cx} cy={yOf(cursor.v)} r="4.5" fill="var(--k-panel,#121614)" stroke={accent} strokeWidth="2.5" />
              <text x={cx > penX / 2 ? cx - 7 : cx + 7} y={TOP - 4} textAnchor={cx > penX / 2 ? "end" : "start"} fontSize="11" fontWeight="700" className="font-mono" style={{ ...outline, fill: "var(--k-text,#E9EDE8)" }}>
                {fill(text.readout, { time: formatTime(cursor.t), v: unitV(cursor.v) })}
              </text>
            </g>
          )}

          {/* the recording drum and the pen arm */}
          <rect x={W - DRUM} y="0" width={DRUM} height={H} fill="var(--k-panel-2,#181D1B)" stroke="var(--k-line,#3A433F)" />
          {[0.2, 0.5, 0.8].map((f) => (
            <circle key={f} cx={W - DRUM / 2} cy={H * f} r="2" fill="var(--k-line,#3A433F)" />
          ))}
          {state !== "loading" && (
            <g>
              <line ref={arm} x1={W - DRUM / 2} y1={pivotY} x2={penX} y2={target} stroke="var(--k-mute,#8A938D)" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx={W - DRUM / 2} cy={pivotY} r="5" fill="var(--k-panel,#121614)" stroke="var(--k-mute,#8A938D)" strokeWidth="2" />
              <circle
                ref={tip}
                cx={penX}
                cy={target}
                r="4"
                fill={stale || !has ? "var(--k-panel,#121614)" : accent}
                stroke={spiking ? spikeColor : stale || !has ? "var(--k-mute,#8A938D)" : accent}
                strokeWidth={spiking ? 3 : 2}
                style={spiking ? { filter: `drop-shadow(0 0 6px ${spikeColor})` } : undefined}
              />
            </g>
          )}
        </svg>
        {(state === "empty" || state === "loading") && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 pr-16 text-center text-sm font-semibold text-[var(--k-mute,#8A938D)]">
            {state === "loading" && <span aria-hidden="true" className="inline-block size-3 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin" />}
            {state === "loading" ? text.loading : text.empty}
          </p>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p id={`${uid}-hint`} className="text-xs text-[var(--k-mute,#8A938D)]">
          {interactive ? (fz ? text.hintPaused : text.hintLive) : ""}
        </p>
        {recentSpikes.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={text.spikesTitle}>
            <span className="text-xs font-bold text-[var(--k-mute,#8A938D)]">{text.spikesTitle}</span>
            {recentSpikes.map((s) => (
              <button key={s.t} type="button" disabled={!interactive} onClick={() => moveTo(s.t, frozen(s.t))} className={`${btn.replace("text-[var(--k-text,#E9EDE8)]", "")} font-mono text-[var(--k-err-text,#FF8F7E)]`}>
                {fill(text.spike, { v: formatValue(s.v), time: formatTime(s.t) })}
              </button>
            ))}
          </div>
        )}
      </div>

      {table && has && (
        <div id={`${uid}-table`} className="mt-3 max-h-64 overflow-auto rounded-lg border border-[var(--k-line,#3A433F)]">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">{fill(text.tableCaption, { n: rows.length })}</caption>
            <thead className="bg-[var(--k-panel-2,#181D1B)] text-[var(--k-mute,#8A938D)]">
              <tr>
                <th scope="col" className="px-3 py-1.5">{text.colTime}</th>
                <th scope="col" className="px-3 py-1.5 text-right">{text.colValue}</th>
                <th scope="col" className="px-3 py-1.5">{text.colNote}</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums">
              {rows.map((r) => (
                <tr key={r.t} className="border-t border-[var(--k-line,#3A433F)]">
                  <td className="px-3 py-1">{formatTime(r.t)}</td>
                  <td className="px-3 py-1 text-right">{unitV(r.v)}</td>
                  <td className="px-3 py-1 text-[var(--k-err-text,#FF8F7E)]">
                    {spikes.some((s) => s.t === r.t) ? text.noteSpike : threshold != null && r.v > threshold ? text.noteHigh : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p role="status" aria-live="polite" className="sr-only">
        {announce}
      </p>
      <p role="status" aria-live="assertive" className="sr-only">
        {lastSpike && !previewState && lastSpike.t >= lastT - 15000 ? fill(text.spikeAnnounce, { v: unitV(lastSpike.v), time: formatTime(lastSpike.t) }) : ""}
      </p>
    </figure>
  );
}
