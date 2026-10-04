"use client";

import { click, useLoop, type Step } from "@/lib/loop";
import { SplitBillCard, type BillItem, type BillPerson } from "./SplitBillCard";

const ITEMS: BillItem[] = [
  { id: "a", name: "Pizza", cents: 1400 },
  { id: "b", name: "Fries", cents: 800 },
  { id: "c", name: "Salad", cents: 1100 },
];
const PEOPLE: BillPerson[] = [
  { id: "sam", name: "Sam", color: "#FF6B57" },
  { id: "maya", name: "Maya", color: "#3DD9FF" },
];
const who = (n: number) => click(`[aria-label="Who is choosing"] button:nth-of-type(${n})`);
const item = (name: string) => click(`button[aria-label^="${name},"]`);

/** The real card being split on a loop: pick a person, tap their dishes. */
function Scene({ period, steps, start = {} }: { period: number; steps: Step[]; start?: Record<string, string[]> }) {
  const { ref, run, stop } = useLoop(period, steps);
  return (
    <div ref={ref} onClick={stop}>
      <SplitBillCard key={run} items={ITEMS} people={PEOPLE} initialAssignments={start} />
    </div>
  );
}

/** Every state, splitting live on a loop (Nothing claimed holds still). */
export const SPLIT_BILL_CARD_STATES = [
  { id: "empty", label: "Nothing claimed", note: "Every line says unclaimed; nobody owes anything yet.", node: <SplitBillCard items={ITEMS} people={PEOPLE} /> },
  {
    id: "partial",
    label: "Some unclaimed",
    note: "Shows what's left over and offers to share it between everyone.",
    node: <Scene period={4200} steps={[[700, who(1)], [1100, item("Pizza")], [1700, who(2)], [2100, item("Pizza")]]} />,
  },
  {
    id: "shared",
    label: "Shared item",
    note: "The pizza is split in half; tax and tip follow what each person ate.",
    node: <Scene period={5200} steps={[[600, who(1)], [1000, item("Pizza")], [1500, item("Fries")], [2100, who(2)], [2500, item("Pizza")], [3000, item("Salad")]]} />,
  },
  {
    id: "settled",
    label: "All settled",
    note: "Everything claimed, and the shares add up to the exact cent.",
    node: <Scene period={4600} start={{ a: ["sam"] }} steps={[[700, who(1)], [1100, item("Fries")], [1700, who(2)], [2100, item("Fries")], [2600, item("Salad")]]} />,
  },
];
