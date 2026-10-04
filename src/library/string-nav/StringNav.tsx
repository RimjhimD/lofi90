"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";

export interface StringNavItem {
  id: string;
  label: string;
  /**
   * Render a real link. Plain clicks still call onChange (route there yourself); Ctrl/Cmd-click opens normally.
   * If any item has an href the nav is a list of links (all tabbable, aria-current on the active one);
   * with no hrefs at all it is a tab list (arrow keys move between tabs).
   */
  href?: string;
  /** Shown dimmed; can't be focused, clicked or chosen with the keys. */
  disabled?: boolean;
}

export interface StringNavPreview {
  /** Freeze the string pulled: x is 0–1 along the string, y is the bend in px (negative = up). */
  pull?: { x: number; y: number };
  /** Freeze the string mid-ring, glowing, as if the active link was just plucked. */
  plucked?: boolean;
}

export interface StringNavProps {
  items: StringNavItem[];
  /** The id of the active item. */
  value: string;
  /** Called with the id of the item that was clicked (or chosen with Enter / Space). */
  onChange: (id: string) => void;
  /** Bead and glow colour. */
  accent?: string;
  /** How stiff the string is, 1–10: higher rings faster and dies sooner. */
  tension?: number;
  /** Pluck strength in px, 0–16. 0 turns the ring off. */
  wobble?: number;
  size?: "sm" | "md" | "lg";
  /** Accessible name of the nav landmark. */
  label?: string;
  /** Freeze one look without physics, for docs and tests. */
  preview?: StringNavPreview;
  className?: string;
}

type Size = NonNullable<StringNavProps["size"]>;

const SIZES: Record<Size, { text: string; pad: string; band: number; bead: number; sag: number; nudge: number }> = {
  sm: { text: "text-xs", pad: "px-1 py-1", band: 24, bead: 3.5, sag: 1, nudge: 2 },
  md: { text: "text-sm", pad: "px-1.5 py-1.5", band: 32, bead: 4.5, sag: 1.4, nudge: 3 },
  lg: { text: "text-base", pad: "px-2 py-2", band: 40, bead: 5.5, sag: 1.8, nudge: 4 },
};

/** Pegs sit this far in from each end; the string runs between them. */
const PEG = 5;
/** Harmonics summed for a pluck. */
const MODES = 4;
/** Extra invisible hit area under the string, so a pull is easy to start. */
const SLOP = 10;

interface Spring {
  x: number;
  v: number;
  t: number;
}
interface Pluck {
  t0: number;
  c: number[];
}

/** Animation clock (also the rAF timebase). */
const clock = () => performance.now();
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const gauss = (dx: number, s: number) => Math.exp(-(dx * dx) / (s * s));

/** A damped spring step (semi-implicit Euler, two substeps so stiff springs stay stable). */
function spring(s: Spring, k: number, zeta: number, dt: number) {
  const c = 2 * zeta * Math.sqrt(k);
  for (let i = 0; i < 2; i++) {
    s.v += (-k * (s.x - s.t) - c * s.v) * (dt / 2);
    s.x += s.v * (dt / 2);
  }
}
const settled = (s: Spring, eps = 0.05) => Math.abs(s.x - s.t) < eps && Math.abs(s.v) < eps * 4;

/**
 * Harmonic weights for a string plucked at u0 (0–1): mode n gets sin(nπ·u0)/n², like a real plucked string,
 * scaled so the strongest point of the shape is `amp` px.
 */
function pluckWeights(u0: number, amp: number) {
  const c = Array.from({ length: MODES }, (_, i) => Math.sin((i + 1) * Math.PI * u0) / ((i + 1) * (i + 1)));
  let peak = 0;
  for (let k = 1; k < 40; k++) {
    const u = k / 40;
    peak = Math.max(peak, Math.abs(c.reduce((sum, cn, i) => sum + cn * Math.sin((i + 1) * Math.PI * u), 0)));
  }
  return c.map((cn) => (peak ? (cn * amp) / peak : 0));
}

/** Ring speed and decay from tension: stiffer strings ring faster and stop sooner. */
const physics = (tension: number) => {
  const t = clamp(tension, 1, 10);
  return { w1: 2 * Math.PI * (2.5 + 0.55 * t), d1: 0.9 + 0.45 * t, k: t };
};

/**
 * Navigation links on a taut string. The string leans toward the pointer, clicking a link plucks it (a damped,
 * multi-harmonic ring), and a glowing bead rides the string over to the new link, bobbing as it vibrates.
 */
export function StringNav({
  items,
  value,
  onChange,
  accent = "#C6FF3D",
  tension = 5,
  wobble = 9,
  size = "md",
  label = "Main",
  preview,
  className = "",
}: StringNavProps) {
  const sz = SIZES[size];
  const gradId = `sn${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const wrap = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const links = useRef<(HTMLElement | null)[]>([]);
  const path = useRef<SVGPathElement>(null);
  const glow = useRef<SVGPathElement>(null);
  const bead = useRef<SVGGElement>(null);
  const [geo, setGeo] = useState<{ w: number; centers: number[] }>({ w: 0, centers: [] });
  const [focusIdx, setFocusIdx] = useState<number | null>(null);
  /** True when the links are wider than the nav, so the row (string and all) scrolls sideways. */
  const [scrolls, setScrolls] = useState(false);
  const activeIdx = Math.max(0, items.findIndex((i) => i.id === value));
  const ids = items.map((i) => i.id).join("|");
  /** No hrefs at all: buttons that switch a view, so it's a tab list with roving focus. Otherwise a list of links. */
  const tabs = !items.some((i) => i.href);

  // Everything the animation loop needs lives in refs, so frames never re-render React.
  const sim = useRef({
    bead: { x: 0, v: 0, t: 0 } as Spring,
    pull: { x: 0, v: 0, t: 0 } as Spring,
    pullU: 0.5,
    pullUT: 0.5,
    nudge: { x: 0, v: 0, t: 0 } as Spring,
    nudgeX: 0,
    nudgeXT: 0,
    plucks: [] as Pluck[],
    raf: 0,
    last: 0,
    geo: null as null | { w: number; centers: number[] },
  });
  const opts = useRef({ tension, wobble, size, preview, activeIdx });
  // layout effect, declared first, so the redraw below already sees this render's props
  useLayoutEffect(() => {
    opts.current = { tension, wobble, size, preview, activeIdx };
  });

  // Measure the nav width and each link's centre (layout px, so a zoomed preview still lines up).
  useEffect(() => {
    const root = wrap.current;
    if (!root) return;
    const measure = () => {
      const w = root.offsetWidth;
      const centers = links.current.slice(0, ids.split("|").length).map((el) => (el ? el.offsetLeft + el.offsetWidth / 2 : 0));
      setGeo((g) => (g.w === w && g.centers.length === centers.length && g.centers.every((c, i) => Math.abs(c - centers[i]) < 0.5) ? g : { w, centers }));
      // compare with the nav itself: the scroller grows a little padding once it scrolls
      const navW = scroller.current?.parentElement?.clientWidth;
      if (navW) setScrolls(w > navW + 0.5);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    if (scroller.current) ro.observe(scroller.current);
    links.current.forEach((el) => el && ro.observe(el));
    return () => ro.disconnect();
  }, [ids]);

  /** Draw the string, its glow and the bead for the current physics state. */
  function draw(now: number) {
    const s = sim.current;
    const g = s.geo;
    const p = path.current;
    if (!g || !g.w || !p) return;
    const o = opts.current;
    const z = SIZES[o.size];
    const mid = z.band / 2;
    const maxD = mid - 2;
    const L = PEG;
    const span = g.w - PEG * 2;
    const pv = o.preview;
    const { w1, d1 } = physics(o.tension);
    const pullA = pv?.pull ? pv.pull.y : s.pull.x;
    const pullU = clamp(pv?.pull ? pv.pull.x : s.pullU, 0.06, 0.94);
    const frozen = !!pv?.plucked;
    const rings: Pluck[] = frozen ? [{ t0: 0, c: pluckWeights((g.centers[o.activeIdx] - L) / span, Math.max(4, o.wobble) * 0.8) }] : s.plucks;
    const beadX = clamp(pv ? (g.centers[o.activeIdx] ?? g.w / 2) : s.bead.x, L, L + span);

    const yAt = (x: number) => {
      const u = (x - L) / span;
      if (u <= 0 || u >= 1) return 0;
      let d = 0;
      if (pullA) {
        // a soft tent: straight to the pulled point, rounded at the tip
        const f = u < pullU ? u / pullU : (1 - u) / (1 - pullU);
        d += pullA * (1 - (1 - f) * (1 - f));
      }
      for (const pl of rings) {
        const age = (now - pl.t0) / 1000;
        for (let n = 1; n <= MODES; n++) {
          const c = pl.c[n - 1];
          if (!c) continue;
          const t = frozen ? Math.sin((n * Math.PI) / 2) : Math.sin(n * w1 * age) * Math.exp(-d1 * (1 + 0.5 * (n - 1)) * age);
          d += c * Math.sin(n * Math.PI * u) * t;
        }
      }
      const taper = Math.min(1, u * 10, (1 - u) * 10);
      d += taper * (s.nudge.x * gauss(x - s.nudgeX, 22) + z.sag * gauss(x - beadX, 28));
      // soft limit: big pulls flatten out instead of crossing into the links
      return maxD * Math.tanh(d / maxD);
    };

    const N = clamp(Math.round(span / 8), 24, 96);
    const pts: [number, number][] = [];
    for (let k = 0; k <= N; k++) {
      const x = L + (span * k) / N;
      pts.push([x, mid + yAt(x)]);
    }
    const f = (n: number) => n.toFixed(2);
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let k = 1; k < N; k++) d += ` Q${f(pts[k][0])} ${f(pts[k][1])} ${f((pts[k][0] + pts[k + 1][0]) / 2)} ${f((pts[k][1] + pts[k + 1][1]) / 2)}`;
    d += ` L${f(pts[N][0])} ${f(pts[N][1])}`;
    p.setAttribute("d", d);

    // the string glows while it rings (and a little while it's pulled)
    let energy = frozen ? 1 : 0;
    for (const pl of s.plucks) energy += (Math.abs(pl.c[0]) * Math.exp(-d1 * ((now - pl.t0) / 1000))) / Math.max(4, o.wobble);
    energy += (Math.abs(pullA) / maxD) * 0.35;
    if (glow.current) {
      glow.current.setAttribute("d", d);
      glow.current.setAttribute("opacity", clamp(energy * 0.8, 0, 0.8).toFixed(3));
    }

    // the bead rides the string, and stretches a little in the direction it's travelling
    const stretch = pv ? 1 : 1 + Math.min(0.35, Math.abs(s.bead.v) / 2000);
    bead.current?.setAttribute("transform", `translate(${f(beadX)} ${f(mid + yAt(beadX))}) scale(${f(stretch)} ${f(1 / stretch)})`);
  }

  function step(now: number) {
    const s = sim.current;
    const o = opts.current;
    const dt = clamp((now - s.last) / 1000, 0, 0.033);
    s.last = now;
    const { k: T, d1 } = physics(o.tension);
    spring(s.bead, 140 + 22 * T, 0.55, dt);
    spring(s.pull, 180 + 30 * T, 0.4, dt);
    spring(s.nudge, 320, 0.45, dt);
    s.pullU += (s.pullUT - s.pullU) * Math.min(1, dt * 18);
    s.nudgeX += (s.nudgeXT - s.nudgeX) * Math.min(1, dt * 14);
    s.plucks = s.plucks.filter((pl) => Math.abs(pl.c[0]) * Math.exp(-d1 * ((now - pl.t0) / 1000)) > 0.06);
    draw(now);
    const moving = !settled(s.bead, 0.1) || !settled(s.pull) || !settled(s.nudge) || s.plucks.length > 0 || Math.abs(s.pullU - s.pullUT) > 0.002;
    s.raf = moving ? requestAnimationFrame(step) : 0;
  }

  function kick() {
    const s = sim.current;
    if (s.raf || opts.current.preview) return;
    s.last = clock();
    s.raf = requestAnimationFrame(step);
  }

  useEffect(() => () => cancelAnimationFrame(sim.current.raf), []);

  // New size: snap everything into place. New active item: the bead slides there on its spring.
  useLayoutEffect(() => {
    if (!geo.w) return;
    const s = sim.current;
    const target = geo.centers[activeIdx] ?? geo.w / 2;
    s.bead.t = target;
    if (s.geo !== geo || reduced() || preview) {
      s.geo = geo;
      s.bead.x = target;
      s.bead.v = 0;
    } else kick();
    // kick reads only refs; re-running on its identity would restart nothing useful
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo, activeIdx, preview]);

  // In a scrolling row, keep the active link in view.
  useEffect(() => {
    const box = scroller.current;
    const el = links.current[activeIdx];
    if (!scrolls || !box || !el) return;
    const left = el.offsetLeft;
    if (left < box.scrollLeft || left + el.offsetWidth > box.scrollLeft + box.clientWidth)
      box.scrollTo({ left: left - (box.clientWidth - el.offsetWidth) / 2, behavior: reduced() ? "auto" : "smooth" });
  }, [activeIdx, scrolls]);

  // Redraw after every render (size, preview or colour may have changed); cheap, and frames do the rest.
  useLayoutEffect(() => {
    draw(clock());
  });

  function pluck(i: number) {
    const s = sim.current;
    const g = s.geo;
    if (!g || !g.w || reduced() || preview || wobble <= 0) return;
    const u0 = clamp((g.centers[i] - PEG) / (g.w - PEG * 2), 0.04, 0.96);
    s.plucks = [...s.plucks.slice(-2), { t0: clock(), c: pluckWeights(u0, -wobble) }];
    kick();
  }

  function activate(i: number) {
    if (items[i].disabled) return;
    pluck(i);
    if (items[i].id !== value) onChange(items[i].id);
  }

  function onBandMove(e: PointerEvent<HTMLDivElement>) {
    if (preview || reduced()) return;
    const s = sim.current;
    const g = s.geo;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    if (!g || !r.width || !r.height) return;
    // layout px, so a scaled-down preview still bends exactly under the pointer
    const lx = (e.clientX - r.left) * (el.offsetWidth / r.width);
    const ly = (e.clientY - r.top) * (el.offsetHeight / r.height);
    const maxD = sz.band / 2 - 2;
    s.pullUT = clamp((lx - PEG) / (g.w - PEG * 2), 0.06, 0.94);
    if (Math.abs(s.pull.x) < 0.5) s.pullU = s.pullUT;
    s.pull.t = clamp(ly - sz.band / 2, -maxD, maxD);
    kick();
  }

  function onBandLeave() {
    sim.current.pull.t = 0;
    kick();
  }

  function hover(i: number | null) {
    if (preview || reduced() || (i !== null && items[i].disabled)) return;
    const s = sim.current;
    if (i === null) s.nudge.t = 0;
    else {
      s.nudgeXT = s.geo?.centers[i] ?? 0;
      if (Math.abs(s.nudge.x) < 0.3) s.nudgeX = s.nudgeXT;
      s.nudge.t = -sz.nudge;
    }
    kick();
  }

  /** The nearest enabled item from `from`, walking by `dir` (wraps round). */
  function nearest(from: number, dir: 1 | -1) {
    const n = items.length;
    for (let k = 0; k < n; k++) {
      const j = (((from + dir * k) % n) + n) % n;
      if (!items[j].disabled) return j;
    }
    return -1;
  }

  /** Tab list only: arrows, Home and End move focus; Enter / Space (native on buttons) chooses. Links keep plain Tab order. */
  function onKey(e: KeyboardEvent<HTMLElement>, i: number) {
    if (!tabs) return;
    const n = items.length;
    let next = -1;
    if (e.key === "ArrowRight") next = nearest(i + 1, 1);
    else if (e.key === "ArrowLeft") next = nearest(i - 1 + n, -1);
    else if (e.key === "Home") next = nearest(0, 1);
    else if (e.key === "End") next = nearest(n - 1, -1);
    if (next < 0) return;
    e.preventDefault();
    setFocusIdx(next);
    links.current[next]?.focus();
  }

  function onLinkClick(e: MouseEvent<HTMLElement>, i: number) {
    if (items[i].disabled) {
      e.preventDefault();
      return;
    }
    if (items[i].href) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
    }
    activate(i);
  }

  // roving focus (tab list only): the focused tab, else the active one, else the first that isn't disabled
  const rove = focusIdx ?? (items[activeIdx]?.disabled ? nearest(activeIdx, 1) : activeIdx);
  const linkClass = `block w-full whitespace-nowrap rounded-md text-center font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)] ${sz.pad} ${sz.text}`;

  return (
    <nav aria-label={label} className={`w-full ${className}`}>
      {/* Columns are equal and never narrower than the widest label; when that's wider than the nav, the row scrolls
          sideways (string included) instead of the labels running into each other. The bottom slop lives inside it,
          and a little padding keeps focus outlines from being clipped. */}
      <div
        ref={scroller}
        className={scrolls ? "-mx-1 -mt-1 overflow-x-auto overflow-y-hidden overscroll-x-contain px-1 pt-1 [scrollbar-width:thin]" : ""}
        style={{ marginBottom: -SLOP }}
      >
        <div ref={wrap} className="relative w-max min-w-full">
          <ul
            role={tabs ? "tablist" : undefined}
            className="grid"
            style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
            onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setFocusIdx(null)}
          >
            {items.map((it, i) => {
              const active = i === activeIdx;
              const off = !!it.disabled;
              const common = {
                ref: (el: HTMLElement | null) => {
                  links.current[i] = el;
                },
                "data-item": it.id,
                tabIndex: off ? -1 : tabs ? (i === rove ? 0 : -1) : 0,
                "aria-disabled": off || undefined,
                onFocus: () => setFocusIdx(i),
                onKeyDown: (e: KeyboardEvent<HTMLElement>) => onKey(e, i),
                onPointerEnter: () => hover(i),
                onPointerLeave: () => hover(null),
                onClick: (e: MouseEvent<HTMLElement>) => onLinkClick(e, i),
                className: `${linkClass} ${
                  off
                    ? "cursor-not-allowed text-[var(--k-mute,#8A938D)] opacity-40"
                    : active
                      ? "text-[var(--k-text,#E9EDE8)]"
                      : "text-[var(--k-mute,#8A938D)] hover:text-[var(--k-text,#E9EDE8)]"
                }`,
              };
              return (
                <li key={it.id} role={tabs ? "presentation" : undefined} className="min-w-0">
                  {it.href ? (
                    // a disabled link drops its href, so it can't be followed or focused
                    <a href={off ? undefined : it.href} role={off ? "link" : undefined} aria-current={active ? "page" : undefined} {...common}>
                      {it.label}
                    </a>
                  ) : tabs ? (
                    <button type="button" role="tab" aria-selected={active} disabled={off} {...common}>
                      {it.label}
                    </button>
                  ) : (
                    <button type="button" aria-current={active ? "page" : undefined} disabled={off} {...common}>
                      {it.label}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          {/* the string: a pointer near it pulls it; the extra bottom slop makes the pull easy to catch */}
          <div
            aria-hidden="true"
            className="relative"
            style={{ height: sz.band + SLOP }}
            onPointerMove={onBandMove}
            onPointerLeave={onBandLeave}
          >
            {geo.w > 0 && (
              <svg width={geo.w} height={sz.band} viewBox={`0 0 ${geo.w} ${sz.band}`} className="pointer-events-none absolute left-0 top-0 overflow-visible">
                <defs>
                  {/* sheen: brighter in the middle of the span, like light along a wire */}
                  <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1={PEG} y1="0" x2={geo.w - PEG} y2="0">
                    <stop offset="0" style={{ stopColor: "var(--k-text,#E9EDE8)", stopOpacity: 0.45 }} />
                    <stop offset="0.5" style={{ stopColor: "var(--k-text,#E9EDE8)", stopOpacity: 0.95 }} />
                    <stop offset="1" style={{ stopColor: "var(--k-text,#E9EDE8)", stopOpacity: 0.45 }} />
                  </linearGradient>
                </defs>
                <path ref={glow} fill="none" stroke={accent} strokeWidth={3.5} strokeLinecap="round" opacity={0} style={{ filter: "blur(2.5px)" }} />
                <path ref={path} fill="none" stroke={`url(#${gradId})`} strokeWidth={size === "lg" ? 1.8 : 1.5} strokeLinecap="round" />
                {[PEG, geo.w - PEG].map((x) => (
                  <circle key={x} cx={x} cy={sz.band / 2} r={size === "sm" ? 2.5 : 3} strokeWidth={1.2} style={{ fill: "var(--k-panel-2,#181D1B)", stroke: "var(--k-mute,#8A938D)" }} />
                ))}
                <g ref={bead}>
                  <circle r={sz.bead * 2.4} fill={accent} opacity={0.28} style={{ filter: "blur(3px)" }} />
                  <circle r={sz.bead} fill={accent} stroke="rgba(0,0,0,.25)" strokeWidth={0.75} />
                  <circle cx={-sz.bead * 0.3} cy={-sz.bead * 0.35} r={sz.bead * 0.35} fill="#fff" opacity={0.7} />
                </g>
              </svg>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
