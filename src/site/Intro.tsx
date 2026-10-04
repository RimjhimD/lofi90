"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const KEY = "lofi90-intro-seen";
const LIME = "198,255,61";
const TEXT = "233,237,232";

type Phase = "off" | "run" | "leaving" | "gone";

interface Particle {
  x: number;
  y: number;
  tx: number;
  ty: number;
  lime: boolean;
  delay: number;
  spin: number;
}

/** Points that spell "lofi90", sampled from the word drawn on a hidden canvas. */
function wordTargets(w: number, h: number): { x: number; y: number; lime: boolean }[] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  const size = Math.min(w * 0.2, 230);
  g.font = `700 ${size}px ${getComputedStyle(document.body).getPropertyValue("--font-grotesk") || "system-ui"}, system-ui, sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = "#fff";
  g.fillText("lofi90", w / 2, h / 2);
  const split = w / 2 - g.measureText("lofi90").width / 2 + g.measureText("lofi").width;
  const data = g.getImageData(0, 0, w, h).data;
  const step = Math.max(4, Math.round(size / 34));
  const out: { x: number; y: number; lime: boolean }[] = [];
  for (let y = 0; y < h; y += step)
    for (let x = 0; x < w; x += step) if (data[(y * w + x) * 4 + 3] > 140) out.push({ x, y, lime: x > split });
  return out;
}

/**
 * Opening sequence: a lime oscilloscope trace scans across the dark through static, locks into a clean
 * wave, collapses to a single point, then bursts into particles that fly together to spell "lofi90".
 * A radar ping ripples out and the page zooms in behind it. Plays once per visit; Skip and reduced
 * motion jump straight to the page.
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
    const seeds = Array.from({ length: 6 }, () => ({ f: 0.01 + Math.random() * 0.05, p: Math.random() * 6.28, a: 0.3 + Math.random() }));
    let particles: Particle[] = [];
    let frame = 0;
    const t0 = performance.now();
    let built = false;
    let shownLabel = "";
    const say = (text: string) => {
      if (text !== shownLabel) {
        shownLabel = text;
        setLabel(text);
      }
    };
    const done = window.setTimeout(() => setPhase("leaving"), 4300);

    const wave = (x: number, t: number, noise: number, clean: number) => {
      let n = 0;
      for (const s of seeds) n += Math.sin(x * s.f * 3 + s.p + t * 9) * s.a;
      return cy + n * 22 * noise + Math.sin(x * 0.018 - t * 6) * 70 * clean;
    };

    const draw = (now: number) => {
      const t = (now - t0) / 1000;
      g.fillStyle = "rgba(11,13,12,0.32)";
      g.fillRect(0, 0, W, H);

      if (t < 2.55) {
        // 1 · scan through static, 2 · lock into a clean wave, 3 · collapse to a point
        const reach = Math.min(1, t / 1.1);
        const noise = t < 1.3 ? 1 : Math.max(0, 1 - (t - 1.3) / 0.6);
        const clean = t < 1.3 ? 0 : t < 2.0 ? Math.min(1, (t - 1.3) / 0.5) : Math.max(0, 1 - (t - 2.0) / 0.3);
        const squeeze = t < 2.25 ? 0 : Math.min(1, (t - 2.25) / 0.3);
        const x0 = (W / 2) * squeeze;
        const x1 = W * reach - (W / 2) * squeeze;
        g.beginPath();
        for (let x = x0; x <= x1; x += 3) {
          const y = wave(x, t, noise, clean);
          if (x === x0) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
        g.strokeStyle = `rgba(${LIME},.95)`;
        g.lineWidth = 2;
        g.shadowColor = `rgba(${LIME},.9)`;
        g.shadowBlur = 16;
        g.stroke();
        g.shadowBlur = 0;
        // the bright head of the trace
        const hx = x1;
        const hy = wave(hx, t, noise, clean);
        g.fillStyle = "#fff";
        g.beginPath();
        g.arc(hx, hy, 3, 0, 6.28);
        g.fill();
        say(t < 1.3 ? "ACQUIRING SIGNAL" : t < 2.25 ? "SIGNAL LOCKED" : "");
      } else {
        // 4 · burst into particles that assemble the word, 5 · radar ping
        if (!built) {
          built = true;
          particles = wordTargets(W, H).map((p) => ({ x: W / 2, y: cy, tx: p.x, ty: p.y, lime: p.lime, delay: Math.random() * 0.25, spin: (Math.random() - 0.5) * 6 }));
        }
        const k = t - 2.55;
        for (const p of particles) {
          const q = Math.min(1, Math.max(0, (k - p.delay) / 0.75));
          const e = 1 - Math.pow(1 - q, 3);
          // fly out on a curve before settling, so it reads as a burst rather than a slide
          const curl = Math.sin(q * Math.PI) * p.spin * 22;
          const x = p.x + (p.tx - p.x) * e + curl;
          const y = p.y + (p.ty - p.y) * e - curl * 0.6;
          g.fillStyle = p.lime ? `rgba(${LIME},${0.4 + e * 0.6})` : `rgba(${TEXT},${0.35 + e * 0.65})`;
          g.fillRect(x, y, 2.4, 2.4);
        }
        if (k > 0.85) {
          const r = (k - 0.85) * 900;
          g.strokeStyle = `rgba(${LIME},${Math.max(0, 0.5 - (k - 0.85) * 0.6)})`;
          g.lineWidth = 1.5;
          g.beginPath();
          g.arc(W / 2, cy, r, 0, 6.28);
          g.stroke();
        }
        say(k > 0.9 ? "CONTROL ROOM ONLINE" : "");
      }
      frame = requestAnimationFrame(draw);
    };
    g.fillStyle = "#0B0D0C";
    g.fillRect(0, 0, W, H);
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
      className={`fixed inset-0 z-[100] bg-bg transition-[opacity,transform,filter] duration-700 [transition-timing-function:cubic-bezier(.7,0,.2,1)] ${
        phase === "leaving" ? "pointer-events-none scale-[1.35] opacity-0 blur-sm" : ""
      }`}
    >
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(233,237,232,.05)_1px,transparent_1.2px)] bg-[length:22px_22px]" />
      <span className="mono absolute left-6 top-6 flex items-center gap-2 text-[0.66rem] text-acc">
        <i className="led" data-on="true" data-pulse="true" style={{ width: 6, height: 6 }} />
        {label}
      </span>
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
