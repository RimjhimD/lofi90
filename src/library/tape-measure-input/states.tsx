"use client";

import { useState } from "react";
import { useLoop, type Step } from "@/lib/loop";
import { TAPE_HOOK_W, TapeMeasureInput } from "./TapeMeasureInput";

const noop = () => {};
const frame = (node: React.ReactNode) => <div className="w-[380px] p-1">{node}</div>;

/* Scripted hands: real pointer events on the real hook, aimed in the track's own pixels. */
const send = (el: Element, type: string, x: number, y: number) =>
  el.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 1, isPrimary: true, button: 0, clientX: x, clientY: y }));

function aim(root: HTMLElement, f: number) {
  const track = root.querySelector<HTMLElement>("[data-tape-track]")!;
  const r = track.getBoundingClientRect();
  const scale = r.width / (track.offsetWidth || 1);
  const usable = track.offsetWidth - TAPE_HOOK_W - 6;
  return { x: r.left + scale * (f * usable + TAPE_HOOK_W / 2), y: r.top + r.height / 2 };
}

const hook = (root: HTMLElement) => root.querySelector<HTMLElement>("[data-tape-hook]")!;

/** Grab the hook at `t0`, move it through `keys` ([ms after t0, fraction of the track]) with eased moves, then let go. */
function pull(t0: number, keys: [number, number][]): Step[] {
  const steps: Step[] = [
    [
      t0,
      (root) => {
        const r = hook(root).getBoundingClientRect();
        send(hook(root), "pointerdown", r.left + r.width / 2, r.top + r.height / 2);
      },
    ],
  ];
  for (let k = 1; k < keys.length; k++) {
    const [m0, f0] = keys[k - 1];
    const [m1, f1] = keys[k];
    for (let t = m0 + 30; t <= m1; t += 30) {
      const u = (t - m0) / (m1 - m0);
      const f = f0 + (f1 - f0) * (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
      steps.push([t0 + t, (root) => { const p = aim(root, f); send(hook(root), "pointermove", p.x, p.y); }]);
    }
  }
  steps.push([t0 + keys[keys.length - 1][0] + 40, (root) => send(hook(root), "pointerup", 0, 0)]);
  return steps;
}

const home = (root: HTMLElement) => hook(root).dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));

/** The real input played by a scripted hand, on a loop. */
function Scene({ period, steps, step = 1 }: { period: number; steps: Step[]; step?: number }) {
  const [v, setV] = useState(0);
  const { ref, stop } = useLoop(period, steps);
  return (
    <div ref={ref} onClick={stop}>
      {frame(<TapeMeasureInput label="Length" value={v} onChange={setV} step={step} />)}
    </div>
  );
}

/** Every state, playing live on a loop (Retracted, Fully out and Disabled hold still). */
export const TAPE_MEASURE_INPUT_STATES = [
  { id: "retracted", label: "Retracted", note: "At min the tape is all the way in; only the hook shows.", node: frame(<TapeMeasureInput label="Length" value={0} onChange={noop} preview={{ value: 0 }} />) },
  {
    id: "pulling",
    label: "Pulling",
    note: "A fast pull: the tape slides out, flexes a little, and the readout counts live. Back to min, it zips in.",
    node: <Scene period={5600} steps={[...pull(500, [[0, 0], [650, 0.8], [950, 0.62], [1200, 0.7]]), [3800, home]]} />,
  },
  {
    id: "snapped",
    label: "Snapped",
    note: "Let go between marks and it springs to the nearest step, overshooting a hair.",
    node: <Scene period={5400} step={10} steps={[...pull(500, [[0, 0], [1100, 0.44], [1500, 0.44]]), [3900, home]]} />,
  },
  { id: "extended", label: "Fully out", note: "At max the hook rests against the end stop.", node: frame(<TapeMeasureInput label="Length" value={200} onChange={noop} preview={{ value: 200 }} />) },
  { id: "disabled", label: "Disabled", note: "Dimmed and locked: no dragging, no keys.", node: frame(<TapeMeasureInput label="Length" value={70} onChange={noop} disabled />) },
];
