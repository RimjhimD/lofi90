import Link from "next/link";
import { ENTRIES } from "@/lib/registry";
import { Intro } from "@/site/Intro";
import { Phone } from "@/site/Phone";
import { Inbox } from "@/site/Inbox";
import { ReplayIntro } from "@/site/ReplayIntro";

const WORDS = ["A", "component", "library", "in", "your", "pocket."];

export default function Home() {
  const latest = Math.max(...ENTRIES.map((e) => e.week));
  const newCount = ENTRIES.filter((e) => e.week === latest).length;
  const first = ENTRIES.find((e) => e.week === latest) ?? ENTRIES[0];

  return (
    <>
      <Intro />
      <main className="mx-auto max-w-[1240px] px-6">
        <section className="grid items-center gap-14 pb-20 pt-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <span className="anim-wobble inline-flex items-center gap-2 rounded-full border-4 border-ink bg-p2 px-3.5 py-0.5 font-extrabold shadow-[4px_4px_0_#20201C]">
              <i className="anim-blink block h-2.5 w-2.5 rounded-full border-2 border-ink bg-p1" />
              NEW MESSAGE ({newCount}) · WEEK {String(latest).padStart(2, "0")}
            </span>
            <h1 aria-label={WORDS.join(" ")} className="mb-4 mt-6 font-title text-[clamp(2.8rem,6vw,5.2rem)] leading-none text-board title-shadow">
              {WORDS.map((w, i) => (
                <span key={w} aria-hidden="true" className="ready-word mr-[0.25em] inline-block" style={{ animationDelay: `${150 + i * 90}ms`, color: i === WORDS.length - 1 ? "#FFB800" : undefined }}>
                  {w}
                </span>
              ))}
            </h1>
            <p className="ready-rise max-w-[46ch] text-lg font-semibold text-board" style={{ animationDelay: "700ms" }}>
              React + TypeScript + Tailwind components: everyday UI with a twist, and tools for real automation work. Each one ships with a live demo, its full source and the prompt that built it. Two new ones every week.
            </p>
            <p className="ready-rise mt-4 flex flex-wrap items-center gap-2 font-bold text-board" style={{ animationDelay: "850ms" }}>
              Drive the phone →
              {["▲", "▼", "Enter", "Esc"].map((k) => (
                <kbd key={k} className="rounded-lg border-[3px] border-ink bg-paper px-1.5 font-body font-extrabold text-ink shadow-[0_3px_0_#20201C]">
                  {k}
                </kbd>
              ))}
              or click its screen and type a name
            </p>
            <div className="ready-rise mt-6 flex flex-wrap gap-3" style={{ animationDelay: "1000ms" }}>
              <Link href={`/components/${first.slug}`} className="chunk bg-p1! px-5 py-2 text-lg text-white">
                Open week {String(latest).padStart(2, "0")} ▸
              </Link>
              <Link href="#inbox" className="chunk px-5 py-2 text-lg">
                See all
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            <Phone />
          </div>
        </section>
        <Inbox />
      </main>
      <ReplayIntro />
    </>
  );
}
