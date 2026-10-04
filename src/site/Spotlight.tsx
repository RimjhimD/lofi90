"use client";

import { useEffect, useRef } from "react";

/**
 * A soft lime glow that follows the cursor. It is its own fixed layer moved with transform, so following
 * the mouse never makes the browser restyle the page (which made live previews stutter).
 */
export function Spotlight() {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (el.current) el.current.style.transform = `translate3d(${e.clientX - 600}px, ${e.clientY - 600}px, 0)`;
      });
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
    };
  }, []);
  return (
    <div
      ref={el}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 -z-10 h-[1200px] w-[1200px] rounded-full will-change-transform [background:radial-gradient(circle,var(--glow),transparent_50%)] [transform:translate3d(calc(50vw-600px),-400px,0)]"
    />
  );
}
