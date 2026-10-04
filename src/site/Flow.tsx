"use client";

import { useEffect, useRef, useState } from "react";
import type { FlowStep } from "@/lib/registry";

const TONE = {
  good: "border-bottle bg-bottle text-bone",
  bad: "border-signal bg-white text-signal",
  neutral: "border-ink bg-bone text-ink",
} as const;

/** "How it works": numbered steps joined by cable; side branches hang under a step. Steps light up in order when scrolled to. */
export function Flow({ steps }: { steps: FlowStep[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setShown(true), io.disconnect()), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <ol ref={ref} className="grid gap-x-5 gap-y-6 md:grid-cols-[repeat(var(--n),minmax(0,1fr))]" style={{ ["--n" as string]: steps.length }}>
      {steps.map((s, i) => (
        <li
          key={s.title}
          className="relative flex flex-col gap-3 transition-[opacity,transform] duration-500"
          style={{ opacity: shown ? 1 : 0, transform: shown ? "none" : "translateY(20px)", transitionDelay: `${i * 180}ms` }}
        >
          <div className="relative border-2 border-ink bg-white p-4 pt-5">
            <span className="absolute -top-3 left-3 flex items-center gap-1.5 bg-bone px-1.5">
              <i className="lamp" data-on={shown} style={{ width: 10, height: 10, transitionDelay: `${i * 180 + 300}ms` }} />
              <span className="mono">Step {i + 1}</span>
            </span>
            <div className="mb-1 text-2xl" aria-hidden="true">{s.icon}</div>
            <h3 className="font-display text-xl font-bold uppercase leading-tight">{s.title}</h3>
            <p className="mt-1 text-[0.92rem] leading-snug text-muted">{s.text}</p>
          </div>
          {i < steps.length - 1 && (
            <span aria-hidden="true" className="absolute -right-5 top-10 z-10 hidden h-1 w-5 bg-signal md:block" />
          )}
          {s.branches?.map((b) => (
            <div key={b.label} className={`ml-3 border-2 border-dashed px-3 py-2 text-sm ${TONE[b.tone]}`}>
              <b className="mono block">↳ {b.label}</b>
              <span>{b.text}</span>
            </div>
          ))}
        </li>
      ))}
    </ol>
  );
}
