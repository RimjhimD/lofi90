"use client";

import { useState } from "react";
import { click, useLoop } from "@/lib/loop";
import { OfflineAwareNavbar, QueueStatusBadge, createOfflineQueue, useOfflineQueue, type NavLink, type NavbarPreviewState, type QueueItemStatus } from "./OfflineAwareNavbar";

const LINKS: NavLink[] = [
  { label: "Orders", href: "#", active: true },
  { label: "Customers", href: "#" },
  { label: "Reports", href: "#" },
];

type Row = [string, QueueItemStatus | "saved"];

/** A still frame: the navbar in one state over a couple of order rows. No links, buttons or listeners. */
function Still({ state, rows }: { state: NavbarPreviewState; rows: Row[] }) {
  return (
    <div className="w-full max-w-[360px] overflow-hidden rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-bg,#0E1110)]">
      <OfflineAwareNavbar brand="Orders" links={LINKS} previewState={state} size="sm" />
      <Rows rows={rows} />
    </div>
  );
}

function Rows({ rows }: { rows: Row[] }) {
  return (
    <ul className="text-xs text-[var(--k-text,#E9EDE8)]">
      {rows.map(([label, status]) => (
        <li key={label} className="flex items-center justify-between gap-2 border-b border-[var(--k-line,#3A433F)] px-3 py-2 last:border-b-0">
          <span className="truncate">{label}</span>
          <QueueStatusBadge status={status} />
        </li>
      ))}
    </ul>
  );
}

/** A live loop: the real navbar and queue going offline, taking an order, and syncing it on reconnect. */
function Cycle() {
  const { ref, run, stop } = useLoop(7000, [
    [800, click("[data-off]")],
    [1700, click("[data-add]")],
    [2500, click("[data-add]")],
    [3800, click("[data-on]")],
  ]);
  return (
    <div ref={ref} onClick={stop} className="w-full max-w-[360px]">
      <CycleScene key={run} />
    </div>
  );
}

function CycleScene() {
  const [queue] = useState(() => createOfflineQueue());
  const q = useOfflineQueue(queue);
  const [offline, setOffline] = useState(false);
  const [rows, setRows] = useState<{ label: string; qid?: string }[]>([{ label: "Order #1042 · Ana" }]);
  const add = () => {
    const label = `Order #${1042 + rows.length} · New`;
    const qid = queue.add(() => new Promise((r) => setTimeout(r, 600)), label);
    setRows((rs) => [...rs, { label, qid }]);
  };
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-bg,#0E1110)]">
      <OfflineAwareNavbar brand="Orders" links={LINKS} queue={queue} size="sm" savedMs={1800} forceStatus={offline ? "offline" : "online"} />
      <Rows rows={rows.map((r) => [r.label, q.statusOf(r.qid)])} />
      <button type="button" hidden data-off onClick={() => setOffline(true)} />
      <button type="button" hidden data-on onClick={() => setOffline(false)} />
      <button type="button" hidden data-add onClick={add} />
    </div>
  );
}

const saved: Row[] = [
  ["Order #1042 · Ana", "saved"],
  ["Order #1043 · Ben", "saved"],
];

/** Every state. All are still frames with sample data except the live cycle. */
export const OFFLINE_AWARE_NAVBAR_STATES = [
  { id: "cycle", label: "Full cycle (live)", note: "Offline, two orders taken, back online: they sync in order and the strip says so, then slides away.", node: <Cycle /> },
  { id: "online", label: "Online", note: "A plain navbar. The icon's dot is the only hint that it is watching the connection.", node: <Still state="online" rows={saved} /> },
  { id: "offline", label: "Offline, nothing waiting", note: "The strip slides down and says changes will save later.", node: <Still state="offline" rows={saved} /> },
  {
    id: "offline-waiting",
    label: "Offline with waiting changes",
    note: "Work done offline is kept and counted. Each item shows a Waiting badge.",
    node: <Still state="offline-waiting" rows={[["Order #1042 · Ana", "saved"], ["Order #1043 · Ben", "waiting"], ["Order #1044 · Chloe", "waiting"]]} />,
  },
  { id: "syncing", label: "Back online, syncing", note: "Waiting changes are sent one by one, in the order they were made.", node: <Still state="syncing" rows={[["Order #1043 · Ben", "saved"], ["Order #1044 · Chloe", "syncing"]]} /> },
  { id: "saved", label: "All saved", note: "Everything reached the server. The strip says so and slides away after a moment.", node: <Still state="saved" rows={saved} /> },
  { id: "failed", label: "Sync failed", note: "The server refused one change. It stays, marked Not saved, with Retry.", node: <Still state="failed" rows={[["Order #1043 · Ben", "saved"], ["Order #1044 · Chloe", "failed"]]} /> },
  { id: "slow", label: "Slow connection", note: "Where the browser reports it, a quiet hint that saving may take longer.", node: <Still state="slow" rows={saved} /> },
  { id: "menu-open", label: "Mobile menu open", note: "On narrow screens the links fold into a menu. Focus moves into it; Esc closes it.", node: <Still state="menu-open" rows={saved.slice(0, 1)} /> },
];
