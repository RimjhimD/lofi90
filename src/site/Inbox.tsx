"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ENTRIES, TYPES, type ComponentType, typeOf } from "@/lib/registry";

/** Every built component, as cards that pop in on scroll. Only types that have components get a filter. */
export function Inbox() {
  const [filter, setFilter] = useState<ComponentType | "all">("all");
  const grid = useRef<HTMLDivElement>(null);
  const shown = ENTRIES.filter((e) => filter === "all" || e.type === filter);
  const usedTypes = TYPES.filter((t) => ENTRIES.some((e) => e.type === t.id));

  useEffect(() => {
    const cards = grid.current?.querySelectorAll<HTMLElement>("[data-card]") ?? [];
    let n = 0;
    const io = new IntersectionObserver(
      (items) =>
        items.forEach((item) => {
          if (!item.isIntersecting) return;
          const el = item.target as HTMLElement;
          el.style.transitionDelay = `${n++ * 80}ms`;
          el.dataset.in = "true";
          window.setTimeout(() => (el.style.transitionDelay = "0ms"), 900);
          io.unobserve(el);
        }),
      { threshold: 0.15 },
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [filter]);

  return (
    <section id="inbox" className="scroll-mt-6 pb-24">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-title text-4xl text-board title-shadow">Inbox · {ENTRIES.length} components</h2>
        <div role="group" aria-label="Filter by type" className="flex flex-wrap gap-1.5">
          <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")} className="chunk px-3 text-sm">
            All
          </button>
          {usedTypes.map((t) => (
            <button key={t.id} type="button" aria-pressed={filter === t.id} onClick={() => setFilter(t.id)} className="chunk px-3 text-sm">
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={grid} className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6">
        {shown.map((e) => {
          const t = typeOf(e.type);
          return (
            <Link
              key={e.slug}
              href={`/components/${e.slug}`}
              data-card
              className="group flex translate-y-10 scale-90 flex-col overflow-hidden rounded-[22px] border-4 border-ink bg-paper opacity-0 shadow-[7px_7px_0_#20201C] transition-[opacity,transform,box-shadow] duration-500 [transition-timing-function:cubic-bezier(.3,1.6,.5,1)] hover:-translate-x-[3px] hover:-translate-y-[3px] hover:-rotate-1 hover:shadow-[10px_10px_0_#20201C] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-p2 data-[in=true]:translate-y-0 data-[in=true]:scale-100 data-[in=true]:opacity-100"
            >
              <div className="h-[18px] border-b-4 border-ink" style={{ background: t.color }} />
              <div className="relative mx-3.5 mt-3.5 grid h-[120px] place-items-center rounded-2xl border-4 border-ink bg-board text-[2.6rem]">
                <span className="anim-blink absolute left-2 top-1.5 text-[0.7rem] font-extrabold">✉ NEW</span>
                <span className="absolute right-2 top-1.5 font-title text-sm">ext {e.ext}</span>
                <span className="inline-block transition-transform duration-300 [transition-timing-function:cubic-bezier(.3,1.8,.5,1)] group-hover:-rotate-12 group-hover:scale-125">
                  {e.icon}
                </span>
              </div>
              <div className="px-4 pb-4 pt-3">
                <h3 className="font-title text-[1.4rem] leading-tight">{e.name}</h3>
                <p className="mb-2 mt-1 text-sm font-semibold text-[#4d4a40]">{e.summary}</p>
                <span className="mr-1 inline-block rounded-full border-[3px] border-ink px-2 text-xs font-extrabold" style={{ background: t.color }}>
                  {e.type}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
