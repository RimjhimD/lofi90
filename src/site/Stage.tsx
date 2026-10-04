"use client";

import { useState } from "react";
import { DEMOS } from "@/lib/demos";

const WIDTHS = [
  { id: "375", label: "375", max: "375px" },
  { id: "768", label: "768", max: "768px" },
  { id: "full", label: "Full", max: "100%" },
];

/** Live preview on the bone panel, with phone / tablet / desktop widths. */
export function Stage({ slug }: { slug: string }) {
  const [width, setWidth] = useState("full");
  const Demo = DEMOS[slug];
  const max = WIDTHS.find((w) => w.id === width)!.max;
  return (
    <section aria-label="Live preview" className="flex h-full flex-col border-2 border-ink bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-ink px-3 py-2">
        <div role="group" aria-label="Preview width" className="flex">
          {WIDTHS.map((w) => (
            <button
              key={w.id}
              type="button"
              aria-pressed={width === w.id}
              onClick={() => setWidth(w.id)}
              className="mono -ml-0.5 border-2 border-ink bg-white px-2.5 py-1 first:ml-0 aria-pressed:bg-ink aria-pressed:text-bone focus-visible:relative focus-visible:outline-3 focus-visible:outline-signal"
            >
              {w.label}
            </button>
          ))}
        </div>
        <span className="mono ml-auto flex items-center gap-2">
          <i className="lamp anim-blink" data-on="true" style={{ width: 9, height: 9 }} />
          Live
        </span>
      </div>
      <div className="grid flex-1 place-items-center bg-bone-2 bg-[radial-gradient(#d5cdb8_1px,transparent_1.2px)] bg-[length:12px_12px] p-4 sm:p-7">
        <div
          className="grid min-h-[420px] w-full place-items-center border-2 border-ink bg-bone px-4 py-8 transition-[max-width] duration-500 [transition-timing-function:cubic-bezier(.3,1.2,.5,1)]"
          style={{ maxWidth: max }}
        >
          <Demo />
        </div>
      </div>
    </section>
  );
}
