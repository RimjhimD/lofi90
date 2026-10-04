"use client";

import type { ControlValues } from "@/site/Controls";
import { say } from "@/site/log";
import { VinylCrateCarousel, type VinylCrateCarouselProps, type VinylRecord } from "./VinylCrateCarousel";

const RECORDS: VinylRecord[] = [
  { id: "night-bus", title: "Night Bus", artist: "Mira Sol", year: 2021, colors: ["#1E2A78", "#FF8A3D"], pattern: "sun" },
  { id: "paper-moons", title: "Paper Moons", artist: "The Lanterns", year: 2019, colors: ["#F4D35E", "#0D3B66"], pattern: "bands" },
  { id: "low-tide", title: "Low Tide", artist: "Kai Ostrander", year: 2023, colors: ["#2EC4B6", "#011627"], pattern: "rings" },
  { id: "neon-orchard", title: "Neon Orchard", artist: "Velvet Grid", year: 2022, colors: ["#FF3CAC", "#2B86C5"], pattern: "split" },
  { id: "dust-gold", title: "Dust & Gold", artist: "Ada Fenn", year: 2018, colors: ["#C08552", "#3C2A21"], pattern: "grid" },
  { id: "slow-static", title: "Slow Static", artist: "Hollow Hearts", year: 2020, colors: ["#6A4C93", "#C9E4CA"], pattern: "wave" },
  { id: "riverlight", title: "Riverlight", artist: "Otis Wren", year: 2024, colors: ["#0B6E4F", "#F2E8CF"], pattern: "sun" },
  { id: "glass-garden", title: "Glass Garden", artist: "Lumen", year: 2025, colors: ["#E63946", "#F1FAEE"], pattern: "bands" },
];

/** Live preview: a record shop's staff-picks crate. Flip through, then pull one out to play it. */
export default function VinylCrateCarouselDemo({ controls = {} }: { controls?: ControlValues }) {
  const look = controls as Pick<VinylCrateCarouselProps, "accent" | "flipMs" | "size">;
  const rpm = Number(controls.rpm ?? 33) === 45 ? 45 : 33;

  return (
    <div className="flex w-full flex-col items-center">
      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[var(--k-mute,#8A938D)]">Record shop — staff picks</p>
      <VinylCrateCarousel
        {...look}
        rpm={rpm}
        records={RECORDS}
        label="Staff picks"
        onChange={(i) => say(`Flipped to “${RECORDS[i].title}” — ${RECORDS[i].artist}, ${i + 1} of ${RECORDS.length}.`)}
        onPlay={(r) => say(`Pulled out “${r.title}”. The record slides out and spins at ${rpm} rpm.`, "good")}
        onPutBack={(r) => say(`Put “${r.title}” back in the crate.`)}
      />
    </div>
  );
}
