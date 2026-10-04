"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const KEY = "lofi90-intro-seen";
const LINE = "Connecting you to the components…";

type Phase = "off" | "ringing" | "answered" | "leaving" | "gone";

/** An incoming call: the lamp flashes and buzzes, the operator plugs in, the line connects, the board lifts away. Once per visit. */
export function Intro() {
  const [phase, setPhase] = useState<Phase>("off");
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = sessionStorage.getItem(KEY);
    const replay = () => {
      setTyped(0);
      setPhase("ringing");
    };
    window.addEventListener("lofi90:replay-intro", replay);
    // sessionStorage only exists in the browser, so decide on the first tick after mount.
    const t = window.setTimeout(() => {
      if (seen || reduce) {
        setPhase("gone");
        document.documentElement.dataset.ready = "true";
      } else {
        setPhase("ringing");
      }
    }, 0);
    return () => {
      clearTimeout(t);
      window.removeEventListener("lofi90:replay-intro", replay);
    };
  }, []);

  useEffect(() => {
    if (phase === "ringing") {
      delete document.documentElement.dataset.ready;
      const t = window.setTimeout(() => setPhase("answered"), 1700);
      return () => clearTimeout(t);
    }
    if (phase === "answered") {
      const timers = Array.from(LINE, (_, i) => window.setTimeout(() => setTyped(i + 1), 450 + i * 28));
      timers.push(window.setTimeout(() => setPhase("leaving"), 450 + LINE.length * 28 + 650));
      return () => timers.forEach(clearTimeout);
    }
    if (phase === "leaving") {
      const t = window.setTimeout(() => {
        setPhase("gone");
        sessionStorage.setItem(KEY, "1");
        document.documentElement.dataset.ready = "true";
      }, 800);
      return () => clearTimeout(t);
    }
  }, [phase]);

  if (phase === "gone" || phase === "off") return null;
  const answered = phase !== "ringing";

  return createPortal(
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-bottle bg-[repeating-linear-gradient(90deg,rgba(255,255,255,.025)_0_2px,transparent_2px_9px)] transition-transform duration-[800ms] [transition-timing-function:cubic-bezier(.7,0,.2,1)] ${
        phase === "leaving" ? "-translate-y-full" : ""
      }`}
    >
      <div className="flex flex-col items-center text-center text-bone">
        {/* the cable drops in from the top when the call is answered */}
        <svg width="40" height="220" viewBox="0 0 40 220" className="-mb-2 overflow-visible">
          <path
            d="M20 -400 C 20 40, 20 120, 20 212"
            fill="none"
            stroke="#D7263D"
            strokeWidth="6"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1"
            className={answered ? "animate-[draw_.45s_cubic-bezier(.3,.7,.2,1)_forwards] [stroke-dashoffset:1]" : "[stroke-dashoffset:1]"}
          />
        </svg>

        <div className={`relative grid place-items-center ${answered ? "" : "animate-[buzz_.5s_linear_infinite]"}`}>
          {!answered && (
            <>
              <span className="absolute h-40 w-40 rounded-full border-2 border-glow/60 animate-[ring_1.1s_ease-out_infinite]" />
              <span className="absolute h-40 w-40 rounded-full border-2 border-glow/60 animate-[ring_1.1s_.55s_ease-out_infinite]" />
            </>
          )}
          <span
            className={`block h-24 w-24 rounded-full border-[6px] border-[#c9c2ae] transition-[background-color,box-shadow] duration-200 ${
              answered ? "bg-[#3a3a33] shadow-[inset_0_6px_12px_#000]" : "bg-glow shadow-[0_0_60px_18px_rgba(255,90,110,.55)] animate-[blink_.5s_steps(1)_infinite]"
            }`}
          />
        </div>

        <span className="mono mt-8 text-[#c9c2ae]">{answered ? "Line connected" : "Incoming call"}</span>
        <b className="mt-1 block font-display text-[clamp(3.2rem,9vw,6.5rem)] font-black leading-[0.9]">LOFI90</b>
        <span className="mono mt-4 h-5 text-bone">
          {LINE.slice(0, typed)}
          {answered && <span className="animate-[blink_1s_steps(1)_infinite]">▌</span>}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setPhase("leaving")}
        tabIndex={-1}
        className="mono absolute bottom-5 right-5 border border-bone/40 px-2.5 py-1.5 text-bone"
      >
        Skip ›
      </button>
    </div>,
    document.body,
  );
}
