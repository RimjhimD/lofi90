import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ENTRIES, findEntry, typeOf } from "@/lib/registry";
import { highlight, readRepoFile } from "@/lib/source";
import { Stage } from "@/site/Stage";
import { CodePanel, CopyButton } from "@/site/CodePanel";
import { Flow } from "@/site/Flow";
import { StatesGrid } from "@/site/StatesGrid";
import { PageConfetti } from "@/site/PageConfetti";

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

function Section({ id, title, children, lead }: { id: string; title: string; lead?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 pt-14">
      <h2 id={`${id}-title`} className="font-title text-[2.2rem] leading-none text-board title-shadow">
        {title}
      </h2>
      {lead && <p className="mb-5 mt-2 max-w-[70ch] font-semibold text-board/90">{lead}</p>}
      <div className={lead ? "" : "mt-5"}>{children}</div>
    </section>
  );
}

export default async function ComponentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = findEntry(slug);
  if (!entry) notFound();
  const type = typeOf(entry.type);
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
    <main className="mx-auto max-w-[1280px] px-6 pb-24">
      <PageConfetti />

      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 pb-1.5 pt-4 font-extrabold text-board">
        <Link href="/" className="text-p2 underline decoration-2 underline-offset-4">Home</Link>›<span>{type.label}</span>›<span>{entry.name}</span>
      </nav>
      <header className="anim-rise mb-6 mt-2">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="mr-2 font-title text-[clamp(2.2rem,4.6vw,3.8rem)] leading-none text-board title-shadow">{entry.name}</h1>
          <span className="rounded-full border-[3px] border-ink px-2.5 font-extrabold" style={{ background: type.color }}>{entry.type}</span>
          <span className="rounded-full border-[3px] border-ink bg-paper px-2.5 font-extrabold">ext {entry.ext}</span>
        </div>
        <p className="mt-4 max-w-[80ch] text-lg font-semibold leading-relaxed text-board">{entry.why}</p>
      </header>

      {/* 1. Preview and source, side by side */}
      <div className="grid items-stretch gap-6 lg:grid-cols-2">
        <Stage slug={entry.slug} />
        <CodePanel files={sourceFiles} title="Source" maxHeight="560px" />
      </div>

      {/* Jump links */}
      <nav aria-label="On this page" className="sticky top-0 z-30 -mx-2 mt-10 flex gap-2 overflow-x-auto bg-felt/95 px-2 py-3 backdrop-blur-sm">
        {SECTIONS.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="chunk shrink-0 px-3.5 py-0.5 text-sm">
            {label}
          </a>
        ))}
      </nav>

      <Section id="how" title="How it works" lead="The flow from the user's first tap to the end result, including what happens when things go wrong.">
        <Flow steps={entry.flow} />
      </Section>

      <Section id="when" title="When to use it">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-[22px] border-4 border-ink bg-paper p-5 shadow-[6px_6px_0_#20201C]">
            <h3 className="mb-3 flex items-center gap-2 font-title text-xl">
              <span className="grid h-7 w-7 place-items-center rounded-full border-[3px] border-ink bg-p5 text-sm">✓</span>Great for
            </h3>
            <ul className="space-y-2">
              {entry.useWhen.map((u) => (
                <li key={u} className="font-semibold">• {u}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-[22px] border-4 border-ink bg-paper p-5 shadow-[6px_6px_0_#20201C]">
            <h3 className="mb-3 flex items-center gap-2 font-title text-xl">
              <span className="grid h-7 w-7 place-items-center rounded-full border-[3px] border-ink bg-p1 text-sm text-white">✕</span>Skip it when
            </h3>
            <ul className="space-y-2">
              {entry.avoidWhen.map((u) => (
                <li key={u} className="font-semibold">• {u}</li>
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
        <div className="overflow-x-auto rounded-[22px] border-[5px] border-ink bg-white shadow-[8px_8px_0_#20201C]">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead className="bg-board">
              <tr className="[&>th]:border-b-4 [&>th]:border-ink [&>th]:px-4 [&>th]:py-2.5 [&>th]:font-extrabold">
                <th>Prop</th>
                <th>Type</th>
                <th>Default</th>
                <th>What it does</th>
              </tr>
            </thead>
            <tbody>
              {entry.props.map((p) => (
                <tr key={p.name} className="[&>td]:border-b-[3px] [&>td]:border-dashed [&>td]:border-[#efe5cb] [&>td]:px-4 [&>td]:py-2.5 [&>td]:align-top">
                  <td className="font-extrabold">{p.name}</td>
                  <td>
                    <code className="rounded-md border-2 border-ink bg-board px-1.5 text-xs">{p.type}</code>
                  </td>
                  <td className="font-semibold">{p.default}</td>
                  <td className="font-semibold">{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="prompt" title="Build prompt" lead="The final prompt used to build this component.">
        <div className="rounded-[22px] border-[5px] border-ink bg-paper shadow-[8px_8px_0_#20201C]">
          <div className="flex items-center justify-between border-b-4 border-ink bg-board px-4 py-2">
            <span className="font-title">prompt.md</span>
            <CopyButton text={prompt} label="Copy prompt" />
          </div>
          <p className="whitespace-pre-wrap p-5 text-[0.98rem] font-semibold leading-relaxed">{prompt}</p>
        </div>
      </Section>

      <Section id="a11y" title="Accessibility & support">
        <div className="grid gap-5 md:grid-cols-[2fr_1fr]">
          <ul className="space-y-2 rounded-[22px] border-4 border-ink bg-paper p-5 shadow-[6px_6px_0_#20201C]">
            {entry.accessibility.map((a) => (
              <li key={a} className="flex gap-2 font-semibold">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-ink bg-p5 text-[10px]">✓</span>
                {a}
              </li>
            ))}
          </ul>
          <div className="rounded-[22px] border-4 border-ink bg-paper p-5 shadow-[6px_6px_0_#20201C]">
            <h3 className="mb-2 font-title text-lg">Browser support</h3>
            <p className="font-semibold">{entry.support}</p>
          </div>
        </div>
      </Section>

      <div className="mt-14 flex flex-wrap justify-between gap-3">
        <Link href={`/components/${prev.slug}`} className="chunk px-5 py-2">◂ {prev.name}</Link>
        <Link href={`/components/${next.slug}`} className="chunk bg-p1! px-5 py-2 text-white">{next.name} ▸</Link>
      </div>
    </main>
  );
}
