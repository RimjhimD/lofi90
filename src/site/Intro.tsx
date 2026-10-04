"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Ms_Madi } from "next/font/google";

// the handwritten line under the LED word
const script = Ms_Madi({ weight: "400", subsets: ["latin"], display: "swap" });

const KEY = "lofi90-intro-seen";
const LIME = "198,255,61";
const TEXT = "233,237,232";

type Phase = "off" | "run" | "leaving" | "gone";

interface Led {
  x: number;
  y: number;
  lime: boolean;
  on: number;
  flick: number;
}

/** Points that spell "lofi90", sampled from the word drawn on a hidden canvas. */
function wordTargets(w: number, h: number): { pts: { x: number; y: number; lime: boolean }[]; step: number } {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  const size = Math.min(w * 0.14, 200);
  g.font = `700 ${size}px ${getComputedStyle(document.body).getPropertyValue("--font-unbounded") || "system-ui"}, system-ui, sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = "#fff";
  g.fillText("lofi90", w / 2, h / 2);
  const split = w / 2 - g.measureText("lofi90").width / 2 + g.measureText("lofi").width;
  const data = g.getImageData(0, 0, w, h).data;
  const step = Math.max(6, Math.round(size / 24));
  const out: { x: number; y: number; lime: boolean }[] = [];
  for (let y = 0; y < h; y += step)
    for (let x = 0; x < w; x += step) if (data[(y * w + x) * 4 + 3] > 140) out.push({ x, y, lime: x > split });
  return { pts: out, step };
}

/**
 * Opening sequence: the screen powers on like an old CRT (a bright line splits open), a dim LED board
 * fills the dark, and the LEDs that spell "lofi90" light up in a slow diagonal sweep, each one
 * flickering before it holds. A shimmer runs across the word, then the whole screen powers off into a
 * lime line and the page is there behind it. Plays once per visit; Skip and reduced motion jump
 * straight to the page.
 */
export function Intro() {
  const [phase, setPhase] = useState<Phase>("off");
  const canvas = useRef<HTMLCanvasElement>(null);
  const [label, setLabel] = useState("");

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = sessionStorage.getItem(KEY);
    const replay = () => setPhase("run");
    window.addEventListener("lofi90:replay-intro", replay);
    const t = window.setTimeout(() => {
      if (seen || reduce) {
        setPhase("gone");
        document.documentElement.dataset.ready = "true";
      } else setPhase("run");
    }, 0);
    return () => {
      clearTimeout(t);
      window.removeEventListener("lofi90:replay-intro", replay);
    };
  }, []);

  useEffect(() => {
    if (phase !== "run") return;
    delete document.documentElement.dataset.ready;
    const cv = canvas.current;
    if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = window.innerWidth;
    const H = window.innerHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    const g = cv.getContext("2d")!;
    g.scale(dpr, dpr);
    const cy = H / 2;

    // the word, snapped to the LED grid; each LED gets the moment it switches on (a left-to-right,
    // slightly diagonal sweep) and a little random flicker before it holds
    const { pts, step } = wordTargets(W, H);
    const xs = pts.map((p) => p.x);
    const minX = Math.min(...xs);
    const spanX = Math.max(1, Math.max(...xs) - minX);
    const leds: Led[] = pts.map((p) => ({
      ...p,
      on: 1.0 + ((p.x - minX) / spanX) * 1.1 + ((p.y - cy) / H) * 0.35 + Math.random() * 0.12,
      flick: Math.random() * 6.28,
    }));
    const r = step * 0.34;

    // the dim board behind, drawn once
    const board = document.createElement("canvas");
    board.width = W * dpr;
    board.height = H * dpr;
    const bg = board.getContext("2d")!;
    bg.scale(dpr, dpr);
    bg.fillStyle = `rgba(${TEXT},.07)`;
    for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) bg.fillRect(x - r * 0.5, y - r * 0.5, r, r);

    let frame = 0;
    const t0 = performance.now();
    let shownLabel = "";
    const say = (text: string) => {
      if (text !== shownLabel) {
        shownLabel = text;
        setLabel(text);
      }
    };
    const done = window.setTimeout(() => setPhase("leaving"), 4700);

    const draw = (now: number) => {
      const t = (now - t0) / 1000;
      g.fillStyle = "#0B0D0C";
      g.fillRect(0, 0, W, H);

      if (t < 0.85) {
        // 1 · CRT power-on: a line grows out from the centre, then splits open top and bottom
        const grow = Math.min(1, t / 0.4);
        const open = t < 0.4 ? 0 : Math.min(1, (t - 0.4) / 0.45);
        const ease = 1 - Math.pow(1 - open, 3);
        const halfH = 1 + ease * (H / 2);
        const halfW = (W / 2) * (1 - Math.pow(1 - grow, 3));
        g.globalAlpha = 1 - ease * 0.9;
        g.fillStyle = `rgba(${LIME},1)`;
        g.shadowColor = `rgba(${LIME},1)`;
        g.shadowBlur = 30;
        g.fillRect(W / 2 - halfW, cy - Math.max(1, 3 * (1 - ease)), halfW * 2, Math.max(2, 6 * (1 - ease)));
        g.shadowBlur = 0;
        g.globalAlpha = 0.18 * (1 - ease) + 0.02;
        g.fillRect(W / 2 - halfW, cy - halfH, halfW * 2, halfH * 2);
        g.globalAlpha = 1;
        if (open > 0) {
          g.globalAlpha = ease;
          g.drawImage(board, 0, (cy - halfH) * dpr, W * dpr, halfH * 2 * dpr, 0, cy - halfH, W, halfH * 2);
          g.globalAlpha = 1;
        }
        say("POWERING ON");
      } else {
        // 2 · the LED board, word lighting up in a sweep · 3 · a shimmer runs across it
        g.drawImage(board, 0, 0, W, H);
        const sweep = minX + ((t - 2.5) / 0.9) * spanX;
        for (const l of leds) {
          const k = t - l.on;
          if (k < 0) continue;
          let b = k < 0.22 ? (Math.sin(k * 70 + l.flick) > 0 ? 0.9 : 0.15) : Math.min(1, 0.75 + k);
          if (t > 2.5) b += Math.max(0, 0.6 - Math.abs(l.x - sweep) / (step * 6));
          const c = l.lime ? LIME : TEXT;
          g.fillStyle = `rgba(${c},${Math.min(0.22, b * 0.16)})`;
          g.fillRect(l.x - r * 2, l.y - r * 2, r * 4, r * 4);
          g.fillStyle = `rgba(${c},${Math.min(1, b)})`;
          g.beginPath();
          g.arc(l.x, l.y, r, 0, 6.28);
          g.fill();
        }
        say(t < 2.4 ? "LIGHTING THE BOARD" : "ALL CHANNELS LIVE");
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(done);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "leaving") return;
    const t = window.setTimeout(() => {
      setPhase("gone");
      sessionStorage.setItem(KEY, "1");
      document.documentElement.dataset.ready = "true";
    }, 750);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === "gone" || phase === "off") return null;

  return createPortal(
    <div
      aria-hidden="true"
      className={`screen fixed inset-0 z-[100] bg-[#0B0D0C] ${phase === "leaving" ? "pointer-events-none animate-[crt-off_.75s_cubic-bezier(.7,0,.2,1)_forwards]" : ""}`}
    >
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(233,237,232,.05)_1px,transparent_1.2px)] bg-[length:22px_22px]" />
      <span className="mono absolute left-6 top-6 flex items-center gap-2 text-[0.66rem] text-acc">
        <i className="led" data-on="true" data-pulse="true" style={{ width: 6, height: 6 }} />
        {label}
      </span>
      {/* signed by hand under the board once the letters are lit */}
      <p
        className={`${script.className} pointer-events-none absolute inset-x-0 text-center text-acc [text-shadow:0_0_18px_rgba(198,255,61,.55)] animate-[sign_1.6s_cubic-bezier(.45,0,.2,1)_2.2s_both]`}
        style={{ top: `calc(50% + ${Math.round(Math.min(window.innerWidth * 0.14, 200) * 0.5)}px)`, fontSize: `${Math.round(Math.max(30, Math.min(window.innerWidth * 0.045, 64)))}px` }}
      >
        Rimjhim’s component control room
      </p>
      <span className="mono absolute bottom-6 left-6 text-[0.6rem] text-mute">lofi90 · component control room</span>
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setPhase("leaving")}
        className="mono absolute bottom-5 right-5 rounded-md border border-line-2 px-2.5 py-1.5 text-[0.64rem] text-mute hover:text-text"
      >
        Skip ›
      </button>
    </div>,
    document.body,
  );
}
