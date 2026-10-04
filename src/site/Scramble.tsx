"use client";

import { useEffect, useState } from "react";

const GLYPHS = "!<>-_\\/[]{}=+*^?#01";

/** Cycles through phrases, decoding each one out of random glyphs like a terminal. */
export function Scramble({ phrases, holdMs = 2400 }: { phrases: string[]; holdMs?: number }) {
  const [text, setText] = useState(phrases[0]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0;
    let frame = 0;
    let timer = 0;
    const next = () => {
      i = (i + 1) % phrases.length;
      const target = phrases[i];
      let step = 0;
      const steps = 18;
      const run = () => {
        step++;
        const done = Math.floor((step / steps) * target.length);
        setText(
          target
            .split("")
            .map((ch, k) => (k < done || ch === " " ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
            .join(""),
        );
        if (step < steps) frame = requestAnimationFrame(run);
        else timer = window.setTimeout(next, holdMs);
      };
      run();
    };
    timer = window.setTimeout(next, holdMs);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [phrases, holdMs]);

  return (
    <span className="text-acc">
      <span aria-hidden="true">{text}</span>
      <span className="sr-only">{phrases[0]}</span>
    </span>
  );
}
