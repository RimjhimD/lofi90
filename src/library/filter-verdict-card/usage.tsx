import { FilterVerdictCard } from "@/library/filter-verdict-card/FilterVerdictCard";
import type { Condition } from "@/library/filter-verdict-card/evaluate";

// The same conditions your workflow's filter step uses.
const vipFollowUp: Condition[] = [
  { field: "phone", op: "exists", label: "Phone number is saved" },
  { field: "tags", op: "includes", value: "vip", label: 'Tags include "vip"' },
  { field: "dnd", op: "equals", value: false, label: "Do-not-disturb is off" },
  { field: "spend", op: "gt", value: 300, label: "Lifetime spend over $300" },
];

export function WhyDidntItRun({ contact }: { contact: { name: string } & Record<string, unknown> }) {
  return (
    <FilterVerdictCard
      title={contact.name}
      subtitle="Workflow: VIP follow-up"
      record={contact}
      conditions={vipFollowUp}
      mode="all"
      onVerdict={(v) => console.log(v.passed ? "would run" : "blocked")}
    />
  );
}
