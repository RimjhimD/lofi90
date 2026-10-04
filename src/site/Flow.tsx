"use client";

import { useEffect, useRef, useState } from "react";
import type { FlowStep } from "@/lib/registry";

const TONE = {
  good: "border-acc/40 text-acc",
  bad: "border-err/40 text-err",
  neutral: "border-line-2 text-mute",
} as const;

/** "How it works": numbered steps joined by a flowing signal line; side branches hang under a step. */
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
    <div className="relative">
      {/* the signal line, with a lime packet riding along it */}
      <svg aria-hidden="true" className="pointer-events-none absolute left-0 right-0 top-[26px] hidden h-2 w-full md:block" preserveAspectRatio="none" viewBox="0 0 100 2">
        <line x1="2" y1="1" x2="98" y2="1" stroke="#3A433F" strokeWidth="0.4" strokeDasharray="1.2 1.2" className="animate-[flow_3s_linear_infinite]" vectorEffect="non-scaling-stroke" />
      </svg>
      <span aria-hidden="true" className="pointer-events-none absolute top-[23px] hidden h-2 w-2 rounded-full bg-acc shadow-[0_0_12px_2px_rgba(198,255,61,.7)] md:block motion-safe:animate-[packet_4s_ease-in-out_infinite]" />
      <ol ref={ref} className="relative grid gap-x-4 gap-y-5 md:grid-cols-[repeat(var(--n),minmax(0,1fr))]" style={{ ["--n" as string]: steps.length }}>
        {steps.map((s, i) => (
          <li
            key={s.title}
            className="flex flex-col gap-3 transition-[opacity,transform] duration-500"
            style={{ opacity: shown ? 1 : 0, transform: shown ? "none" : "translateY(16px)", transitionDelay: `${i * 140}ms` }}
          >
            <div className="panel relative p-4 pt-9">
              <span className="mono absolute left-4 top-3 flex items-center gap-1.5 text-[0.62rem] text-mute">
                <i className="led" data-on={shown} style={{ width: 6, height: 6, transitionDelay: `${i * 140 + 300}ms` }} /> Step {i + 1}
              </span>
              <div className="mb-1 text-xl" aria-hidden="true">{s.icon}</div>
              <h3 className="font-display font-semibold leading-tight">{s.title}</h3>
              <p className="mt-1 text-sm leading-snug text-mute">{s.text}</p>
            </div>
            {s.branches?.map((b) => (
              <div key={b.label} className={`ml-3 rounded-lg border border-dashed bg-panel/60 px-3 py-2 text-sm ${TONE[b.tone]}`}>
                <b className="mono block text-[0.62rem]">↳ {b.label}</b>
                <span className="text-text/80">{b.text}</span>
              </div>
            ))}
          </li>
        ))}
      </ol>
      <style>{`@keyframes packet{0%{left:2%}100%{left:98%}}`}</style>
    </div>
  );
}
