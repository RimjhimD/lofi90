"use client";

import { useState } from "react";
import { click, useLoop } from "@/lib/loop";
import { StringNav, type StringNavItem, type StringNavProps } from "./StringNav";

const ITEMS: StringNavItem[] = [
  { id: "home", label: "Home" },
  { id: "work", label: "Work" },
  { id: "studio", label: "Studio" },
  { id: "contact", label: "Contact" },
];
const noop = () => {};
const at = (id: string) => click(`[data-item="${id}"]`);

const frame = (node: React.ReactNode, width = 360) => <div style={{ width }}>{node}</div>;

/** A nav that keeps its own value, so scripted clicks move the bead. */
function Live(props: Partial<StringNavProps>) {
  const [value, setValue] = useState("home");
  return <StringNav items={ITEMS} value={value} onChange={setValue} {...props} />;
}

/** The real nav on a loop: links clicked on a timer, so the string rings and the bead travels. */
function Plucking() {
  const { ref, run, stop } = useLoop(5200, [
    [600, at("work")],
    [1900, at("contact")],
    [3200, at("studio")],
    [4400, at("home")],
  ]);
  return (
    <div ref={ref} onClick={stop}>
      {frame(<Live key={run} />)}
    </div>
  );
}

/** Every state; Plucked plays live on a loop, the others hold still. */
export const STRING_NAV_STATES = [
  { id: "resting", label: "Resting", note: "A straight string between two pegs; the bead sits under the active link.", node: frame(<StringNav items={ITEMS} value="home" onChange={noop} />) },
  { id: "pulled", label: "Pulled", note: "A pointer near the string bends it toward the cursor.", node: frame(<StringNav items={ITEMS} value="work" onChange={noop} preview={{ pull: { x: 0.62, y: 11 } }} />) },
  { id: "plucked", label: "Plucked", note: "Each click plucks the string; the bead rides the ring to the new link.", node: <Plucking /> },
  { id: "ringing", label: "Mid-ring", note: "Frozen mid-vibration: the string glows while it rings.", node: frame(<StringNav items={ITEMS} value="studio" onChange={noop} preview={{ plucked: true }} />) },
  { id: "small", label: "Small", note: "Size sm: tighter text and a thinner band, for dense headers.", node: frame(<StringNav items={ITEMS} value="contact" onChange={noop} size="sm" />, 280) },
];
