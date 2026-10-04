"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export type CoverPattern = "sun" | "bands" | "rings" | "split" | "grid" | "wave";

export interface VinylRecord {
  id: string;
  title: string;
  artist: string;
  year?: number | string;
  /** The two cover colours. The label in the middle of the disc uses them too. */
  colors: [string, string];
  /** Cover art style. Picked from the id when not set, so neighbouring sleeves look different. */
  pattern?: CoverPattern;
}

/** Every piece of text the carousel shows or announces. Templates are functions so word order can change. */
export interface VinylLabels {
  prev: string;
  next: string;
  play: string;
  putBack: string;
  /** The tag under the crate while a record plays. */
  nowPlaying: (rpm: number) => string;
  /** Printed on the disc label. */
  discRpm: (rpm: number) => string;
  help: string;
  helpPlaying: string;
  /** Accessible name of the clickable crate. */
  crate: (record: VinylRecord) => string;
  cratePlaying: (record: VinylRecord) => string;
  /** Accessible name of each sleeve; position is 1-based. */
  slide: (record: VinylRecord, position: number, total: number) => string;
  /** Live announcement after a flip; position is 1-based. */
  status: (record: VinylRecord, position: number, total: number) => string;
  statusPlaying: (record: VinylRecord, rpm: number) => string;
}

export interface VinylCrateCarouselProps {
  records: VinylRecord[];
  /** Accessible name for the whole carousel, e.g. "Staff picks". */
  label?: string;
  /** Override any text; the rest stays English. */
  labels?: Partial<VinylLabels>;
  /** Shown in place of the crate when records is empty. */
  emptyLabel?: string;
  /** Controlled: which record is at the front. Pair it with onChange. */
  index?: number;
  /** Uncontrolled: which record is at the front first. */
  initialIndex?: number;
  /** Called whenever the front record changes. */
  onChange?: (index: number) => void;
  /** Called when the front record is pulled out and starts spinning. */
  onPlay?: (record: VinylRecord) => void;
  /** Called when the playing record is put back in the crate. */
  onPutBack?: (record: VinylRecord) => void;
  /** Glow behind the playing disc, the Play button and the focus ring. */
  accent?: string;
  /** How fast the disc spins once it's out. */
  rpm?: 33 | 45;
  /** How long one flip takes, in ms. Pulling a record out takes a little longer. */
  flipMs?: number;
  size?: "sm" | "md" | "lg";
  /** Freeze one look without any input, for docs and tests. */
  preview?: { index: number; pulled?: boolean };
  className?: string;
}

/** Cover size in px for each size; it also shrinks to fit narrow screens. */
const COVER = { sm: 150, md: 184, lg: 220 };
/** How many sleeves stand visibly in the crate, front one included. */
const SHOWN = 6;
const PATTERNS: CoverPattern[] = ["sun", "bands", "rings", "split", "grid", "wave"];

const DEFAULT_LABELS: VinylLabels = {
  prev: "Previous record",
  next: "Next record",
  play: "Play",
  putBack: "Put back",
  nowPlaying: (rpm) => `Now playing · ${rpm} rpm`,
  discRpm: (rpm) => `${rpm} rpm`,
  help: "Scroll, drag or ← → to flip · click the record to play",
  helpPlaying: "Esc or Put back returns it to the crate",
  crate: (r) => `Record crate. ${r.title} by ${r.artist} is at the front.`,
  cratePlaying: (r) => `Playing ${r.title}. Press Escape to put it back.`,
  slide: (r, i, total) => `${i} of ${total}: ${r.title} — ${r.artist}`,
  status: (r, i, total) => `${i} of ${total}: ${r.title} — ${r.artist}`,
  statusPlaying: (r, rpm) => `Now playing “${r.title}” by ${r.artist}, ${rpm} rpm.`,
};

/** A length in "cover sizes": everything in the scene scales with --s. */
const u = (k: number) => `calc(var(--s) * ${k})`;
const mix = (a: string, b: string, p: number) => `color-mix(in srgb, ${a} ${p}%, ${b})`;

function patternOf(r: VinylRecord) {
  if (r.pattern) return r.pattern;
  let h = 0;
  for (const ch of r.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PATTERNS[h % PATTERNS.length];
}

/** Generated cover art: CSS gradients only, no images. */
function coverArt(r: VinylRecord): string {
  const [a, b] = r.colors;
  switch (patternOf(r)) {
    case "sun":
      return `radial-gradient(circle at 50% 62%, ${b} 0 20%, transparent 20.5%), repeating-linear-gradient(to bottom, transparent 0 66%, ${mix(b, "transparent", 45)} 66% 68%, transparent 68% 73%), linear-gradient(170deg, ${a}, ${mix(a, "black", 60)})`;
    case "bands":
      return `linear-gradient(135deg, ${a} 0 34%, ${b} 34% 48%, ${a} 48% 58%, ${b} 58% 64%, ${mix(a, "black", 70)} 64%)`;
    case "rings":
      return `repeating-radial-gradient(circle at 72% 30%, ${b} 0 5%, ${a} 5% 11%)`;
    case "split":
      return `radial-gradient(circle at 50% 50%, ${mix(a, b, 50)} 0 22%, transparent 22.5%), linear-gradient(to right, ${a} 50%, ${b} 50%)`;
    case "grid":
      return `repeating-conic-gradient(${a} 0 25%, ${b} 0 50%) 0 0 / 25% 25%`;
    case "wave":
      return `radial-gradient(ellipse at 50% 118%, ${b} 0 38%, transparent 38.5%), radial-gradient(ellipse at 50% 118%, ${mix(a, b, 50)} 0 56%, transparent 56.5%), ${a}`;
  }
}

/** Dark text on light colours, white on dark ones, so any accent stays readable. */
function textOn(hex: string): string {
  let h = hex.trim().replace(/^#/, "");
  // #abc and #abcd are short for #aabbcc
  if (h.length === 3 || h.length === 4) h = [...h.slice(0, 3)].map((c) => c + c).join("");
  const n = h.length >= 6 ? parseInt(h.slice(0, 6), 16) : NaN;
  if (Number.isNaN(n)) return "#0B0D0C";
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.25 ? "#0B0D0C" : "#FFFFFF";
}

/** Text style for a sleeve corner: picks ink for the cover colour under it, with a halo for busy patterns. */
function inkOn(r: VinylRecord, spot: "top" | "bottom"): CSSProperties {
  const [a, b] = r.colors;
  const p = patternOf(r);
  // the colour each pattern paints in the top-left and bottom-left corners
  const bg = (p === "grid" && spot === "top") || (p === "wave" && spot === "bottom") ? b : a;
  const color = textOn(bg);
  const halo = color === "#FFFFFF" ? "0 1px 2px rgba(0,0,0,.6)" : "0 0 3px rgba(255,255,255,.55)";
  return { color, textShadow: halo };
}

const MOTION = "(prefers-reduced-motion: reduce)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(MOTION);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useReducedMotion = () => useSyncExternalStore(subscribe, () => window.matchMedia(MOTION).matches, () => false);

// The crate's wood is a fixed colour: it's an object in the scene, like the black vinyl.
const WOOD = "linear-gradient(to bottom, #5A4130, #3A2A1F)";
const SLATS = "repeating-linear-gradient(to bottom, transparent 0 31%, rgba(0,0,0,.45) 31% 33.5%)";
const GRAIN = "repeating-linear-gradient(90deg, rgba(255,255,255,.035) 0 2px, transparent 2px 9px)";

// Crate geometry, in cover sizes. z grows toward the viewer.
const FRONT_Z = 0.34;
const BACK_Z = -0.5;
const LIP_H = 0.3;
const BACK_H = 0.6;
const WIDTH = 1.16;
const FIRST_Z = 0.2;
const GAP = 0.1;
/** How far a flipped sleeve tips toward the viewer, in degrees. */
const TIP = -54;
/** Where a pulled-out record goes: up out of the crate and toward the viewer. */
const LIFT = `0 ${u(-0.12)} ${u(0.42)}`;

/**
 * Albums standing in a record crate. Flip with the buttons, the wheel, a vertical drag or the arrow keys:
 * the front sleeve tips forward to show the one behind. Pull the front record out and the sleeve slides
 * left while the disc slides right and spins.
 */
export function VinylCrateCarousel({
  records,
  label = "Records",
  labels,
  emptyLabel = "No records in the crate yet.",
  index,
  initialIndex = 0,
  onChange,
  onPlay,
  onPutBack,
  accent = "#C6FF3D",
  rpm = 33,
  flipMs = 450,
  size = "md",
  preview,
  className = "",
}: VinylCrateCarouselProps) {
  const id = useId();
  const n = records.length;
  const clamp = (i: number) => Math.min(Math.max(0, i), Math.max(0, n - 1));
  const [own, setOwn] = useState(() => clamp(initialIndex));
  const [pulledOwn, setPulledOwn] = useState(false);
  const [motion, setMotion] = useState<"flip" | "pull">("flip");
  const [hover, setHover] = useState(false);
  const reduced = useReducedMotion();
  const area = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const text = { ...DEFAULT_LABELS, ...labels };
  const wasDragged = useRef(false);

  const cur = clamp(preview?.index ?? index ?? own);
  const pulled = preview ? !!preview.pulled : pulledOwn;
  const record = records[cur];
  const pullMs = Math.round(flipMs * 1.6);

  function go(next: number) {
    if (preview || pulled) return;
    const i = clamp(next);
    if (i === cur) return;
    setMotion("flip");
    if (index === undefined) setOwn(i);
    onChange?.(i);
  }
  function pull() {
    if (preview || pulled || !record) return;
    setMotion("pull");
    setPulledOwn(true);
    onPlay?.(record);
  }
  function putBack() {
    if (preview || !pulled || !record) return;
    setMotion("pull");
    setPulledOwn(false);
    onPutBack?.(record);
  }

  // The wheel listener is native so it can stop the page scrolling while it flips; it reads the latest values.
  const latest = useRef({ cur, n, pulled, flipMs, go });
  useEffect(() => {
    latest.current = { cur, n, pulled, flipMs, go };
  });
  const empty = n === 0;
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    let acc = 0;
    let last = 0;
    const onWheel = (e: WheelEvent) => {
      const a = latest.current;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const dir = Math.sign(delta);
      // At either end (or while playing) let the page scroll as normal.
      if (a.pulled || !dir || (dir > 0 && a.cur >= a.n - 1) || (dir < 0 && a.cur <= 0)) return;
      e.preventDefault();
      acc += delta;
      const now = performance.now();
      if (Math.abs(acc) > 40 && now - last > a.flipMs * 0.45) {
        a.go(a.cur + dir);
        acc = 0;
        last = now;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // re-attach when the crate appears after being empty
  }, [empty]);

  if (!record)
    return (
      <section aria-label={label} className={`mx-auto w-full max-w-[40rem] ${className}`}>
        <p className="rounded-2xl border border-dashed border-[var(--k-line,#3A433F)] px-4 py-8 text-center text-sm text-[var(--k-mute,#8A938D)]">{emptyLabel}</p>
      </section>
    );

  const ease = "cubic-bezier(.3,1.25,.5,1)";
  const soft = "cubic-bezier(.22,.8,.25,1)";
  const dim = pulled ? "brightness(.32) saturate(.6)" : "none";
  const crateFade = `filter ${pullMs}ms ${soft}`;

  /** Where one sleeve sits: standing in the crate, tipped forward over the lip, or pulled out. */
  function sleeveStyle(i: number): CSSProperties {
    const d = i - cur;
    const isPulled = pulled && d === 0;
    const back = Math.min(d, SHOWN);
    const wobble = (((i * 37) % 5) - 2) * 0.5;
    let transform: string;
    let opacity = 1;
    let shade = 0;
    // every pose uses the same list of functions so the browser animates between them smoothly
    const pose = (x: number, z: number, y: number, rz: number, ry: number, rx: number) =>
      `translateX(${u(x)}) translateZ(${u(z)}) translateY(${u(y)}) rotateZ(${rz}deg) rotateY(${ry}deg) rotateX(${rx}deg)`;
    if (isPulled) {
      transform = pose(-0.5, FIRST_Z, 0, 0, 6, 0);
    } else if (d < 0) {
      // tipped forward toward the viewer, leaning on the front lip; only the last one flipped stays in view
      transform = pose(0, FRONT_Z - 0.02, -LIP_H, 0, 0, d === -1 ? TIP : TIP - 8);
      opacity = reduced || d < -1 ? 0 : 1;
      shade = 0.5;
    } else {
      const lift = d === 0 && hover && !pulled ? -0.05 : 0;
      transform = pose(0, FIRST_Z - back * GAP, lift, d === 0 ? 0 : wobble, 0, 4);
      opacity = d >= SHOWN ? 0 : 1;
      shade = d === 0 ? 0 : 0.12 + d * 0.09;
    }
    // Paint order: a falling sleeve goes over the lip once it has tipped past it, a rising one drops behind it at the end.
    const z = isPulled ? 60 : d < 0 ? 40 + d : 20 - back;
    const zDelay = motion === "pull" ? (pulled ? pullMs * 0.15 : pullMs * 0.92) : d < 0 ? flipMs * 0.2 : flipMs * 0.62;
    const t = reduced
      ? "opacity 220ms ease"
      : [
          // flips move `transform`; pulling out lifts with `translate` first, then slides with `transform`
          `transform ${motion === "pull" ? pullMs * 0.62 : flipMs}ms ${motion === "pull" ? soft : ease} ${motion === "pull" && pulled ? pullMs * 0.38 : 0}ms`,
          `translate ${pullMs * 0.5}ms ${soft} ${pulled ? 0 : pullMs * 0.45}ms`,
          `opacity ${flipMs * 0.6}ms ease`,
          `filter ${pullMs}ms ${soft}`,
          `z-index 0s linear ${zDelay}ms`,
        ].join(", ");
    return {
      width: u(1),
      height: u(1),
      marginLeft: u(-0.5),
      transform,
      translate: isPulled ? LIFT : "0 0 0",
      opacity,
      zIndex: z,
      filter: isPulled ? "none" : dim,
      transition: t,
      ["--shade" as string]: shade,
    };
  }

  const discOut = pulled;
  const discStyle: CSSProperties = {
    width: u(0.92),
    height: u(0.92),
    marginLeft: u(-0.46),
    bottom: `calc(var(--floor) + ${u(0.04)})`,
    zIndex: 55,
    transform: `translateX(${discOut ? u(0.5) : "0px"}) translateZ(${u(FIRST_Z - 0.01)})`,
    translate: discOut ? LIFT : "0 0 0",
    opacity: discOut ? 1 : 0,
    transition: reduced
      ? "opacity 220ms ease"
      : [
          `transform ${pullMs * 0.62}ms ${soft} ${discOut ? pullMs * 0.38 : 0}ms`,
          `translate ${pullMs * 0.5}ms ${soft} ${discOut ? 0 : pullMs * 0.45}ms`,
          `opacity 120ms linear ${discOut ? pullMs * 0.36 : pullMs * 0.5}ms`,
        ].join(", "),
  };
  const spinDelay = pullMs + 260;
  const status = pulled ? text.statusPlaying(record, rpm) : text.status(record, cur + 1, n);
  const btn =
    "grid h-10 w-10 place-items-center rounded-full border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] text-lg font-bold text-[var(--k-text,#E9EDE8)] shadow-[0_10px_30px_-14px_var(--k-shadow,rgba(0,0,0,.9))] transition-colors hover:border-[var(--accent)] disabled:opacity-35 disabled:hover:border-[var(--k-line,#3A433F)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)]";

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      onKeyDown={(e) => {
        if (preview) return;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") go(cur + 1);
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") go(cur - 1);
        else if (e.key === "Home") go(0);
        else if (e.key === "End") go(n - 1);
        else if (e.key === "Escape" && pulled) putBack();
        else return;
        e.preventDefault();
      }}
      className={`mx-auto w-full max-w-[40rem] select-none text-[var(--k-text,#E9EDE8)] ${className}`}
      style={{ containerType: "inline-size", ["--s" as string]: `min(${COVER[size]}px, 42cqw)`, ["--floor" as string]: u(0.34), ["--accent" as string]: accent }}
    >
      <div
        ref={area}
        role="button"
        tabIndex={0}
        aria-pressed={pulled}
        aria-describedby={`${id}-help`}
        aria-label={pulled ? text.cratePlaying(record) : text.crate(record)}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget || preview || (e.key !== "Enter" && e.key !== " ")) return;
          e.preventDefault();
          if (pulled) putBack();
          else pull();
        }}
        onClick={() => {
          if (wasDragged.current) return;
          if (pulled) putBack();
          else pull();
        }}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        onPointerDown={(e) => {
          if (preview || pulled || e.button !== 0) return;
          drag.current = { x: e.clientX, y: e.clientY };
          wasDragged.current = false;
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const g = drag.current;
          if (!g) return;
          const dx = e.clientX - g.x;
          const dy = e.clientY - g.y;
          // drag down tips the front record toward you (next); drag up lifts the last one back (previous).
          // A sideways swipe flips too (left is next): on touch, vertical swipes scroll the page instead.
          const step = Math.abs(dx) > Math.abs(dy) ? -dx : dy;
          if (Math.abs(step) > 36) {
            go(cur + (step > 0 ? 1 : -1));
            g.x = e.clientX;
            g.y = e.clientY;
            wasDragged.current = true;
          }
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        className="relative mx-auto w-full cursor-pointer touch-pan-y overflow-visible outline-none focus-visible:rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--k-acc-text,#C6FF3D)]"
        style={{ height: u(1.62), perspective: u(4.2), perspectiveOrigin: "50% -60%" }}
      >
        {/* the crate: floor, back wall, side walls; the front lip is painted over the standing sleeves */}
        <div aria-hidden="true" className="absolute left-1/2 [transform-origin:50%_100%]" style={{ bottom: "var(--floor)", width: u(WIDTH), height: u(FRONT_Z - BACK_Z), marginLeft: u(-WIDTH / 2), transform: `translateZ(${u(FRONT_Z)}) rotateX(90deg)`, background: "#21180F", filter: dim, transition: crateFade, zIndex: 1 }} />
        <div aria-hidden="true" className="absolute left-1/2 rounded-t-[3px] [transform-origin:50%_100%]" style={{ bottom: "var(--floor)", width: u(WIDTH), height: u(BACK_H), marginLeft: u(-WIDTH / 2), transform: `translateZ(${u(BACK_Z)})`, background: `${SLATS}, ${GRAIN}, ${WOOD}`, filter: dim, transition: crateFade, zIndex: 2 }} />
        {[-1, 1].map((side) => (
          <div
            key={side}
            aria-hidden="true"
            className="absolute [transform-origin:0_100%]"
            style={{
              bottom: "var(--floor)",
              left: `calc(50% + ${u((side * WIDTH) / 2)})`,
              width: u(FRONT_Z - BACK_Z),
              height: u(BACK_H),
              transform: `translateZ(${u(FRONT_Z)}) rotateY(90deg)`,
              clipPath: `polygon(0 100%, 0 ${(1 - LIP_H / BACK_H) * 100}%, 100% 0, 100% 100%)`,
              background: `linear-gradient(to right, rgba(0,0,0,${side < 0 ? 0.15 : 0.35}), rgba(0,0,0,.5)), ${GRAIN}, ${WOOD}`,
              filter: dim,
              transition: crateFade,
              zIndex: 3,
            }}
          />
        ))}

        {records.map((r, i) => {
          const d = i - cur;
          return (
            <div
              key={r.id}
              role="group"
              aria-roledescription="slide"
              aria-label={text.slide(r, i + 1, n)}
              aria-hidden={d !== 0}
              className="absolute left-1/2 [transform-origin:50%_100%] [transform-style:preserve-3d]"
              style={{ ...sleeveStyle(i), bottom: "var(--floor)" }}
            >
              {/* the back of the sleeve, seen when it tips forward toward you */}
              <div className="absolute inset-0 rounded-[3px] shadow-[0_10px_22px_-8px_rgba(0,0,0,.85)] [backface-visibility:hidden] [transform:rotateX(180deg)]" style={{ background: `repeating-linear-gradient(to bottom, transparent 0 9%, rgba(255,255,255,.07) 9% 10%) 0 0 / 70% 100% no-repeat content-box, ${mix(r.colors[0], "#111", 30)}`, padding: "14% 15%" }}>
                <span className="absolute inset-0 rounded-[3px] bg-black transition-opacity" style={{ opacity: "var(--shade)", transitionDuration: `${flipMs}ms` }} />
                {/* light on the near edge, dark toward the hinge, so the leaning sleeve reads as tilted rather than flat */}
                <span className="absolute inset-0 rounded-[3px] border-b border-white/20 bg-[linear-gradient(to_top,rgba(255,255,255,.1),transparent_35%,rgba(0,0,0,.4))]" />
              </div>
              <div className="relative h-full w-full overflow-hidden rounded-[3px] border-t border-white/25 shadow-[0_6px_14px_-6px_rgba(0,0,0,.8)] [backface-visibility:hidden]" style={{ background: coverArt(r) }}>
                <span className="absolute left-[7%] top-[6%] max-w-[86%] truncate text-[length:calc(var(--s)*0.062)] font-black uppercase leading-none tracking-wider" style={inkOn(r, "top")}>
                  {r.artist}
                </span>
                <span className="absolute bottom-[6%] left-[7%] max-w-[86%] truncate text-[length:calc(var(--s)*0.05)] font-semibold leading-none" style={inkOn(r, "bottom")}>
                  {r.title}
                </span>
                {/* light catching the sleeve edge, and the shadow that pushes back sleeves away */}
                <span className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,.14),transparent_38%)]" />
                <span className="absolute inset-0 bg-black transition-opacity" style={{ opacity: "var(--shade)", transitionDuration: `${flipMs}ms` }} />
              </div>
            </div>
          );
        })}

        {/* the front lip with its hand-hold, over the standing sleeves and under the tipped ones */}
        <div aria-hidden="true" className="absolute left-1/2 rounded-t-[3px] shadow-[0_-1px_0_rgba(255,255,255,.12)_inset] [transform-origin:50%_100%]" style={{ bottom: "var(--floor)", width: u(WIDTH), height: u(LIP_H), marginLeft: u(-WIDTH / 2), transform: `translateZ(${u(FRONT_Z)})`, background: `${SLATS}, ${GRAIN}, ${WOOD}`, filter: dim, transition: crateFade, zIndex: 30 }}>
          <span className="absolute left-1/2 top-[22%] h-[17%] w-[30%] -translate-x-1/2 rounded-full bg-[#140E09] shadow-[0_1px_0_rgba(255,255,255,.12)]" />
        </div>

        {/* the disc: slides out of the sleeve, the arm swings on, then it spins */}
        <div aria-hidden="true" className="absolute left-1/2 [transform-origin:50%_100%]" style={discStyle}>
          <div className="absolute -inset-[30%] rounded-full transition-opacity" style={{ background: `radial-gradient(circle, ${mix(accent, "transparent", 45)} 0, transparent 62%)`, opacity: discOut ? 1 : 0, transitionDuration: `${pullMs}ms`, transitionDelay: `${discOut ? pullMs * 0.5 : 0}ms` }} />
          <div
            className={`absolute inset-0 rounded-full shadow-[0_12px_30px_-10px_rgba(0,0,0,.9)] ${discOut && !reduced ? "animate-spin" : ""}`}
            style={{
              background: "repeating-radial-gradient(circle, #0D0D0D 0 1.5px, #1A1A1A 1.5px 2.6px, #101010 2.6px 3.6px)",
              animationDuration: `${60 / (rpm === 45 ? 45 : 33.33)}s`,
              animationDelay: `${spinDelay}ms`,
            }}
          >
            <div className="absolute inset-[3%] rounded-full border border-white/5" />
            <div className="absolute inset-[31%] overflow-hidden rounded-full" style={{ background: `linear-gradient(to bottom, ${record.colors[0]} 0 50%, ${record.colors[1]} 50%)` }}>
              <span className="absolute inset-x-[12%] top-[20%] truncate text-center text-[length:calc(var(--s)*0.042)] font-black uppercase leading-none" style={{ color: textOn(record.colors[0]) }}>
                {record.title}
              </span>
              <span className="absolute inset-x-[12%] bottom-[20%] truncate text-center text-[length:calc(var(--s)*0.034)] font-semibold leading-none" style={{ color: textOn(record.colors[1]) }}>
                {text.discRpm(rpm)}
              </span>
            </div>
            <div className="absolute left-1/2 top-1/2 h-[4%] w-[4%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--k-bg,#0E1110)] ring-1 ring-black/60" />
          </div>
          {/* light on the grooves stays still while the disc turns underneath it */}
          <div className="pointer-events-none absolute inset-0 rounded-full [background:conic-gradient(from_20deg,transparent_0_6%,rgba(255,255,255,.13)_11%,transparent_17%_50%,rgba(255,255,255,.09)_61%,transparent_67%)] [mask:radial-gradient(circle,transparent_31%,#000_32%)]" />
          {/* the tonearm */}
          <div className="absolute left-[103%] top-[4%] h-[13%] w-[13%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_40%_35%,#E4E8E5,#7D8580)] shadow-[0_2px_6px_rgba(0,0,0,.6)]" />
          <div
            className="absolute left-[103%] top-[4%] h-[64%] w-[2.4%] -translate-x-1/2 rounded-full bg-[linear-gradient(90deg,#9AA29D,#E4E8E5,#9AA29D)] shadow-[0_2px_4px_rgba(0,0,0,.5)] [transform-origin:50%_0]"
            style={{ rotate: discOut ? "27deg" : "-4deg", transition: reduced ? "none" : `rotate ${Math.round(pullMs * 0.5)}ms ${soft} ${discOut ? pullMs * 0.85 : 0}ms` }}
          >
            <span className="absolute -bottom-[3%] left-1/2 h-[12%] w-[340%] -translate-x-1/2 rounded-[2px] bg-[#C9CFCB]" />
          </div>
        </div>
      </div>

      {/* the tag under the crate: which record is at the front, or what's playing */}
      <div className="mt-2 text-center" aria-hidden="true">
        {pulled ? (
          <>
            <p className="font-mono text-[0.68rem] font-bold uppercase tracking-widest text-[var(--k-acc-text,#C6FF3D)]">{text.nowPlaying(rpm)}</p>
            <p className="mt-1 text-2xl font-black leading-tight">{record.title}</p>
            <p className="text-sm text-[var(--k-mute,#8A938D)]">
              {record.artist}
              {record.year ? ` · ${record.year}` : ""}
            </p>
          </>
        ) : (
          <div className="inline-flex max-w-full items-baseline gap-2 rounded-md border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] px-3 py-1.5 shadow-[0_10px_30px_-14px_var(--k-shadow,rgba(0,0,0,.9))]">
            <span className="shrink-0 font-mono text-[0.68rem] text-[var(--k-mute,#8A938D)]">
              {String(cur + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
            </span>
            <span className="truncate text-sm font-bold">{record.title}</span>
            <span className="truncate text-xs text-[var(--k-mute,#8A938D)]">{record.artist}</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-center gap-3">
        <button type="button" aria-label={text.prev} data-prev onClick={() => go(cur - 1)} disabled={cur === 0 || pulled} className={btn}>
          ‹
        </button>
        <button
          type="button"
          data-play
          onClick={() => (pulled ? putBack() : pull())}
          className="h-10 min-w-28 rounded-full px-5 text-sm font-bold transition hover:brightness-110 active:scale-[.97] motion-reduce:transition-none shadow-[0_10px_30px_-14px_var(--k-shadow,rgba(0,0,0,.9))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)]"
          style={pulled ? { background: "var(--k-panel-2,#181D1B)", color: "var(--k-text,#E9EDE8)", border: "1px solid var(--k-line,#3A433F)" } : { background: accent, color: textOn(accent) }}
        >
          {pulled ? (
            text.putBack
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <svg aria-hidden="true" viewBox="0 0 10 12" className="h-3 w-2.5 fill-current">
                <path d="M0 0l10 6-10 6z" />
              </svg>
              {text.play}
            </span>
          )}
        </button>
        <button type="button" aria-label={text.next} data-next onClick={() => go(cur + 1)} disabled={cur === n - 1 || pulled} className={btn}>
          ›
        </button>
      </div>
      <p id={`${id}-help`} className="mt-2 text-center text-[0.7rem] text-[var(--k-mute,#8A938D)]">
        {pulled ? text.helpPlaying : text.help}
      </p>
      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>
    </section>
  );
}
