import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ENTRIES, TYPES, findEntry, pad } from "@/lib/registry";
import { highlight, readRepoFile } from "@/lib/source";
import { Stage } from "@/site/Stage";
import { CodePanel, CopyButton } from "@/site/CodePanel";
import { Flow } from "@/site/Flow";
import { StatesGrid } from "@/site/StatesGrid";
import { VariantsGrid } from "@/site/VariantsGrid";
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
  ["variants", "Variants"],
  ["states", "States"],
  ["props", "Props"],
  ["prompt", "Build prompt"],
  ["a11y", "Accessibility"],
] as const;

const BADGES = ["Keyboard", "Contrast AA", "Reduced motion", "375 / 768 / 1280", "0 deps"];

function Section({ id, title, children, lead }: { id: string; title: string; lead?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-40 pt-16">
      <h2 id={`${id}-title`} className="font-display text-[1.9rem] font-semibold tracking-tight">
        {title}
      </h2>
      {lead && <p className="mb-6 mt-1.5 max-w-[70ch] text-mute">{lead}</p>}
      <div className={lead ? "" : "mt-6"}>{children}</div>
    </section>
  );
}

const box = "panel p-5";

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
    <main className="mx-auto max-w-[1180px] px-6 pb-32 lg:px-10">
      <nav aria-label="Breadcrumb" className="mono flex flex-wrap items-center gap-2 pt-6 text-[0.66rem] text-mute">
        <Link href="/components" className="hover:text-text">Components</Link>/
        <Link href={`/components#type-${entry.type}`} className="hover:text-text">Type {exchange} · {entry.type}</Link>/<span className="text-acc">No. {entry.ext}</span>
      </nav>

      <header className="anim-rise mt-4">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
          <h1 className="font-display text-[clamp(2.2rem,4.6vw,3.6rem)] font-bold leading-[1.02] tracking-tight">{entry.name}</h1>
          <span className="mono mb-2 ml-auto flex items-center gap-2 text-[0.64rem] text-mute"><i className="led" data-on="true" data-pulse="true" /> /components/{entry.slug}</span>
        </div>
        <p className="mt-3 max-w-[80ch] text-[1.02rem] leading-relaxed text-text/80">{entry.why}</p>
        <ul aria-label="Quality checks" className="mt-4 flex flex-wrap gap-2">
          {BADGES.map((b) => (
            <li key={b} className="mono rounded-full border border-acc/30 bg-acc/5 px-2.5 py-1 text-[0.6rem] text-acc">✓ {b}</li>
          ))}
        </ul>
      </header>

      {/* 1. Preview and source, side by side */}
      <div className="mt-6 grid items-stretch gap-5 xl:grid-cols-2">
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
            <div className={`${box} border-l-2 border-l-acc`}>
              <h3 className="mono mb-3 text-[0.66rem] text-acc">✓ Great for</h3>
              <ul className="space-y-2">
                {entry.useWhen.map((u) => (
                  <li key={u} className="text-text/85">— {u}</li>
                ))}
              </ul>
            </div>
            <div className={`${box} border-l-2 border-l-err`}>
              <h3 className="mono mb-3 text-[0.66rem] text-err">✕ Skip it when</h3>
              <ul className="space-y-2">
                {entry.avoidWhen.map((u) => (
                  <li key={u} className="text-text/85">— {u}</li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        <Section id="usage" title="Usage" lead="Copy the component file into your project (React + Tailwind, no other packages), then use it like this.">
          <CodePanel files={[usageFile]} />
        </Section>

        <Section id="variants" title="Variants" lead="The same component in other colours, motions and sizes. Press replay to watch a tile's motion again, or use the controls under the live preview.">
          <VariantsGrid slug={entry.slug} />
        </Section>

        <Section id="states" title="States" lead="Every state the component can be in, rendered live.">
          <StatesGrid slug={entry.slug} />
        </Section>

        <Section id="props" title="Props">
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-[0.95rem]">
              <thead className="border-b border-line text-mute">
                <tr className="[&>th]:mono [&>th]:px-4 [&>th]:py-3 [&>th]:text-[0.62rem] [&>th]:font-normal">
                  <th>Prop</th>
                  <th>Type</th>
                  <th>Default</th>
                  <th>What it does</th>
                </tr>
              </thead>
              <tbody>
                {entry.props.map((p) => (
                  <tr key={p.name} className="[&>td]:border-b [&>td]:border-line [&>td]:px-4 [&>td]:py-2.5 [&>td]:align-top">
                    <td className="font-mono text-[0.8rem] text-acc">{p.name}</td>
                    <td>
                      <code className="rounded bg-panel-2 px-1.5 py-0.5 font-mono text-xs text-text/85">{p.type}</code>
                    </td>
                    <td className="font-mono text-xs text-mute">{p.default}</td>
                    <td className="text-text/80">{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="prompt" title="Build prompt" lead="The final prompt used to build this component.">
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-2">
              <span className="mono text-[0.64rem] text-acc">prompt.md</span>
              <CopyButton text={prompt} label="Copy prompt" />
            </div>
            <p className="whitespace-pre-wrap p-5 text-[0.95rem] leading-relaxed text-text/85">{prompt}</p>
          </div>
        </Section>

        <Section id="a11y" title="Accessibility & support">
          <div className="grid gap-5 md:grid-cols-[2fr_1fr]">
            <ul className={`${box} space-y-2.5`}>
              {entry.accessibility.map((a) => (
                <li key={a} className="flex gap-2.5">
                  <span aria-hidden="true" className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-acc/15 text-[11px] text-acc">✓</span>
                  {a}
                </li>
              ))}
            </ul>
            <div className={box}>
              <h3 className="mono mb-2 text-[0.66rem] text-mute">Browser support</h3>
              <p className="text-text/85">{entry.support}</p>
            </div>
          </div>
        </Section>
      </ScrollCable>

      <nav aria-label="More components" className="mt-16 flex flex-wrap justify-between gap-3 border-t border-line pt-6">
        <Link href={`/components/${prev.slug}`} className="cr-btn">← {prev.name}</Link>
        <Link href={`/components/${next.slug}`} className="cr-btn cr-btn-acc">{next.name} →</Link>
      </nav>
    </main>
  );
}
