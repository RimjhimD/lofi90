import type { Metadata } from "next";
import { ENTRIES, TYPES } from "@/lib/registry";
import { Exchanges } from "@/site/Exchanges";
import { HoverCable } from "@/site/HoverCable";

export const metadata: Metadata = { title: "Components", description: "Every lofi90 component, grouped by type, each with a live demo." };

export default function ComponentsPage() {
  const live = TYPES.filter((t) => ENTRIES.some((e) => e.type === t.id)).length;
  return (
    <main className="mx-auto max-w-[1180px] px-6 pb-32 lg:px-10">
      <HoverCable />
      <header className="anim-rise border-b-2 border-ink pb-8 pt-12">
        <span className="mono flex items-center gap-2 text-signal">
          <i className="lamp" data-on="true" style={{ width: 8, height: 8 }} /> {ENTRIES.length} lines live · {live} of {TYPES.length} exchanges open
        </span>
        <h1 className="mt-3 font-display text-[clamp(2.8rem,6vw,5rem)] font-black uppercase leading-[0.9]">Every component</h1>
        <p className="mt-4 max-w-[60ch] text-muted">
          Each card is the real component, working. Try it right here, or open it for the code, every state and the prompt that built it.
        </p>
      </header>
      <Exchanges />
    </main>
  );
}
