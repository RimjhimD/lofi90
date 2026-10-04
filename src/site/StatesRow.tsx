"use client";

import { STATES } from "@/lib/demos";
import { Fit } from "@/site/Fit";

/** States as a grid of tiles big enough to read: each the real component, frozen, with a label and what it means. */
export function StatesRow({ slug }: { slug: string }) {
  const states = STATES[slug] ?? [];
  return (
    <ul className="grid items-start gap-4 md:grid-cols-2">
      {states.map((s) => (
        <li key={s.id} data-reveal className="panel group flex flex-col overflow-hidden transition-colors hover:border-acc/40">
          <Fit className="screen stage-dark stage-tile">{s.node}</Fit>
          <div className="border-t border-line px-4 py-3">
            <p className="text-sm font-semibold text-text">{s.label}</p>
            <p className="mt-0.5 text-[0.82rem] leading-snug text-mute">{s.note}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
