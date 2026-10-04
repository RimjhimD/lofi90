import Link from "next/link";
import { ENTRIES, TYPES, pad } from "@/lib/registry";
import { Intro } from "@/site/Intro";
import { ReplayIntro } from "@/site/ReplayIntro";
import { HoverCable } from "@/site/HoverCable";
import { CardPreview } from "@/site/CardPreview";

const TOTAL = 30;
const TAGLINES: Record<string, string> = {
  button: "Things that act once",
  input: "Things that listen",
  form: "Things that ask properly",
  card: "Things that tell the truth",
  modal: "Things that interrupt politely",
  table: "Things that line up",
  loader: "Things that wait out loud",
  navbar: "Things that route the call",
  section: "Things that explain",
  chart: "Things that measure",
};

export default function Home() {
  const exchanges = TYPES.map((t, i) => ({ ...t, no: pad(i + 1), entries: ENTRIES.filter((e) => e.type === t.id) })).filter((t) => t.entries.length);
  const first = ENTRIES[0];

  return (
    <>
      <Intro />
      <HoverCable />
      <main className="mx-auto max-w-[1240px] px-6 pb-32">
        <section className="grid gap-12 border-b-2 border-ink pb-14 pt-16 lg:grid-cols-[1.3fr_1fr] lg:pt-[72px]">
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
              <Link href="#lines" className="sb-btn">
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

        <div id="lines" className="scroll-mt-20">
          {exchanges.map((t) => (
            <section key={t.id} id={`ex-${t.id}`} aria-labelledby={`ex-${t.id}-title`} className="scroll-mt-20 pt-12">
              <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-rule pb-2.5">
                <h2 id={`ex-${t.id}-title`} className="font-display text-[2.4rem] font-bold uppercase leading-none">
                  Exchange {t.no} · {t.id}
                </h2>
                <span className="mono text-muted">{TAGLINES[t.id]}</span>
              </div>
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-5">
                {t.entries.map((e, i) => {
                  return (
                    <li key={e.slug} className="anim-rise" style={{ animationDelay: `${i * 90}ms` }}>
                      <Link
                        href={`/components/${e.slug}`}
                        data-line={e.type}
                        className="group relative flex h-full flex-col border-2 border-ink bg-white transition-[transform,box-shadow] duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_#0E3B2E] focus-visible:-translate-x-[3px] focus-visible:-translate-y-[3px] focus-visible:shadow-[6px_6px_0_#0E3B2E] focus-visible:outline-none"
                      >
                        <span className="lamp absolute right-2.5 top-2.5 z-10" aria-hidden="true" />
                        <div aria-hidden="true" className="relative grid h-[190px] place-items-center overflow-hidden border-b-2 border-ink bg-bone-2">
                          <CardPreview slug={e.slug} />
                        </div>
                        <div className="flex flex-1 items-start gap-3 px-4 py-3.5">
                          <i data-jack className="jack mt-0.5" style={{ width: 22, height: 22, borderWidth: 3 }} />
                          <div className="min-w-0">
                            <b className="block font-display text-[1.4rem] font-bold leading-tight">{e.name}</b>
                            <span className="mono text-[0.66rem] text-muted">Line {e.ext} · {e.type}</span>
                            <p className="mt-1.5 text-[0.92rem] leading-snug text-muted">{e.summary}</p>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <ReplayIntro />
    </>
  );
}
