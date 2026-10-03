"use client";

import { useEffect } from "react";
import { confetti } from "./confetti";

export function PageConfetti() {
  useEffect(() => {
    const t = window.setTimeout(() => confetti(window.innerWidth / 2, 140, 34), 250);
    return () => clearTimeout(t);
  }, []);
  return null;
}
