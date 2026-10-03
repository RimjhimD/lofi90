"use client";

import { useState } from "react";
import { DEMOS } from "@/lib/demos";

const WIDTHS = [
  { id: "375", label: "📱 375", max: "375px" },
  { id: "768", label: "▭ 768", max: "768px" },
  { id: "full", label: "🖥 Full", max: "100%" },
];

/** Live preview on the felt, with phone / tablet / desktop widths. */
export function Stage({ slug }: { slug: string }) {
  const [width, setWidth] = useState("full");
  const Demo = DEMOS[slug];
  const max = WIDTHS.find((w) => w.id === width)!.max;
  return (
    <section aria-label="Live preview" className="anim-rise rounded-[28px] border-[5px] border-ink bg-board p-3.5 shadow-[8px_8px_0_#20201C]">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {WIDTHS.map((w) => (
          <button key={w.id} type="button" aria-pressed={width === w.id} onClick={() => setWidth(w.id)} className="chunk px-3 text-sm">
            {w.label}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-1.5 text-sm font-extrabold">
          <i className="anim-blink block h-2.5 w-2.5 rounded-full border-2 border-ink bg-p1" />
          LIVE
        </span>
      </div>
      <div className="grid min-h-[460px] place-items-center rounded-[20px] border-4 border-ink bg-felt bg-[radial-gradient(rgba(255,255,255,.07)_1px,transparent_1.5px)] bg-[length:6px_6px] p-4 sm:p-6">
        <div
          className="grid min-h-[400px] w-full place-items-center rounded-[18px] border-4 border-ink bg-paper px-4 py-8 transition-[max-width] duration-500 [transition-timing-function:cubic-bezier(.3,1.3,.5,1)]"
          style={{ maxWidth: max }}
        >
          <Demo />
        </div>
      </div>
    </section>
  );
}
