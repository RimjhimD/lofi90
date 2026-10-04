"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export interface BillItem {
  id: string;
  name: string;
  /** Price in cents, so totals add up exactly. */
  cents: number;
}

export interface BillPerson {
  id: string;
  name: string;
  /** Avatar colour. */
  color: string;
}

export type Assignments = Record<string, string[]>;

export interface SplitBillCardProps {
  items: BillItem[];
  people: BillPerson[];
  /** Tax as a fraction of the food, e.g. 0.08. */
  taxRate?: number;
  /** Tip as a fraction of the food, e.g. 0.15. */
  tipRate?: number;
  currency?: string;
  locale?: string;
  /** Who had what at the start. Item id → person ids. */
  initialAssignments?: Assignments;
  onChange?: (assignments: Assignments, totals: Record<string, number>) => void;
  title?: string;
  className?: string;
}

/**
 * Split a cents total between people so the parts add back to the exact total:
 * everyone gets the floor of their share, and the leftover cents go to the largest remainders.
 */
function allocate(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (!sum) return weights.map(() => 0);
  const raw = weights.map((w) => (total * w) / sum);
  const out = raw.map(Math.floor);
  let left = total - out.reduce((a, b) => a + b, 0);
  raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac)
    .forEach(({ i }) => {
      if (left-- > 0) out[i]++;
    });
  return out;
}

const initials = (name: string) => name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();

export function SplitBillCard({
  items,
  people,
  taxRate = 0.08,
  tipRate = 0.15,
  currency = "USD",
  locale = "en-US",
  initialAssignments = {},
  onChange,
  title = "Dinner",
  className = "",
}: SplitBillCardProps) {
  const id = useId();
  const [who, setWho] = useState<Assignments>(initialAssignments);
  const [active, setActive] = useState<string>(people[0]?.id ?? "");
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [said, setSaid] = useState("");
  const money = useMemo(() => new Intl.NumberFormat(locale, { style: "currency", currency }), [locale, currency]);
  const fmt = (c: number) => money.format(c / 100);

  const food = items.reduce((a, it) => a + it.cents, 0);
  const tax = Math.round(food * taxRate);
  const tip = Math.round(food * tipRate);
  const unclaimed = items.filter((it) => !who[it.id]?.length);

  // Each person's food: every item split evenly between whoever had it, to the cent.
  const foodBy: Record<string, number> = Object.fromEntries(people.map((p) => [p.id, 0]));
  for (const it of items) {
    const ps = who[it.id] ?? [];
    allocate(it.cents, ps.map(() => 1)).forEach((c, i) => (foodBy[ps[i]] += c));
  }
  // Tax and tip follow what you ate; the unclaimed food keeps its own share until someone takes it.
  const unclaimedFood = unclaimed.reduce((a, it) => a + it.cents, 0);
  const weights = [...people.map((p) => foodBy[p.id]), unclaimedFood];
  const taxBy = allocate(tax, weights);
  const tipBy = allocate(tip, weights);
  const totals: Record<string, number> = Object.fromEntries(people.map((p, i) => [p.id, foodBy[p.id] + taxBy[i] + tipBy[i]]));
  const claimed = Object.values(totals).reduce((a, b) => a + b, 0);

  const latest = useRef(onChange);
  useEffect(() => {
    latest.current = onChange;
  });
  const signature = JSON.stringify(who);
  useEffect(() => {
    latest.current?.(JSON.parse(signature), totals);
    // totals are derived from `who`, so the signature is enough to know when to report.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  function toggle(itemId: string, personId: string, force?: boolean) {
    const item = items.find((i) => i.id === itemId)!;
    const person = people.find((p) => p.id === personId)!;
    const now = who[itemId] ?? [];
    const has = now.includes(personId);
    const add = force ?? !has;
    if (add === has) return;
    setWho({ ...who, [itemId]: add ? [...now, personId] : now.filter((x) => x !== personId) });
    setSaid(`${person.name} ${add ? "added to" : "removed from"} ${item.name}.`);
  }

  function splitUnclaimed() {
    setWho((w) => {
      const next = { ...w };
      for (const it of unclaimed) next[it.id] = people.map((p) => p.id);
      return next;
    });
    setSaid(`${unclaimed.length} unclaimed item${unclaimed.length > 1 ? "s" : ""} shared by everyone.`);
  }

  const maxTotal = Math.max(1, ...Object.values(totals));

  return (
    <div className={`w-full max-w-md text-[#1A1A17] ${className}`}>
      {/* who is picking: click a person, then tap items. Or drag a person onto an item. */}
      <div role="group" aria-label="Who is choosing" className="mb-3 flex flex-wrap gap-2">
        {people.map((p) => (
          <button
            key={p.id}
            type="button"
            draggable
            aria-pressed={active === p.id}
            onClick={() => setActive(p.id)}
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", p.id);
              setActive(p.id);
            }}
            className="flex items-center gap-1.5 border-2 border-[#1A1A17] bg-white py-1 pl-1 pr-2.5 text-sm font-bold shadow-[2px_2px_0_#1A1A17] aria-pressed:-translate-y-0.5 aria-pressed:shadow-[3px_4px_0_#1A1A17] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#D7263D] cursor-grab active:cursor-grabbing"
          >
            <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#1A1A17] text-[0.7rem] text-white" style={{ background: p.color }}>
              {initials(p.name)}
            </span>
            {p.name}
          </button>
        ))}
      </div>

      {/* the receipt */}
      <div className="relative bg-white px-5 pb-6 pt-4 shadow-[4px_4px_0_#1A1A17] [clip-path:polygon(0_0,100%_0,100%_calc(100%-8px),95%_100%,90%_calc(100%-8px),85%_100%,80%_calc(100%-8px),75%_100%,70%_calc(100%-8px),65%_100%,60%_calc(100%-8px),55%_100%,50%_calc(100%-8px),45%_100%,40%_calc(100%-8px),35%_100%,30%_calc(100%-8px),25%_100%,20%_calc(100%-8px),15%_100%,10%_calc(100%-8px),5%_100%,0_calc(100%-8px))] border-x-2 border-t-2 border-[#1A1A17]">
        <p className="text-center font-mono text-xs font-bold uppercase tracking-[0.2em]">{title}</p>
        <p className="mb-3 text-center font-mono text-[0.68rem] text-[#5E5A50]">Tap an item to add {people.find((p) => p.id === active)?.name ?? "someone"} · tap again to remove</p>
        <ul aria-label="Items" className="divide-y divide-dashed divide-[#C9C2AE] font-mono text-sm">
          {items.map((it) => {
            const ps = who[it.id] ?? [];
            const mine = ps.includes(active);
            return (
              <li key={it.id}>
                <button
                  type="button"
                  aria-pressed={mine}
                  aria-label={`${it.name}, ${fmt(it.cents)}, ${ps.length ? `shared by ${ps.length}` : "nobody yet"}`}
                  onClick={() => active && toggle(it.id, active)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(it.id);
                  }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(null);
                    const pid = e.dataTransfer.getData("text/plain");
                    if (pid) toggle(it.id, pid, true);
                  }}
                  className={`flex w-full items-center gap-2 px-1.5 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-[#D7263D] ${dragOver === it.id ? "bg-[#FFF4E5]" : mine ? "bg-[#F2EEE3]" : "hover:bg-[#FAF8F2]"}`}
                >
                  <span className="min-w-0 flex-1 truncate">{it.name}</span>
                  <span aria-hidden="true" className="flex -space-x-1.5">
                    {ps.map((pid) => {
                      const p = people.find((x) => x.id === pid)!;
                      return (
                        <span key={pid} className="grid h-5 w-5 place-items-center rounded-full border-2 border-white text-[0.5rem] font-bold text-white motion-safe:animate-[pop_.3s_cubic-bezier(.3,1.6,.5,1)]" style={{ background: p.color }}>
                          {initials(p.name)}
                        </span>
                      );
                    })}
                    {!ps.length && <span className="text-[0.65rem] text-[#B42318]">unclaimed</span>}
                  </span>
                  <span className="w-16 text-right tabular-nums">{fmt(it.cents)}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <dl className="mt-3 space-y-0.5 border-t-2 border-[#1A1A17] pt-2 font-mono text-xs">
          <div className="flex justify-between"><dt>Food</dt><dd className="tabular-nums">{fmt(food)}</dd></div>
          <div className="flex justify-between"><dt>Tax {Math.round(taxRate * 100)}%</dt><dd className="tabular-nums">{fmt(tax)}</dd></div>
          <div className="flex justify-between"><dt>Tip {Math.round(tipRate * 100)}%</dt><dd className="tabular-nums">{fmt(tip)}</dd></div>
          <div className="flex justify-between text-sm font-bold"><dt>Total</dt><dd className="tabular-nums">{fmt(food + tax + tip)}</dd></div>
        </dl>
      </div>

      {/* who owes what: each total is a stack of coins */}
      <div aria-labelledby={`${id}-owes`} className="mt-4">
        <p id={`${id}-owes`} className="mb-2 text-xs font-bold uppercase tracking-wider text-[#5E5A50]">Each person pays</p>
        <ul className="flex items-end justify-around gap-3">
          {people.map((p) => {
            const coins = Math.round((totals[p.id] / maxTotal) * 8);
            return (
              <li key={p.id} className="flex flex-col items-center gap-1">
                <span aria-hidden="true" className="flex h-[84px] flex-col-reverse items-center">
                  {Array.from({ length: coins }, (_, i) => (
                    <i key={i} className="-mt-1.5 block h-3 w-9 rounded-[50%] border-2 border-[#7A4D00] bg-[#FFC94A] motion-safe:animate-[coin_.35s_cubic-bezier(.3,1.5,.5,1)_both]" style={{ animationDelay: `${i * 30}ms` }} />
                  ))}
                </span>
                <b className="font-mono text-sm tabular-nums">{fmt(totals[p.id])}</b>
                <span className="text-xs text-[#5E5A50]">{p.name}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div role="status" aria-live="polite" className="mt-3 space-y-1 text-sm">
        {unclaimed.length > 0 ? (
          <p className="flex flex-wrap items-center gap-2 border-l-4 border-[#B42318] bg-[#FBE4E6] px-2.5 py-1.5">
            {unclaimed.length} item{unclaimed.length > 1 ? "s" : ""} nobody claimed ({fmt(food + tax + tip - claimed)} left over).
            <button type="button" onClick={splitUnclaimed} className="border border-[#1A1A17] bg-white px-2 text-xs font-bold focus-visible:outline-2 focus-visible:outline-[#D7263D]">
              Share between everyone
            </button>
          </p>
        ) : (
          <p className="font-bold text-[#0E3B2E]">✓ Adds up to the cent: {fmt(claimed)}.</p>
        )}
        <p className="text-xs text-[#5E5A50]">{said}</p>
      </div>
      <style>{`@keyframes pop{from{transform:scale(0)}}@keyframes coin{from{transform:translateY(-26px);opacity:0}}`}</style>
    </div>
  );
}
