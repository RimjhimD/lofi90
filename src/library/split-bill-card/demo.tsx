"use client";

import { useRef, useState } from "react";
import type { ControlValues } from "@/site/Controls";
import { say } from "@/site/log";
import { SplitBillCard, type BillItem, type BillPerson, type SplitBillCardProps } from "./SplitBillCard";

const ITEMS: BillItem[] = [
  { id: "a", name: "Margherita pizza", cents: 1450 },
  { id: "b", name: "Truffle fries", cents: 890 },
  { id: "c", name: "Caesar salad", cents: 1125 },
  { id: "d", name: "Lemonade × 2", cents: 760 },
  { id: "e", name: "Tiramisu", cents: 950 },
  { id: "f", name: "Garlic bread", cents: 525 },
];

const PEOPLE: BillPerson[] = [
  { id: "sam", name: "Sam", color: "#FF6B57" },
  { id: "maya", name: "Maya", color: "#3DD9FF" },
  { id: "jo", name: "Jo", color: "#FFB547" },
];

const START = { a: ["sam", "maya"], b: ["jo"], d: ["maya", "jo"] };

/** Live preview: three friends splitting dinner. Drag a name onto an item, or tap a name then the items. */
export default function SplitBillCardDemo({ controls = {} }: { controls?: ControlValues }) {
  const look = controls as Pick<SplitBillCardProps, "accent" | "coin" | "coinMotion" | "taxRate" | "tipRate">;
  const [run, setRun] = useState(0);
  const first = useRef(true);
  const money = (c: number) => `$${(c / 100).toFixed(2)}`;
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <SplitBillCard taxRate={0.08} tipRate={0.18} {...look} key={run} title="Luigi's · Table 4" items={ITEMS} people={PEOPLE} initialAssignments={START}
        onChange={(_, totals) => {
          if (first.current) return void (first.current = false);
          const parts = PEOPLE.map((p) => `${p.name} ${money(totals[p.id] ?? 0)}`).join(" · ");
          const sum = Object.values(totals).reduce((a, b) => a + b, 0);
          say(`Re-split: ${parts} = ${money(sum)} (every cent accounted for).`, "good");
        }}
      />
      <button type="button" onClick={() => { first.current = true; setRun((r) => r + 1); say("Bill reset to the starting split."); }} className="rounded-lg border border-[#3A433F] bg-[#121614] px-3 py-0.5 text-sm font-bold shadow-[0_10px_30px_-14px_rgba(0,0,0,.9)] focus-visible:outline-3 focus-visible:outline-[#C6FF3D]">
        Reset the bill
      </button>
    </div>
  );
}
