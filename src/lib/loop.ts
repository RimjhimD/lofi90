"use client";

import { useEffect, useRef, useState } from "react";

export type Step = [ms: number, run: (root: HTMLElement) => void];

/**
 * Plays a little scripted scene on a loop: each step runs at its time, then after `period` the scene starts
 * over (use the returned `run` as a key to remount the component fresh). Pauses while off screen.
 */
export function useLoop(period: number, steps: Step[]) {
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(0);
  const [visible, setVisible] = useState(false);
  const latest = useRef(steps);
  useEffect(() => {
    latest.current = steps;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !visible || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timers = latest.current.map(([ms, fn]) => window.setTimeout(() => fn(el), ms));
    const next = window.setTimeout(() => setRun((r) => r + 1), period);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(next);
    };
  }, [run, visible, period]);

  // Scripted clicks must stay inside the scene: on a gallery card the scene sits inside a link, and a
  // click bubbling out would open the component page on its own.
  const stop = (e: { stopPropagation: () => void; preventDefault: () => void }) => {
    e.stopPropagation();
    e.preventDefault();
  };
  return { ref, run, stop };
}

/** Click the first element matching `selector` inside the scene. */
export const click = (selector: string) => (root: HTMLElement) => root.querySelector<HTMLElement>(selector)?.click();

/** Fire a pointer event (e.g. press-and-hold) on the first element matching `selector`. */
export const pointer = (selector: string, type: "pointerdown" | "pointerup") => (root: HTMLElement) =>
  root.querySelector(selector)?.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 1, isPrimary: true }));
