import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ENTRIES, TYPES, findEntry, pad } from "@/lib/registry";
import { highlight, readRepoFile } from "@/lib/source";
import { Showcase } from "@/site/Showcase";
import { CodePanel, CopyButton } from "@/site/CodePanel";
import { Flow } from "@/site/Flow";
import { StatesRow } from "@/site/StatesRow";

export function generateStaticParams() {
  return ENTRIES.map((e) => ({ slug: e.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const entry = findEntry((await params).slug);
  return entry ? { title: entry.name, description: entry.summary } : {};
}

const REPO = "https://github.com/RimjhimD/lofi90/blob/main/";

function Section({ id, title, children, lead }: { id: string; title: string; lead?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-28 pt-14">
      <h2 id={`${id}-title`} className="flex items-center gap-3 font-display text-2xl font-semibold tracking-tight">
        <span aria-hidden="true" className="h-6 w-1 rounded-full bg-acc shadow-[0_0_12px_rgba(198,255,61,.6)]" />
        {title}
      </h2>
      {lead && <p className="mt-1.5 max-w-[70ch] text-sm text-mute">{lead}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function ComponentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = findEntry(slug);
  if (!entry) notFound();
  const typeNo = pad(TYPES.findIndex((t) => t.id === entry.type) + 1);
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
    <main className="mx-auto max-w-[1120px] px-6 pb-32 lg:px-10">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 pt-8 text-sm text-mute">
        <Link href="/" className="hover:text-text">Home</Link>/<Link href="/components" className="hover:text-text">Components</Link>/<span className="text-text">{entry.name}</span>
      </nav>

      <header className="anim-rise mt-5 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-[72ch]">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="mono flex items-center gap-1.5 rounded-full border border-acc/40 bg-acc/10 px-2.5 py-1 text-[0.6rem] text-acc">
              <i className="led" data-on="true" style={{ width: 5, height: 5 }} /> Type: {entry.type}
            </span>
            <span className="mono text-[0.62rem] text-mute">Type {typeNo}</span>
            <span className="mono text-[0.62rem] text-mute">No. {entry.ext}</span>
          </div>
          <h1 className="bg-gradient-to-r from-text via-text to-acc bg-clip-text font-display text-[clamp(2.4rem,5vw,3.8rem)] font-bold leading-[1.02] tracking-tight text-transparent">{entry.name}</h1>
          <p className="mt-4 text-[1.02rem] leading-relaxed text-text/75">{entry.why}</p>
        </div>
        <a href={`${REPO}${entry.files[0].path}`} className="cr-btn shrink-0 text-sm">
          View on GitHub ↗
        </a>
      </header>

      <Showcase slug={entry.slug} files={sourceFiles} />

      <Section id="usage" title="Usage" lead="Copy the component file into your project (React + Tailwind, no other packages), then use it like this.">
        <CodePanel files={[usageFile]} />
      </Section>

      <Section id="states" title="States">
        <StatesRow slug={entry.slug} />
      </Section>

      <Section id="how" title="How it works">
        <Flow steps={entry.flow} />
      </Section>

      <Section id="when" title="When to use it">
        <div className="grid gap-3 md:grid-cols-2">
          {[
            { title: "Great for", items: entry.useWhen, mark: "✓", tone: "text-acc" },
            { title: "Skip it when", items: entry.avoidWhen, mark: "✕", tone: "text-err" },
          ].map((g) => (
            <div key={g.title} className="panel p-5">
              <h3 className={`mono mb-3 text-[0.64rem] ${g.tone}`}>{g.title}</h3>
              <ul className="space-y-2 text-sm">
                {g.items.map((u) => (
                  <li key={u} className="flex gap-2.5 text-text/85">
                    <span aria-hidden="true" className={g.tone}>{g.mark}</span>
                    {u}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section id="props" title="Props">
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead className="text-mute">
              <tr className="[&>th]:border-b [&>th]:border-line [&>th]:px-4 [&>th]:py-3 [&>th]:text-xs [&>th]:font-medium">
                <th>Prop</th>
                <th>Type</th>
                <th>Default</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {entry.props.map((p) => (
                <tr key={p.name} className="[&>td]:border-b [&>td]:border-line/70 [&>td]:px-4 [&>td]:py-3 [&>td]:align-top last:[&>td]:border-b-0">
                  <td className="font-mono text-[0.8rem] font-medium text-text">{p.name}</td>
                  <td className="font-mono text-[0.78rem] text-acc/90">{p.type}</td>
                  <td className="font-mono text-[0.78rem] text-mute">{p.default}</td>
                  <td className="text-text/75">{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="a11y" title="Accessibility">
        <ul className="grid gap-3 md:grid-cols-2">
          {[...entry.accessibility, entry.support].map((a) => (
            <li key={a} className="panel flex gap-3 p-4 text-sm text-text/85">
              <span aria-hidden="true" className="text-acc">✓</span>
              {a}
            </li>
          ))}
        </ul>
      </Section>

      <Section id="prompt" title="Build prompt">
        <details className="panel group overflow-hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-medium">
            The final prompt used to build this component
            <span aria-hidden="true" className="text-mute transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <div className="border-t border-line">
            <div className="flex justify-end px-4 pt-3">
              <CopyButton text={prompt} label="Copy prompt" />
            </div>
            <p className="whitespace-pre-wrap px-5 pb-5 pt-2 text-sm leading-relaxed text-text/80">{prompt}</p>
          </div>
        </details>
      </Section>

      <nav aria-label="More components" className="mt-16 flex flex-wrap justify-between gap-3 border-t border-line pt-6">
        <Link href={`/components/${prev.slug}`} className="cr-btn">← {prev.name}</Link>
        <Link href={`/components/${next.slug}`} className="cr-btn cr-btn-acc">{next.name} →</Link>
      </nav>
    </main>
  );
}
