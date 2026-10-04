import Link from "next/link";
import { ENTRIES, TYPES, pad } from "@/lib/registry";
import { CardPreview } from "@/site/CardPreview";

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

/** Built components grouped by type ("exchange"), each card carrying a live mini preview. */
export function Exchanges({ id }: { id?: string }) {
  const exchanges = TYPES.map((t, i) => ({ ...t, no: pad(i + 1), entries: ENTRIES.filter((e) => e.type === t.id) })).filter((t) => t.entries.length);
  return (
        <div id={id} className="scroll-mt-20">
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
  );
}
