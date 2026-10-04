"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { TYPES } from "@/lib/registry";

const KEY = "lofi90-intro-seen";
const CABLE = ["#D7263D", "#E8E2D2", "#D7263D", "#C9C2AE", "#D7263D", "#E8E2D2", "#D7263D", "#C9C2AE", "#D7263D", "#E8E2D2"];
const STEP = 170;

/** Operator plugs a cable into each of the ten type jacks, lamps light, then the board lifts away. Once per visit. */
export function Intro() {
  const [phase, setPhase] = useState<"off" | "plugging" | "leaving" | "gone">("off");
  const [plugged, setPlugged] = useState(0);
  const [lit, setLit] = useState(0);
  const [title, setTitle] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = sessionStorage.getItem(KEY);
    const replay = () => {
      setPlugged(0);
      setLit(0);
      setTitle(false);
      setPhase("plugging");
    };
    window.addEventListener("lofi90:replay-intro", replay);
    // sessionStorage only exists in the browser, so decide on the first tick after mount.
    const t = window.setTimeout(() => {
      if (seen || reduce) {
        setPhase("gone");
        document.documentElement.dataset.ready = "true";
      } else {
        setPhase("plugging");
      }
    }, 0);
    return () => {
      clearTimeout(t);
      window.removeEventListener("lofi90:replay-intro", replay);
    };
  }, []);

  useEffect(() => {
    if (phase !== "plugging") return;
    delete document.documentElement.dataset.ready;
    const t: number[] = [];
    TYPES.forEach((_, i) => {
      t.push(window.setTimeout(() => setPlugged(i + 1), 250 + i * STEP));
      t.push(window.setTimeout(() => setLit(i + 1), 250 + i * STEP + 520));
    });
    const end = 250 + TYPES.length * STEP;
    t.push(window.setTimeout(() => setTitle(true), end + 300));
    t.push(window.setTimeout(() => setPhase("leaving"), end + 1400));
    return () => t.forEach(clearTimeout);
  }, [phase]);

  useEffect(() => {
    if (phase !== "leaving") return;
    const t = window.setTimeout(() => {
      setPhase("gone");
      sessionStorage.setItem(KEY, "1");
      document.documentElement.dataset.ready = "true";
    }, 900);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === "gone" || phase === "off") return null;
  return createPortal(
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-bottle bg-[repeating-linear-gradient(90deg,rgba(255,255,255,.025)_0_2px,transparent_2px_9px)] transition-transform duration-[900ms] [transition-timing-function:cubic-bezier(.7,0,.2,1)] ${
        phase === "leaving" ? "-translate-y-full" : ""
      }`}
    >
      <div className={`absolute left-1/2 top-[9%] -translate-x-1/2 text-center text-bone transition-opacity duration-500 ${title ? "opacity-100" : "opacity-0"}`}>
        <span className="mono text-[#c9c2ae]">Operator, connect me to</span>
        <b className="block font-display text-[clamp(3rem,9vw,6.5rem)] font-black leading-[0.9]">LOFI90</b>
      </div>

      <div className="relative h-[min(420px,70vh)] w-[min(1000px,94vw)]">
        <svg viewBox="0 0 1000 420" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
          {TYPES.slice(0, plugged).map((t, i) => {
            const x = 50 + i * 100;
            const sx = 500 + (i - 4.5) * 18;
            return (
              <path
                key={t.id}
                d={`M ${sx} -40 C ${sx} 160, ${x} 180, ${x} 345`}
                fill="none"
                stroke={CABLE[i]}
                strokeWidth="5"
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1"
                className="animate-[draw_.55s_cubic-bezier(.3,.7,.2,1)_forwards] [stroke-dashoffset:1]"
              />
            );
          })}
        </svg>
        <div className="absolute inset-x-0 bottom-0 grid grid-cols-10 gap-1.5">
          {TYPES.map((t, i) => (
            <div key={t.id} className="flex flex-col items-center gap-2.5">
              <i className="lamp" data-on={i < lit} style={{ width: 16, height: 16 }} />
              <i className="jack" style={{ width: 34, height: 34, borderWidth: 5 }} />
              <span className={`mono hidden bg-bone px-1.5 py-0.5 text-[0.62rem] text-ink transition-opacity sm:block ${i < lit ? "opacity-100" : "opacity-35"}`}>
                {t.id}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button type="button" onClick={() => setPhase("leaving")} tabIndex={-1} className="mono absolute bottom-5 right-5 border border-bone/40 px-2.5 py-1.5 text-bone">
        Skip ›
      </button>
    </div>,
    document.body,
  );
}
