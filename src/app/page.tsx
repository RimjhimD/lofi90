import Link from "next/link";
import { ENTRIES, TYPES, pad } from "@/lib/registry";
import { Intro } from "@/site/Intro";
import { ReplayIntro } from "@/site/ReplayIntro";
import { HoverCable } from "@/site/HoverCable";
import { Exchanges } from "@/site/Exchanges";

const TOTAL = 30;

export default function Home() {
  const exchanges = TYPES.filter((t) => ENTRIES.some((e) => e.type === t.id));
  const first = ENTRIES[0];

  return (
    <>
      <Intro />
      <HoverCable />
      <main className="mx-auto max-w-[1180px] px-6 pb-32 lg:px-10">
        <section className="grid gap-12 border-b-2 border-ink pb-14 pt-16 xl:grid-cols-[1.4fr_1fr] lg:pt-[64px]">
          <div>
            <span className="ready-rise mono flex items-center gap-2 text-signal">
              <i className="lamp anim-blink" data-on="true" style={{ width: 8, height: 8 }} /> Exchange open · 90 day build
            </span>
            <h1 className="ready-rise mb-6 mt-3 font-display text-[clamp(3.4rem,8vw,7.5rem)] font-black uppercase leading-[0.86]" style={{ animationDelay: "120ms" }}>
              Every line <em className="not-italic text-signal">connected.</em>
            </h1>
            <p className="ready-rise max-w-[52ch] text-[1.1rem] text-muted" style={{ animationDelay: "240ms" }}>
              React + TypeScript + Tailwind components for the front desk of a real business: calls, texts, bots and bookings. Each one is a line on the board, with a live demo, its full source and the prompt that built it.
            </p>
            <div className="ready-rise mt-7 flex flex-wrap gap-3" style={{ animationDelay: "360ms" }}>
              <Link href={`/components/${first.slug}`} className="sb-btn border-signal! bg-signal! text-white">
                Pick up line {first.ext} ›
              </Link>
              <Link href="/components" className="sb-btn">
                See every line
              </Link>
            </div>
          </div>

          <div className="ready-rise relative self-end bg-bottle p-6 text-bone" style={{ animationDelay: "480ms" }}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-2 border border-dashed border-bone/35" />
            <div className="mono mb-1.5 opacity-70">Operator&apos;s ticket</div>
            <dl>
              {[
                ["Lines live", `${pad(ENTRIES.length)} / ${TOTAL}`],
                ["Exchanges", `${pad(exchanges.length)} / ${pad(TYPES.length)}`],
                ["Prompts logged", "100%"],
                ["A11y checked", "AA"],
              ].map(([k, v], i, all) => (
                <div key={k} className={`flex items-baseline justify-between py-2 ${i < all.length - 1 ? "border-b border-bone/20" : ""}`}>
                  <dt className="mono">{k}</dt>
                  <dd className="font-display text-[1.6rem] font-bold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <Exchanges id="lines" />
      </main>
      <ReplayIntro />
    </>
  );
}
