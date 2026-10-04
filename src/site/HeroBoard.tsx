"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ENTRIES, TYPES, pad } from "@/lib/registry";

const ROWS = 3;
const COLORS = ["#D7263D", "#E8E2D2", "#D7263D", "#C9C2AE"];
const MAX_CABLES = 5;
const CODES: Record<string, string> = { button: "BTN", input: "INP", form: "FRM", card: "CRD", modal: "MDL", table: "TBL", loader: "LDR", navbar: "NAV", section: "SEC", chart: "CHT" };

interface Cable {
  id: number;
  a: number;
  b: number;
  color: string;
  leaving?: boolean;
}

/** One jack per possible component: 10 type columns × 3 lines. */
const JACKS = TYPES.flatMap((t, col) =>
  Array.from({ length: ROWS }, (_, row) => {
    const entry = ENTRIES.filter((e) => e.type === t.id)[row];
    return { col, row, type: t.id, entry };
  }),
);

/**
 * The hero's live switchboard. Built components light their jack; on idle the board patches calls
 * between random jacks with cables that sag, plug in and later unplug. Hover a jack to read its line.
 */
export function HeroBoard() {
  const board = useRef<HTMLDivElement>(null);
  const holes = useRef<(HTMLElement | null)[]>([]);
  const [centers, setCenters] = useState<{ x: number; y: number }[]>([]);
  const [cables, setCables] = useState<Cable[]>([]);
  const [hover, setHover] = useState<number | null>(null);

  // Where every jack sits inside the board, re-measured whenever the board resizes.
  useEffect(() => {
    const el = board.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const box = el.getBoundingClientRect();
      setCenters(
        holes.current.map((h) => {
          const r = h?.getBoundingClientRect();
          return r ? { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 } : { x: 0, y: 0 };
        }),
      );
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The operator at work: patch a new call every so often, unplug the oldest.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let id = 0;
    const patch = () => {
      const a = Math.floor(Math.random() * JACKS.length);
      let b = Math.floor(Math.random() * JACKS.length);
      if (JACKS[b].col === JACKS[a].col) b = (b + ROWS * 3) % JACKS.length;
      const next = { id: id++, a, b, color: COLORS[id % COLORS.length] };
      setCables((cs) => {
        const live = cs.filter((c) => !c.leaving);
        const marked = live.length >= MAX_CABLES ? cs.map((c) => (c.id === live[0].id ? { ...c, leaving: true } : c)) : cs;
        return [...marked, next];
      });
      window.setTimeout(() => setCables((cs) => cs.filter((c) => !c.leaving)), 500);
    };
    const first = window.setTimeout(patch, 900);
    const timer = window.setInterval(patch, 1700);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);

  const connected = new Set(cables.filter((c) => !c.leaving).flatMap((c) => [c.a, c.b]));
  const shown = hover === null ? null : JACKS[hover];

  return (
    <div className="relative border-2 border-ink bg-bottle p-4 text-bone shadow-[8px_8px_0_#1A1A17] sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-2 border border-dashed border-bone/25" />
      <div className="mono mb-4 flex items-center justify-between text-[0.66rem] text-[#c9c2ae]">
        <span>Exchange board · {pad(ENTRIES.length)} of 30 lines live</span>
        <span className="flex items-center gap-1.5">
          <i className="lamp anim-blink" data-on="true" style={{ width: 7, height: 7 }} /> Live
        </span>
      </div>

      <div ref={board} className="relative grid grid-cols-10 gap-x-1 gap-y-3">
        {TYPES.map((t, col) => (
          <span key={t.id} title={t.label} className="mono bg-bone py-0.5 text-center text-[0.52rem] tracking-normal text-ink sm:text-[0.6rem]" style={{ gridColumn: col + 1, gridRow: 1 }}>
            {CODES[t.id]}
          </span>
        ))}
        {JACKS.map((j, i) => {
          const lit = !!j.entry || connected.has(i);
          const inner = (
            <>
              <i className="lamp" data-on={lit} style={{ width: 9, height: 9 }} />
              <i
                ref={(el) => {
                  holes.current[i] = el;
                }}
                className="jack"
                style={{ width: 26, height: 26, borderWidth: 4 }}
              />
            </>
          );
          const common = {
            onMouseEnter: () => setHover(i),
            onMouseLeave: () => setHover(null),
            onFocus: () => setHover(i),
            onBlur: () => setHover(null),
            style: { gridColumn: j.col + 1, gridRow: j.row + 2 },
          };
          return j.entry ? (
            <Link
              key={i}
              href={`/components/${j.entry.slug}`}
              aria-label={`${j.entry.name}, line ${j.entry.ext}`}
              className="flex flex-col items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow"
              {...common}
            >
              {inner}
            </Link>
          ) : (
            <span key={i} aria-hidden="true" className="flex flex-col items-center gap-1.5" {...common}>
              {inner}
            </span>
          );
        })}

        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
          {cables.map((c) => {
            const a = centers[c.a];
            const b = centers[c.b];
            if (!a || !b) return null;
            const sag = 40 + Math.abs(b.x - a.x) * 0.3;
            return (
              <path
                key={c.id}
                d={`M ${a.x} ${a.y} C ${a.x} ${a.y + sag}, ${b.x} ${b.y + sag}, ${b.x} ${b.y}`}
                fill="none"
                stroke={c.color}
                strokeWidth="4"
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1"
                className={`transition-opacity duration-500 [stroke-dashoffset:1] animate-[draw_.6s_cubic-bezier(.3,.7,.2,1)_forwards] ${c.leaving ? "opacity-0" : "opacity-95"}`}
              />
            );
          })}
        </svg>
      </div>

      <p className="mono mt-5 min-h-5 text-[0.68rem] text-[#c9c2ae]" aria-live="polite">
        {shown
          ? shown.entry
            ? `Exchange ${pad(shown.col + 1)} · ${shown.type} · line ${shown.entry.ext} — ${shown.entry.name}`
            : `Exchange ${pad(shown.col + 1)} · ${shown.type} · line open, coming soon`
          : "Hover a jack to read its line · lit lamps are live components"}
      </p>
    </div>
  );
}
