"use client";

import { useEffect, useRef, useState } from "react";

const X = 14;
const BULGE = 34;

/**
 * A red cable down the left margin that draws itself as you scroll and plugs into a jack beside
 * every section heading (h2) inside it; the jack's lamp lights when the cable reaches it.
 * Decorative only. Hidden on small screens; static and fully drawn with reduced motion.
 */
export function ScrollCable({ children }: { children: React.ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const live = useRef<SVGPathElement>(null);
  const stops = useRef<number[]>([]);
  const [layout, setLayout] = useState<{ jacks: number[]; height: number }>({ jacks: [], height: 0 });
  const [reached, setReached] = useState(0);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const update = () => {
      const box = el.getBoundingClientRect();
      const progress = reduce ? 1 : Math.min(1, Math.max(0, (window.innerHeight * 0.55 - box.top) / box.height));
      if (live.current) live.current.style.strokeDashoffset = String(1 - progress);
      const y = progress * box.height;
      setReached(stops.current.filter((s) => s <= y + 1).length);
    };

    // Fires once on observe, then whenever the content changes size (fonts, code panels, demos).
    const ro = new ResizeObserver(() => {
      const top = el.getBoundingClientRect().top;
      const jacks = Array.from(el.querySelectorAll("h2")).map((h) => {
        const r = h.getBoundingClientRect();
        return Math.round(r.top - top + r.height / 2);
      });
      stops.current = jacks;
      setLayout({ jacks, height: el.offsetHeight });
      update();
    });
    ro.observe(el);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const { jacks, height } = layout;
  const points = [0, ...jacks, height];
  let d = `M ${X} 0`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    d += ` C ${BULGE} ${a + (b - a) * 0.3}, ${BULGE} ${a + (b - a) * 0.7}, ${X} ${b}`;
  }

  return (
    <div ref={wrap} className="relative md:pl-14">
      {height > 0 && (
        <div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 hidden w-11 md:block" style={{ height }}>
          <svg width="44" height={height} viewBox={`0 0 44 ${height}`} className="absolute inset-0 overflow-visible">
            <path d={d} fill="none" stroke="#CFC7B3" strokeWidth="3" strokeDasharray="2 7" strokeLinecap="round" />
            <path ref={live} d={d} fill="none" stroke="#D7263D" strokeWidth="4" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset="1" />
          </svg>
          {jacks.map((y, i) => (
            <span key={i}>
              <i className="jack absolute" style={{ top: y - 12, left: X - 12 }} />
              <i className="lamp absolute" data-on={i < reached} style={{ top: y - 27, left: X - 4.5, width: 9, height: 9 }} />
            </span>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
