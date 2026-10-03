import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ENTRIES, findEntry, typeOf } from "@/lib/registry";
import { highlight, readRepoFile } from "@/lib/source";
import { Stage } from "@/site/Stage";
import { CodeTabs, type CodeTab } from "@/site/CodeTabs";
import { PageConfetti } from "@/site/PageConfetti";

export function generateStaticParams() {
  return ENTRIES.map((e) => ({ slug: e.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const entry = findEntry((await params).slug);
  return entry ? { title: entry.name, description: entry.summary } : {};
}

export default async function ComponentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = findEntry(slug);
  if (!entry) notFound();
  const type = typeOf(entry.type);
  const index = ENTRIES.indexOf(entry);
  const next = ENTRIES[(index + 1) % ENTRIES.length];
  const prev = ENTRIES[(index - 1 + ENTRIES.length) % ENTRIES.length];

  const usage = await readRepoFile(entry.usagePath);
  const prompt = await readRepoFile(entry.promptPath);
  const sources = await Promise.all(entry.files.map(async (f) => ({ ...f, code: await readRepoFile(f.path) })));

  const tabs: CodeTab[] = [
    { id: "usage", label: "Usage", files: [{ label: "usage.tsx", code: usage, html: await highlight(usage, "usage.tsx") }] },
    {
      id: "source",
      label: "Source",
      files: await Promise.all(sources.map(async (s) => ({ label: s.label, code: s.code, html: await highlight(s.code, s.path) }))),
    },
    { id: "props", label: "Props", props: entry.props },
    { id: "prompt", label: "Prompt", files: [{ label: "prompt.md", code: prompt, text: prompt }] },
  ];

  return (
    <main className="mx-auto max-w-[1240px] px-6 pb-24">
      <PageConfetti />
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 pb-1.5 pt-4 font-extrabold text-board">
        <Link href="/" className="text-p2 underline decoration-2 underline-offset-4">Home</Link>›<span>{type.label}</span>›<span>{entry.name}</span>
      </nav>
      <div className="anim-rise mb-6 mt-2 flex flex-wrap items-center gap-2.5">
        <h1 className="mr-2 font-title text-[clamp(2.2rem,4.6vw,3.8rem)] leading-none text-board title-shadow">{entry.name}</h1>
        <span className="rounded-full border-[3px] border-ink px-2.5 font-extrabold" style={{ background: type.color }}>{entry.type}</span>
        <span className="rounded-full border-[3px] border-ink bg-paper px-2.5 font-extrabold">ext {entry.ext}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <Stage slug={entry.slug} />
        <div className="flex min-w-0 flex-col gap-4">
          <div className="anim-rise rounded-[20px] border-4 border-ink bg-paper p-4 shadow-[6px_6px_0_#20201C]" style={{ animationDelay: "80ms" }}>
            <h2 className="mb-1 font-title text-xl">What it does</h2>
            <p className="font-semibold leading-relaxed">{entry.why}</p>
          </div>
          <dl className="anim-rise grid grid-cols-2 gap-x-3 rounded-[20px] border-4 border-ink bg-paper px-4 py-3 text-sm font-bold shadow-[6px_6px_0_#20201C] [&>dd]:text-right [&>dd]:font-extrabold [&>dt,&>dd]:border-b-[3px] [&>dt,&>dd]:border-dashed [&>dt,&>dd]:border-[#e8dcbc] [&>dt,&>dd]:py-1" style={{ animationDelay: "140ms" }}>
            <dt>Route</dt><dd>/components/{entry.slug}</dd>
            <dt>Stack</dt><dd>React · TypeScript · Tailwind</dd>
            <dt>Dependencies</dt><dd>none</dd>
            <dt className="border-b-0!">Files</dt><dd className="border-b-0!">{entry.files.map((f) => f.label).join(", ")}</dd>
          </dl>
          <ul aria-label="Quality checks" className="anim-rise flex flex-wrap gap-2" style={{ animationDelay: "200ms" }}>
            {["Keyboard", "Screen reader text", "Reduced motion", "375 · 768 · 1280", "All states"].map((b) => (
              <li key={b} className="rounded-full border-[3px] border-ink bg-p5 px-2.5 text-sm font-extrabold">✓ {b}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8">
        <CodeTabs tabs={tabs} />
      </div>

      <div className="mt-8 flex flex-wrap justify-between gap-3">
        <Link href={`/components/${prev.slug}`} className="chunk px-5 py-2">◂ {prev.name}</Link>
        <Link href={`/components/${next.slug}`} className="chunk bg-p1! px-5 py-2 text-white">{next.name} ▸</Link>
      </div>
    </main>
  );
}
