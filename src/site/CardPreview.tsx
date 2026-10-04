"use client";

import { CARD_STATE, STATES } from "@/lib/demos";
import { Fit } from "@/site/Fit";

/** The preview on a gallery card: one state of the real component, frozen and zoomed to fill the card. */
export function CardPreview({ slug }: { slug: string }) {
  const preview = STATES[slug]?.find((s) => s.id === CARD_STATE[slug]);
  if (!preview) return null;
  return (
    <Fit height={210} max={1.15} className="screen stage-dark stage-tile transition-transform duration-500 group-hover:scale-[1.03]">
      {preview.node}
    </Fit>
  );
}
