"use client";

import { click, useLoop } from "@/lib/loop";
import { UrlSlugInput } from "./UrlSlugInput";

const TITLE = "Café & Crème: 10 Best Recipes!";

/** A pretend check: the plain address is taken, everything else is free. */
const check = (slug: string, signal: AbortSignal) =>
  new Promise<boolean>((resolve, reject) => {
    const t = window.setTimeout(() => resolve(slug !== "cafe-and-creme-10-best-recipes"), 350);
    signal.addEventListener("abort", () => (clearTimeout(t), reject(new DOMException("Aborted", "AbortError"))), { once: true });
  });

/** Live loop: the title is taken, free versions appear, and the first one is picked. */
function PickScene() {
  const { ref, run, stop } = useLoop(5200, [[2600, click("[data-suggestion]")]]);
  return (
    <div ref={ref} onClick={stop} className="w-full">
      <UrlSlugInput key={run} defaultValue={{ title: TITLE }} checkAvailability={check} size="sm" />
    </div>
  );
}

/** Every state. All still except the live "pick a suggestion" loop. */
export const URL_SLUG_INPUT_STATES = [
  { id: "empty", label: "Empty", note: "No title yet. The address spot shows a placeholder.", node: <UrlSlugInput previewState="empty" size="sm" /> },
  { id: "typing", label: "Typing", note: "Accents, “&” and symbols are cleaned up live as you type.", node: <UrlSlugInput previewState="typing" size="sm" /> },
  { id: "checking", label: "Checking", note: "A short pause after typing, then one check. Older checks are cancelled.", node: <UrlSlugInput previewState="checking" size="sm" /> },
  { id: "available", label: "Free", note: "Nobody uses this address yet.", node: <UrlSlugInput previewState="available" size="sm" /> },
  { id: "taken", label: "Taken, with suggestions", note: "Already in use. Free versions are checked first, then offered.", node: <UrlSlugInput previewState="taken" size="sm" /> },
  { id: "pick", label: "Pick a suggestion", note: "Click a free version and it becomes the address.", node: <PickScene /> },
  { id: "manual", label: "Edited by hand", note: "Unlocked: the address is yours and the title no longer overwrites it.", node: <UrlSlugInput previewState="manual" size="sm" /> },
  { id: "published", label: "Published page", note: "Changing a live address warns that old links break, with a redirect option.", node: <UrlSlugInput previewState="published" size="sm" /> },
  { id: "error", label: "Check failed", note: "The server didn't answer. Retry is right there.", node: <UrlSlugInput previewState="error" size="sm" /> },
  { id: "disabled", label: "Disabled", note: "Shown but locked, for example while the page saves.", node: <UrlSlugInput previewState="disabled" size="sm" /> },
];
