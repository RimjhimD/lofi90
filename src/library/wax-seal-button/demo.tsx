"use client";

import { useEffect, useRef, useState } from "react";
import type { ControlValues } from "@/site/Controls";
import { say } from "@/site/log";
import { WaxSealButton, type WaxSealButtonHandle, type WaxSealButtonProps } from "./WaxSealButton";

type Server = "ok" | "flaky" | "declined";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const short = (key: string) => `${key.slice(0, 8)}…`;

/** Live preview: a checkout with a pretend payment server that dedupes by idempotency key. */
export default function WaxSealButtonDemo({ controls = {} }: { controls?: ControlValues }) {
  const look = controls as Pick<WaxSealButtonProps, "accent" | "size" | "glyph" | "maxRetries">;
  const seal = useRef<WaxSealButtonHandle>(null);
  const scene = useRef<HTMLDivElement>(null);
  const [online, setOnline] = useState(true);
  const [server, setServer] = useState<Server>("ok");
  const [stats, setStats] = useState({ requests: 0, charges: 0, key: "" });
  // The pretend server: which keys it has charged, and how many times it has seen each key.
  const db = useRef({ charged: new Set<string>(), seen: new Map<string, number>() });
  const live = useRef({ online, server });
  useEffect(() => {
    live.current = { online, server };
  });

  async function charge(key: string) {
    const seen = (db.current.seen.get(key) ?? 0) + 1;
    db.current.seen.set(key, seen);
    setStats((s) => ({ ...s, requests: s.requests + 1, key }));
    say(`Request reached the server with key ${short(key)} (try ${seen} for this key).`, "wait");
    await wait(900);
    const now = live.current;
    if (!now.online) throw new TypeError("Failed to fetch");
    if (now.server === "flaky" && seen <= 2) throw Object.assign(new Error("Service unavailable"), { status: 503 });
    if (now.server === "declined") throw Object.assign(new Error("card declined"), { status: 402 });
    if (db.current.charged.has(key)) {
      say(`Server already charged key ${short(key)}. It returns the first receipt and charges nothing.`, "good");
      return { receipt: short(key) };
    }
    db.current.charged.add(key);
    setStats((s) => ({ ...s, charges: s.charges + 1 }));
    return { receipt: short(key) };
  }

  function spam() {
    const b = scene.current?.querySelector<HTMLButtonElement>("button");
    say("Five clicks in the same instant, like a frantic double-click.", "info");
    for (let i = 0; i < 5; i++) b?.click();
  }

  function reset() {
    seal.current?.reset();
    db.current = { charged: new Set(), seen: new Map() };
    setStats({ requests: 0, charges: 0, key: "" });
    say("New checkout. The next press gets a fresh key.");
  }

  const chip = "rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] px-2.5 py-1 text-xs font-semibold text-[var(--k-text,#E9EDE8)] transition-colors hover:border-[var(--k-acc-text,#C6FF3D)] aria-pressed:border-[var(--k-acc-text,#C6FF3D)] aria-pressed:bg-[var(--k-panel-2,#181D1B)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)]";
  const group = (label: string, items: { id: string; text: string; on: boolean; go: () => void }[]) => (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-semibold text-[var(--k-mute,#8A938D)]">{label}:</span>
      {items.map((it) => (
        <button key={it.id} type="button" aria-pressed={it.on} onClick={it.go} className={chip}>
          {it.text}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div ref={scene} className="w-full max-w-sm rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] p-4 text-[var(--k-text,#E9EDE8)] shadow-[0_10px_30px_-14px_var(--k-shadow,rgba(0,0,0,.9))]">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--k-mute,#8A938D)]">Checkout</p>
        <div className="mt-2 flex justify-between text-sm">
          <span>Linen tote bag × 2</span>
          <span>$48.00</span>
        </div>
        <div className="mb-4 mt-1 flex justify-between border-t border-[var(--k-line,#3A433F)] pt-2 text-sm font-bold">
          <span>Total</span>
          <span>$48.00</span>
        </div>
        <div className="flex justify-center">
          <WaxSealButton
            ref={seal}
            {...look}
            online={online}
            labels={{ idle: "Pay $48.00", sealing: "Paying…", sent: "Paid", sentHint: "Paid. Your card was charged once." }}
            onSubmit={charge}
            onSuccess={(_, key) => say(`Paid. Seal set with key ${short(key)}; the button won't charge again.`, "good")}
            onDuplicate={() => say("Extra press ignored: it's already sealed. No second request.", "info")}
            onQueued={(key) => say(`Offline. Sealed and waiting; it will send key ${short(key)} as soon as you're back.`, "wait")}
            onRetry={({ attempt, delayMs, error }) => say(`Server said ${(error as { status?: number }).status ?? "network error"}. Retry ${attempt} in ${Math.round(delayMs / 1000)}s with the same key.`, "wait")}
            onError={(error) => say(`Not paid: ${(error as Error).message}. The seal cracks; press again to retry with the same key.`, "bad")}
          />
        </div>
      </div>
      <dl className="grid w-full max-w-sm grid-cols-3 gap-2 text-center text-xs">
        {[
          ["Charges on server", String(stats.charges)],
          ["Requests sent", String(stats.requests)],
          ["Key", stats.key ? short(stats.key) : "on first press"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] px-2 py-1.5">
            <dt className="text-[var(--k-mute,#8A938D)]">{k}</dt>
            <dd aria-live="polite" className="font-mono font-bold text-[var(--k-text,#E9EDE8)]">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="flex w-full max-w-sm flex-col items-start gap-2">
        {group("Network", [
          { id: "on", text: "Online", on: online, go: () => { setOnline(true); say("Back online.", "good"); } },
          { id: "off", text: "Offline", on: !online, go: () => { setOnline(false); say("Connection lost.", "bad"); } },
        ])}
        {group("Server", [
          { id: "ok", text: "OK", on: server === "ok", go: () => { setServer("ok"); say("Server healthy."); } },
          { id: "flaky", text: "Flaky (503 ×2)", on: server === "flaky", go: () => { setServer("flaky"); say("Server will answer 503 twice per key, then succeed.", "wait"); } },
          { id: "declined", text: "Declined (402)", on: server === "declined", go: () => { setServer("declined"); say("Server will decline the card with 402. That isn't worth retrying.", "bad"); } },
        ])}
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={spam} className={chip}>Spam-click ×5</button>
          <button type="button" onClick={reset} className={chip}>Reset</button>
        </div>
      </div>
    </div>
  );
}
