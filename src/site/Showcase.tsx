"use client";

import { useState } from "react";
import { DEMOS } from "@/lib/demos";
import { PLAYGROUNDS } from "@/lib/playgrounds";
import { Controls, type ControlValues } from "@/site/Controls";
import { CodePanel, type CodeFile } from "@/site/CodePanel";

const WIDTHS = [
  { id: "375", label: "375", max: "375px" },
  { id: "768", label: "768", max: "768px" },
  { id: "full", label: "Full", max: "100%" },
];

/** One panel with Preview / Code tabs. Preview: the live component on a glowing stage, controls in a column beside it. */
export function Showcase({ slug, files }: { slug: string; files: CodeFile[] }) {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [width, setWidth] = useState("full");
  const Demo = DEMOS[slug];
  const play = PLAYGROUNDS[slug];
  const [values, setValues] = useState<ControlValues>(play?.initial ?? {});
  const tabBtn =
    "rounded-md px-3 py-1.5 text-sm font-medium text-mute transition-colors aria-selected:bg-panel-2 aria-selected:text-text focus-visible:outline-2 focus-visible:outline-acc";

  return (
    <section aria-label="Component showcase" className="mt-8">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="View" className="flex rounded-lg border border-line bg-panel p-1">
          <button role="tab" type="button" aria-selected={tab === "preview"} onClick={() => setTab("preview")} className={tabBtn}>
            Preview
          </button>
          <button role="tab" type="button" aria-selected={tab === "code"} onClick={() => setTab("code")} className={tabBtn}>
            Code
          </button>
        </div>
        {tab === "preview" && (
          <div role="group" aria-label="Preview width" className="ml-auto flex rounded-lg border border-line bg-panel p-1">
            {WIDTHS.map((w) => (
              <button key={w.id} type="button" aria-pressed={width === w.id} onClick={() => setWidth(w.id)} className="mono rounded-md px-2.5 py-1 text-[0.62rem] text-mute aria-pressed:bg-panel-2 aria-pressed:text-text focus-visible:outline-2 focus-visible:outline-acc">
                {w.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {tab === "preview" ? (
        <div className="panel grid overflow-hidden lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="relative grid min-h-[480px] place-items-center overflow-hidden p-6">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(233,237,232,.06)_1px,transparent_1.2px)] bg-[length:18px_18px]" />
            <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(198,255,61,.12),transparent_65%)] blur-2xl" />
            <span className="mono absolute left-4 top-4 flex items-center gap-1.5 text-[0.6rem] text-acc">
              <i className="led" data-on="true" data-pulse="true" style={{ width: 6, height: 6 }} /> Live
            </span>
            <div className="relative grid w-full place-items-center transition-[max-width] duration-500" style={{ maxWidth: width === "full" ? "100%" : WIDTHS.find((w) => w.id === width)!.max }}>
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
        </div>
      ) : (
        <CodePanel files={files} maxHeight="640px" />
      )}
    </section>
  );
}
