"use client";

import { useState } from "react";
import { FilterVerdictCard } from "./FilterVerdictCard";
import type { Condition, FilterMode } from "./evaluate";

const CONTACTS = [
  { id: "pass", label: "✅ Passes", name: "Sam Kim", record: { phone: "+1 555 010 2030", tags: ["vip", "booked"], dnd: false, spend: 420 } },
  { id: "missing", label: "👻 Missing phone", name: "Jo Rivera", record: { phone: "", tags: ["vip"], dnd: false, spend: 610 } },
  { id: "case", label: "🏷 Tag letter case", name: "Ava Chen", record: { phone: "+1 555 010 9911", tags: ["VIP"], dnd: false, spend: 380 } },
  { id: "dnd", label: "🔕 Do not disturb", name: "Leo Park", record: { phone: "+1 555 010 4410", tags: ["vip"], dnd: true, spend: 95 } },
];

const CONDITIONS: Condition[] = [
  { field: "phone", op: "exists", label: "Phone number is saved" },
  { field: "tags", op: "includes", value: "vip", label: 'Tags include "vip"' },
  { field: "dnd", op: "equals", value: false, label: "Do-not-disturb is off" },
  { field: "spend", op: "gt", value: 300, label: "Lifetime spend over $300" },
];

/** Live preview: why did (or didn't) the "VIP follow-up" workflow run for this contact? */
export default function FilterVerdictCardDemo() {
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<FilterMode>("all");
  const [runKey, setRunKey] = useState(0);
  const contact = CONTACTS[index];

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <FilterVerdictCard
        title={contact.name}
        subtitle={`Workflow: VIP follow-up · match ${mode === "all" ? "ALL" : "ANY"}`}
        record={contact.record}
        conditions={CONDITIONS}
        mode={mode}
        runKey={runKey}
      />
      <div role="group" aria-label="Pick a contact" className="flex flex-wrap justify-center gap-2">
        {CONTACTS.map((c, i) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={i === index}
            onClick={() => setIndex(i)}
            className="rounded-full border-[3px] border-[#20201C] bg-white px-3 py-0.5 text-sm font-extrabold shadow-[0_3px_0_#20201C] active:translate-y-0.5 active:shadow-[0_1px_0_#20201C] aria-pressed:bg-[#FFB800] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#3BB2F6]"
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => setMode(mode === "all" ? "any" : "all")}
          className="rounded-full border-[3px] border-[#20201C] bg-[#3BB2F6] px-3 py-0.5 text-sm font-extrabold shadow-[0_3px_0_#20201C] active:translate-y-0.5 active:shadow-[0_1px_0_#20201C] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#20201C]"
        >
          Switch to match {mode === "all" ? "ANY" : "ALL"}
        </button>
        <button
          type="button"
          onClick={() => setRunKey((k) => k + 1)}
          className="rounded-full border-[3px] border-[#20201C] bg-[#00C49A] px-3 py-0.5 text-sm font-extrabold shadow-[0_3px_0_#20201C] active:translate-y-0.5 active:shadow-[0_1px_0_#20201C] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#20201C]"
        >
          ▶ Check again
        </button>
      </div>
    </div>
  );
}
