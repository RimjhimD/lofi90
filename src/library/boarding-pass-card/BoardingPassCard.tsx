"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";

export interface Airport {
  /** Three-letter airport code, e.g. "DAC". */
  code: string;
  city: string;
}

export interface BoardingPass {
  from: Airport;
  to: Airport;
  passenger: string;
  flight: string;
  date: string;
  /** Boarding time, e.g. "21:40". */
  boards: string;
  gate: string;
  seat: string;
  group?: string;
  cabin?: string;
  /** Highlight the gate in amber: it moved since the pass was printed. */
  gateChanged?: boolean;
}

/** Every bit of visible and announced copy. Templates get the pass so they can quote seat and gate. */
export interface BoardingPassLabels {
  passenger: string;
  date: string;
  boards: string;
  gate: string;
  seat: string;
  /** Short label for the boarding group on the stub. */
  group: string;
  /** Tag after the gate label when the gate moved. */
  gateNew: string;
  /** Accessible name of the whole pass. */
  pass: (pass: BoardingPass) => string;
  /** Read out by screen readers when the stub is torn off. */
  announce: (pass: BoardingPass) => string;
  /** Big stamp line. */
  stamp: string;
  /** Small line under the stamp. */
  stampDetail: (pass: BoardingPass) => string;
  /** Hint under the barcode on the stub. */
  hint: string;
  /** Button text before check-in. */
  button: string;
  /** Button text once checked in. */
  buttonDone: string;
  /** Button text while `loading`. */
  checkingIn: string;
}

export const DEFAULT_BOARDING_PASS_LABELS: BoardingPassLabels = {
  passenger: "Passenger",
  date: "Date",
  boards: "Boards",
  gate: "Gate",
  seat: "Seat",
  group: "Grp",
  gateNew: "· new",
  pass: (p) => `Boarding pass, ${p.from.city} to ${p.to.city}`,
  announce: (p) => `Checked in. Seat ${p.seat}, gate ${p.gate}.`,
  stamp: "Checked in",
  stampDetail: (p) => `Seat ${p.seat} · Gate ${p.gate}`,
  hint: "Tear to check in",
  button: "Tear stub to check in",
  buttonDone: "Checked in ✓",
  checkingIn: "Checking in…",
};

export interface BoardingPassCardProps {
  pass: BoardingPass;
  /** Airline name, shown top left. */
  airline: string;
  /** Runs when the stub is torn off, i.e. the passenger checked in. */
  onTear?: () => void;
  /** Runs when someone starts pulling the stub. */
  onPeelStart?: () => void;
  /** Runs when the stub is let go too early and springs back. */
  onSnapBack?: () => void;
  /** Controlled: is the stub torn off? */
  torn?: boolean;
  /** Uncontrolled starting value. */
  defaultTorn?: boolean;
  /** Colour of the stamp, the plane and the hint arrow. */
  accent?: string;
  /**
   * Text colour for the stamp, plane and arrow. Defaults to `--k-acc-ink` from the page, else `accent`.
   * Set it when `accent` is too pale to read on your background.
   */
  inkColor?: string;
  /** How far the stub must be pulled before it rips, in px. */
  tearDistance?: number;
  size?: "sm" | "md" | "lg";
  /** Freeze one look without any dragging, for docs and tests. */
  preview?: "ready" | "tearing" | "torn";
  /** Override any of the copy; the rest stays English. */
  labels?: Partial<BoardingPassLabels>;
  /** Locked: the stub won't move and the button is disabled. */
  disabled?: boolean;
  /** Check-in in flight: busy, the button says so, and nothing tears. */
  loading?: boolean;
  className?: string;
}

const SIZES = {
  sm: { box: "max-w-[400px]", code: "text-[1.7rem]", seat: "text-2xl" },
  md: { box: "max-w-[520px]", code: "text-[2.15rem]", seat: "text-3xl" },
  lg: { box: "max-w-[620px]", code: "text-[2.6rem]", seat: "text-4xl" },
};

/** Wider than this the stub sits on the right and tears sideways; narrower, it sits below and tears down. */
const WIDE = 420;
/** How deep the torn teeth bite into the paper, in px. */
const TOOTH = 5;
const NOTCH = 10;

/**
 * A zigzag clip-path along one edge. The main panel starts with a valley and the stub with a tip, so where
 * they meet the two torn edges leave a thin jagged gap, like paper that is coming apart.
 */
function jag(side: "right" | "left" | "bottom" | "top", teeth: number, tipFirst: boolean) {
  const pts: string[] = [];
  const steps = teeth * 2;
  for (let i = 0; i <= steps; i++) {
    const at = `${((i / steps) * 100).toFixed(2)}%`;
    const depth = (i % 2 === 0) === tipFirst ? "0px" : `${TOOTH}px`;
    if (side === "right") pts.push(`calc(100% - ${depth}) ${at}`);
    if (side === "left") pts.push(`${depth} ${at}`);
    if (side === "bottom") pts.push(`${at} calc(100% - ${depth})`);
    if (side === "top") pts.push(`${at} ${depth}`);
  }
  const rest = { right: ["0 100%", "0 0"], left: ["100% 100%", "100% 0"], bottom: ["100% 0", "0 0"], top: ["100% 100%", "0 100%"] }[side];
  return `polygon(${[...pts, ...rest].join(",")})`;
}

/** Two half-circle bites where the perforation meets the ticket edge, so the stage shows through. */
const hole = (at: string) => `radial-gradient(circle at ${at}, #0000 ${NOTCH}px, #000 ${NOTCH + 0.5}px)`;
const notches = (a: string, b: string, split: "rows" | "cols") =>
  split === "rows"
    ? `${hole(a)} top / 100% 51% no-repeat, ${hole(b)} bottom / 100% 51% no-repeat`
    : `${hole(a)} left / 51% 100% no-repeat, ${hole(b)} right / 51% 100% no-repeat`;

// One stylesheet for the parts Tailwind can't say neatly: the masks, the torn edges, the peel and the stamp.
const CSS = `
@property --bpc-p { syntax: "<number>"; inherits: true; initial-value: 0; }
.bpc-ticket {
  --bpc-edge: var(--k-line, #3A433F);
  transition: --bpc-p 560ms cubic-bezier(.3,1.9,.45,1);
  /* a hairline that follows the notches and the torn teeth, then the soft shadow */
  filter: drop-shadow(1px 0 0 var(--bpc-edge)) drop-shadow(-1px 0 0 var(--bpc-edge)) drop-shadow(0 1px 0 var(--bpc-edge)) drop-shadow(0 -1px 0 var(--bpc-edge)) drop-shadow(0 14px 14px var(--k-shadow, rgba(0,0,0,.6)));
}
.bpc-main { mask: ${notches("0 100%", "100% 100%", "cols")}; transform: translateY(calc(var(--bpc-p) * -3px)); }
.bpc-stub { mask: ${notches("0 0", "100% 0", "cols")}; transform-origin: 0 0; transform: translateY(calc(var(--bpc-p) * 14px)) rotate(calc(var(--bpc-p) * 4deg)); touch-action: none; }
/* stacked: once the stub has flown off, close the gap it left */
.bpc-ticket[data-gone="true"] .bpc-stub { display: none; }
.bpc-main::after { content: ""; position: absolute; left: ${NOTCH + 6}px; right: ${NOTCH + 6}px; bottom: 0; border-bottom: 2px dashed var(--k-line, #3A433F); }
.bpc-ticket:not([data-phase="ready"]) .bpc-main::after { display: none; }
.bpc-ticket:not([data-phase="ready"]) .bpc-main { clip-path: ${jag("bottom", 18, false)}; }
.bpc-ticket:not([data-phase="ready"]) .bpc-stub { clip-path: ${jag("top", 18, true)}; }
@container (min-width: ${WIDE}px) {
  .bpc-main { mask: ${notches("100% 0", "100% 100%", "rows")}; transform: translateX(calc(var(--bpc-p) * -3px)); }
  .bpc-stub { mask: ${notches("0 0", "0 100%", "rows")}; transform-origin: 0 100%; transform: translateX(calc(var(--bpc-p) * 22px)) rotate(calc(var(--bpc-p) * 9deg)); }
  .bpc-ticket[data-gone="true"] .bpc-stub { display: block; visibility: hidden; }
  .bpc-main::after { left: auto; top: ${NOTCH + 6}px; bottom: ${NOTCH + 6}px; right: 0; border-bottom: 0; border-right: 2px dashed var(--k-line, #3A433F); }
  .bpc-ticket:not([data-phase="ready"]) .bpc-main { clip-path: ${jag("right", 12, false)}; }
  .bpc-ticket:not([data-phase="ready"]) .bpc-stub { clip-path: ${jag("left", 12, true)}; }
}
@media (prefers-reduced-motion: no-preference) {
  .bpc-ticket[data-phase="ready"]:not([data-locked="true"]):has(.bpc-stub:hover) { --bpc-p: .07; }
  .bpc-ticket[data-phase="ready"]:not([data-locked="true"]):has(.bpc-stub:active) { --bpc-p: .14; }
}
/* hover and press show on the stub's paper too, so they read with reduced motion */
.bpc-ticket[data-phase="ready"]:not([data-locked="true"]) .bpc-stub:hover { background-color: color-mix(in oklab, var(--k-panel-2, #181D1B) 90%, var(--k-text, #E9EDE8)); }
.bpc-ticket[data-phase="ready"]:not([data-locked="true"]) .bpc-stub:active { background-color: color-mix(in oklab, var(--k-panel-2, #181D1B) 82%, var(--k-text, #E9EDE8)); }
.bpc-ticket[data-locked="true"] { opacity: .6; }
/* the page can set --k-acc-ink for a readable accent on its background; the inkColor prop wins over both */
.bpc-ink { color: var(--bpc-ink, var(--k-acc-ink, var(--bpc-acc))); }
.bpc-stamp { transform: rotate(-8deg); }
.bpc-stamp[data-animate="true"] { animation: bpc-stamp 420ms 160ms cubic-bezier(.5,0,.7,1.2) both; }
.bpc-main[data-thump="true"] { animation: bpc-thump 260ms 390ms ease-out; }
@keyframes bpc-stamp { from { transform: rotate(-18deg) scale(2.6); opacity: 0; } 70% { transform: rotate(-7deg) scale(.93); opacity: 1; } to { transform: rotate(-8deg) scale(1); opacity: 1; } }
@keyframes bpc-thump { 0%, 100% { translate: 0 0; } 30% { translate: 0 2px; } }
@media (prefers-reduced-motion: reduce) {
  .bpc-ticket { transition: none; }
  .bpc-stamp[data-animate="true"], .bpc-main[data-thump="true"] { animation: none; }
}
`;

const MOTION = "(prefers-reduced-motion: reduce)";
const onMotionChange = (cb: () => void) => {
  const m = window.matchMedia(MOTION);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

/** Bars for the stub's barcode, the same every time for the same pass. */
function bars(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const out: { x: number; w: number }[] = [];
  let x = 0;
  for (let i = 0; i < 30; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    const w = 1 + (Math.abs(h) % 3);
    out.push({ x, w });
    x += w + 1 + (Math.abs(h >> 4) % 2);
  }
  return { out, width: x };
}

function Field({ label, value, warn, warnLabel, className = "" }: { label: string; value: string; warn?: boolean; warnLabel?: string; className?: string }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <dt className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-[var(--k-mute,#8A938D)]">
        {label}
        {warn && <span className="ml-1 text-[var(--k-warn-text,#FFD08A)]">{warnLabel}</span>}
      </dt>
      <dd className={`truncate font-mono text-sm font-semibold tabular-nums ${warn ? "text-[var(--k-warn-text,#FFD08A)]" : ""}`}>{value}</dd>
    </div>
  );
}

/**
 * A boarding pass whose stub you tear off to check in. Drag the stub away from the perforation: it peels
 * around the perforation edge and fights back the further you pull. Let go early and it springs back; pull
 * past `tearDistance` and it rips off, flies away, and a CHECKED IN stamp thumps onto the pass.
 */
export function BoardingPassCard({
  pass,
  airline,
  onTear,
  onPeelStart,
  onSnapBack,
  torn,
  defaultTorn = false,
  accent = "#C6FF3D",
  tearDistance = 110,
  size = "md",
  preview,
  inkColor,
  labels,
  disabled = false,
  loading = false,
  className = "",
}: BoardingPassCardProps) {
  const l = { ...DEFAULT_BOARDING_PASS_LABELS, ...labels };
  const pathId = `bpc${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const reduced = useSyncExternalStore(onMotionChange, () => window.matchMedia(MOTION).matches, () => false);
  const [ownTorn, setOwnTorn] = useState(defaultTorn);
  const [pulling, setPulling] = useState(false);
  const [flying, setFlying] = useState(false);
  const [said, setSaid] = useState("");
  const ticket = useRef<HTMLDivElement>(null);
  const stub = useRef<HTMLDivElement>(null);
  const fly = useRef<Animation | null>(null);
  const drag = useRef<{ x: number; y: number; wide: boolean; peeled: boolean } | null>(null);

  const isTorn = preview ? preview === "torn" : (torn ?? ownTorn);
  const phase = preview === "tearing" || pulling ? "pulling" : isTorn || flying ? "torn" : "ready";

  const latest = useRef({ onTear, onPeelStart, onSnapBack, isTorn });
  useEffect(() => {
    latest.current = { onTear, onPeelStart, onSnapBack, isTorn };
  });

  // Handed a fresh pass (controlled torn went back to false): put the stub back where it belongs.
  useEffect(() => {
    if (isTorn) return;
    fly.current?.cancel();
    fly.current = null;
    ticket.current?.style.removeProperty("--bpc-p");
    ticket.current?.style.removeProperty("transition");
  }, [isTorn]);

  const isWide = () => (stub.current?.offsetLeft ?? 0) > 0;

  function tear(wide: boolean) {
    if (isTorn || preview || flying || disabled || loading) return;
    drag.current = null;
    setPulling(false);
    setOwnTorn(true);
    setSaid(l.announce(pass));
    latest.current.onTear?.();
    const el = stub.current;
    const t = ticket.current;
    if (reduced || !el || !t) return;
    // Freeze the peel where it is and throw the stub from there.
    t.style.transition = "none";
    setFlying(true);
    const a = el.animate(
      [{ transform: wide ? "translate(190px, 46px) rotate(34deg)" : "translate(46px, 160px) rotate(22deg)", opacity: 0 }],
      { duration: 650, easing: "cubic-bezier(.35,.1,.7,.9)", fill: "forwards" },
    );
    fly.current = a;
    a.onfinish = () => {
      setFlying(false);
      // Controlled and the parent kept the pass whole: bring the stub back.
      if (!latest.current.isTorn) {
        a.cancel();
        t.style.removeProperty("--bpc-p");
        t.style.removeProperty("transition");
      }
    };
  }

  function release() {
    const d = drag.current;
    drag.current = null;
    const t = ticket.current;
    if (!d || !t) return;
    // Hand the stub back to the stylesheet: the springy transition carries it home with a little overshoot.
    t.style.removeProperty("transition");
    t.style.removeProperty("--bpc-p");
    if (!d.peeled) return;
    setPulling(false);
    latest.current.onSnapBack?.();
  }

  const s = SIZES[size];
  const code = bars(`${pass.flight}${pass.seat}${pass.passenger}`);
  const locked = disabled || loading;
  const style = { "--bpc-acc": accent, ...(inkColor ? { "--bpc-ink": inkColor } : {}), ...(preview === "tearing" ? { "--bpc-p": 0.62 } : {}) } as CSSProperties;

  return (
    <div role="group" aria-label={l.pass(pass)} aria-busy={loading || undefined} aria-disabled={disabled || undefined} className={`@container w-full ${s.box} text-[var(--k-text,#E9EDE8)] ${className}`} style={style}>
      {/* React 19 hoists this to <head> once, however many passes are on the page */}
      <style href="bpc-card" precedence="default">
        {CSS}
      </style>
      <div ref={ticket} data-phase={phase} data-gone={isTorn && !flying} data-locked={locked} className="bpc-ticket flex flex-col @min-[420px]:flex-row">
        {/* main panel */}
        <section
          className="bpc-main relative min-w-0 flex-1 rounded-t-2xl @min-[420px]:rounded-tr-none @min-[420px]:rounded-bl-2xl bg-[var(--k-panel,#121614)] p-4 pb-5 @min-[420px]:pb-4 @min-[420px]:pr-5"
          data-thump={isTorn && !preview}
        >
          <div className="flex items-baseline justify-between gap-3">
            <p className="flex min-w-0 items-center gap-1.5 truncate text-sm font-bold">
              <span aria-hidden="true" className="bpc-ink text-xs">◆</span>
              {airline}
            </p>
            <p className="shrink-0 font-mono text-[0.68rem] text-[var(--k-mute,#8A938D)]">
              {pass.flight}
              {pass.cabin && ` · ${pass.cabin}`}
            </p>
          </div>

          <div className="mt-3 flex items-end gap-2">
            <div className="shrink-0">
              <p className={`font-mono ${s.code} font-black leading-none tracking-tight`}>{pass.from.code}</p>
              <p className="mt-1 text-xs text-[var(--k-mute,#8A938D)]">{pass.from.city}</p>
            </div>
            <svg viewBox="0 0 120 36" aria-hidden="true" className="mb-5 h-9 min-w-0 flex-1 overflow-visible text-[var(--k-line,#3A433F)]">
              <path id={pathId} d="M4 30 Q60 -8 116 30" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="0.1 5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              <circle cx="4" cy="30" r="2.2" fill="currentColor" />
              <circle cx="116" cy="30" r="2.2" fill="currentColor" />
              <g className="bpc-ink">
                <path
                  d="M7 0 L3 -1.2 L-1 -6.5 L-3 -6.5 L-1.2 -1.2 L-5 -1.2 L-6.5 -3.2 L-8 -3.2 L-7 0 L-8 3.2 L-6.5 3.2 L-5 1.2 L-1.2 1.2 L-3 6.5 L-1 6.5 L3 1.2 Z"
                  fill="currentColor"
                  transform={reduced ? "translate(60 11) rotate(0) scale(.85)" : "scale(.85)"}
                />
                {!reduced && (
                  <>
                    <animateMotion dur="5.5s" repeatCount="indefinite" rotate="auto" keyPoints="0;1;1" keyTimes="0;0.8;1" calcMode="linear">
                      <mpath href={`#${pathId}`} />
                    </animateMotion>
                    <animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.1;0.72;0.8;1" dur="5.5s" repeatCount="indefinite" />
                  </>
                )}
              </g>
            </svg>
            <div className="shrink-0 text-right">
              <p className={`font-mono ${s.code} font-black leading-none tracking-tight`}>{pass.to.code}</p>
              <p className="mt-1 text-xs text-[var(--k-mute,#8A938D)]">{pass.to.city}</p>
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-x-3 gap-y-2.5">
            <Field label={l.passenger} value={pass.passenger} className="col-span-2" />
            <Field label={l.date} value={pass.date} />
            <Field label={l.boards} value={pass.boards} />
            <Field label={l.gate} value={pass.gate} warn={pass.gateChanged} warnLabel={l.gateNew} />
            <Field label={l.seat} value={pass.seat} />
          </dl>

          {isTorn && (
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
              <div
                className="bpc-stamp bpc-ink rounded-lg border-[3px] border-double border-current px-4 py-1.5 text-center"
                data-animate={!preview}
                // opaque, so the fields underneath can't drag the small line's contrast down
                style={{ background: `color-mix(in oklab, ${accent} 12%, var(--k-panel, #121614))` }}
              >
                <p className="font-mono text-xl font-black uppercase tracking-[0.18em]">{l.stamp}</p>
                <p className="font-mono text-[0.7rem] font-extrabold uppercase tracking-[0.18em]">{l.stampDetail(pass)}</p>
              </div>
            </div>
          )}
        </section>

        {/* the stub: drag it away from the perforation to tear it off */}
        <div
          ref={stub}
          className={`bpc-stub relative shrink-0 ${locked ? (loading ? "cursor-progress" : "cursor-not-allowed") : "cursor-grab active:cursor-grabbing"} select-none rounded-b-2xl @min-[420px]:rounded-bl-none @min-[420px]:rounded-tr-2xl bg-[var(--k-panel-2,#181D1B)] p-4 pt-5 transition-colors @min-[420px]:w-[33%] @min-[420px]:min-w-[128px] @min-[420px]:pl-5 @min-[420px]:pt-4`}
          onPointerDown={(e) => {
            if (isTorn || preview || flying || locked || e.button !== 0) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { x: e.clientX, y: e.clientY, wide: isWide(), peeled: false };
            ticket.current?.style.setProperty("transition", "none");
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d) return;
            const along = Math.max(0, d.wide ? e.clientX - d.x : e.clientY - d.y);
            if (!d.peeled && along > 6) {
              d.peeled = true;
              setPulling(true);
              latest.current.onPeelStart?.();
            }
            const r = along / tearDistance;
            if (r >= 1) return tear(d.wide);
            if (reduced) return;
            // Tension: quick to give at first, stiffer the further it goes, and trembling just before it rips.
            const shake = r > 0.78 ? (Math.random() - 0.5) * 0.05 : 0;
            ticket.current?.style.setProperty("--bpc-p", String(Math.sin((r * Math.PI) / 2) + shake));
          }}
          onPointerUp={release}
          onPointerCancel={release}
        >
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-2 @min-[420px]:h-full @min-[420px]:grid-cols-1 @min-[420px]:content-between">
            <div>
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-[var(--k-mute,#8A938D)]">{l.seat}</p>
              <p className={`font-mono ${s.seat} font-black leading-none tabular-nums`}>{pass.seat}</p>
              <p className="mt-1.5 font-mono text-[0.68rem] tabular-nums text-[var(--k-mute,#8A938D)]">
                {l.gate} <span className={`font-bold ${pass.gateChanged ? "text-[var(--k-warn-text,#FFD08A)]" : "text-[var(--k-text,#E9EDE8)]"}`}>{pass.gate}</span>
                {pass.group && (
                  <>
                    {" · "}
                    {l.group} <span className="font-bold text-[var(--k-text,#E9EDE8)]">{pass.group}</span>
                  </>
                )}
              </p>
            </div>
            <div className="min-w-0">
              <svg aria-hidden="true" viewBox={`0 0 ${code.width} 10`} preserveAspectRatio="none" className="h-9 w-full">
                {code.out.map((b) => (
                  <rect key={b.x} x={b.x} width={b.w} height="10" fill="currentColor" />
                ))}
              </svg>
              <p className="mt-1.5 flex items-center justify-between gap-2 text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-[var(--k-mute,#8A938D)]">
                <span className="truncate">{l.hint}</span>
                <span aria-hidden="true" className="bpc-ink text-sm leading-none">
                  <span className="@min-[420px]:hidden">↓</span>
                  <span className="hidden @min-[420px]:inline">→</span>
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-center @min-[420px]:mt-3">
        <button
          type="button"
          data-tear
          disabled={disabled}
          aria-disabled={isTorn || !!preview || loading}
          onClick={() => tear(isWide())}
          className="rounded-full px-3 py-1 text-xs font-semibold text-[var(--k-mute,#8A938D)] transition-[color,background-color,scale] hover:bg-[color-mix(in_oklab,var(--k-text,#E9EDE8)_8%,transparent)] hover:text-[var(--k-text,#E9EDE8)] active:scale-95 active:bg-[color-mix(in_oklab,var(--k-text,#E9EDE8)_14%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)] aria-disabled:cursor-default aria-disabled:bg-transparent aria-disabled:scale-100 aria-disabled:hover:text-[var(--k-mute,#8A938D)] disabled:cursor-not-allowed disabled:bg-transparent disabled:scale-100 disabled:opacity-60 disabled:hover:text-[var(--k-mute,#8A938D)]"
        >
          {loading ? l.checkingIn : isTorn ? l.buttonDone : l.button}
        </button>
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {said}
      </p>
    </div>
  );
}
