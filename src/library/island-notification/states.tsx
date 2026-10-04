"use client";

import { useState } from "react";
import { useLoop } from "@/lib/loop";
import { IslandNotification, type IslandItem } from "./IslandNotification";

const noop = () => {};
const msg: IslandItem = { id: "a", title: "New message from Sam", body: "Running 10 minutes late, sorry!", icon: "💬", action: { label: "Reply", onClick: noop } };
const fail: IslandItem = { id: "b", title: "Payment failed", body: "Your card was declined.", icon: "!", tone: "error" };
const ok: IslandItem = { id: "c", title: "Booking confirmed", body: "Friday 7:00 pm", icon: "✓", tone: "success" };

const frame = (node: React.ReactNode) => <div className="relative h-[150px] w-[400px]">{node}</div>;

/** The real island on a loop: notifications arrive, show for a moment, and go. */
function Arrive({ batch, duration, period }: { batch: IslandItem[]; duration: number; period: number }) {
  const [items, setItems] = useState<IslandItem[]>([]);
  const { ref } = useLoop(period, [
    [0, () => setItems([])],
    [700, () => setItems(batch)],
  ]);
  return (
    <div ref={ref}>
      {frame(<IslandNotification position="absolute" items={items} duration={duration} onDismiss={(id) => setItems((xs) => xs.filter((x) => x.id !== id))} />)}
    </div>
  );
}

/** An upload filling the pill's ring, then finishing. */
function Upload() {
  const [p, setP] = useState(0);
  const { ref } = useLoop(5400, [[0, () => setP(0)], ...Array.from({ length: 10 }, (_, i) => [500 + i * 320, () => setP((i + 1) / 10)] as [number, () => void])]);
  const done = p >= 1;
  const item: IslandItem = done ? { id: "u", title: "Upload finished", body: "12 photos are in the album.", tone: "success", icon: "✓", progress: 1 } : { id: "u", title: "Uploading photos", progress: p };
  return <div ref={ref}>{frame(<IslandNotification position="absolute" items={[item]} duration={60000} onDismiss={noop} />)}</div>;
}

/** Every state, playing live on a loop (Quiet and Waiting hold still). */
export const ISLAND_NOTIFICATION_STATES = [
  { id: "idle", label: "Quiet", note: "A small pill with a glowing dot.", node: frame(<IslandNotification position="absolute" items={[]} onDismiss={noop} />) },
  { id: "open", label: "Notification", note: "The pill morphs into a card with an action, then shrinks back.", node: <Arrive batch={[msg]} duration={2600} period={4800} /> },
  { id: "error", label: "Error", note: "Coral glow and button for things that need fixing.", node: <Arrive batch={[fail]} duration={2600} period={4800} /> },
  { id: "queued", label: "Queued", note: "Three arrive at once: one shows, +2 wait their turn.", node: <Arrive batch={[ok, msg, fail]} duration={1500} period={8200} /> },
  { id: "live", label: "Live activity", note: "An upload lives in the pill as a progress ring.", node: <Upload /> },
  { id: "held", label: "Waiting for you", note: "Amber dot: held while you type, delivered when you pause.", node: frame(<IslandNotification position="absolute" items={[msg]} onDismiss={noop} preview="held" />) },
];
