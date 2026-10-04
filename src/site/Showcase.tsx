"use client";

import { useEffect, useRef, useState } from "react";
import { DEMOS } from "@/lib/demos";
import { PLAYGROUNDS } from "@/lib/playgrounds";
import { Controls, type ControlValues } from "@/site/Controls";
import { listen, type LogTone } from "@/site/log";

const WIDTHS = [
  { id: "375", label: "375", px: 375 },
  { id: "768", label: "768", px: 768 },
  { id: "full", label: "Full", px: 0 },
] as const;

const TONE: Record<LogTone, string> = { info: "text-text/80", good: "text-acc", bad: "text-err", wait: "text-warn" };

/**
 * The preview, and nothing but the preview: one framed stage on a monitor. The toolbar is built into the
 * monitor's top edge; the stage really resizes to 375 / 768 / full with a ruler that reads its width, and
 * the stage lights up dark or light. Under it, one quiet caption line says what the component just did.
 */
export function Showcase({ slug, tryIt }: { slug: string; tryIt: string[] }) {
  const Demo = DEMOS[slug];
  const play = PLAYGROUNDS[slug];
  const [values, setValues] = useState<ControlValues>(play?.initial ?? {});
  const [width, setWidth] = useState<(typeof WIDTHS)[number]["id"]>("full");
  const [light, setLight] = useState(false);
  const [slow, setSlow] = useState(false);
  const [measured, setMeasured] = useState(0);
  const [last, setLast] = useState<{ text: string; tone: LogTone; n: number } | null>(null);
  const frame = useRef<HTMLDivElement>(null);

  // the ruler reads the stage's real width
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setMeasured(Math.round(el.offsetWidth)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // the latest thing the component did, for the caption
  useEffect(() => listen((text, tone) => setLast((l) => ({ text, tone, n: (l?.n ?? 0) + 1 }))), []);

  // Slow-mo: every animation and transition on the stage plays at a quarter speed, including ones that
  // start while it is on.
  useEffect(() => {
    const el = frame.current;
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
  }, [slow]);

  const target = WIDTHS.find((w) => w.id === width)!;
  const seg =
    "mono rounded-md px-2.5 py-1 text-[0.64rem] text-mute transition-colors hover:text-text aria-pressed:bg-panel-2 aria-pressed:text-text focus-visible:outline-2 focus-visible:outline-acc";
  const ease = "[transition-timing-function:cubic-bezier(.6,0,.2,1)]";

  return (
    <section aria-label="Live preview" className="mt-10">
      <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_30px_80px_-40px_rgba(0,0,0,.7)]">
        {/* the monitor's top edge */}
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5">
          <span className="hidden gap-1.5 sm:flex" aria-hidden="true">
            <i className="h-2.5 w-2.5 rounded-full bg-line-2" />
            <i className="h-2.5 w-2.5 rounded-full bg-line-2" />
            <i className="led" data-on="true" data-pulse="true" style={{ width: 10, height: 10 }} />
          </span>
          <div role="group" aria-label="Preview width" className="flex rounded-lg border border-line bg-bg/40 p-0.5 sm:ml-1">
            {WIDTHS.map((w) => (
              <button key={w.id} type="button" aria-pressed={width === w.id} onClick={() => setWidth(w.id)} className={seg}>
                {w.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:ml-auto">
            <button
              type="button"
              aria-pressed={slow}
              onClick={() => setSlow((v) => !v)}
              title="Play the component's animations at a quarter speed"
              className="mono flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-line px-2.5 py-1 text-[0.64rem] text-mute transition-colors hover:text-text aria-pressed:border-acc/60 aria-pressed:text-acc focus-visible:outline-2 focus-visible:outline-acc"
            >
              <span aria-hidden="true" className={slow ? "animate-spin [animation-duration:4s]" : ""}>◐</span>
              Slow-mo{slow ? " ×¼" : ""}
            </button>
            {/* lights switch: a knob slides between the dark and the light stage */}
            <button
              type="button"
              role="switch"
              aria-checked={light}
              aria-label="Light stage"
              onClick={() => setLight((v) => !v)}
              className="relative flex items-center whitespace-nowrap rounded-lg border border-line bg-bg/40 p-0.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-acc"
            >
              <span
                aria-hidden="true"
                className={`absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-md bg-panel-2 shadow-[0_0_0_1px_var(--color-line-2)] transition-transform duration-500 ${ease} ${light ? "translate-x-full" : ""}`}
              />
              <span className={`relative z-10 w-[4.4rem] py-1 text-center transition-colors sm:w-[6.6rem] ${light ? "text-mute" : "text-text"}`}>☾ Dark<span className="hidden sm:inline"> stage</span></span>
              <span className={`relative z-10 w-[4.4rem] py-1 text-center transition-colors sm:w-[6.6rem] ${light ? "text-text" : "text-mute"}`}>☀ Light<span className="hidden sm:inline"> stage</span></span>
            </button>
          </div>
        </div>

        {/* the bay the stage sits in */}
        <div className="grid justify-items-center bg-bg/50 px-3 pb-8 pt-9 sm:px-8">
          {/* ruler: ticks across the stage's width, reading its size */}
          <div aria-hidden="true" className={`relative mb-3 h-3 w-full transition-[max-width] duration-700 ${ease}`} style={{ maxWidth: target.px ? `${target.px}px` : "100%" }}>
            <div className="absolute inset-x-0 top-1.5 h-px bg-line-2" />
            <div className="absolute inset-y-0 left-0 w-px bg-acc" />
            <div className="absolute inset-y-0 right-0 w-px bg-acc" />
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-[repeating-linear-gradient(90deg,var(--color-line-2)_0_1px,transparent_1px_24px)]" />
            <span className="mono absolute -top-3.5 left-1/2 -translate-x-1/2 rounded bg-panel px-1.5 text-[0.58rem] text-acc">{measured || "—"} px</span>
          </div>

          <div
            ref={frame}
            className={`${light ? "stage-light" : "stage-dark screen"} relative grid min-h-[480px] w-full place-items-center overflow-hidden rounded-xl border px-5 py-12 transition-[max-width,background-color,border-color] duration-700 ${ease} sm:px-8`}
            style={{ maxWidth: target.px ? `${target.px}px` : "100%" }}
          >
            {/* lights coming on: a soft sweep each time the stage switches */}
            <span key={String(light)} aria-hidden="true" className="stage-lights pointer-events-none absolute inset-0" />
            <span aria-hidden="true" className="stage-grid pointer-events-none absolute inset-0" />
            {["left-3 top-3 border-l border-t", "right-3 top-3 border-r border-t", "bottom-3 left-3 border-b border-l", "bottom-3 right-3 border-b border-r"].map((c) => (
              <span key={c} aria-hidden="true" className={`pointer-events-none absolute h-3.5 w-3.5 border-acc/70 ${c}`} />
            ))}
            <div className="stage-on relative grid w-full place-items-center">
              <Demo controls={values} />
            </div>
          </div>
        </div>

        {/* one quiet caption line */}
        <div className="flex flex-col gap-x-5 gap-y-1 border-t border-line px-5 py-3 text-sm sm:flex-row sm:items-start">
          <span className="mono shrink-0 pt-1 text-[0.6rem] text-mute">
            {target.px ? `${target.px} px viewport` : "Full width"} · {light ? "Light" : "Dark"} stage{slow ? " · Slow-mo ×¼" : ""}
          </span>
          {last ? (
            <span key={last.n} className={`anim-rise min-w-0 flex-1 ${TONE[last.tone]}`} aria-live="polite">
              {last.text}
            </span>
          ) : (
            <span className="min-w-0 flex-1 text-mute">
              <span className="text-text/80">Try it:</span> {tryIt.join(" → ")}
            </span>
          )}
        </div>
      </div>

      {play && (
        <details className="group mt-3 overflow-hidden rounded-2xl border border-line bg-panel">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-acc">
            <span className="flex min-w-0 items-center gap-2.5">
              <span aria-hidden="true" className="text-acc">⚙</span> Customize
              <span className="truncate font-normal text-mute">{play.controls.map((c) => c.label.toLowerCase()).join(", ")}</span>
            </span>
            <span aria-hidden="true" className="text-mute transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <Controls
            controls={play.controls}
            values={values}
            onChange={(key, value) => setValues((v) => ({ ...v, [key]: value }))}
            onReset={() => setValues(play.initial)}
          />
        </details>
      )}
    </section>
  );
}
