"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ENTRIES, TYPES, pad } from "@/lib/registry";

/** Where each component sits on the scope: its type sets the bearing, its number sets the range. */
const BLIPS = ENTRIES.map((e, i) => {
  const t = TYPES.findIndex((x) => x.id === e.type);
  const angle = (t / TYPES.length) * 360 + 14 + i * 9;
  const r = 0.34 + ((i * 37) % 50) / 100;
  return { e, angle, r: Math.min(r, 0.82) };
});
const DUST = Array.from({ length: 34 }, (_, i) => ({ a: (i * 137.5) % 360, r: 0.12 + ((i * 53) % 86) / 100 }));
const PERIOD = 4200;
/** Rounded percentages, so the server and the browser print exactly the same position. */
const pct = (n: number) => `${n.toFixed(3)}%`;

/**
 * The home page's centrepiece: a live radar. The beam sweeps round; every component is a blip that flares
 * as the beam passes and fades after. Hover a blip to read it, click to open it, drag the scope to spin it.
 */
export function Radar() {
  const scope = useRef<HTMLDivElement>(null);
  const beam = useRef<HTMLDivElement>(null);
  const blips = useRef<(HTMLElement | null)[]>([]);
  const dust = useRef<(HTMLElement | null)[]>([]);
  const offset = useRef(0);
  const drag = useRef<{ start: number; from: number } | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const sweep = ((((now - t0) / PERIOD) * 360 + offset.current) % 360 + 360) % 360;
      if (beam.current) beam.current.style.transform = `rotate(${sweep}deg)`;
      // how long ago (in degrees) the beam passed each point decides how bright it is
      const glow = (angle: number) => {
        const behind = (sweep - angle + 360) % 360;
        return Math.max(0, 1 - behind / 300);
      };
      BLIPS.forEach((b, i) => {
        const el = blips.current[i];
        if (el) el.style.setProperty("--g", String(0.25 + glow(b.angle) * 0.75));
      });
      DUST.forEach((d, i) => {
        const el = dust.current[i];
        if (el) el.style.opacity = String(glow(d.a) * 0.55);
      });
      frame = requestAnimationFrame(tick);
    };
    if (reduce) {
      BLIPS.forEach((_, i) => blips.current[i]?.style.setProperty("--g", "1"));
      return;
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const angleAt = (x: number, y: number) => {
    const r = scope.current!.getBoundingClientRect();
    return (Math.atan2(y - (r.top + r.height / 2), x - (r.left + r.width / 2)) * 180) / Math.PI + 90;
  };

  const shown = hover === null ? null : BLIPS[hover];

  return (
    <div className="relative mx-auto w-full max-w-[460px]">
      <div
        ref={scope}
        role="group"
        aria-label={`Radar showing ${ENTRIES.length} components`}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("a")) return;
          drag.current = { start: angleAt(e.clientX, e.clientY), from: offset.current };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          offset.current = drag.current.from + (angleAt(e.clientX, e.clientY) - drag.current.start);
        }}
        onPointerUp={() => (drag.current = null)}
        className="relative aspect-square cursor-grab touch-none select-none overflow-hidden rounded-full border border-line-2 bg-[radial-gradient(circle,#121A14_0%,#0B0D0C_70%)] shadow-[0_0_80px_-20px_rgba(198,255,61,.25),inset_0_0_60px_rgba(0,0,0,.8)] active:cursor-grabbing"
      >
        {/* range rings and crosshair */}
        {[0.25, 0.5, 0.75].map((s) => (
          <span key={s} aria-hidden="true" className="absolute left-1/2 top-1/2 rounded-full border border-acc/15" style={{ width: `${s * 100}%`, height: `${s * 100}%`, transform: "translate(-50%,-50%)" }} />
        ))}
        <span aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px bg-acc/10" />
        <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-acc/10" />
        {TYPES.map((t, i) => {
          const a = ((i / TYPES.length) * 360 * Math.PI) / 180;
          return (
            <span key={t.id} aria-hidden="true" className="mono absolute -translate-x-1/2 -translate-y-1/2 text-[0.5rem] text-mute/70" style={{ left: pct(50 + Math.sin(a) * 45), top: pct(50 - Math.cos(a) * 45) }}>
              {t.id}
            </span>
          );
        })}

        {/* the sweeping beam: a conic wedge with a bright leading edge */}
        <div ref={beam} aria-hidden="true" className="absolute inset-0 will-change-transform">
          <div className="absolute inset-0 rounded-full [background:conic-gradient(from_-60deg,transparent_0deg,rgba(198,255,61,.0)_0deg,rgba(198,255,61,.22)_58deg,rgba(198,255,61,.55)_60deg,transparent_60.5deg)]" />
        </div>

        {DUST.map((d, i) => {
          const a = (d.a * Math.PI) / 180;
          return (
            <i
              key={i}
              ref={(el) => {
                dust.current[i] = el;
              }}
              aria-hidden="true"
              className="absolute h-[3px] w-[3px] rounded-full bg-acc opacity-0"
              style={{ left: pct(50 + Math.sin(a) * d.r * 50), top: pct(50 - Math.cos(a) * d.r * 50) }}
            />
          );
        })}

        {BLIPS.map((b, i) => {
          const a = (b.angle * Math.PI) / 180;
          return (
            <Link
              key={b.e.slug}
              href={`/components/${b.e.slug}`}
              ref={(el) => {
                blips.current[i] = el;
              }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`${b.e.name}, ${b.e.type}`}
              className="group absolute z-10 grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-acc"
              style={{ left: pct(50 + Math.sin(a) * b.r * 50), top: pct(50 - Math.cos(a) * b.r * 50) }}
            >
              <span className="absolute h-7 w-7 rounded-full border border-acc/50 opacity-[var(--g,1)] transition-transform group-hover:scale-125" />
              <span className="h-2.5 w-2.5 rounded-full bg-acc opacity-[var(--g,1)] shadow-[0_0_14px_4px_rgba(198,255,61,.6)]" />
            </Link>
          );
        })}
        <span aria-hidden="true" className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-acc shadow-[0_0_12px_3px_rgba(198,255,61,.6)]" />
      </div>

      <div className="mono mt-4 flex min-h-10 items-center justify-center gap-2 text-center text-[0.66rem] text-mute" aria-live="polite">
        {shown ? (
          <span>
            <span className="text-acc">Contact · No. {shown.e.ext}</span> — {shown.e.name} <span className="text-mute">({shown.e.type}, bearing {pad(Math.round(shown.angle))}°)</span>
          </span>
        ) : (
          <span>Hover a blip to read it · click to open · drag the scope to spin it</span>
        )}
      </div>
    </div>
  );
}
