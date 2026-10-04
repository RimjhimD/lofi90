"use client";

import { useState } from "react";
import type { ControlValues } from "@/site/Controls";
import { say } from "@/site/log";
import { BoardingPassCard, type BoardingPass, type BoardingPassCardProps } from "./BoardingPassCard";

const PASS: BoardingPass = {
  from: { code: "DAC", city: "Dhaka" },
  to: { code: "LHR", city: "London" },
  passenger: "Nadia Rahman",
  flight: "MA 207",
  date: "14 Nov",
  boards: "21:40",
  gate: "B12",
  seat: "14A",
  group: "3",
  cabin: "Economy",
};

/** Live preview: one boarding pass. Pull the stub off to check in, then print a fresh one. */
export default function BoardingPassCardDemo({ controls = {} }: { controls?: ControlValues }) {
  const look = controls as Pick<BoardingPassCardProps, "accent" | "tearDistance" | "size">;
  const [run, setRun] = useState(0);
  const [torn, setTorn] = useState(false);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <BoardingPassCard
        key={run}
        {...look}
        pass={PASS}
        airline="Monsoon Air"
        onPeelStart={() => say("Peeling the stub… pull further to tear.", "wait")}
        onSnapBack={() => say("Let go too early — the stub snaps back.")}
        onTear={() => {
          setTorn(true);
          say("Torn off. Checked in: seat 14A, gate B12.", "good");
        }}
      />
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-[var(--k-mute,#8A938D)]">
        <span>{torn ? "You're checked in." : "Drag the stub away from the dotted line."}</span>
        <button
          type="button"
          onClick={() => {
            setRun((r) => r + 1);
            setTorn(false);
            say("A fresh pass, stub still on.");
          }}
          className="rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] px-2 py-0.5 font-bold text-[var(--k-text,#E9EDE8)] shadow-[0_10px_30px_-14px_var(--k-shadow,rgba(0,0,0,.9))] focus-visible:outline-3 focus-visible:outline-[var(--k-acc-text,#C6FF3D)]"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
