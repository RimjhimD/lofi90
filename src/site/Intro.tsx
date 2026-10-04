"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const BOOT_COLORS = ["#FF5D5D", "#FFB800", "#3BB2F6", "#9B5DE5", "#00C49A", "#FF5D5D", "#FFB800", "#3BB2F6"];
const KEY = "lofi90-intro-seen";

/** Board-game phone powers on: handshake, coloured boot blocks, then the site. Plays once per visit. */
export function Intro() {
  const [phase, setPhase] = useState<"off" | "boot" | "leaving" | "gone">("off");
  const [filled, setFilled] = useState(0);
  const [line, setLine] = useState("powering on…");
  const [lit, setLit] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = sessionStorage.getItem(KEY);
    const replay = () => {
      setLit(false);
      setFilled(0);
      setLine("powering on…");
      setPhase("boot");
    };
    window.addEventListener("lofi90:replay-intro", replay);
    // sessionStorage only exists in the browser, so decide on the first tick after mount.
    const t = window.setTimeout(() => {
      if (seen || reduce) {
        setPhase("gone");
        document.documentElement.dataset.ready = "true";
      } else {
        setPhase("boot");
      }
    }, 0);
    return () => {
      clearTimeout(t);
      window.removeEventListener("lofi90:replay-intro", replay);
    };
  }, []);

  useEffect(() => {
    if (phase !== "boot") return;
    delete document.documentElement.dataset.ready;
    const t: number[] = [];
    t.push(window.setTimeout(() => setLit(true), 650));
    BOOT_COLORS.forEach((_, i) => t.push(window.setTimeout(() => setFilled(i + 1), 950 + i * 110)));
    t.push(window.setTimeout(() => setLine("loading components…"), 1300));
    t.push(window.setTimeout(() => setLine("ready! ✓"), 1950));
    t.push(window.setTimeout(() => setPhase("leaving"), 2450));
    return () => t.forEach(clearTimeout);
  }, [phase]);

  // Fade out (also reached via "skip"), then reveal the page.
  useEffect(() => {
    if (phase !== "leaving") return;
    const t = window.setTimeout(() => {
      setPhase("gone");
      sessionStorage.setItem(KEY, "1");
      document.documentElement.dataset.ready = "true";
    }, 500);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === "gone" || phase === "off") return null;
  // Portal to <body> so the overlay sits above the header and everything else.
  return createPortal(overlay(), document.body);

  function overlay() {

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] grid place-items-center bg-felt bg-[radial-gradient(rgba(255,255,255,.06)_1px,transparent_1.5px)] bg-[length:6px_6px] transition-[opacity,transform] duration-500 ${
        phase === "leaving" ? "pointer-events-none scale-105 opacity-0" : ""
      }`}
    >
      <div className="w-[340px] max-w-[88vw] animate-[dropin_.55s_cubic-bezier(.3,1.6,.5,1)_both] rounded-[56px_56px_72px_72px] border-[6px] border-ink bg-board px-[22px] pb-[26px] pt-7 shadow-[10px_10px_0_#20201C]">
        <div className="mx-auto mb-4 h-2.5 w-[70px] rounded-[9px] border-[3px] border-ink bg-[repeating-linear-gradient(90deg,#20201C_0_4px,transparent_4px_8px)]" />
        <div className={`flex h-[270px] flex-col items-center justify-center gap-2.5 rounded-[18px] border-4 border-ink transition-colors duration-200 ${lit ? "bg-paper" : "bg-[#3b3a33]"}`}>
          <IntroScreen filled={filled} line={line} lit={lit} />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {["◀", "▲", "OK", "⌂", "▼", "★"].map((k, i) => (
            <span key={k} className={`rounded-[18px] border-4 border-ink py-2 text-center font-extrabold shadow-[0_5px_0_#20201C] ${["bg-p3", "bg-p2", "bg-p1 text-white", "bg-p5", "bg-p2", "bg-p4 text-white"][i]}`}>
              {k}
            </span>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setPhase("leaving")}
        className="chunk absolute bottom-5 right-6 px-4 py-1"
        tabIndex={-1}
      >
        skip ▸
      </button>
    </div>
  );
  }
}

function IntroScreen({ filled, line, lit }: { filled: number; line: string; lit: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-2.5 transition-opacity duration-200 ${lit ? "opacity-100" : "opacity-0"}`}>
      <div className="text-[2.6rem] leading-none">🤝</div>
      <div className="-rotate-3 font-title text-[2.6rem] leading-none">lofi90</div>
      <div className="flex gap-[5px]">
        {BOOT_COLORS.map((c, i) => (
          <i
            key={i}
            className={`block h-5 w-5 rounded-md border-[3px] border-ink transition-transform duration-200 ${i < filled ? "-translate-y-[3px]" : ""}`}
            style={{ background: i < filled ? c : "#FFFDF6" }}
          />
        ))}
      </div>
      <div className="text-[0.8rem] font-extrabold">{line}</div>
    </div>
  );
}
