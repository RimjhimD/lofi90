"use client";

import { useId } from "react";

export type Control =
  | { key: string; label: string; type: "segment"; options: { value: string; label: string }[] }
  | { key: string; label: string; type: "slider"; min: number; max: number; step: number; unit?: string; scale?: number }
  | { key: string; label: string; type: "color"; options: { value: string; label: string }[] };

export type ControlValues = Record<string, string | number>;

/** The playground panel under a live preview: swatches, segments and sliders that drive the component's props. */
export function Controls({ controls, values, onChange, onReset }: { controls: Control[]; values: ControlValues; onChange: (key: string, value: string | number) => void; onReset: () => void }) {
  const id = useId();
  return (
    <div className="border-t-2 border-ink bg-white px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="mono text-[0.66rem] text-muted">Controls</span>
        <button type="button" onClick={onReset} className="mono text-[0.62rem] underline decoration-signal underline-offset-4 hover:text-signal focus-visible:outline-2 focus-visible:outline-signal">
          Reset
        </button>
      </div>
      <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
        {controls.map((c) => {
          const v = values[c.key];
          const labelId = `${id}-${c.key}`;
          if (c.type === "slider") {
            const shown = c.scale ? (Number(v) * c.scale).toFixed(0) : String(v);
            return (
              <label key={c.key} className="flex flex-col gap-1">
                <span className="flex justify-between text-xs font-bold">
                  {c.label}
                  <span className="font-mono font-normal text-muted">{shown}{c.unit}</span>
                </span>
                <input
                  type="range"
                  min={c.min}
                  max={c.max}
                  step={c.step}
                  value={Number(v)}
                  onChange={(e) => onChange(c.key, Number(e.target.value))}
                  className="w-full accent-[#D7263D]"
                />
              </label>
            );
          }
          return (
            <div key={c.key} role="radiogroup" aria-labelledby={labelId} className="flex flex-col gap-1">
              <span id={labelId} className="text-xs font-bold">{c.label}</span>
              <div className="flex flex-wrap gap-1.5">
                {c.options.map((o) =>
                  c.type === "color" ? (
                    <button
                      key={o.value}
                      type="button"
                      role="radio"
                      aria-checked={v === o.value}
                      aria-label={o.label}
                      title={o.label}
                      onClick={() => onChange(c.key, o.value)}
                      className="h-6 w-6 rounded-full border-2 border-ink shadow-[inset_0_0_0_2px_#fff] transition-transform hover:scale-110 aria-checked:scale-110 aria-checked:outline-2 aria-checked:outline-offset-2 aria-checked:outline-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
                      style={{ background: o.value }}
                    />
                  ) : (
                    <button
                      key={o.value}
                      type="button"
                      role="radio"
                      aria-checked={v === o.value}
                      onClick={() => onChange(c.key, o.value)}
                      className="mono -ml-px border border-ink bg-white px-2 py-1 text-[0.62rem] first:ml-0 aria-checked:bg-ink aria-checked:text-bone focus-visible:relative focus-visible:outline-2 focus-visible:outline-signal"
                    >
                      {o.label}
                    </button>
                  ),
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
