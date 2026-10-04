import Link from "next/link";
import { ENTRIES, TYPES } from "@/lib/registry";
import { Intro } from "@/site/Intro";
import { Exchanges } from "@/site/Exchanges";
import { Radar } from "@/site/Radar";
import { Scramble } from "@/site/Scramble";
import { CountUp } from "@/site/CountUp";
import { PLAYGROUNDS } from "@/lib/playgrounds";

const PHRASES = ["think twice.", "guard your keys.", "spin to the M's.", "split to the cent."];

export default function Home() {
  const types = new Set(ENTRIES.map((e) => e.type)).size;
  const controls = Object.values(PLAYGROUNDS).reduce((n, p) => n + p.controls.length, 0);
  const stats = [
    { label: "Components live", node: <><CountUp to={ENTRIES.length} pad={2} /><span className="text-mute">/30</span></> },
    { label: "Types covered", node: <><CountUp to={types} pad={2} /><span className="text-mute">/{TYPES.length}</span></> },
    { label: "Prompts published", node: <CountUp to={100} suffix="%" /> },
    { label: "Live controls", node: <CountUp to={controls} /> },
  ];

  return (
    <>
      <Intro />
      <main className="mx-auto max-w-[1180px] px-6 pb-32 lg:px-10">
        <section className="relative flex min-h-[calc(100vh-88px)] flex-col justify-center gap-12 border-b border-line py-14">
          <div className="grid items-center gap-12 xl:grid-cols-[1.1fr_1fr]">
            <div>
              <span className="ready-rise mono flex items-center gap-2 text-[0.68rem] text-mute">
                <i className="led" data-on="true" data-pulse="true" /> Rimjhim · component control room
              </span>
              <h1 className="mt-5 font-display font-bold leading-[0.92] tracking-tight">
                <span className="block overflow-hidden">
                  <span className="ready-rise block text-[clamp(4.2rem,11vw,9.5rem)]" style={{ animationDelay: "100ms" }}>
                    lofi<span className="text-acc [text-shadow:0_0_50px_rgba(198,255,61,.35)]">90</span>
                  </span>
                </span>
                <span className="ready-rise mt-3 block text-[clamp(1.6rem,3.2vw,2.6rem)] font-semibold tracking-tight" style={{ animationDelay: "260ms" }}>
                  Components that <Scramble phrases={PHRASES} />
                </span>
              </h1>
              <p className="ready-rise mono mt-6 text-[0.74rem] text-acc" style={{ animationDelay: "380ms" }}>
                Thirty components · ninety days · every prompt published
              </p>
              <p className="ready-rise mt-3 max-w-[50ch] text-text/75" style={{ animationDelay: "460ms" }}>
                Unique React + TypeScript + Tailwind components. Each one runs live with a playground of controls, every state, its full code and the prompt that built it.
              </p>
              <div className="ready-rise mt-7 flex flex-wrap gap-3" style={{ animationDelay: "560ms" }}>
                <Link href="#lines" className="cr-btn cr-btn-acc">
                  See the {ENTRIES.length} live ↓
                </Link>
                <Link href="/components" className="cr-btn">
                  All components
                </Link>
              </div>
            </div>
            <div className="ready-rise" style={{ animationDelay: "300ms" }}>
              <Radar />
            </div>
          </div>

          <dl className="ready-rise grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-line bg-line md:grid-cols-4" style={{ animationDelay: "700ms" }}>
            {stats.map((s) => (
              <div key={s.label} className="bg-panel px-5 py-4">
                <dt className="mono text-[0.6rem] text-mute">{s.label}</dt>
                <dd className="mt-1 font-display text-3xl font-semibold">{s.node}</dd>
              </div>
            ))}
          </dl>
        </section>

        <Exchanges id="lines" />
      </main>
    </>
  );
}
