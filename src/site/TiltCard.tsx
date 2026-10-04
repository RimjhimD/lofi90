"use client";

import { useRef } from "react";

/** Leans its content up to 4° toward the cursor, with a soft lime glare where the pointer is. */
export function TiltCard({ children }: { children: React.ReactNode }) {
  const el = useRef<HTMLDivElement>(null);
  const reduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return (
    <div
      ref={el}
      className="group/tilt relative h-full [transform-style:preserve-3d] transition-transform duration-200 ease-out [perspective:900px]"
      onPointerMove={(e) => {
        if (reduce() || e.pointerType !== "mouse" || !el.current) return;
        const r = el.current.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.current.style.transform = `perspective(900px) rotateX(${-y * 6}deg) rotateY(${x * 8}deg) translateY(-3px)`;
        el.current.style.setProperty("--gx", `${(x + 0.5) * 100}%`);
        el.current.style.setProperty("--gy", `${(y + 0.5) * 100}%`);
      }}
      onPointerLeave={() => {
        if (el.current) el.current.style.transform = "";
      }}
    >
      {children}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[14px] opacity-0 transition-opacity duration-300 [background:radial-gradient(300px_circle_at_var(--gx,50%)_var(--gy,50%),rgba(198,255,61,.08),transparent_60%)] group-hover/tilt:opacity-100" />
    </div>
  );
}
