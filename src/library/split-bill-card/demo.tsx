"use client";

import { useState } from "react";
import { SplitBillCard, type BillItem, type BillPerson } from "./SplitBillCard";

const ITEMS: BillItem[] = [
  { id: "a", name: "Margherita pizza", cents: 1450 },
  { id: "b", name: "Truffle fries", cents: 890 },
  { id: "c", name: "Caesar salad", cents: 1125 },
  { id: "d", name: "Lemonade × 2", cents: 760 },
  { id: "e", name: "Tiramisu", cents: 950 },
  { id: "f", name: "Garlic bread", cents: 525 },
];

const PEOPLE: BillPerson[] = [
  { id: "sam", name: "Sam", color: "#D7263D" },
  { id: "maya", name: "Maya", color: "#0E3B2E" },
  { id: "jo", name: "Jo", color: "#7A4D00" },
];

const START = { a: ["sam", "maya"], b: ["jo"], d: ["maya", "jo"] };

/** Live preview: three friends splitting dinner. Drag a name onto an item, or tap a name then the items. */
export default function SplitBillCardDemo() {
  const [run, setRun] = useState(0);
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <SplitBillCard key={run} title="Luigi's · Table 4" items={ITEMS} people={PEOPLE} initialAssignments={START} taxRate={0.08} tipRate={0.18} />
      <button type="button" onClick={() => setRun((r) => r + 1)} className="border-2 border-[#1A1A17] bg-white px-3 py-0.5 text-sm font-bold shadow-[2px_2px_0_#1A1A17] focus-visible:outline-3 focus-visible:outline-[#D7263D]">
        Reset the bill
      </button>
    </div>
  );
}
