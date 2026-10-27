"use client";

import { click, useLoop, type Step } from "@/lib/loop";
import { WaxSealButton } from "./WaxSealButton";

const noop = () => {};
const slow = () => new Promise((r) => setTimeout(r, 1400));

/** A looping scene: the real button pressed on a timer, then remounted fresh. */
function Scene({ period, steps }: { period: number; steps: Step[] }) {
  const { ref, run, stop } = useLoop(period, steps);
  return (
    <div ref={ref} onClick={stop}>
      <WaxSealButton key={run} onSubmit={slow} labels={{ idle: "Pay $48.00", sent: "Paid" }} />
    </div>
  );
}

const pay = { idle: "Pay $48.00", sent: "Paid", sealing: "Paying…" };

/** Every state. The press-and-seal one plays live; the rest hold still. */
export const WAX_SEAL_BUTTON_STATES = [
  { id: "idle", label: "Ready", note: "A dashed ring shows where the seal will land.", node: <WaxSealButton onSubmit={noop} labels={pay} previewState="idle" /> },
  {
    id: "stamp",
    label: "Stamped",
    note: "Pressed: the seal drops, squishes, then glints when the server says yes. Extra clicks do nothing.",
    node: <Scene period={4200} steps={[[700, click("button")], [900, click("button")], [1000, click("button")]]} />,
  },
  { id: "sealing", label: "Sending", note: "Sealed and on its way, busy, with the wax still warm.", node: <WaxSealButton onSubmit={noop} labels={pay} previewState="sealing" /> },
  { id: "queued", label: "Offline", note: "Sealed but cold. It sends by itself, same key, when the connection is back.", node: <WaxSealButton onSubmit={noop} labels={pay} previewState="queued" /> },
  { id: "retrying", label: "Retrying", note: "The server said 503. It waits, counts down and tries again with the same key.", node: <WaxSealButton onSubmit={noop} labels={pay} previewState="retrying" /> },
  { id: "sent", label: "Sent", note: "Went through once. It stays sealed, so it can't pay twice.", node: <WaxSealButton onSubmit={noop} labels={pay} previewState="sent" /> },
  { id: "error", label: "Cracked", note: "A real refusal. The seal cracks and the button can be pressed again.", node: <WaxSealButton onSubmit={noop} labels={pay} previewState="error" /> },
  { id: "disabled", label: "Disabled", note: "Nothing in the cart yet.", node: <WaxSealButton onSubmit={noop} labels={pay} disabled /> },
];
