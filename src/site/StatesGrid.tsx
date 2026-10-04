"use client";

import { STATES } from "@/lib/demos";

/** Every state of a component, rendered side by side so you can see them all at once. */
export function StatesGrid({ slug }: { slug: string }) {
  const states = STATES[slug] ?? [];
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {states.map((s) => (
        <li key={s.id} className="panel flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5">
            <b className="font-display text-sm font-semibold">{s.label}</b>
            <code className="mono ml-auto rounded bg-panel-2 px-1.5 py-0.5 text-[0.6rem] normal-case tracking-normal text-mute">{s.id}</code>
          </div>
          <div className="mx-3 grid min-h-[190px] flex-1 place-items-center rounded-[10px] border border-line bg-bg bg-[radial-gradient(rgba(233,237,232,.07)_1px,transparent_1.2px)] bg-[length:16px_16px] px-5 pb-6 pt-16">
            <div className="flex w-full justify-center">{s.node}</div>
          </div>
          <p className="px-4 py-2.5 text-sm text-mute">{s.note}</p>
        </li>
      ))}
    </ul>
  );
}
