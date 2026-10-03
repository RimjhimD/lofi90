"use client";

export function ReplayIntro() {
  return (
    <button
      type="button"
      onClick={() => {
        window.scrollTo({ top: 0 });
        window.dispatchEvent(new Event("lofi90:replay-intro"));
      }}
      className="chunk fixed bottom-5 right-5 z-40 bg-p2! px-4 py-1"
    >
      ↻ reboot
    </button>
  );
}
