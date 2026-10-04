"use client";

/** Plays the opening animation again, from any page. */
export function ReplayIntro() {
  return (
    <button
      type="button"
      title="Play the opening animation again"
      onClick={() => {
        window.scrollTo({ top: 0 });
        window.dispatchEvent(new Event("lofi90:replay-intro"));
      }}
      className="flex items-center gap-1.5 rounded-full border border-line bg-panel px-2.5 py-1 text-xs font-medium text-mute transition-colors hover:border-acc hover:text-acc focus-visible:outline-2 focus-visible:outline-acc"
    >
      <span aria-hidden="true">↻</span>
      <span className="sr-only sm:not-sr-only">Intro</span>
    </button>
  );
}
