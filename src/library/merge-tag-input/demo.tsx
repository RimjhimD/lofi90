"use client";

import { useState } from "react";
import { MergeTagInput, type MergeField, type SampleContact } from "./MergeTagInput";

const FIELDS: MergeField[] = [
  { key: "contact.first_name", label: "First name", fallback: "there" },
  { key: "contact.last_name", label: "Last name" },
  { key: "appointment.time", label: "Appointment time" },
  { key: "appointment.stylist", label: "Stylist", fallback: "our team" },
  { key: "business.name", label: "Business name" },
];

const SAMPLES: SampleContact[] = [
  { label: "Sam", values: { "contact.first_name": "Sam", "appointment.time": "Fri 3:00 pm", "appointment.stylist": "Maya", "business.name": "Glow Studio" } },
  { label: "Walk-in, no name", values: { "contact.first_name": "", "appointment.time": "Sat 11:30 am", "appointment.stylist": "Jo", "business.name": "Glow Studio" } },
  { label: "Priya", values: { "contact.first_name": "Priya", "appointment.time": "Mon 9:15 am", "business.name": "Glow Studio" } },
];

const START = "Hi {{contact.first_name}}! See you {{appointment.time}} with {{appointment.stylist}} at {{business.name}}. Reply C to confirm.";

/** Live preview: a salon's reminder text, checked against three real-looking customers. */
export default function MergeTagInputDemo() {
  const [text, setText] = useState(START);
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="w-full max-w-xl border-2 border-[#1A1A17] bg-[#FFFFFF] p-5 shadow-[5px_5px_0_#1A1A17]">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#5E5A50]">Glow Studio · Appointment reminder</p>
        <MergeTagInput value={text} onChange={setText} fields={FIELDS} samples={SAMPLES} label="Reminder text" />
      </div>
      <div role="group" aria-label="Try a mistake" className="flex flex-wrap justify-center gap-2">
        {[
          ["Reset", START],
          ["Typo in a field", "Hi {{contact.frist_name}}, your table is ready!"],
          ["Field nobody has", "Hi {{contact.first_name}}, Maya will see you at {{appointment.time}} ({{appointment.stylist}})."],
          ["Forgot to close", "Hi {{contact.first_name}}, see you {{appointment.time"],
        ].map(([label, value]) => (
          <button
            key={label}
            type="button"
            onClick={() => setText(value)}
            className="border-2 border-[#1A1A17] bg-white px-3 py-0.5 text-sm font-bold shadow-[2px_2px_0_#1A1A17] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_#1A1A17] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#D7263D]"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
