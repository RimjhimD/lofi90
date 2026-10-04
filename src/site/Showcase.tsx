"use client";

import { useEffect, useRef, useState } from "react";
import { DEMOS } from "@/lib/demos";
import { PLAYGROUNDS } from "@/lib/playgrounds";
import { Controls, type ControlValues } from "@/site/Controls";
import { CodePanel, type CodeFile } from "@/site/CodePanel";
import { listen, type LogLine } from "@/site/log";

const TONE = { info: "text-text/85", good: "text-acc", bad: "text-err", wait: "text-warn" } as const;
const MARK = { info: "›", good: "✓", bad: "✕", wait: "◷" } as const;

const WIDTHS = [
  { id: "375", label: "375", max: "375px" },
  { id: "768", label: "768", max: "768px" },
  { id: "full", label: "Full", max: "100%" },
];

/** One panel with Preview / Code tabs. Preview: the live component on a glowing stage, controls in a column beside it. */
export function Showcase({ slug, files, tryIt }: { slug: string; files: CodeFile[]; tryIt: string[] }) {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [width, setWidth] = useState("full");
  const Demo = DEMOS[slug];
  const play = PLAYGROUNDS[slug];
  const [values, setValues] = useState<ControlValues>(play?.initial ?? {});
  const [slow, setSlow] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<LogLine[]>([]);
  const t0 = useRef(0);

  // "What just happened": the live preview reports each thing it does, newest on top.
  useEffect(() => {
    t0.current = performance.now();
    let id = 0;
    return listen((text, tone) =>
      setLines((xs) => [{ id: ++id, at: performance.now() - t0.current, text, tone }, ...xs].slice(0, 5)),
    );
  }, []);
  const stamp = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };

  // Slow-mo: every animation and transition inside the stage plays at a quarter speed. New ones are
  // caught as they start, so a morph or a flip triggered while slow-mo is on is slowed too.
  useEffect(() => {
    const el = stage.current;
    if (!el || !el.getAnimations) return;
    const rate = slow ? 0.25 : 1;
    const apply = () =>
      el.getAnimations({ subtree: true }).forEach((a) => {
        if (a.playbackRate !== rate) a.playbackRate = rate;
      });
    apply();
    if (!slow) return;
    const id = window.setInterval(apply, 50);
    return () => {
      clearInterval(id);
      el.getAnimations({ subtree: true }).forEach((a) => (a.playbackRate = 1));
    };
  }, [slow, tab]);
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
          <button
            type="button"
            aria-pressed={slow}
            onClick={() => setSlow((v) => !v)}
            title="Play the component's animations at a quarter speed"
            className="ml-auto flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-1.5 text-sm font-medium text-mute transition-colors hover:text-text aria-pressed:border-acc/60 aria-pressed:text-acc focus-visible:outline-2 focus-visible:outline-acc"
          >
            <span aria-hidden="true" className={slow ? "animate-spin [animation-duration:4s]" : ""}>◐</span>
            Slow-mo {slow ? "×¼" : ""}
          </button>
        )}
        {tab === "preview" && (
          <div role="group" aria-label="Preview width" className="flex rounded-lg border border-line bg-panel p-1">
            {WIDTHS.map((w) => (
              <button key={w.id} type="button" aria-pressed={width === w.id} onClick={() => setWidth(w.id)} className="mono rounded-md px-2.5 py-1 text-[0.62rem] text-mute aria-pressed:bg-panel-2 aria-pressed:text-text focus-visible:outline-2 focus-visible:outline-acc">
                {w.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {tab === "preview" && (
        <ol aria-label="Try it" className="mb-3 grid gap-2 md:grid-cols-3">
          {tryIt.map((step, i) => (
            <li key={step} className="panel flex items-start gap-3 px-4 py-3 text-sm leading-snug text-text/90">
              <span className="mono grid h-6 w-6 shrink-0 place-items-center rounded-full border border-acc/50 bg-acc/10 text-[0.64rem] text-acc">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      )}

      {tab === "preview" ? (
        <div className="panel grid overflow-hidden lg:grid-cols-[minmax(0,1fr)_280px]">
          <div ref={stage} className="screen relative grid min-h-[480px] place-items-center overflow-hidden p-6">
            <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-acc shadow-[0_0_18px_4px_rgba(198,255,61,.4)] animate-[scan-down_1.4s_cubic-bezier(.65,0,.35,1)_.2s_both]" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(233,237,232,.06)_1px,transparent_1.2px)] bg-[length:18px_18px]" />
            <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(198,255,61,.12),transparent_65%)] blur-2xl" />
            <span className="mono absolute left-4 top-4 flex items-center gap-1.5 text-[0.6rem] text-acc">
              <i className="led" data-on="true" data-pulse="true" style={{ width: 6, height: 6 }} /> Live
            </span>
            <div className="stage-on relative grid w-full place-items-center transition-[max-width] duration-500" style={{ maxWidth: width === "full" ? "100%" : WIDTHS.find((w) => w.id === width)!.max }}>
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
          <div className="border-t border-line px-4 py-3 lg:col-span-2">
            <p className="mono mb-2 flex items-center gap-2 text-[0.6rem] text-mute">
              <i className="led" data-on={lines.length > 0} data-pulse={lines.length > 0} style={{ width: 6, height: 6 }} /> What just happened
            </p>
            <ul aria-live="polite" className="min-h-[1.6rem] space-y-1 text-sm">
              {lines.length === 0 && <li className="text-mute">Nothing yet. Follow step 1 above and this log explains each thing the component does.</li>}
              {lines.map((l, i) => (
                <li key={l.id} className={`flex gap-3 ${i === 0 ? "anim-rise" : "opacity-60"}`}>
                  <span className="mono shrink-0 pt-0.5 text-[0.62rem] text-mute">{stamp(l.at)}</span>
                  <span className={`shrink-0 ${TONE[l.tone]}`} aria-hidden="true">{MARK[l.tone]}</span>
                  <span className={i === 0 ? TONE[l.tone] : "text-text/70"}>{l.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <CodePanel files={files} maxHeight="640px" />
      )}
    </section>
  );
}
