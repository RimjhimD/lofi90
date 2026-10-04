import Link from "next/link";
import { ENTRIES } from "@/lib/registry";
import { Intro } from "@/site/Intro";
import { ReplayIntro } from "@/site/ReplayIntro";
import { HoverCable } from "@/site/HoverCable";
import { Exchanges } from "@/site/Exchanges";
import { HeroBoard } from "@/site/HeroBoard";

const WORDS = ["Component", "Exchange"];

export default function Home() {
  return (
    <>
      <Intro />
      <HoverCable />
      <main className="mx-auto max-w-[1180px] px-6 pb-32 lg:px-10">
        <section className="relative flex min-h-[calc(100vh-60px)] flex-col justify-center gap-10 border-b-2 border-ink py-14">
          <div className="grid items-center gap-12 xl:grid-cols-[1fr_1.05fr]">
            <div>
              <span className="ready-rise mono flex items-center gap-2 text-muted">
                <i className="lamp anim-blink" data-on="true" style={{ width: 8, height: 8 }} /> Operator · Rimjhim
              </span>
              <h1 aria-label="Component Exchange" className="mt-4 font-display font-black uppercase leading-[0.82] tracking-tight">
                {WORDS.map((w, i) => (
                  <span key={w} aria-hidden="true" className="block overflow-hidden">
                    <span
                      className={`ready-rise block text-[clamp(3.6rem,9vw,8.4rem)] ${i === 1 ? "text-signal" : ""}`}
                      style={{ animationDelay: `${120 + i * 140}ms` }}
                    >
                      {w}
                    </span>
                  </span>
                ))}
              </h1>
              <p className="ready-rise mono mt-6 text-[0.86rem] text-ink" style={{ animationDelay: "420ms" }}>
                Thirty lines. Ninety days. Every prompt on record.
              </p>
              <p className="ready-rise mt-4 max-w-[48ch] text-muted" style={{ animationDelay: "520ms" }}>
                React components for businesses that run on texts, calls and bookings. Each one works live on this page, with its full code and the prompt that built it.
              </p>
            </div>
            <div className="ready-rise" style={{ animationDelay: "380ms" }}>
              <HeroBoard />
            </div>
          </div>

          <div className="ready-rise flex flex-wrap items-center justify-between gap-3" style={{ animationDelay: "700ms" }}>
            <Link href="#lines" className="sb-btn border-signal! bg-signal! text-white">
              See the {ENTRIES.length} live ↓
            </Link>
            <span className="mono text-muted">Hover the board · press a lit jack to open it</span>
          </div>
        </section>

        <Exchanges id="lines" />
      </main>
      <ReplayIntro />
    </>
  );
}
