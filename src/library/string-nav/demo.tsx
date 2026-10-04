"use client";

import { useState } from "react";
import type { ControlValues } from "@/site/Controls";
import { say } from "@/site/log";
import { StringNav, type StringNavItem, type StringNavProps } from "./StringNav";

const ITEMS: StringNavItem[] = [
  { id: "home", label: "Home" },
  { id: "work", label: "Work" },
  { id: "studio", label: "Studio" },
  { id: "contact", label: "Contact" },
];

const PAGES: Record<string, { title: string; text: string; tag: string }> = {
  home: { title: "Sound you can see.", text: "Fret is a small studio making music videos and live visuals.", tag: "Now booking spring" },
  work: { title: "Selected work", text: "Tour visuals for Low Tide, a lyric video for Mara June, and 40 live sets.", tag: "12 projects" },
  studio: { title: "The studio", text: "Two rooms in Leeds, a lot of cables, and one very old piano.", tag: "Visits by appointment" },
  contact: { title: "Say hello", text: "hello@fret.studio. We reply within a day, usually sooner.", tag: "Usually replies in 1 day" },
};

/** Live preview: a little studio website with the string nav as its header. */
export default function StringNavDemo({ controls = {} }: { controls?: ControlValues }) {
  const look = controls as Pick<StringNavProps, "accent" | "tension" | "wobble" | "size">;
  const [page, setPage] = useState("home");

  return (
    <div className="@container w-full max-w-2xl">
      <div className="overflow-hidden rounded-xl border border-[var(--k-line,#3A433F)] bg-[var(--k-bg,#0E1110)] shadow-[0_10px_30px_-14px_var(--k-shadow,rgba(0,0,0,.9))]">
        {/* browser-ish top bar */}
        <div className="flex items-center gap-1.5 border-b border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-[var(--k-line,#3A433F)]" />
          <span className="h-2 w-2 rounded-full bg-[var(--k-line,#3A433F)]" />
          <span className="h-2 w-2 rounded-full bg-[var(--k-line,#3A433F)]" />
          <span className="ml-2 truncate font-mono text-[0.65rem] text-[var(--k-mute,#8A938D)]">fret.studio/{page === "home" ? "" : page}</span>
        </div>

        <header className="flex flex-col gap-2 px-4 pt-4 @md:flex-row @md:items-start @md:gap-6 @md:px-6">
          <p className="flex shrink-0 items-center gap-2 pt-1 text-sm font-bold text-[var(--k-text,#E9EDE8)]">
            <span aria-hidden="true" className="grid h-6 w-6 place-items-center rounded-full border border-[var(--k-line,#3A433F)] text-xs" style={{ color: look.accent ?? "#C6FF3D" }}>
              ◉
            </span>
            Fret
          </p>
          <StringNav
            {...look}
            label="Site"
            items={ITEMS}
            value={page}
            className="@md:max-w-sm @md:ml-auto"
            onChange={(id) => {
              setPage(id);
              const label = ITEMS.find((i) => i.id === id)?.label;
              say(
                (look.wobble ?? 9) > 0
                  ? `Plucked “${label}”. The string rings out and the bead slides over.`
                  : `Picked “${label}”. Wobble is 0, so the bead just slides over.`,
                "good",
              );
            }}
          />
        </header>

        {/* page content: every page sits in the same grid cell and cross-fades */}
        <main className="grid px-4 pb-6 pt-6 @md:px-6 @md:pt-8">
          {ITEMS.map(({ id }) => {
            const p = PAGES[id];
            const on = id === page;
            return (
              <section
                key={id}
                aria-hidden={!on}
                inert={!on}
                className="[grid-area:1/1] transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none"
                style={{ opacity: on ? 1 : 0, transform: on ? "none" : "translateY(6px)" }}
              >
                <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--k-acc-text,#C6FF3D)]">{p.tag}</p>
                <h2 className="mt-1 text-xl font-bold text-[var(--k-text,#E9EDE8)] @md:text-2xl">{p.title}</h2>
                <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-[var(--k-mute,#8A938D)]">{p.text}</p>
              </section>
            );
          })}
        </main>
      </div>
      <p className="mt-3 text-center text-xs text-[var(--k-mute,#8A938D)]">Move your pointer just under the links, then click one.</p>
    </div>
  );
}
