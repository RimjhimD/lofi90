"use client";

import { CARD_STATE, STATES } from "@/lib/demos";

/** The mini live preview on a home-page line card: one state of the real component, shrunk and inert. */
export function CardPreview({ slug }: { slug: string }) {
  const preview = STATES[slug]?.find((s) => s.id === CARD_STATE[slug]);
  if (!preview) return null;
  return (
    <div inert className="pointer-events-none absolute left-1/2 top-1/2 w-[380px] [transform:translate(-50%,-50%)_scale(.6)] transition-transform duration-300 group-hover:[transform:translate(-50%,-50%)_scale(.64)]">
      <div className="flex justify-center">{preview.node}</div>
    </div>
  );
}
