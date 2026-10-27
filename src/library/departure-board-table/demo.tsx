"use client";

import { useEffect, useRef, useState } from "react";
import type { ControlValues } from "@/site/Controls";
import { say, type LogTone } from "@/site/log";
import { DepartureBoardTable, type BoardColumn, type DepartureBoardTableProps } from "./DepartureBoardTable";

type Status = "Baking" | "Ready" | "Collected";
interface Order {
  id: number;
  customer: string;
  item: string;
  status: Status;
  eta: number;
}

const NAMES = ["Priya", "Tom", "Amara", "Leo", "Sofia", "Kenji", "Nadia", "Omar", "Grace", "Ivan"];
const ITEMS = ["Sourdough", "Croissant x4", "Rye loaf", "Carrot cake", "Cinnamon bun", "Baguette x2", "Lemon tart", "Focaccia"];
const START: Order[] = [
  { id: 1041, customer: "Priya", item: "Sourdough", status: "Ready", eta: 0 },
  { id: 1042, customer: "Tom", item: "Croissant x4", status: "Baking", eta: 4 },
  { id: 1043, customer: "Amara", item: "Carrot cake", status: "Baking", eta: 9 },
  { id: 1044, customer: "Leo", item: "Rye loaf", status: "Baking", eta: 12 },
];

const COLUMNS: BoardColumn<Order>[] = [
  { key: "id", header: "Order", value: (o) => `#${o.id}`, width: 5 },
  { key: "customer", header: "Customer", value: (o) => o.customer, width: 7 },
  { key: "item", header: "Item", value: (o) => o.item, width: 12 },
  { key: "status", header: "Status", value: (o) => o.status, width: 9, tone: (o) => (o.status === "Ready" ? "ok" : o.status === "Collected" ? "neutral" : o.eta === 0 ? "bad" : "warn") },
  { key: "eta", header: "ETA", value: (o) => (o.status !== "Baking" ? "-" : o.eta > 0 ? `${o.eta} MIN` : "LATE"), width: 6, align: "right", announce: false, tone: (o) => (o.status === "Baking" && o.eta === 0 ? "bad" : "neutral") },
];
const pick = <X,>(xs: X[]) => xs[Math.floor(Math.random() * xs.length)];

/** One thing happens in the kitchen: an order leaves, arrives, is collected, or comes out of the oven. */
function kitchen(xs: Order[], nextId: { current: number }): [Order[], string, LogTone] {
  const gone = xs.find((o) => o.status === "Collected");
  if (gone) return [xs.filter((o) => o !== gone), `Order #${gone.id} left the board.`, "info"];
  const ready = xs.filter((o) => o.status === "Ready");
  const baking = xs.filter((o) => o.status === "Baking");
  const roll = Math.random();
  if ((roll < 0.3 || baking.length === 0) && xs.length < 6) {
    const o: Order = { id: nextId.current++, customer: pick(NAMES), item: pick(ITEMS), status: "Baking", eta: 6 + Math.floor(Math.random() * 10) };
    return [[...xs, o], `New order #${o.id}: ${o.item} for ${o.customer}.`, "wait"];
  }
  if (ready.length && roll < 0.55) {
    const o = pick(ready);
    return [xs.map((x) => (x === o ? { ...x, status: "Collected" as const } : x)), `${o.customer} collected order #${o.id}.`, "good"];
  }
  const done = baking.find((o) => o.eta <= 3);
  const next = xs.map((o) => (o === done ? { ...o, status: "Ready" as const, eta: 0 } : o.status === "Baking" ? { ...o, eta: Math.max(0, o.eta - 2) } : o));
  return [next, done ? `Order #${done.id} is out of the oven: Ready.` : "Ovens ticking: ETAs count down (not announced, that column is quiet).", done ? "good" : "info"];
}

/** Live preview: a bakery's order board, fed a new update every 2.5 seconds. */
export default function DepartureBoardTableDemo({ controls = {} }: { controls?: ControlValues }) {
  const { holdOnHover, ...rest } = controls;
  const look = rest as Pick<DepartureBoardTableProps<Order>, "accent" | "size" | "flipMs">;
  const [orders, setOrders] = useState(START);
  const [paused, setPaused] = useState(false);
  const [failing, setFailing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | undefined>(undefined);
  const nextId = useRef(1045);
  const held = useRef(false);
  const ordersRef = useRef(START);

  // The "server": every 2.5 s one thing happens in the kitchen.
  useEffect(() => {
    if (paused || failing || loading) return;
    const id = window.setInterval(() => {
      setUpdatedAt(Date.now());
      const xs = ordersRef.current;
      const [next, text, tone] = kitchen(xs, nextId);
      ordersRef.current = next;
      setOrders(next);
      say(text + (held.current ? " (held while you're on the board)" : ""), tone);
    }, 2500);
    return () => clearInterval(id);
  }, [paused, failing, loading]);

  const btn =
    "rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] px-2.5 py-1 text-xs font-bold text-[var(--k-text,#E9EDE8)] transition hover:border-[var(--k-acc-text,#C6FF3D)] active:translate-y-px aria-pressed:bg-[var(--k-panel-2,#181D1B)] aria-pressed:text-[var(--k-acc-text,#C6FF3D)] focus-visible:outline-3 focus-visible:outline-[var(--k-acc-text,#C6FF3D)]";

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <DepartureBoardTable
        {...look}
        holdOnHover={holdOnHover !== "off"}
        caption="Pickup counter · today"
        rows={orders}
        getRowId={(o) => String(o.id)}
        rowLabel={(o) => `Order ${o.id}`}
        columns={COLUMNS}
        loading={loading}
        error={failing}
        updatedAt={updatedAt}
        staleAfterMs={30000}
        onRetry={() => {
          say("Retry pressed. Asking the kitchen again…", "wait");
          setFailing(false);
          setLoading(true);
          window.setTimeout(() => {
            setLoading(false);
            setUpdatedAt(Date.now());
            say("Feed is back. The board flips back in.", "good");
          }, 1400);
        }}
        onHoldChange={(h, waiting) => {
          held.current = h;
          say(h ? "Pointer or focus on the board: updates are held so rows don't move under you." : waiting ? `You moved away: ${waiting} held update${waiting === 1 ? "" : "s"} flip in now.` : "You moved away. Nothing was waiting.", h ? "wait" : "info");
        }}
      />
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" aria-pressed={paused} className={btn} onClick={() => { setPaused(!paused); say(paused ? "Feed resumed." : "Feed paused. The board stays as it is.", "info"); }}>
          {paused ? "Resume feed" : "Pause feed"}
        </button>
        <button type="button" aria-pressed={failing} className={btn} onClick={() => { setFailing(!failing); say(failing ? "Feed fixed." : "Feed failed. The board shows SERVICE INTERRUPTED with a Retry button.", failing ? "good" : "bad"); }}>
          {failing ? "Fix feed" : "Fail feed"}
        </button>
        <button type="button" className={btn} onClick={() => { setPaused(true); setUpdatedAt(Date.now() - 3 * 60000); say("Feed paused and the last update set to 3 minutes ago: the board dims and says it may be out of date.", "bad"); }}>
          Make stale
        </button>
        <button type="button" className={btn} onClick={() => { setOrders(START); ordersRef.current = START; setPaused(false); setFailing(false); setLoading(false); setUpdatedAt(Date.now()); nextId.current = 1045; say("Board reset."); }}>
          Reset
        </button>
      </div>
      <p className="text-center text-xs text-[var(--k-mute,#8A938D)]">Watch a status flip. Then rest your mouse on the board: new orders wait until you move away.</p>
    </div>
  );
}
