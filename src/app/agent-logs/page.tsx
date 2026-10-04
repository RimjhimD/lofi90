import type { Metadata } from "next";
import Link from "next/link";
import { AGENT_LOGS } from "@/lib/agentLogs";

export const metadata: Metadata = { title: "Agent logs", description: "Real tasks done with an AI agent while building lofi90: the prompt, the workflow and what it produced." };

/** Every agent log as a recorder entry: number, kind, the task in one line. */
export default function AgentLogsPage() {
  const kinds = new Set(AGENT_LOGS.map((l) => l.kind)).size;
  return (
    <main className="mx-auto max-w-[1180px] px-6 pb-32 lg:px-10">
      <header className="anim-rise border-b border-line pb-8 pt-12">
        <span className="mono flex items-center gap-2 text-acc">
          <i className="led" data-on="true" data-pulse="true" /> {AGENT_LOGS.length} logs · {kinds} kinds of task
        </span>
        <h1 className="mt-3 font-display text-[clamp(2.4rem,5vw,4rem)] font-bold leading-[1.02] tracking-tight">Agent logs</h1>
        <p className="mt-3 max-w-[62ch] text-mute">
          Real tasks I handed to an AI agent, from client work to building this site. Each one shows what I asked for, how the agent worked through it, and what came out.
        </p>
      </header>

      <ol className="mt-10 grid gap-4">
        {AGENT_LOGS.map((l, i) => (
          <li key={l.slug} data-reveal style={{ ["--reveal-delay" as string]: `${i * 90}ms` }}>
            <Link
              href={`/agent-logs/${l.slug}`}
              className="group grid gap-4 rounded-2xl border border-line bg-panel p-5 transition-[border-color,box-shadow,transform] duration-500 hover:-translate-y-0.5 hover:border-acc/50 hover:shadow-[0_24px_60px_-30px_rgba(198,255,61,.4)] focus-visible:border-acc focus-visible:outline-none sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:items-center sm:p-6"
            >
              <span className="font-display text-4xl font-bold text-line-2 transition-colors group-hover:text-acc">{l.no}</span>
              <span className="min-w-0">
                <span className="mono flex flex-wrap items-center gap-2 text-[0.6rem] text-mute">
                  <span className="rounded-full border border-acc/40 bg-acc/10 px-2 py-0.5 text-acc">{l.kind}</span>
                  {l.agent} · {l.date}
                </span>
                <span className="mt-2 block font-display text-xl font-semibold tracking-tight">{l.title}</span>
                <span className="mt-1 block text-sm leading-snug text-mute">{l.summary}</span>
              </span>
              <span className="text-sm font-medium text-acc opacity-70 transition-opacity group-hover:opacity-100">
                Read log <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
