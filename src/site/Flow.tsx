"use client";

import { useEffect, useRef, useState } from "react";
import type { FlowStep } from "@/lib/registry";

const TONE = {
  good: "bg-p5",
  bad: "bg-[#FFD6D6]",
  neutral: "bg-paper",
} as const;

/** "How it works": numbered steps joined by arrows; side branches hang under a step. Steps pop in when scrolled to. */
export function Flow({ steps }: { steps: FlowStep[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setShown(true), io.disconnect()), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <ol ref={ref} className="grid gap-x-3 gap-y-6 md:grid-cols-[repeat(var(--n),minmax(0,1fr))]" style={{ ["--n" as string]: steps.length }}>
      {steps.map((s, i) => (
        <li
          key={s.title}
          className="relative flex flex-col gap-3 transition-[opacity,transform] duration-500 [transition-timing-function:cubic-bezier(.3,1.6,.5,1)]"
          style={{ opacity: shown ? 1 : 0, transform: shown ? "none" : "translateY(30px) scale(.92)", transitionDelay: `${i * 160}ms` }}
        >
          <div className="relative rounded-[20px] border-4 border-ink bg-paper p-4 shadow-[6px_6px_0_#20201C]">
            <span className="absolute -left-3 -top-3 grid h-8 w-8 place-items-center rounded-full border-[3px] border-ink bg-p2 font-title text-sm">{i + 1}</span>
            <div className="mb-1 text-3xl" aria-hidden="true">{s.icon}</div>
            <h3 className="font-title text-lg leading-tight">{s.title}</h3>
            <p className="mt-1 text-sm font-semibold leading-snug text-[#4d4a40]">{s.text}</p>
          </div>
          {i < steps.length - 1 && (
            <span aria-hidden="true" className="absolute -right-[18px] top-10 z-10 hidden font-title text-2xl text-board [text-shadow:2px_2px_0_#20201C] md:block">
              ➜
            </span>
          )}
          {s.branches?.map((b) => (
            <div key={b.label} className={`ml-4 rounded-2xl border-[3px] border-dashed border-ink px-3 py-2 text-sm ${TONE[b.tone]}`}>
              <b className="block font-extrabold">↳ {b.label}</b>
              <span className="font-semibold">{b.text}</span>
            </div>
          ))}
        </li>
      ))}
    </ol>
  );
}
