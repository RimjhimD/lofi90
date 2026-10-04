"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export type IslandTone = "info" | "success" | "warning" | "error";

export interface IslandItem {
  id: string;
  title: string;
  body?: string;
  icon?: ReactNode;
  tone?: IslandTone;
  /** Optional button inside the expanded card. */
  action?: { label: string; onClick: () => void };
  /** 0–1 turns this into a live activity: it lives in the pill as a progress ring until it reaches 1. */
  progress?: number;
}

export interface IslandNotificationProps {
  /** Waiting notifications, oldest first. The island shows them one at a time. */
  items: IslandItem[];
  /** Called when a notification is finished with (timed out, swiped away, Esc, or its action ran). */
  onDismiss: (id: string) => void;
  /** How long an expanded notification stays open, in ms. Hovering pauses it. */
  duration?: number;
  /** How long the pill-to-card morph takes, in ms. */
  morphMs?: number;
  /** Hold new notifications while the person is typing, and deliver them when they pause. */
  holdWhileTyping?: boolean;
  /** Colour of the idle glow and the info tone. */
  accent?: string;
  /** "fixed" pins it to the top of the window; "absolute" keeps it inside its parent (for previews). */
  position?: "fixed" | "absolute";
  /** Freeze one look without timers, for docs and tests: the card open, or held while typing. */
  preview?: "open" | "held";
  className?: string;
}

const TONES: Record<IslandTone, string> = { info: "", success: "#C6FF3D", warning: "#FFB547", error: "#FF6B57" };
const IDLE = { w: 132, h: 36 };
const LIVE = { w: 230, h: 36 };
const TYPING_PAUSE = 1200;

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Notifications that live in a small black pill. A new one makes the pill morph into a card, then shrink
 * back. Several queue up and take turns; a live activity (upload, timer) sits inside the pill as a progress
 * ring. With holdWhileTyping, nothing pops up while someone is mid-sentence: it waits until they pause.
 */
export function IslandNotification({
  items,
  onDismiss,
  duration = 4000,
  morphMs = 520,
  holdWhileTyping = true,
  accent = "#3DD9FF",
  position = "fixed",
  preview,
  className = "",
}: IslandNotificationProps) {
  const id = useId();
  const [typing, setTyping] = useState(false);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [height, setHeight] = useState(84);
  const [width, setWidth] = useState(360);
  const body = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; dy: number } | null>(null);
  const latest = useRef(onDismiss);
  useEffect(() => {
    latest.current = onDismiss;
  });

  // Watch for typing anywhere on the page; a pause of TYPING_PAUSE ends it.
  useEffect(() => {
    if (!holdWhileTyping) return;
    let t = 0;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (!el.closest("input, textarea, [contenteditable='true']")) return;
      setTyping(true);
      clearTimeout(t);
      t = window.setTimeout(() => setTyping(false), TYPING_PAUSE);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [holdWhileTyping]);

  const held = preview === "held" || (!preview && holdWhileTyping && typing);
  // Live activities stay in the pill; regular notifications take turns in the card.
  const live = items.find((i) => i.progress !== undefined && i.progress < 1);
  const current = items.find((i) => i.progress === undefined || i.progress >= 1);
  const waiting = items.filter((i) => i !== current && i !== live).length;
  const showCard = !!current && !held && (preview === "open" || (!preview && open));

  // Open the card for the next notification (unless someone is typing).
  useEffect(() => {
    if (!current || held || preview) return;
    const t = window.setTimeout(() => setOpen(true), 60);
    return () => clearTimeout(t);
  }, [current, held, preview]);

  // Auto-close after `duration`, paused while hovered.
  useEffect(() => {
    if (!showCard || hovered || !current || preview) return;
    const t = window.setTimeout(() => close(current.id), duration);
    return () => clearTimeout(t);
    // close is stable enough for this timer; we only restart it when the card or hover changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCard, hovered, current?.id, duration, preview]);

  // Size the card to its content so the morph lands exactly on it.
  useEffect(() => {
    const el = body.current;
    const sh = shell.current?.parentElement;
    if (!el || !sh) return;
    const ro = new ResizeObserver(() => {
      setHeight(el.scrollHeight);
      setWidth(Math.min(380, sh.clientWidth - 24));
    });
    ro.observe(el);
    ro.observe(sh);
    return () => ro.disconnect();
  }, [current?.id]);

  function close(itemId: string) {
    setOpen(false);
    window.setTimeout(() => latest.current(itemId), reduced() ? 0 : morphMs * 0.6);
  }

  const size = showCard ? { w: width, h: height } : live ? LIVE : IDLE;
  const tone = current?.tone ?? "info";
  const toneColor = tone === "info" ? accent : TONES[tone];
  const ease = "cubic-bezier(.32,1.45,.45,1)";

  return (
    <div className={`${position === "fixed" ? "fixed" : "absolute"} inset-x-0 top-3 z-50 flex justify-center ${className}`}>
      <div
        ref={shell}
        role="region"
        aria-label="Notifications"
        aria-describedby={`${id}-live`}
        tabIndex={showCard ? 0 : -1}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onKeyDown={(e) => {
          if (!current || !showCard) return;
          if (e.key === "Escape") close(current.id);
          if (e.key === "Enter" && current.action) {
            current.action.onClick();
            close(current.id);
          }
        }}
        onPointerDown={(e) => showCard && (drag.current = { y: e.clientY, dy: 0 })}
        onPointerMove={(e) => {
          if (!drag.current || !shell.current) return;
          drag.current.dy = Math.min(0, e.clientY - drag.current.y);
          shell.current.style.translate = `0 ${drag.current.dy}px`;
        }}
        onPointerUp={() => {
          if (!drag.current || !shell.current) return;
          if (drag.current.dy < -30 && current) close(current.id);
          shell.current.style.translate = "";
          drag.current = null;
        }}
        className="relative overflow-hidden bg-black text-[#E9EDE8] outline-none ring-1 ring-white/10 focus-visible:ring-2 focus-visible:ring-[#C6FF3D]"
        style={{
          width: size.w,
          height: size.h,
          borderRadius: showCard ? 26 : 18,
          transition: reduced() ? "none" : `width ${morphMs}ms ${ease}, height ${morphMs}ms ${ease}, border-radius ${morphMs}ms ${ease}`,
          boxShadow: showCard ? `0 20px 50px -18px ${toneColor}66` : `0 0 18px -6px ${accent}`,
        }}
      >
        {/* the idle / live pill */}
        <div
          aria-hidden={showCard}
          className="absolute inset-0 flex items-center justify-between px-3.5 transition-opacity duration-200"
          style={{ opacity: showCard ? 0 : 1 }}
        >
          <span className="h-2 w-2 rounded-full" style={{ background: held && current ? "#FFB547" : accent, boxShadow: `0 0 10px ${held && current ? "#FFB547" : accent}` }} />
          {live ? (
            <span className="flex items-center gap-2 text-xs">
              <span className="max-w-[120px] truncate">{live.title}</span>
              <svg viewBox="0 0 20 20" className="h-5 w-5 -rotate-90">
                <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="2.5" />
                <circle cx="10" cy="10" r="8" fill="none" stroke={accent} strokeWidth="2.5" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - (live.progress ?? 0)} strokeLinecap="round" style={{ transition: "stroke-dashoffset .3s" }} />
              </svg>
            </span>
          ) : (
            <span className="font-mono text-[0.62rem] text-[#8A938D]">{held && current ? `${waiting + 1} waiting` : waiting > 0 ? `+${waiting}` : "quiet"}</span>
          )}
        </div>

        {/* the expanded card */}
        <div
          ref={body}
          aria-hidden={!showCard}
          className="absolute inset-x-0 top-0 flex items-start gap-3 p-4 transition-[opacity,transform] duration-300"
          style={{ opacity: showCard ? 1 : 0, transform: showCard ? "none" : "scale(.92)", transitionDelay: showCard ? `${morphMs * 0.35}ms` : "0ms" }}
        >
          {current && (
            <>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg" style={{ background: `${toneColor}22`, color: toneColor }}>
                {current.icon ?? "●"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{current.title}</p>
                {current.body && <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-[#8A938D]">{current.body}</p>}
                {current.action && (
                  <button
                    type="button"
                    tabIndex={showCard ? 0 : -1}
                    onClick={() => {
                      current.action!.onClick();
                      close(current.id);
                    }}
                    className="mt-2 rounded-full px-3 py-1 text-xs font-semibold text-black"
                    style={{ background: toneColor }}
                  >
                    {current.action.label}
                  </button>
                )}
              </div>
              {waiting > 0 && <span className="font-mono text-[0.6rem] text-[#8A938D]">+{waiting}</span>}
            </>
          )}
        </div>
      </div>
      <p id={`${id}-live`} role="status" aria-live="polite" className="sr-only">
        {current && !held ? `${current.title}. ${current.body ?? ""}` : ""}
      </p>
    </div>
  );
}
