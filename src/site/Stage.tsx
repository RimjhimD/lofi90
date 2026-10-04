"use client";

import { useState } from "react";
import { DEMOS } from "@/lib/demos";
import { PLAYGROUNDS } from "@/lib/playgrounds";
import { Controls, type ControlValues } from "@/site/Controls";

const WIDTHS = [
  { id: "375", label: "375", max: "375px" },
  { id: "768", label: "768", max: "768px" },
  { id: "full", label: "Full", max: "100%" },
];

/** Live preview on a light screen inside the console, with phone / tablet / desktop widths and a controls panel. */
export function Stage({ slug }: { slug: string }) {
  const [width, setWidth] = useState("full");
  const Demo = DEMOS[slug];
  const play = PLAYGROUNDS[slug];
  const [values, setValues] = useState<ControlValues>(play?.initial ?? {});
  const max = WIDTHS.find((w) => w.id === width)!.max;
  return (
    <section aria-label="Live preview" className="panel flex h-full flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
        <div role="group" aria-label="Preview width" className="flex rounded-lg border border-line p-0.5">
          {WIDTHS.map((w) => (
            <button
              key={w.id}
              type="button"
              aria-pressed={width === w.id}
              onClick={() => setWidth(w.id)}
              className="mono rounded-md px-2.5 py-1 text-[0.64rem] text-mute aria-pressed:bg-panel-2 aria-pressed:text-text focus-visible:outline-2 focus-visible:outline-acc"
            >
              {w.label}
            </button>
          ))}
        </div>
        <span className="mono ml-auto flex items-center gap-2 text-[0.64rem] text-acc">
          <i className="led" data-on="true" data-pulse="true" style={{ width: 7, height: 7 }} />
          Live
        </span>
      </div>
      <div className="grid flex-1 place-items-center bg-panel-2 p-4 sm:p-6">
        <div
          className="grid min-h-[420px] w-full place-items-center rounded-[10px] bg-[#F4F5F1] bg-[radial-gradient(#dfe2dc_1px,transparent_1.2px)] bg-[length:14px_14px] px-4 py-8 text-[#1A1A17] shadow-[0_20px_60px_-30px_rgba(0,0,0,.9)] transition-[max-width] duration-500 [transition-timing-function:cubic-bezier(.3,1.2,.5,1)]"
          style={{ maxWidth: max }}
        >
          <Demo controls={values} />
        </div>
      </div>
      {play && (
        <Controls
          controls={play.controls}
          values={values}
          onChange={(key, value) => setValues((v) => ({ ...v, [key]: value }))}
          onReset={() => setValues(play.initial)}
        />
      )}
    </section>
  );
}
