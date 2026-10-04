"use client";

import { useState } from "react";
import type { ControlValues } from "@/site/Controls";
import { say } from "@/site/log";
import { TapeMeasureInput, type TapeMeasureInputProps } from "./TapeMeasureInput";

const MIN = 40;
const MAX = 240;
const price = (cm: number) => (18 + cm * 0.32).toFixed(2);

/** Live preview: ordering a shelf cut to length. Pull the tape and the shelf grows with it. */
export default function TapeMeasureInputDemo({ controls = {} }: { controls?: ControlValues }) {
  const look = controls as Pick<TapeMeasureInputProps, "accent" | "size" | "step">;
  const [cm, setCm] = useState(120);

  return (
    <div className="w-full max-w-md rounded-2xl border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] p-5 shadow-[0_10px_30px_-14px_var(--k-shadow,rgba(0,0,0,.9))]">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <p className="text-sm font-bold text-[var(--k-text,#E9EDE8)]">Custom shelf</p>
        <p className="text-xs text-[var(--k-mute,#8A938D)]">Solid oak · 25 cm deep</p>
      </div>

      <TapeMeasureInput
        label="Length"
        value={cm}
        onChange={setCm}
        onSettle={(v) =>
          v === MIN
            ? say(`Tape zipped back in. The shelf is at its shortest, ${MIN} cm.`)
            : say(`Snapped to ${v} cm. The shelf is now ${v} cm wide, $${price(v)}.`, "good")
        }
        min={MIN}
        max={MAX}
        step={Number(look.step ?? 5)}
        unit="cm"
        accent={look.accent ?? "#C6FF3D"}
        size={look.size ?? "md"}
      />

      {/* the shelf, drawn to scale */}
      <div aria-hidden="true" className="relative mt-6 h-12 rounded-lg border border-dashed border-[var(--k-line,#3A433F)] bg-[var(--k-bg,#0E1110)] px-3">
        <div className="relative mt-4 h-3 rounded-sm bg-[linear-gradient(180deg,#D9A66B,#B07A44)] shadow-[0_6px_10px_-6px_rgba(0,0,0,.6)] transition-[width] duration-300 ease-out motion-reduce:transition-none" style={{ width: `${(cm / MAX) * 100}%` }}>
          <span className="absolute left-[12%] top-full h-3 w-1 rounded-b-sm bg-[var(--k-mute,#8A938D)]" />
          <span className="absolute right-[12%] top-full h-3 w-1 rounded-b-sm bg-[var(--k-mute,#8A938D)]" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between border-t border-[var(--k-line,#3A433F)] pt-3">
        <span className="text-xs text-[var(--k-mute,#8A938D)]">Cut to {cm} cm · ships in 3 days</span>
        <span className="font-mono text-lg font-bold tabular-nums text-[var(--k-text,#E9EDE8)]" aria-live="polite">
          ${price(cm)}
        </span>
      </div>
    </div>
  );
}
