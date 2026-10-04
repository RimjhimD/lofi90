"use client";

import { click, useLoop, type Step } from "@/lib/loop";
import { RolodexCarousel, type RolodexCard } from "./RolodexCarousel";

const make = (names: string[]): RolodexCard[] => names.map((n, i) => ({ id: String(i), title: n, subtitle: "Contact" }));
const MANY = make(["Ana Alvarez", "Ben Okafor", "Chloe Martin", "Dev Patel", "Emma Nakamura", "Maya Chen", "Sam Osei"]);
const next = click('button[aria-label="Next card"]');
const prev = click('button[aria-label="Previous card"]');

/** The real rolodex flipping on a loop. */
function Scene({ start, period, steps }: { start: number; period: number; steps: Step[] }) {
  const { ref, run, stop } = useLoop(period, steps);
  return (
    <div ref={ref} onClick={stop}>
      <RolodexCarousel key={run} label="Contacts" cards={MANY} initialIndex={start} />
    </div>
  );
}

/** Every state, flipping live on a loop (One card holds still). */
export const ROLODEX_CAROUSEL_STATES = [
  { id: "first", label: "First card", note: "Previous is disabled; cards stack behind on the rod.", node: <Scene start={0} period={3400} steps={[[1000, next], [2200, prev]]} /> },
  { id: "middle", label: "Middle", note: "Each flip swings the card over the rod and out of sight.", node: <Scene start={3} period={5200} steps={[[900, next], [1900, next], [2900, prev], [3900, prev]]} /> },
  { id: "last", label: "Last card", note: "Next is disabled; the stack behind is empty.", node: <Scene start={MANY.length - 1} period={3400} steps={[[1000, prev], [2200, next]]} /> },
  { id: "single", label: "One card", note: "Still a rolodex; nothing to flip to.", node: <RolodexCarousel label="Contacts" cards={make(["Maya Chen"])} /> },
];
