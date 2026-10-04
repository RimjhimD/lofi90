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
          <h3 className="mono mb-3 flex items-center gap-2 text-[0.66rem] text-mute">
            <i className="led" data-on="true" style={{ width: 6, height: 6 }} /> {g}
          </h3>
          <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {variants.map((v, i) =>
              v.group !== g ? null : (
                <li key={i} className="panel flex flex-col overflow-hidden">
                  <div className="m-3 mb-0 grid min-h-[170px] flex-1 place-items-center overflow-hidden rounded-[10px] border border-line bg-bg bg-[radial-gradient(rgba(233,237,232,.07)_1px,transparent_1.2px)] bg-[length:16px_16px] px-4 py-8">
                    <div key={runs[i] ?? 0} className="flex w-full justify-center">
                      {v.node}
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm font-medium">{v.label}</span>
                    <button
                      type="button"
                      onClick={() => setRuns((r) => ({ ...r, [i]: (r[i] ?? 0) + 1 }))}
                      aria-label={`Replay ${v.label}`}
                      className="mono rounded-md border border-line-2 px-2 py-0.5 text-[0.6rem] text-mute transition-colors hover:border-acc hover:text-acc focus-visible:outline-2 focus-visible:outline-acc"
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
