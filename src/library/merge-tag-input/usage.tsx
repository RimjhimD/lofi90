"use client";

import { useState } from "react";
import { MergeTagInput } from "@/library/merge-tag-input/MergeTagInput";

// Pass the fields your CRM really has, and two or three real contacts to preview against —
// ideally one with a full profile and one that is missing data.
export function ReminderEditor({ contacts }: { contacts: { name: string; firstName?: string; time?: string }[] }) {
  const [text, setText] = useState("Hi {{contact.first_name | there}}, see you {{appointment.time}}.");

  return (
    <MergeTagInput
      value={text}
      onChange={setText}
      fields={[
        { key: "contact.first_name", label: "First name" },
        { key: "appointment.time", label: "Appointment time" },
      ]}
      samples={contacts.slice(0, 3).map((c) => ({
        label: c.name,
        values: { "contact.first_name": c.firstName, "appointment.time": c.time },
      }))}
    />
  );
}
