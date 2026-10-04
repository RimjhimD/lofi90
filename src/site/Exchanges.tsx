import Link from "next/link";
import { ENTRIES, TYPES, pad } from "@/lib/registry";
import { CardPreview } from "@/site/CardPreview";
import { TiltCard } from "@/site/TiltCard";

const TAGLINES: Record<string, string> = {
  button: "Actions with second thoughts built in",
  input: "Fields that catch the mistake before it ships",
  form: "Forms that ask properly",
  card: "Surfaces that hold one thing well",
  modal: "Layers that interrupt only when it helps",
  table: "Dense data, readable",
  loader: "Waiting, explained",
  navbar: "Getting around without getting lost",
  section: "Page-sized ideas",
  chart: "Numbers you can feel",
};

/** Built components grouped by type, each card carrying a live, inert mini preview. */
export function Exchanges({ id }: { id?: string }) {
  const groups = TYPES.map((t, i) => ({ ...t, no: pad(i + 1), entries: ENTRIES.filter((e) => e.type === t.id) })).filter((t) => t.entries.length);
  return (
    <div id={id} className="scroll-mt-28">
      {groups.map((t) => (
        <section key={t.id} id={`type-${t.id}`} aria-labelledby={`type-${t.id}-title`} className="scroll-mt-28 pt-14">
          <div className="mb-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="mono text-acc">Type {t.no}</span>
            <h2 id={`type-${t.id}-title`} className="font-display text-3xl font-semibold capitalize tracking-tight">
              {t.label}
            </h2>
            <span className="text-sm text-mute">{TAGLINES[t.id]}</span>
          </div>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
            {t.entries.map((e, i) => (
              <li key={e.slug} className="anim-rise" style={{ animationDelay: `${i * 90}ms` }}>
                <TiltCard>
                  <Link
                    href={`/components/${e.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-[14px] border border-line bg-panel transition-[border-color,box-shadow] duration-300 hover:border-acc/60 hover:shadow-[0_0_40px_-12px_rgba(198,255,61,.45)] focus-visible:border-acc focus-visible:outline-none"
                  >
                    <div className="flex items-center justify-between px-4 pt-3">
                      <span className="mono text-[0.62rem] text-mute">
                        {e.type} · {e.ext}
                      </span>
                      <i className="led" data-on="true" data-pulse="true" style={{ width: 7, height: 7 }} />
                    </div>
                    <div aria-hidden="true" className="relative m-3 grid h-[200px] place-items-center overflow-hidden rounded-[10px] border border-line bg-bg bg-[radial-gradient(rgba(233,237,232,.07)_1px,transparent_1.2px)] bg-[length:16px_16px]">
                      <CardPreview slug={e.slug} />
                    </div>
                    <div className="px-4 pb-4">
                      <h3 className="font-display text-lg font-semibold">{e.name}</h3>
                      <p className="mt-1 text-sm leading-snug text-mute">{e.summary}</p>
                      <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-acc">
                        Open <span className="transition-transform group-hover:translate-x-1">→</span>
                      </span>
                    </div>
                  </Link>
                </TiltCard>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
