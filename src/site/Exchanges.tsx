import Link from "next/link";
import { ENTRIES, TYPES, pad, type Entry } from "@/lib/registry";
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

function Card({ e, i }: { e: Entry; i: number }) {
  return (
    <li data-reveal style={{ ["--reveal-delay" as string]: `${i * 110}ms` }}>
      <TiltCard>
        <Link
          href={`/components/${e.slug}`}
          className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-panel transition-[border-color,box-shadow,transform] duration-500 hover:-translate-y-1 hover:border-acc/50 hover:shadow-[0_24px_60px_-28px_rgba(198,255,61,.45)] focus-visible:border-acc focus-visible:outline-none"
        >
          <div className="border-b border-line">
            <CardPreview slug={e.slug} />
          </div>
          <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
            <span className="mono text-[0.6rem] text-mute">
              <span className="text-acc">No.</span> {e.ext}
            </span>
            <h3 className="mt-1 font-display text-lg font-semibold tracking-tight">{e.name}</h3>
            <p className="mt-1.5 flex-1 text-sm leading-snug text-mute">{e.summary}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="mono rounded-full border border-line-2 px-2 py-0.5 text-[0.58rem] text-mute">Type: {e.type}</span>
              <span className="flex items-center gap-1 text-sm font-medium text-acc opacity-70 transition-opacity group-hover:opacity-100">
                Open <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </span>
            </div>
          </div>
        </Link>
      </TiltCard>
    </li>
  );
}

/** What is still to come: a dim card holding the next slot. */
function NextCard({ i }: { i: number }) {
  return (
    <li data-reveal style={{ ["--reveal-delay" as string]: `${i * 110}ms` }} className="flex flex-col overflow-hidden rounded-2xl border border-dashed border-line">
      <div className="stage-tile screen stage-dark grid h-[210px] place-items-center border-b border-dashed border-line">
        <i className="led" data-on="true" data-pulse="true" />
      </div>
      <div className="px-5 pb-5 pt-4">
        <span className="mono text-[0.6rem] text-mute">No. {pad(ENTRIES.length + 1)}</span>
        <h3 className="mt-1 font-display text-lg font-semibold tracking-tight text-mute">Next one is on the bench</h3>
        <p className="mt-1.5 text-sm text-mute">{30 - ENTRIES.length} more to go.</p>
      </div>
    </li>
  );
}

const GRID = "grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-5";

/**
 * The gallery. `flat` (home page): every component in one grid, plus the next empty slot.
 * Otherwise (Components page): grouped by type, so the sidebar can jump to a type.
 */
export function Exchanges({ id, flat = false }: { id?: string; flat?: boolean }) {
  if (flat)
    return (
      <section id={id} aria-labelledby="collection-title" className="scroll-mt-28 pt-24">
        <div data-reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mono text-acc">The collection</p>
            <h2 id="collection-title" className="mt-2 font-display text-4xl font-semibold tracking-tight">
              Shipped so far
            </h2>
          </div>
          <Link href="/components" className="text-sm font-medium text-mute transition-colors hover:text-acc">
            Browse by type →
          </Link>
        </div>
        <ul className={GRID}>
          {ENTRIES.map((e, i) => (
            <Card key={e.slug} e={e} i={i} />
          ))}
          <NextCard i={ENTRIES.length} />
        </ul>
      </section>
    );

  const groups = TYPES.map((t, i) => ({ ...t, no: pad(i + 1), entries: ENTRIES.filter((e) => e.type === t.id) })).filter((t) => t.entries.length);
  return (
    <div id={id} className="scroll-mt-28">
      {groups.map((t) => (
        <section key={t.id} id={`type-${t.id}`} aria-labelledby={`type-${t.id}-title`} className="scroll-mt-28 pt-14">
          <div data-reveal className="mb-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="mono text-acc">Type {t.no}</span>
            <h2 id={`type-${t.id}-title`} className="font-display text-3xl font-semibold capitalize tracking-tight">
              {t.label}
            </h2>
            <span className="text-sm text-mute">{TAGLINES[t.id]}</span>
          </div>
          <ul className={GRID}>
            {t.entries.map((e, i) => (
              <Card key={e.slug} e={e} i={i} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
