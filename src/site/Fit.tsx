"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * Shows a frozen component zoomed to fill its box: small things (a button) grow, big things (a receipt)
 * shrink to fit. With a fixed `height` it fits both ways; without one the box grows to the component.
 */
export function Fit({ children, height, max = 1.3, className = "" }: { children: ReactNode; height?: number; max?: number; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: 0.7, height: height ?? 240 });
  useLayoutEffect(() => {
    const b = box.current;
    const i = inner.current;
    if (!b || !i) return;
    const measure = () => {
      const w = i.offsetWidth;
      const h = i.offsetHeight;
      if (!w || !h) return;
      const byWidth = (b.clientWidth * 0.84) / w;
      const scale = height ? Math.min(byWidth, (height * 0.8) / h, max) : Math.min(byWidth, max);
      setFit({ scale, height: height ?? Math.max(220, Math.round(h * scale + 56)) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(b);
    ro.observe(i);
    return () => ro.disconnect();
  }, [height, max]);
  return (
    <div ref={box} aria-hidden="true" className={`relative overflow-hidden ${className}`} style={{ height: fit.height }}>
      <div
        ref={inner}
        inert
        className="pointer-events-none absolute left-1/2 top-1/2 w-max max-w-[440px]"
        style={{ transform: `translate(-50%,-50%) scale(${fit.scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
