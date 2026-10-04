"use client";

import { click, useLoop, type Step } from "@/lib/loop";
import { UndoFuseButton } from "./UndoFuseButton";

const noop = () => {};

/** A looping scene: the real button pressed (and pressed again) on a timer, then reset. */
function Scene({ period, delayMs, steps }: { period: number; delayMs: number; steps: Step[] }) {
  const { ref, run, stop } = useLoop(period, steps);
  return (
    <div ref={ref} onClick={stop}>
      <UndoFuseButton key={run} onCommit={noop} delayMs={delayMs} />
    </div>
  );
}

/** Every state, playing live on a loop (Ready and Disabled hold still). */
export const UNDO_FUSE_BUTTON_STATES = [
  { id: "idle", label: "Ready", note: "A plain destructive button until you press it.", node: <UndoFuseButton onCommit={noop} previewState="idle" /> },
  {
    id: "burning",
    label: "Fuse burning",
    note: "The fuse burns around the border; the spark marks how much time is left.",
    node: <Scene period={5600} delayMs={4000} steps={[[700, click("button")]]} />,
  },
  {
    id: "undone",
    label: "Undone",
    note: "Pressed again in time: nothing happens, it says so.",
    node: <Scene period={4600} delayMs={4000} steps={[[700, click("button")], [2300, click("button")]]} />,
  },
  {
    id: "done",
    label: "Done",
    note: "The fuse reached the end and the action ran.",
    node: <Scene period={4400} delayMs={1800} steps={[[600, click("button")]]} />,
  },
  { id: "committing", label: "Committing", note: "onCommit returned a promise: it waits here, busy, until the server answers.", node: <UndoFuseButton onCommit={noop} previewState="committing" /> },
  { id: "disabled", label: "Disabled", note: "Nothing selected, so nothing to delete.", node: <UndoFuseButton onCommit={noop} disabled /> },
];
