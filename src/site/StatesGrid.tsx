"use client";

import { STATES } from "@/lib/demos";

/** Every state of a component, rendered side by side so you can see them all at once. */
export function StatesGrid({ slug }: { slug: string }) {
  const states = STATES[slug] ?? [];
  return (
    <ul className="grid gap-6 md:grid-cols-2">
      {states.map((s) => (
        <li key={s.id} className="flex flex-col overflow-hidden rounded-[22px] border-4 border-ink bg-board shadow-[6px_6px_0_#20201C]">
          <div className="flex items-center gap-2 border-b-4 border-ink bg-paper px-4 py-2">
            <span className="font-title text-base">{s.label}</span>
            <code className="ml-auto rounded-md border-2 border-ink bg-white px-1.5 text-xs font-bold">{s.id}</code>
          </div>
          <div className="grid min-h-[200px] flex-1 place-items-center bg-[radial-gradient(#e9dcb8_1px,transparent_1.5px)] bg-[length:10px_10px] px-5 pb-6 pt-16">
            <div className="flex w-full justify-center">{s.node}</div>
          </div>
          <p className="border-t-4 border-ink bg-paper px-4 py-2 text-sm font-semibold">{s.note}</p>
        </li>
      ))}
    </ul>
  );
}
