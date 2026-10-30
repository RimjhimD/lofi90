"use client";

import { useEffect, useRef, useState } from "react";
import type { ControlValues } from "@/site/Controls";
import { say } from "@/site/log";
import { OfflineAwareNavbar, QueueStatusBadge, createOfflineQueue, useOfflineQueue, type ConnectionStatus, type NavLink, type OfflineAwareNavbarProps } from "./OfflineAwareNavbar";

type Order = { no: number; name: string; total: string; qid?: string };

const START: Order[] = [
  { no: 1042, name: "Ana", total: "$84.00" },
  { no: 1043, name: "Ben", total: "$126.50" },
];
const NAMES = ["Chloe", "Dev", "Elif", "Farah", "Goran", "Hana", "Ivo"];
const LINKS: NavLink[] = [
  { label: "Orders", href: "#orders", active: true },
  { label: "Customers", href: "#customers" },
  { label: "Reports", href: "#reports" },
];
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const btn =
  "rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] px-2.5 py-1 text-xs font-bold text-[var(--k-text,#E9EDE8)] transition-colors hover:border-[var(--k-acc-text,#C6FF3D)] active:translate-y-px aria-pressed:border-[var(--k-acc-text,#C6FF3D)] aria-pressed:text-[var(--k-acc-text,#C6FF3D)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)]";

/** Live preview: a small Orders app. Go offline, add orders, and watch them wait, then sync on reconnect. */
export default function OfflineAwareNavbarDemo({ controls = {} }: { controls?: ControlValues }) {
  const look = controls as Pick<OfflineAwareNavbarProps, "accent" | "size" | "stripPosition" | "savedMs">;
  const [queue, setQueue] = useState(() => createOfflineQueue());
  const q = useOfflineQueue(queue);
  const [orders, setOrders] = useState<Order[]>(START);
  const [offline, setOffline] = useState(false);
  const failNext = useRef(false);
  const [failArmed, setFailArmed] = useState(false);
  const next = useRef(1044);
  const seen = useRef<ConnectionStatus | null>(null);
  const auto = useRef<number[]>([]);

  const stopAuto = () => {
    auto.current.forEach(clearTimeout);
    auto.current = [];
  };

  function addOrder() {
    const no = next.current++;
    const name = NAMES[(no - 1044) % NAMES.length];
    const order: Order = { no, name, total: `$${(40 + ((no * 37) % 160)).toFixed(2)}` };
    // The demo "server": takes a moment, and fails once if asked to.
    const save = async () => {
      say(`Sending order #${no} to the server…`, "wait");
      await wait(700);
      if (failNext.current) {
        failNext.current = false;
        setFailArmed(false);
        say(`The server refused order #${no}. It stays in the list marked "Not saved" with a Retry button.`, "bad");
        throw new Error("Server error 500");
      }
      say(`Order #${no} saved on the server.`, "good");
    };
    order.qid = queue.add(save, `Order #${no} · ${name}`);
    setOrders((os) => [...os, order]);
    say(queue.isOnline() ? `Order #${no} added. Online, so it is sent straight away.` : `Order #${no} added while offline. It is kept with a "Waiting" badge instead of being lost.`, queue.isOnline() ? "info" : "wait");
  }

  // Play one offline → online cycle on load, then hand over.
  useEffect(() => {
    const at = (ms: number, fn: () => void) => auto.current.push(window.setTimeout(fn, ms));
    at(900, () => setOffline(true));
    at(1900, addOrder);
    at(2800, addOrder);
    at(4600, () => setOffline(false));
    return stopAuto;
    // runs once on mount; addOrder only touches refs and setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onStatus(s: ConnectionStatus) {
    const before = seen.current;
    seen.current = s;
    if (before === null) return;
    if (s === "offline") say("Connection lost. The strip slides down under the navbar and the icon changes. Nothing you add is lost.", "bad");
    else if (before === "offline") say(queue.count ? `Back online. Replaying ${queue.count} waiting change${queue.count === 1 ? "" : "s"} in order.` : "Back online. Nothing was waiting.", "good");
    else if (s === "slow") say("The browser reports a slow connection.", "wait");
  }

  function reset() {
    stopAuto();
    setQueue(createOfflineQueue());
    setOrders(START);
    setOffline(false);
    failNext.current = false;
    setFailArmed(false);
    next.current = 1044;
    say("Demo reset.");
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="w-full max-w-xl overflow-hidden rounded-xl border border-[var(--k-line,#3A433F)] bg-[var(--k-bg,#0E1110)] shadow-[0_10px_30px_-14px_var(--k-shadow,rgba(0,0,0,.9))]">
        <OfflineAwareNavbar
          {...look}
          brand="Orders"
          links={LINKS}
          queue={queue}
          forceStatus={offline ? "offline" : undefined}
          onStatusChange={onStatus}
          onNavigate={(l, e) => {
            e.preventDefault();
            say(`"${l.label}" clicked. In a real app this routes to ${l.href}.`);
          }}
          right={<span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-[var(--k-panel-2,#181D1B)] text-xs font-bold text-[var(--k-mute,#8A938D)]">RK</span>}
        />
        <ul aria-label="Orders" className="text-sm text-[var(--k-text,#E9EDE8)]">
          {orders.map((o) => (
            <li key={o.no} className="flex items-center justify-between gap-3 border-b border-[var(--k-line,#3A433F)] px-4 py-2.5 last:border-b-0">
              <span className="min-w-0 truncate">
                Order #{o.no} · {o.name} <span className="text-[var(--k-mute,#8A938D)]">{o.total}</span>
              </span>
              <QueueStatusBadge
                status={q.statusOf(o.qid)}
                onRetry={() => {
                  stopAuto();
                  say(`Retrying order #${o.no}.`, "wait");
                  void q.retry(o.qid);
                }}
              />
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          className={btn}
          onClick={() => {
            stopAuto();
            setOffline((o) => !o);
          }}
        >
          {offline ? "Come back online" : "Go offline"}
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => {
            stopAuto();
            addOrder();
          }}
        >
          Add order
        </button>
        <button
          type="button"
          className={btn}
          aria-pressed={failArmed}
          onClick={() => {
            stopAuto();
            failNext.current = !failArmed;
            setFailArmed(!failArmed);
            say(!failArmed ? "The next save will fail once." : "Fail-once turned off.", "info");
          }}
        >
          Make sync fail once
        </button>
        <button type="button" className={btn} onClick={reset}>
          Reset
        </button>
      </div>
      <p className="max-w-md text-center text-xs text-[var(--k-mute,#8A938D)]">
        The buttons simulate the connection. Real detection is on too: turn off your Wi-Fi and the navbar notices by itself.
      </p>
    </div>
  );
}
