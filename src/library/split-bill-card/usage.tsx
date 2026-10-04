"use client";

import { SplitBillCard } from "@/library/split-bill-card/SplitBillCard";

// Prices are in cents so every share adds back up to the exact total.
export function SplitDinner({ receipt, friends }: { receipt: { id: string; name: string; price: number }[]; friends: { id: string; name: string; color: string }[] }) {
  return (
    <SplitBillCard
      title="Friday dinner"
      items={receipt.map((r) => ({ id: r.id, name: r.name, cents: Math.round(r.price * 100) }))}
      people={friends}
      taxRate={0.08}
      tipRate={0.18}
      currency="USD"
      onChange={(assignments, totals) => console.info(assignments, totals)}
    />
  );
}
