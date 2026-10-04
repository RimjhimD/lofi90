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
    <div className="border-t border-line bg-panel px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="mono flex items-center gap-1.5 text-[0.64rem] text-acc"><i className="led" data-on="true" style={{ width: 6, height: 6 }} /> Controls</span>
        <button type="button" onClick={onReset} className="mono text-[0.62rem] text-mute hover:text-acc focus-visible:outline-2 focus-visible:outline-acc">
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
                <span className="flex justify-between text-xs font-medium text-text/90">
                  {c.label}
                  <span className="font-mono text-mute">{shown}{c.unit}</span>
                </span>
                <input
                  type="range"
                  min={c.min}
                  max={c.max}
                  step={c.step}
                  value={Number(v)}
                  onChange={(e) => onChange(c.key, Number(e.target.value))}
                  className="w-full accent-[#C6FF3D]"
                />
              </label>
            );
          }
          return (
            <div key={c.key} role="radiogroup" aria-labelledby={labelId} className="flex flex-col gap-1">
              <span id={labelId} className="text-xs font-medium text-text/90">{c.label}</span>
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
                      className="h-6 w-6 rounded-full border border-line-2 shadow-[inset_0_0_0_2px_#121614] transition-transform hover:scale-110 aria-checked:scale-110 aria-checked:outline-2 aria-checked:outline-offset-2 aria-checked:outline-acc focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acc"
                      style={{ background: o.value }}
                    />
                  ) : (
                    <button
                      key={o.value}
                      type="button"
                      role="radio"
                      aria-checked={v === o.value}
                      onClick={() => onChange(c.key, o.value)}
                      className="mono rounded-md border border-line-2 px-2 py-1 text-[0.62rem] text-mute aria-checked:border-acc aria-checked:bg-acc/10 aria-checked:text-acc focus-visible:outline-2 focus-visible:outline-acc"
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
