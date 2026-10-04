import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AGENT_LOGS, findLog } from "@/lib/agentLogs";
import { CopyButton } from "@/site/CodePanel";

export function generateStaticParams() {
  return AGENT_LOGS.map((l) => ({ slug: l.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const log = findLog((await params).slug);
  return log ? { title: `Agent log ${log.no}: ${log.title}`, description: log.summary } : {};
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section data-reveal className="grid gap-3 border-t border-line py-8 md:grid-cols-[180px_minmax(0,1fr)]">
      <h2 className="mono flex items-start gap-2 pt-1 text-[0.64rem] text-acc">
        <i className="led mt-0.5" data-on="true" style={{ width: 6, height: 6 }} />
        {label}
      </h2>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

/** One agent log: the task, the agent, the prompt as given, the steps it took, and what came out. */
export default async function AgentLogPage({ params }: { params: Promise<{ slug: string }> }) {
  const log = findLog((await params).slug);
  if (!log) notFound();
  const i = AGENT_LOGS.indexOf(log);
  const prev = AGENT_LOGS[(i - 1 + AGENT_LOGS.length) % AGENT_LOGS.length];
  const next = AGENT_LOGS[(i + 1) % AGENT_LOGS.length];

  return (
    <main className="mx-auto max-w-[980px] px-6 pb-32 lg:px-10">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 pt-8 text-sm text-mute">
        <Link href="/" className="hover:text-text">Home</Link>/<Link href="/agent-logs" className="hover:text-text">Agent logs</Link>/<span className="text-text">Log {log.no}</span>
      </nav>

      <header className="anim-rise mt-6 pb-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="mono flex items-center gap-1.5 rounded-full border border-acc/40 bg-acc/10 px-2.5 py-1 text-[0.6rem] text-acc">
            <i className="led" data-on="true" style={{ width: 5, height: 5 }} /> {log.kind}
          </span>
          <span className="mono text-[0.62rem] text-mute">Log {log.no} · {log.date}</span>
        </div>
        <h1 className="font-display text-[clamp(2.2rem,4.6vw,3.4rem)] font-bold leading-[1.04] tracking-tight">{log.title}</h1>
        <p className="mt-4 max-w-[64ch] text-[1.02rem] leading-relaxed text-text/75">{log.summary}</p>
        <dl className="mt-6 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
          <div className="bg-panel px-4 py-3">
            <dt className="mono text-[0.58rem] text-mute">Agent</dt>
            <dd className="mt-0.5 text-sm font-medium">{log.agent}</dd>
          </div>
          <div className="bg-panel px-4 py-3">
            <dt className="mono text-[0.58rem] text-mute">Tools</dt>
            <dd className="mt-0.5 text-sm font-medium">{log.tools.join(" · ")}</dd>
          </div>
        </dl>
      </header>

      <Block label="The task">
        <p className="leading-relaxed text-text/85">{log.task}</p>
      </Block>

      <Block label="The prompt">
        <figure className="relative rounded-xl border border-line bg-panel">
          <div className="flex items-center justify-between border-b border-line px-4 py-2">
            <span className="mono text-[0.58rem] text-mute">Prompt · ready to reuse</span>
            <CopyButton text={log.prompt} label="Copy" />
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap px-5 py-4 font-mono text-[0.82rem] leading-relaxed text-text/90">{log.prompt}</pre>
        </figure>
      </Block>

      <Block label="The workflow">
        <ol className="relative grid gap-4 border-l border-line pl-6">
          {log.workflow.map((s, n) => (
            <li key={s} className="relative text-text/85">
              <span className="mono absolute -left-[37px] top-0 grid h-6 w-6 place-items-center rounded-full border border-acc/50 bg-bg text-[0.6rem] text-acc">{n + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </Block>

      <Block label="The result">
        <ul className="grid gap-2">
          {log.produced.map((p) => (
            <li key={p} className="flex gap-3 rounded-lg border border-line bg-panel px-4 py-3 text-sm text-text/85">
              <span aria-hidden="true" className="text-acc">✓</span>
              {p}
            </li>
          ))}
        </ul>
        <p className="mt-4 rounded-lg border border-acc/30 bg-acc/5 px-4 py-3 text-sm leading-relaxed text-text/90">
          <span className="font-semibold text-acc">What it saved: </span>
          {log.saved}
        </p>
      </Block>

      <nav aria-label="More logs" className="mt-10 flex flex-wrap justify-between gap-3 border-t border-line pt-6">
        <Link href={`/agent-logs/${prev.slug}`} className="cr-btn">← Log {prev.no}</Link>
        <Link href={`/agent-logs/${next.slug}`} className="cr-btn cr-btn-acc">Log {next.no} →</Link>
      </nav>
    </main>
  );
}
