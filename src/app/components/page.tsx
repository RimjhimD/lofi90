import type { Metadata } from "next";
import { ENTRIES, TYPES } from "@/lib/registry";
import { Exchanges } from "@/site/Exchanges";

export const metadata: Metadata = { title: "Components", description: "Every lofi90 component, grouped by type, each with a live demo." };

export default function ComponentsPage() {
  const live = TYPES.filter((t) => ENTRIES.some((e) => e.type === t.id)).length;
  return (
    <main className="mx-auto max-w-[1180px] px-6 pb-32 lg:px-10">
      <header className="anim-rise border-b border-line pb-8 pt-12">
        <span className="mono flex items-center gap-2 text-acc">
          <i className="led" data-on="true" data-pulse="true" /> {ENTRIES.length} components live · {live} of {TYPES.length} types
        </span>
        <h1 className="mt-3 font-display text-[clamp(2.4rem,5vw,4rem)] font-bold leading-[1.02] tracking-tight">Every component</h1>
        <p className="mt-3 max-w-[60ch] text-mute">
          Each card is the real component, running. Open one for the live playground, every variant and state, the code and the prompt that built it.
        </p>
      </header>
      <Exchanges />
    </main>
  );
}
