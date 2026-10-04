"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export interface RolodexCard {
  id: string;
  /** Main line on the card, e.g. a name. Its first letter is the index tab unless `tab` is set. */
  title: string;
  subtitle?: string;
  body?: ReactNode;
  /** The A–Z tab this card sits under. Defaults to the first letter of the title. */
  tab?: string;
}

export interface RolodexCarouselProps {
  cards: RolodexCard[];
  /** Accessible name for the whole carousel, e.g. "Contacts". */
  label: string;
  initialIndex?: number;
  onChange?: (index: number) => void;
  /** Colour of the side wheels and the focus ring. */
  accent?: string;
  /** How long one flip takes, in milliseconds. */
  flipMs?: number;
  /** How many cards peek out behind the current one. */
  behind?: number;
  /** How far each card behind leans back, in degrees. */
  tilt?: number;
  className?: string;
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const tabOf = (c: RolodexCard) => (c.tab ?? c.title).trim().charAt(0).toUpperCase();
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * A desk rolodex: cards hang from a rod and flip over a hinge. Scroll, drag, use the arrow keys,
 * or type a letter to spin straight to that A–Z tab.
 */
export function RolodexCarousel({ cards, label, initialIndex = 0, onChange, accent = "#C6FF3D", flipMs = 450, behind = 4, tilt = 7, className = "" }: RolodexCarouselProps) {
  const id = useId();
  const [index, setIndex] = useState(() => Math.min(Math.max(0, initialIndex), cards.length - 1));
  const [spinning, setSpinning] = useState(false);
  const wheel = useRef(0);
  const drag = useRef<{ y: number; moved: number } | null>(null);
  const spin = useRef(0);
  const latest = useRef(onChange);
  useEffect(() => {
    latest.current = onChange;
  });

  function go(next: number) {
    const clamped = Math.min(Math.max(0, next), cards.length - 1);
    setIndex(clamped);
    latest.current?.(clamped);
  }

  /** Flip through every card between here and there, fast, so you see the rolodex spin. */
  function spinTo(target: number) {
    clearInterval(spin.current);
    if (reduced() || Math.abs(target - index) <= 1) return go(target);
    setSpinning(true);
    let at = index;
    spin.current = window.setInterval(() => {
      at += target > at ? 1 : -1;
      go(at);
      if (at === target) {
        clearInterval(spin.current);
        setSpinning(false);
      }
    }, 55);
  }
  useEffect(() => () => clearInterval(spin.current), []);

  function jumpToLetter(letter: string) {
    const L = letter.toUpperCase();
    const hit = cards.findIndex((c) => tabOf(c) >= L);
    spinTo(hit === -1 ? cards.length - 1 : hit);
  }

  const current = cards[index];
  const usedLetters = new Set(cards.map(tabOf));

  return (
    <section
      style={{ ["--accent" as string]: accent }}
      aria-roledescription="carousel"
      aria-label={label}
      className={`w-full max-w-md select-none text-[#E9EDE8] ${className}`}
    >
      {/* A–Z index: click a letter to spin there. Letters with no cards are dimmed. */}
      <div role="group" aria-label="Jump to letter" className="mb-3 flex flex-wrap justify-center gap-px">
        {LETTERS.split("").map((L) => (
          <button
            key={L}
            type="button"
            disabled={!usedLetters.has(L)}
            onClick={() => jumpToLetter(L)}
            aria-pressed={tabOf(current) === L}
            className="h-6 w-[22px] border border-transparent font-mono text-[0.68rem] font-bold hover:border-[#3A433F] aria-pressed:bg-[#C6FF3D] aria-pressed:text-[#0B0D0C] disabled:text-[#3A433F] disabled:hover:border-transparent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
          >
            {L}
          </button>
        ))}
      </div>

      <div
        tabIndex={0}
        aria-describedby={`${id}-help`}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "PageDown") go(index + 1);
          else if (e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "PageUp") go(index - 1);
          else if (e.key === "Home") spinTo(0);
          else if (e.key === "End") spinTo(cards.length - 1);
          else if (/^[a-z]$/i.test(e.key) && !e.metaKey && !e.ctrlKey) jumpToLetter(e.key);
          else return;
          e.preventDefault();
        }}
        onWheel={(e) => {
          wheel.current += e.deltaY;
          if (Math.abs(wheel.current) > 60) {
            go(index + Math.sign(wheel.current));
            wheel.current = 0;
          }
        }}
        onPointerDown={(e) => {
          drag.current = { y: e.clientY, moved: 0 };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const dy = e.clientY - drag.current.y;
          if (Math.abs(dy) > 40) {
            go(index + (dy < 0 ? 1 : -1));
            drag.current.y = e.clientY;
          }
        }}
        onPointerUp={() => (drag.current = null)}
        className="relative mx-auto h-[270px] cursor-grab touch-none [perspective:900px] active:cursor-grabbing focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
      >
        {/* the rod and the two side wheels the cards hang from */}
        <div aria-hidden="true" className="absolute inset-x-6 bottom-9 h-2 rounded-full bg-[#8A938D]" />
        <div aria-hidden="true" className="absolute bottom-3 left-2 h-14 w-14 rounded-full border-[6px] border-[#3A433F]" style={{ background: accent, transform: `rotate(${index * 24}deg)`, transition: `transform ${flipMs}ms cubic-bezier(.3,1.3,.5,1)` }}>
          <span className="absolute left-1/2 top-0.5 h-3 w-1 -translate-x-1/2 bg-[#121614]" />
        </div>
        <div aria-hidden="true" className="absolute bottom-3 right-2 h-14 w-14 rounded-full border-[6px] border-[#3A433F]" style={{ background: accent, transform: `rotate(${index * 24}deg)`, transition: `transform ${flipMs}ms cubic-bezier(.3,1.3,.5,1)` }}>
          <span className="absolute left-1/2 top-0.5 h-3 w-1 -translate-x-1/2 bg-[#121614]" />
        </div>

        {cards.map((c, i) => {
          const d = i - index;
          const hidden = d < -1 || d > behind;
          const L = tabOf(c);
          const tabLeft = (LETTERS.indexOf(L) / 25) * 78;
          const transform =
            d === 0
              ? "translate3d(0,0,0) rotateX(0deg)"
              : d < 0
                ? "translate3d(0,40px,40px) rotateX(-105deg)"
                : `translate3d(0,${-d * 9}px,${-d * 26}px) rotateX(${d * tilt}deg) scale(${1 - d * 0.035})`;
          return (
            <div
              key={c.id}
              role="group"
              aria-roledescription="card"
              aria-label={`${i + 1} of ${cards.length}: ${c.title}`}
              aria-hidden={d !== 0}
              inert={d !== 0}
              className="absolute bottom-10 left-1/2 h-[180px] w-[min(320px,86%)] [transform-origin:50%_100%]"
              style={{
                transform: `translateX(-50%) ${transform}`,
                zIndex: 50 - Math.abs(d) * 2 + (d === 0 ? 10 : 0),
                opacity: hidden ? 0 : d < 0 ? 0 : 1 - Math.max(0, d) * 0.12,
                transition: spinning ? "transform .12s linear, opacity .12s linear" : `transform ${flipMs}ms cubic-bezier(.3,1.25,.5,1), opacity ${Math.round(flipMs * 0.7)}ms`,
                visibility: hidden ? "hidden" : "visible",
              }}
            >
              {/* the A–Z tab sticking up from the card's top edge */}
              <span aria-hidden="true" className="absolute -top-5 h-5 w-6 border-2 border-b-0 border-[#3A433F] bg-[#181D1B] text-center font-mono text-[0.68rem] font-bold leading-[18px]" style={{ left: `${tabLeft}%` }}>
                {L}
              </span>
              <div className="flex h-full flex-col rounded-lg border border-[#3A433F] bg-[#121614] p-4 shadow-[0_10px_30px_-14px_rgba(0,0,0,.9)] [background-image:repeating-linear-gradient(transparent_0_23px,#1C2220_23px_24px)]">
                <b className="font-mono text-[0.7rem] text-[#8A938D]">{String(i + 1).padStart(2, "0")} / {String(cards.length).padStart(2, "0")}</b>
                <h3 className="mt-1 text-xl font-black leading-tight">{c.title}</h3>
                {c.subtitle && <p className="text-sm text-[#8A938D]">{c.subtitle}</p>}
                {c.body && <div className="mt-auto text-sm">{c.body}</div>}
              </div>
              {/* the two punched holes the card hangs from */}
              <span aria-hidden="true" className="absolute -bottom-1 left-[30%] h-3 w-5 rounded-full border border-[#3A433F] bg-[#181D1B]" />
              <span aria-hidden="true" className="absolute -bottom-1 right-[30%] h-3 w-5 rounded-full border border-[#3A433F] bg-[#181D1B]" />
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-center gap-2">
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous card" className="h-9 w-9 rounded-lg border border-[#3A433F] bg-[#121614] font-bold shadow-[0_10px_30px_-14px_rgba(0,0,0,.9)] active:translate-x-px active:translate-y-px active:shadow-none disabled:opacity-40 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
          ▲
        </button>
        <p id={`${id}-help`} className="min-w-44 text-center text-xs text-[#8A938D]">Scroll, drag, ↑ ↓, or type a letter</p>
        <button type="button" onClick={() => go(index + 1)} disabled={index === cards.length - 1} aria-label="Next card" className="h-9 w-9 rounded-lg border border-[#3A433F] bg-[#121614] font-bold shadow-[0_10px_30px_-14px_rgba(0,0,0,.9)] active:translate-x-px active:translate-y-px active:shadow-none disabled:opacity-40 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
          ▼
        </button>
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {spinning ? "" : `${current.title}, card ${index + 1} of ${cards.length}`}
      </p>
    </section>
  );
}
