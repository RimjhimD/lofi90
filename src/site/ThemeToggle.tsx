"use client";

import { useSyncExternalStore } from "react";

const KEY = "lofi90-theme";
type Theme = "dark" | "light";

const listeners = new Set<() => void>();
const read = (): Theme => (document.documentElement.dataset.theme === "light" ? "light" : "dark");
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

function apply(next: Theme) {
  const set = () => {
    document.documentElement.dataset.theme = next;
    localStorage.setItem(KEY, next);
    listeners.forEach((l) => l());
  };
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // The new theme is wiped in top to bottom behind the old one (see ::view-transition in globals.css).
  const vt = (document as Document & { startViewTransition?: (cb: () => void) => unknown }).startViewTransition;
  if (vt && !reduce) vt.call(document, set);
  else set();
}

/** Dark / Light switch. The choice is remembered and applied before first paint by the script in the layout. */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, read, () => "dark" as Theme);
  const btn =
    "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-mute transition-colors aria-pressed:bg-panel-2 aria-pressed:text-text focus-visible:outline-2 focus-visible:outline-acc";
  return (
    <div role="group" aria-label="Colour theme" className="flex rounded-full border border-line bg-panel p-0.5">
      <button type="button" aria-pressed={theme === "dark"} onClick={() => theme !== "dark" && apply("dark")} className={btn}>
        <span aria-hidden="true">☾</span> Dark
      </button>
      <button type="button" aria-pressed={theme === "light"} onClick={() => theme !== "light" && apply("light")} className={btn}>
        <span aria-hidden="true">☀</span> Light
      </button>
    </div>
  );
}
