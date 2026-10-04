"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { PAWN_COLORS, PIECES, PieceBody } from "./pieces";

const PUSH_RADIUS = 150;
const KICK_RADIUS = 70;

interface Motion {
  /** Where a die ended up after rolling, added to its home spot. */
  rollX: number;
  /** Spring that leans the piece away from the cursor and jolts it on scroll. */
  px: number;
  py: number;
  vx: number;
  vy: number;
  rolling: boolean;
  phase: number;
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The felt behind every page. Pieces bob, lean away from the cursor, drift with scroll,
 * dice tumble across the board, and a pawn hops up to each section title as it scrolls in.
 * Decorative only: hidden from screen readers, never takes clicks, still when reduced motion is on.
 */
export function LiveBoard() {
  const [faces, setFaces] = useState(() => PIECES.map((p, i) => (p.kind === "die" ? [5, 3, 6][i % 3] : 1)));
  const layer = useRef<HTMLDivElement>(null);
  const outer = useRef<(HTMLDivElement | null)[]>([]);
  const inner = useRef<(HTMLDivElement | null)[]>([]);
  const hops = useRef(0);
  const pathname = usePathname();

  useEffect(() => {
    if (reducedMotion()) return;
    const motion: Motion[] = PIECES.map((_, i) => ({ rollX: 0, px: 0, py: 0, vx: 0, vy: 0, rolling: false, phase: i * 1.7 }));
    const pointer = { x: -9999, y: -9999 };
    let lastScroll = window.scrollY;
    let lastKick = 0;
    let frame = 0;

    const roll = (i: number, awayFrom?: number) => {
      const m = motion[i];
      const el = inner.current[i];
      if (m.rolling || !el) return;
      const home = (PIECES[i].x / 100) * window.innerWidth + m.rollX;
      let dir = awayFrom === undefined ? (Math.random() < 0.5 ? -1 : 1) : home >= awayFrom ? 1 : -1;
      const dist = 60 + Math.random() * 70;
      if (home + dir * dist < 20 || home + dir * dist > window.innerWidth - 60) dir = -dir;
      const d = dir * dist;
      m.rolling = true;
      m.rollX += d;
      // The outer box jumps to the landing spot; the inner die tumbles in from where it was.
      el.animate(
        [
          { transform: `translateX(${-d}px) rotate(0deg)` },
          { transform: `translate(${-d * 0.5}px, -34px) rotate(${dir * 260}deg) scale(1.08)`, offset: 0.45 },
          { transform: `translate(${-d * 0.1}px, 0) rotate(${dir * 520}deg) scale(1.15, 0.8)`, offset: 0.78 },
          { transform: `translate(0, -6px) rotate(${dir * 540}deg) scale(0.95, 1.08)`, offset: 0.9 },
          { transform: `rotate(${dir * 540}deg)` },
        ],
        { duration: 760, easing: "cubic-bezier(.3,.6,.4,1)" },
      ).onfinish = () => {
        m.rolling = false;
        setFaces((f) => f.map((v, j) => (j === i ? 1 + Math.floor(Math.random() * 6) : v)));
      };
    };

    const tick = (now: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const scroll = window.scrollY;
      const scrollDelta = scroll - lastScroll;
      lastScroll = scroll;

      PIECES.forEach((spec, i) => {
        const el = outer.current[i];
        if (!el) return;
        const m = motion[i];
        const span = h + 140;
        const baseY = ((((spec.y / 100) * h - scroll * spec.depth) % span) + span) % span - 70;
        const baseX = (spec.x / 100) * w + m.rollX;
        const bob = Math.sin(now / 900 + m.phase) * 9;

        const dx = baseX + 20 - pointer.x;
        const dy = baseY + 20 - pointer.y;
        const dist = Math.hypot(dx, dy) || 1;
        const reach = Math.max(0, PUSH_RADIUS - dist) / PUSH_RADIUS;
        m.vx += ((dx / dist) * reach * 46 - m.px) * 0.1;
        m.vy += ((dy / dist) * reach * 46 - m.py) * 0.1 - scrollDelta * spec.depth * 0.25;
        m.vx *= 0.8;
        m.vy *= 0.8;
        m.px += m.vx;
        m.py += m.vy;

        if (spec.kind === "die" && dist < KICK_RADIUS && now - lastKick > 600) {
          lastKick = now;
          roll(i, pointer.x);
        }
        const lean = spec.tilt + m.px * 0.5 + Math.sin(now / 1300 + m.phase) * 5;
        el.style.transform = `translate3d(${baseX + m.px - (spec.x / 100) * w}px, ${baseY + m.py + bob}px, 0) rotate(${lean}deg)`;
      });
      frame = requestAnimationFrame(tick);
    };

    const dice = PIECES.flatMap((p, i) => (p.kind === "die" ? [i] : []));
    const autoRoll = window.setInterval(() => roll(dice[Math.floor(Math.random() * dice.length)]), 3800);

    const move = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };
    const leave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(autoRoll);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion()) return;
    // A pawn hops in from the board edge and lands next to each section title the first time it shows.
    const landed = new WeakSet<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || landed.has(entry.target) || !layer.current) continue;
          landed.add(entry.target);
          const range = document.createRange();
          range.selectNodeContents(entry.target);
          const text = range.getBoundingClientRect();
          const toX = Math.min(text.right + 16, window.innerWidth - 40);
          const toY = text.top + text.height / 2 - 26;
          const fromX = toX > window.innerWidth / 2 ? window.innerWidth + 40 : -40;
          const pawn = document.createElement("div");
          pawn.className = "absolute left-0 top-0 h-[42px] w-[30px] rounded-[50%_50%_8px_8px/40%_40%_8px_8px] border-4 border-ink shadow-[3px_3px_0_#20201C]";
          pawn.style.background = PAWN_COLORS[hops.current++ % PAWN_COLORS.length];
          layer.current.appendChild(pawn);
          const at = (x: number, y: number, extra = "") => `translate(${x}px, ${y}px) ${extra}`;
          const midX = (fromX + toX) / 2;
          const hop = pawn.animate(
            [
              { transform: at(fromX, toY + 60, "rotate(-20deg)") },
              { transform: at(midX, toY - 90, "rotate(10deg)"), offset: 0.45 },
              { transform: at(toX, toY + 6, "scale(1.25, 0.7)"), offset: 0.75 },
              { transform: at(toX, toY - 12, "scale(0.9, 1.12)"), offset: 0.87 },
              { transform: at(toX, toY) },
            ],
            { duration: 900, easing: "cubic-bezier(.3,.7,.4,1)", fill: "forwards" },
          );
          hop.onfinish = () => {
            pawn.animate([{ opacity: 1 }, { opacity: 0, transform: at(toX, toY + 14, "scale(.6)") }], {
              duration: 400,
              delay: 900,
              fill: "forwards",
            }).onfinish = () => pawn.remove();
          };
        }
      },
      { threshold: 1, rootMargin: "0px 0px -15% 0px" },
    );
    document.querySelectorAll("main h2").forEach((h2) => observer.observe(h2));
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <div ref={layer} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {PIECES.map((spec, i) => (
        <div
          key={i}
          ref={(el) => {
            outer.current[i] = el;
          }}
          className={`absolute will-change-transform ${spec.wide ? "hidden md:block" : ""}`}
          style={{ left: `${spec.x}%`, top: 0, transform: `translateY(${spec.y}vh) rotate(${spec.tilt}deg)` }}
        >
          <div
            ref={(el) => {
              inner.current[i] = el;
            }}
          >
            <PieceBody spec={spec} face={faces[i]} />
          </div>
        </div>
      ))}
    </div>
  );
}
