"use client";

import { useState } from "react";
import { useLoop, type Step } from "@/lib/loop";
import { TabProgressLoader, type TabProgressPreview } from "./TabProgressLoader";

const still = (state: TabProgressPreview, variant: "bar" | "ring" = "bar") => (
  <div className="w-[340px]">
    <TabProgressLoader previewState={state} progress={null} status="idle" variant={variant} tabPreview />
  </div>
);

/** The running state on a loop: the bar and the mock tab's ring fill together. Preview only, the real tab is untouched. */
function Filling() {
  const [p, setP] = useState(0);
  const steps: Step[] = [[0, () => setP(0)], ...Array.from({ length: 12 }, (_, i) => [400 + i * 330, () => setP(Math.min(100, (i + 1) * 8))] as Step)];
  const { ref, stop } = useLoop(5200, steps);
  return (
    <div ref={ref} onClick={stop} className="w-[340px]">
      <TabProgressLoader previewState="running" progress={p} status="running" tabPreview />
    </div>
  );
}

/** Every state, with the in-page loader and the mock browser tab it drives. */
export const TAB_PROGRESS_LOADER_STATES = [
  { id: "idle", label: "Ready", note: "Nothing running. The tab shows the page's own title and icon.", node: still("idle") },
  { id: "running", label: "Running", note: "The tab icon fills as a ring and the title reads \"42% · Exporting report\".", node: <Filling /> },
  { id: "indeterminate", label: "Unknown length", note: "No percent yet: the bar slides and the tab icon spins.", node: still("indeterminate") },
  { id: "done", label: "Done", note: "Green ✓ icon and \"✓ Ready\" title until you come back to the tab.", node: still("done") },
  { id: "error", label: "Failed", note: "Red ! icon and \"Failed\" title, so you notice from any tab.", node: still("error") },
  { id: "cancelled", label: "Cancelled", note: "Stopped by the user. The tab goes straight back to normal.", node: still("cancelled") },
  { id: "disabled", label: "Can't cancel", note: "Cancel is locked near the end, and it says why.", node: still("disabled") },
  { id: "ring", label: "Ring style", note: "The same loader as a ring with the percent inside.", node: still("running", "ring") },
];
