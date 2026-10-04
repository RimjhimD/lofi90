"use client";

export function ReplayIntro() {
  return (
    <button
      type="button"
      onClick={() => {
        window.scrollTo({ top: 0 });
        window.dispatchEvent(new Event("lofi90:replay-intro"));
      }}
      className="mono fixed bottom-5 right-5 z-30 bg-ink px-3.5 py-2.5 text-bone transition-transform hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-signal"
    >
      ↻ Replay intro
    </button>
  );
}
