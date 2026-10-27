"use client";

import { useLoop } from "@/lib/loop";
import { PolaroidCard, type PolaroidCardProps } from "./PolaroidCard";

const PHOTO: PolaroidCardProps = {
  src: "https://picsum.photos/id/1011/600/450",
  alt: "A woman in a red kayak on a calm green lake",
  width: 600,
  height: 450,
  caption: "Lake day, finally",
  date: "Aug 2026",
  size: "sm",
};

/** The real card remounted on a loop, so the print develops from the chemical tint every few seconds. */
function Develop() {
  const { ref, run, stop } = useLoop(4200, []);
  return (
    <div ref={ref} onClick={stop}>
      <PolaroidCard key={run} {...PHOTO} loading="eager" />
    </div>
  );
}

/** Every state. "Developing" plays live; the rest are held still with previewState. */
export const POLAROID_CARD_STATES = [
  { id: "developed", label: "Developed", note: "Loaded and decoded: the tint has cleared and the photo shows.", node: <Develop /> },
  { id: "developing", label: "Developing", note: "Still loading: a dark chemical tint over the placeholder, space already reserved.", node: <PolaroidCard {...PHOTO} previewState="developing" /> },
  { id: "slow", label: "Slow connection", note: "Past slowAfterMs: the caption says it is still developing.", node: <PolaroidCard {...PHOTO} previewState="slow" /> },
  { id: "error", label: "Couldn't load", note: "The print is overexposed with a light leak, and Retry asks again.", node: <PolaroidCard {...PHOTO} caption="The campsite" previewState="error" /> },
  { id: "missing-alt", label: "Missing alt", note: "No alt attribute: a sticky note in development, before an audit finds it.", node: <PolaroidCard {...PHOTO} alt={undefined} caption="Pug in a blanket" src="https://picsum.photos/id/1025/600/450" previewState="missing-alt" /> },
  { id: "selected", label: "Selected", note: "Clickable card, picked: a strip of tape holds it, aria-pressed is true.", node: <PolaroidCard {...PHOTO} onSelect={() => {}} previewState="selected" /> },
  { id: "disabled", label: "Disabled", note: "Can't be picked right now: faded and grey, no lift.", node: <PolaroidCard {...PHOTO} onSelect={() => {}} previewState="disabled" /> },
];
