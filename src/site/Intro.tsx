"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ENTRIES } from "@/lib/registry";

const KEY = "lofi90-intro-seen";
const LINES = [
  "> boot lofi90 control room",
  `> checking ${ENTRIES.length} components ........... ok`,
  "> loading prompts ................. ok",
  "> calibrating radar ............... ok",
  "> all systems nominal",
];
const CHAR_MS = 14;

type Phase = "off" | "typing" | "flash" | "leaving" | "gone";

/** The console boots: status lines type themselves out, the name flashes, then the screen wipes up. Once per visit. */
export function Intro() {
  const [phase, setPhase] = useState<Phase>("off");
  const [chars, setChars] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = sessionStorage.getItem(KEY);
    const replay = () => {
      setChars(0);
      setPhase("typing");
    };
    window.addEventListener("lofi90:replay-intro", replay);
    const t = window.setTimeout(() => {
      if (seen || reduce) {
        setPhase("gone");
        document.documentElement.dataset.ready = "true";
      } else setPhase("typing");
    }, 0);
    return () => {
      clearTimeout(t);
      window.removeEventListener("lofi90:replay-intro", replay);
    };
  }, []);

  const total = LINES.join("\n").length;
  useEffect(() => {
    if (phase === "typing") {
      delete document.documentElement.dataset.ready;
      const id = window.setInterval(() => setChars((c) => Math.min(total, c + 2)), CHAR_MS * 2);
      return () => clearInterval(id);
    }
    if (phase === "flash") {
      const t = window.setTimeout(() => setPhase("leaving"), 650);
      return () => clearTimeout(t);
    }
    if (phase === "leaving") {
      const t = window.setTimeout(() => {
        setPhase("gone");
        sessionStorage.setItem(KEY, "1");
        document.documentElement.dataset.ready = "true";
      }, 700);
      return () => clearTimeout(t);
    }
  }, [phase, total]);

  useEffect(() => {
    if (phase !== "typing" || chars < total) return;
    const t = window.setTimeout(() => setPhase("flash"), 280);
    return () => clearTimeout(t);
  }, [chars, phase, total]);

  if (phase === "gone" || phase === "off") return null;
  const text = LINES.join("\n").slice(0, chars);

  return createPortal(
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-bg transition-[clip-path] duration-700 [transition-timing-function:cubic-bezier(.7,0,.2,1)] ${phase === "leaving" ? "[clip-path:inset(0_0_100%_0)]" : "[clip-path:inset(0_0_0_0)]"}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(233,237,232,.07)_1px,transparent_1.2px)] bg-[length:22px_22px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-acc/10 to-transparent animate-[scan_2.4s_linear_infinite]" />
      <div className="relative w-[min(560px,88vw)]">
        <pre className={`whitespace-pre-wrap font-mono text-[0.82rem] leading-7 text-mute transition-opacity duration-300 ${phase === "typing" ? "opacity-100" : "opacity-30"}`}>
          {text.split("\n").map((l, i) => (
            <span key={i} className="block">
              {l.endsWith("ok") ? (
                <>
                  {l.slice(0, -2)}
                  <span className="text-acc">ok</span>
                </>
              ) : (
                l
              )}
            </span>
          ))}
          <span className="animate-[blink_1s_steps(1)_infinite] text-acc">▌</span>
        </pre>
        <b
          className={`absolute inset-x-0 top-1/2 block -translate-y-1/2 text-center font-display text-[clamp(4rem,14vw,9rem)] font-bold leading-none tracking-tight text-text transition-[opacity,transform,filter] duration-500 ${
            phase === "typing" ? "scale-90 opacity-0 blur-md" : "scale-100 opacity-100 blur-0 [text-shadow:0_0_40px_rgba(198,255,61,.35)]"
          }`}
        >
          lofi<span className="text-acc">90</span>
        </b>
      </div>
      <button type="button" tabIndex={-1} onClick={() => setPhase("leaving")} className="mono absolute bottom-5 right-5 rounded-md border border-line-2 px-2.5 py-1.5 text-[0.64rem] text-mute hover:text-text">
        Skip ›
      </button>
    </div>,
    document.body,
  );
}
