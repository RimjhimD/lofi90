import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ENTRIES, TYPES, findEntry, pad } from "@/lib/registry";
import { highlight, readRepoFile } from "@/lib/source";
import { Stage } from "@/site/Stage";
import { CodePanel, CopyButton } from "@/site/CodePanel";
import { Flow } from "@/site/Flow";
import { StatesGrid } from "@/site/StatesGrid";
import { ScrollCable } from "@/site/ScrollCable";
import { SectionNav } from "@/site/SectionNav";

export function generateStaticParams() {
  return ENTRIES.map((e) => ({ slug: e.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const entry = findEntry((await params).slug);
  return entry ? { title: entry.name, description: entry.summary } : {};
}

const SECTIONS = [
  ["how", "How it works"],
  ["when", "When to use it"],
  ["usage", "Usage"],
  ["states", "States"],
  ["props", "Props"],
  ["prompt", "Build prompt"],
  ["a11y", "Accessibility"],
] as const;

const BADGES = ["Keyboard", "Contrast AA", "Reduced motion", "375 / 768 / 1280", "0 deps"];

function Section({ id, title, children, lead }: { id: string; title: string; lead?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-32 pt-16">
      <h2 id={`${id}-title`} className="font-display text-[2.4rem] font-bold uppercase leading-none">
        {title}
      </h2>
      {lead && <p className="mb-6 mt-2 max-w-[70ch] text-muted">{lead}</p>}
      <div className={lead ? "" : "mt-6"}>{children}</div>
    </section>
  );
}

const box = "border-2 border-ink bg-white p-5";

export default async function ComponentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = findEntry(slug);
  if (!entry) notFound();
  const exchange = pad(TYPES.findIndex((t) => t.id === entry.type) + 1);
  const index = ENTRIES.indexOf(entry);
  const next = ENTRIES[(index + 1) % ENTRIES.length];
  const prev = ENTRIES[(index - 1 + ENTRIES.length) % ENTRIES.length];

  const [usage, prompt, sources] = await Promise.all([
    readRepoFile(entry.usagePath),
    readRepoFile(entry.promptPath),
    Promise.all(entry.files.map(async (f) => ({ label: f.label, code: await readRepoFile(f.path), path: f.path }))),
  ]);
  const sourceFiles = await Promise.all(sources.map(async (s) => ({ label: s.label, code: s.code, html: await highlight(s.code, s.path) })));
  const usageFile = { label: "usage.tsx", code: usage, html: await highlight(usage, "usage.tsx") };

  return (
    <main className="mx-auto max-w-[1280px] px-6 pb-32">
      <nav aria-label="Breadcrumb" className="mono flex flex-wrap items-center gap-2 pt-6 text-muted">
        <Link href="/" className="text-ink underline decoration-signal decoration-2 underline-offset-4">Board</Link>›
        <Link href={`/#ex-${entry.type}`} className="hover:text-ink">Exchange {exchange} · {entry.type}</Link>›<span className="text-ink">Line {entry.ext}</span>
      </nav>

      <header className="anim-rise mt-4 border-2 border-ink bg-bottle text-bone">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
          <i className="lamp" data-on="true" />
          <h1 className="font-display text-[clamp(2.2rem,4.6vw,3.6rem)] font-black uppercase leading-none">{entry.name}</h1>
          <span className="mono ml-auto text-bone/80">/components/{entry.slug}</span>
        </div>
        <p className="border-t border-bone/20 px-5 py-4 text-[1.05rem] leading-relaxed text-bone/90 lg:max-w-[85ch]">{entry.why}</p>
        <ul aria-label="Quality checks" className="flex flex-wrap gap-2 border-t border-bone/20 px-5 py-3">
          {BADGES.map((b) => (
            <li key={b} className="mono border border-bone/50 px-2 py-1 text-[0.66rem]">✓ {b}</li>
          ))}
        </ul>
      </header>

      {/* 1. Preview and source, side by side */}
      <div className="mt-6 grid items-stretch gap-5 lg:grid-cols-2">
        <Stage slug={entry.slug} />
        <CodePanel files={sourceFiles} title="Source" maxHeight="560px" />
      </div>

      <SectionNav sections={SECTIONS} />

      <ScrollCable>
        <Section id="how" title="How it works" lead="The flow from the user's first tap to the end result, including what happens when things go wrong.">
          <Flow steps={entry.flow} />
        </Section>

        <Section id="when" title="When to use it">
          <div className="grid gap-5 md:grid-cols-2">
            <div className={`${box} border-l-[6px] border-l-bottle`}>
              <h3 className="mono mb-3 text-bottle">✓ Great for</h3>
              <ul className="space-y-2">
                {entry.useWhen.map((u) => (
                  <li key={u}>— {u}</li>
                ))}
              </ul>
            </div>
            <div className={`${box} border-l-[6px] border-l-signal`}>
              <h3 className="mono mb-3 text-signal">✕ Skip it when</h3>
              <ul className="space-y-2">
                {entry.avoidWhen.map((u) => (
                  <li key={u}>— {u}</li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        <Section id="usage" title="Usage" lead="Copy the component file into your project (React + Tailwind, no other packages), then use it like this.">
          <CodePanel files={[usageFile]} />
        </Section>

        <Section id="states" title="States" lead="Every state the component can be in, rendered live.">
          <StatesGrid slug={entry.slug} />
        </Section>

        <Section id="props" title="Props">
          <div className="overflow-x-auto border-2 border-ink bg-white">
            <table className="w-full min-w-[720px] border-collapse text-left text-[0.95rem]">
              <thead className="bg-ink text-bone">
                <tr className="[&>th]:mono [&>th]:px-4 [&>th]:py-2.5 [&>th]:font-normal">
                  <th>Prop</th>
                  <th>Type</th>
                  <th>Default</th>
                  <th>What it does</th>
                </tr>
              </thead>
              <tbody>
                {entry.props.map((p) => (
                  <tr key={p.name} className="[&>td]:border-b [&>td]:border-rule [&>td]:px-4 [&>td]:py-2.5 [&>td]:align-top">
                    <td className="font-bold">{p.name}</td>
                    <td>
                      <code className="bg-bone-2 px-1.5 py-0.5 font-mono text-xs">{p.type}</code>
                    </td>
                    <td className="font-mono text-sm">{p.default}</td>
                    <td className="text-muted">{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="prompt" title="Build prompt" lead="The final prompt used to build this component.">
          <div className="border-2 border-ink bg-white">
            <div className="flex items-center justify-between border-b-2 border-ink px-4 py-2">
              <span className="mono">prompt.md</span>
              <CopyButton text={prompt} label="Copy prompt" />
            </div>
            <p className="whitespace-pre-wrap p-5 leading-relaxed">{prompt}</p>
          </div>
        </Section>

        <Section id="a11y" title="Accessibility & support">
          <div className="grid gap-5 md:grid-cols-[2fr_1fr]">
            <ul className={`${box} space-y-2.5`}>
              {entry.accessibility.map((a) => (
                <li key={a} className="flex gap-2.5">
                  <span aria-hidden="true" className="mt-1 grid h-5 w-5 shrink-0 place-items-center bg-bottle text-[11px] text-bone">✓</span>
                  {a}
                </li>
              ))}
            </ul>
            <div className={`${box} bg-bone-2`}>
              <h3 className="mono mb-2">Browser support</h3>
              <p>{entry.support}</p>
            </div>
          </div>
        </Section>
      </ScrollCable>

      <nav aria-label="More components" className="mt-16 flex flex-wrap justify-between gap-3 border-t-2 border-ink pt-6">
        <Link href={`/components/${prev.slug}`} className="sb-btn">‹ Line {prev.ext} · {prev.name}</Link>
        <Link href={`/components/${next.slug}`} className="sb-btn border-signal! bg-signal! text-white">Line {next.ext} · {next.name} ›</Link>
      </nav>
    </main>
  );
}
