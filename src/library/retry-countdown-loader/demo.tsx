"use client";

import { useState } from "react";
import { RetryAfterError, RetryCountdownLoader } from "./RetryCountdownLoader";

type Scenario = "third" | "busy" | "down";

const SCENARIOS: { id: Scenario; label: string }[] = [
  { id: "third", label: "Works on try 3" },
  { id: "busy", label: "Server says wait 6s" },
  { id: "down", label: "Server is down" },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Live preview: sending a reminder text to a flaky SMS provider. Requests are simulated. */
export default function RetryCountdownLoaderDemo() {
  const [scenario, setScenario] = useState<Scenario>("third");
  const [run, setRun] = useState(0);

  const task = async (attempt: number) => {
    await wait(700);
    if (scenario === "third" && attempt >= 3) return "sent";
    if (scenario === "busy" && attempt === 1) throw new RetryAfterError("429 Too many requests", 6000);
    if (scenario === "busy") return "sent";
    throw new Error(scenario === "down" ? "503 Service unavailable" : "Timed out after 5s");
  };

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <RetryCountdownLoader key={`${scenario}-${run}`} task={task} label="Sending the reminder text" maxAttempts={5} baseDelayMs={1000} />
      <div role="group" aria-label="Demo scenario" className="flex flex-wrap justify-center gap-2">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={scenario === s.id}
            onClick={() => {
              setScenario(s.id);
              setRun((r) => r + 1);
            }}
            className="border-2 border-[#1A1A17] bg-white px-3 py-0.5 text-sm font-bold shadow-[2px_2px_0_#1A1A17] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_#1A1A17] aria-pressed:bg-[#1A1A17] aria-pressed:text-[#F2EEE3] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#D7263D]"
          >
            {s.label}
          </button>
        ))}
      </div>
      <p className="max-w-sm text-center text-xs text-[#5E5A50]">Tip: turn your Wi-Fi off while it is waiting — the countdown pauses and picks up when you are back.</p>
    </div>
  );
}
