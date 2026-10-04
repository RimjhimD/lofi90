"use client";

import { STATES } from "@/lib/demos";

/** Every state of a component, rendered side by side so you can see them all at once. */
export function StatesGrid({ slug }: { slug: string }) {
  const states = STATES[slug] ?? [];
  return (
    <ul className="grid gap-5 md:grid-cols-2">
      {states.map((s) => (
        <li key={s.id} className="flex flex-col border-2 border-ink bg-white">
          <div className="flex items-center gap-2 border-b-2 border-ink px-4 py-2">
            <b className="font-display text-lg font-bold uppercase">{s.label}</b>
            <code className="mono ml-auto bg-bone-2 px-1.5 py-0.5 normal-case tracking-normal">{s.id}</code>
          </div>
          <div className="grid min-h-[200px] flex-1 place-items-center bg-bone-2 bg-[radial-gradient(#d5cdb8_1px,transparent_1.2px)] bg-[length:12px_12px] px-5 pb-6 pt-16">
            <div className="flex w-full justify-center">{s.node}</div>
          </div>
          <p className="border-t-2 border-ink px-4 py-2 text-sm text-muted">{s.note}</p>
        </li>
      ))}
    </ul>
  );
}
