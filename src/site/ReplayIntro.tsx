"use client";

export function ReplayIntro() {
  return (
    <button
      type="button"
      onClick={() => {
        window.scrollTo({ top: 0 });
        window.dispatchEvent(new Event("lofi90:replay-intro"));
      }}
      className="mono fixed bottom-5 right-5 z-30 rounded-lg border border-line-2 bg-panel/90 px-3 py-2 text-[0.64rem] text-mute backdrop-blur transition-colors hover:border-acc hover:text-acc focus-visible:outline-2 focus-visible:outline-acc"
    >
      ↻ Replay boot
    </button>
  );
}
