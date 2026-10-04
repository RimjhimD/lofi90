"use client";

import { useState } from "react";
import { VinylCrateCarousel, type VinylRecord } from "@/library/vinyl-crate-carousel/VinylCrateCarousel";

// Covers are drawn from two colours each, so a list from your API is enough. Control the index if
// something else on the page (a track list, a URL param) needs to know which record is at the front.
export function StaffPicks({ albums }: { albums: { id: string; name: string; band: string; year: number; palette: [string, string] }[] }) {
  const [index, setIndex] = useState(0);
  const records: VinylRecord[] = albums.map((a) => ({ id: a.id, title: a.name, artist: a.band, year: a.year, colors: a.palette }));

  return (
    <VinylCrateCarousel
      label="Staff picks"
      records={records}
      index={index}
      onChange={setIndex}
      onPlay={(r) => console.info("Start the preview for", r.title)}
      rpm={33}
    />
  );
}
