"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { STATES } from "@/lib/demos";

/** Zooms a frozen component so it fills its tile: small things (a button) grow, big things (a card) shrink to fit. */
function Fit({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: 0.8, height: 240 });
  useLayoutEffect(() => {
    const b = box.current;
    const i = inner.current;
    if (!b || !i) return;
    const fit = () => {
      const w = i.offsetWidth;
      const h = i.offsetHeight;
      if (!w || !h) return;
      // fill the tile's width, then let the tile grow to the component's height
      const scale = Math.min((b.clientWidth * 0.84) / w, 1.3);
      setFit({ scale, height: Math.max(220, Math.round(h * scale + 56)) });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(b);
    ro.observe(i);
    return () => ro.disconnect();
  }, []);
  return (
    <div
      ref={box}
      aria-hidden="true"
      className="screen relative overflow-hidden bg-[radial-gradient(rgba(233,237,232,.05)_1px,transparent_1.2px)] bg-[length:14px_14px]"
      style={{ height: fit.height }}
    >
      <div
        ref={inner}
        inert
        className="pointer-events-none absolute left-1/2 top-1/2 w-max max-w-[440px] "
        style={{ transform: `translate(-50%,-50%) scale(${fit.scale})` }}
      >
        {children}
      </div>
    </div>
  );
}

/** States as a grid of tiles big enough to read: each the real component, frozen, with a label and what it means. */
export function StatesRow({ slug }: { slug: string }) {
  const states = STATES[slug] ?? [];
  return (
    <ul className="grid items-start gap-4 md:grid-cols-2">
      {states.map((s) => (
        <li key={s.id} data-reveal className="panel group flex flex-col overflow-hidden transition-colors hover:border-acc/40">
          <Fit>{s.node}</Fit>
          <div className="border-t border-line px-4 py-3">
            <p className="text-sm font-semibold text-text">{s.label}</p>
            <p className="mt-0.5 text-[0.82rem] leading-snug text-mute">{s.note}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
