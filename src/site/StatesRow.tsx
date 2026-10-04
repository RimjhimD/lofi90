"use client";

import { STATES } from "@/lib/demos";

/** States as one tidy row of small tiles: each the real component, shrunk and frozen, with a short label. */
export function StatesRow({ slug }: { slug: string }) {
  const states = STATES[slug] ?? [];
  return (
    <>
      <p className="mb-4 text-sm text-mute">{states.map((s) => s.label).join(" · ")}</p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {states.map((s) => (
          <li key={s.id} data-reveal className="panel group flex flex-col overflow-hidden transition-colors hover:border-acc/40">
            <div aria-hidden="true" className="screen relative grid h-[130px] place-items-center overflow-hidden bg-[radial-gradient(rgba(233,237,232,.05)_1px,transparent_1.2px)] bg-[length:14px_14px]">
              <div inert className="pointer-events-none absolute left-1/2 top-1/2 w-[440px] [transform:translate(-50%,-50%)_scale(.42)] transition-transform duration-300 group-hover:[transform:translate(-50%,-50%)_scale(.46)]">
                <div className="flex justify-center">{s.node}</div>
              </div>
            </div>
            <span className="border-t border-line px-3 py-2 text-xs text-text/85" title={s.note}>
              {s.label}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
