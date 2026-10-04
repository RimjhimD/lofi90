"use client";

import { useState } from "react";
import { VARIANTS } from "@/lib/demos";

/** The component in other colours, motions and sizes, grouped. Each tile can replay its motion. */
export function VariantsGrid({ slug }: { slug: string }) {
  const variants = VARIANTS[slug] ?? [];
  const [runs, setRuns] = useState<Record<number, number>>({});
  const groups = [...new Set(variants.map((v) => v.group))];
  return (
    <div className="space-y-8">
      {groups.map((g) => (
        <div key={g}>
          <h3 className="mono mb-3 flex items-center gap-2 text-muted">
            <i className="lamp" data-on="true" style={{ width: 8, height: 8 }} /> {g}
          </h3>
          <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {variants.map((v, i) =>
              v.group !== g ? null : (
                <li key={i} className="flex flex-col border-2 border-ink bg-white">
                  <div className="grid min-h-[170px] flex-1 place-items-center overflow-hidden bg-bone-2 bg-[radial-gradient(#d5cdb8_1px,transparent_1.2px)] bg-[length:12px_12px] px-4 py-8">
                    <div key={runs[i] ?? 0} className="flex w-full justify-center">
                      {v.node}
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t-2 border-ink px-3 py-1.5">
                    <span className="text-sm font-bold">{v.label}</span>
                    <button
                      type="button"
                      onClick={() => setRuns((r) => ({ ...r, [i]: (r[i] ?? 0) + 1 }))}
                      aria-label={`Replay ${v.label}`}
                      className="mono text-[0.62rem] text-muted hover:text-signal focus-visible:outline-2 focus-visible:outline-signal"
                    >
                      ↻ Replay
                    </button>
                  </div>
                </li>
              ),
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}
