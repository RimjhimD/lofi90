"use client";

import { click, useLoop, type Step } from "@/lib/loop";
import { VinylCrateCarousel, type VinylRecord } from "./VinylCrateCarousel";

const RECORDS: VinylRecord[] = [
  { id: "a", title: "Night Bus", artist: "Mira Sol", colors: ["#1E2A78", "#FF8A3D"], pattern: "sun" },
  { id: "b", title: "Paper Moons", artist: "The Lanterns", colors: ["#F4D35E", "#0D3B66"], pattern: "bands" },
  { id: "c", title: "Low Tide", artist: "Kai Ostrander", colors: ["#2EC4B6", "#011627"], pattern: "rings" },
  { id: "d", title: "Neon Orchard", artist: "Velvet Grid", colors: ["#FF3CAC", "#2B86C5"], pattern: "split" },
  { id: "e", title: "Dust & Gold", artist: "Ada Fenn", colors: ["#C08552", "#3C2A21"], pattern: "grid" },
  { id: "f", title: "Slow Static", artist: "Hollow Hearts", colors: ["#6A4C93", "#C9E4CA"], pattern: "wave" },
  { id: "g", title: "Riverlight", artist: "Otis Wren", colors: ["#0B6E4F", "#F2E8CF"], pattern: "sun" },
];
const next = click("button[data-next]");
const prev = click("button[data-prev]");
const play = click("button[data-play]");

const frame = (node: React.ReactNode) => <div className="w-[400px] max-w-full">{node}</div>;

/** The real crate on a loop: buttons pressed on a timer, then it starts over. */
function Scene({ start, period, steps }: { start: number; period: number; steps: Step[] }) {
  const { ref, run, stop } = useLoop(period, steps);
  return (
    <div ref={ref} onClick={stop}>
      {frame(<VinylCrateCarousel key={run} label="Staff picks" records={RECORDS} initialIndex={start} />)}
    </div>
  );
}

/** Every state, playing live on a loop (In the crate holds still). */
export const VINYL_CRATE_CAROUSEL_STATES = [
  { id: "crate", label: "In the crate", note: "Sleeves stand front to back; the ones already flipped lean forward over the lip.", node: frame(<VinylCrateCarousel label="Staff picks" records={RECORDS} preview={{ index: 3 }} />) },
  {
    id: "flipping",
    label: "Flipping",
    note: "Each flip tips the front sleeve toward you to show the next; going back lifts it up again.",
    node: <Scene start={1} period={5600} steps={[[800, next], [1700, next], [2600, next], [3700, prev], [4600, prev]]} />,
  },
  {
    id: "playing",
    label: "Pulled out & spinning",
    note: "The sleeve slides left, the disc slides right, the arm swings on and it spins.",
    node: <Scene start={2} period={6800} steps={[[800, play], [4800, play]]} />,
  },
  { id: "first", label: "First record", note: "Previous is off; every other sleeve stands behind it, top edges stacking away.", node: frame(<VinylCrateCarousel label="Staff picks" records={RECORDS} preview={{ index: 0 }} />) },
  { id: "last", label: "Last record", note: "Next is off; nothing left behind it in the crate.", node: frame(<VinylCrateCarousel label="Staff picks" records={RECORDS} preview={{ index: RECORDS.length - 1 }} />) },
];
