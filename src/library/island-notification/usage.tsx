"use client";

import { useState } from "react";
import { IslandNotification, type IslandItem } from "@/library/island-notification/IslandNotification";

// Keep the queue in state (or a store) and push to it from anywhere. The island shows one at a time,
// waits while the person is typing, and tells you when each one is done.
export function AppShell({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<IslandItem[]>([]);
  const notify = (item: Omit<IslandItem, "id">) => setItems((xs) => [...xs, { id: crypto.randomUUID(), ...item }]);

  return (
    <>
      <IslandNotification items={items} onDismiss={(id) => setItems((xs) => xs.filter((x) => x.id !== id))} />
      <button onClick={() => notify({ title: "Saved", body: "Your changes are live.", tone: "success", icon: "✓" })}>Save</button>
      {children}
    </>
  );
}
