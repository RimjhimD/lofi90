"use client";

import { click, useLoop } from "@/lib/loop";
import { BoardingPassCard, type BoardingPass } from "./BoardingPassCard";

const PASS: BoardingPass = {
  from: { code: "DAC", city: "Dhaka" },
  to: { code: "LHR", city: "London" },
  passenger: "Nadia Rahman",
  flight: "MA 207",
  date: "14 Nov",
  boards: "21:40",
  gate: "B12",
  seat: "14A",
  group: "3",
  cabin: "Economy",
};
const MOVED: BoardingPass = { ...PASS, gate: "C04", gateChanged: true };

const wide = (node: React.ReactNode) => <div className="w-[440px]">{node}</div>;
const narrow = (node: React.ReactNode) => <div className="w-[300px]">{node}</div>;

/** The real pass on a loop: the tear button is pressed, the stub flies off, then a fresh pass. */
function Tear({ frame }: { frame: (node: React.ReactNode) => React.ReactNode }) {
  const { ref, run, stop } = useLoop(4400, [[900, click("[data-tear]")]]);
  return (
    <div ref={ref} onClick={stop}>
      {frame(<BoardingPassCard key={run} pass={PASS} airline="Monsoon Air" />)}
    </div>
  );
}

/** Every state; the two tear-offs play live on a loop, the plane glides in all of them. */
export const BOARDING_PASS_CARD_STATES = [
  { id: "ready", label: "Ready", note: "Stub on, dotted perforation, the plane gliding along its route.", node: wide(<BoardingPassCard pass={PASS} airline="Monsoon Air" />) },
  { id: "tearing", label: "Peeling", note: "Pulled halfway: the stub tilts away and both edges turn jagged.", node: wide(<BoardingPassCard pass={PASS} airline="Monsoon Air" preview="tearing" />) },
  { id: "torn", label: "Checked in", note: "Torn off: the stub flies away and the stamp thumps down.", node: <Tear frame={wide} /> },
  { id: "stacked", label: "Small screen", note: "Narrow: the stub sits below and tears downward.", node: <Tear frame={narrow} /> },
  { id: "gate-changed", label: "Gate changed", note: "The new gate is shown in amber on both halves.", node: wide(<BoardingPassCard pass={MOVED} airline="Monsoon Air" />) },
];
