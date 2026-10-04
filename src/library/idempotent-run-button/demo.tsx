"use client";

import { useState } from "react";
import { IdempotentRunButton } from "./IdempotentRunButton";

type Scenario = "normal" | "fails" | "disabled";

const SCENARIOS: { id: Scenario; label: string }[] = [
  { id: "normal", label: "Send works" },
  { id: "fails", label: "Send fails" },
  { id: "disabled", label: "Disabled" },
];

interface LogLine {
  id: number;
  kind: "sent" | "blocked" | "failed";
  text: string;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const time = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

/** Live preview: an SMS campaign that must never go out twice. Sending is simulated with a delay. */
export default function IdempotentRunButtonDemo() {
  const [scenario, setScenario] = useState<Scenario>("normal");
  const [batch, setBatch] = useState(1);
  const [log, setLog] = useState<LogLine[]>([]);
  const [sent, setSent] = useState(0);
  const runKey = `promo-oct-04${batch > 1 ? `-b${batch}` : ""}`;

  const add = (kind: LogLine["kind"], text: string) => setLog((prev) => [{ id: Date.now() + Math.random(), kind, text }, ...prev].slice(0, 5));

  const send = async (key: string) => {
    await wait(1400);
    if (scenario === "fails") {
      add("failed", `${time()} · ${key} · carrier timed out`);
      throw new Error("Carrier timed out.");
    }
    add("sent", `${time()} · ${key} · 400 texts sent`);
    setSent((n) => n + 400);
    return "Sent to 400 contacts";
  };

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="w-full max-w-sm rounded-[24px] border-4 border-[#20201C] bg-[#FFFDF6] p-5 shadow-[6px_6px_0_#20201C]">
        <p className="text-sm font-bold text-[#5c5849]">Glow Studio · Campaigns</p>
        <h4 className="text-2xl font-black leading-tight">October promo</h4>
        <p className="mb-4 text-sm font-semibold text-[#5c5849]">SMS · 400 contacts · “20% off colour this week”</p>

        <IdempotentRunButton
          runKey={runKey}
          onRun={send}
          windowMs={20_000}
          labels={{ run: "Send campaign", running: "Sending…", blocked: "Already sent" }}
          onBlocked={({ runKey: key }) => add("blocked", `${time()} · ${key} · repeat stopped`)}
          disabled={scenario === "disabled"}
        />

        <div className="mt-1 flex items-center justify-between gap-2 border-t-[3px] border-dashed border-[#20201C] pt-3">
          <p className="text-sm font-extrabold">
            Texts actually sent: <span className="rounded-md bg-[#FFB800] px-1.5">{sent}</span>
          </p>
          <button
            type="button"
            onClick={() => setBatch((b) => b + 1)}
            className="rounded-full border-[3px] border-[#20201C] bg-white px-2.5 text-xs font-extrabold shadow-[0_3px_0_#20201C] active:translate-y-0.5 active:shadow-[0_1px_0_#20201C] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#3BB2F6]"
          >
            New batch = new key
          </button>
        </div>
        <ul aria-label="Send log" className="mt-2 space-y-1 font-mono text-[11px] font-bold">
          {log.length === 0 && <li className="text-[#5c5849]">Press Send, then press it again fast.</li>}
          {log.map((l) => (
            <li key={l.id} className={l.kind === "sent" ? "text-[#0F7A5F]" : l.kind === "blocked" ? "text-[#1F6FA3]" : "text-[#B42318]"}>
              {l.kind === "sent" ? "✓" : l.kind === "blocked" ? "🛡" : "✕"} {l.text}
            </li>
          ))}
        </ul>
      </div>

      <div role="group" aria-label="Demo scenario" className="flex flex-wrap justify-center gap-2">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={scenario === s.id}
            onClick={() => setScenario(s.id)}
            className="rounded-full border-[3px] border-[#20201C] bg-white px-3 py-0.5 text-sm font-extrabold shadow-[0_3px_0_#20201C] active:translate-y-0.5 active:shadow-[0_1px_0_#20201C] aria-pressed:bg-[#FFB800] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#3BB2F6]"
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
