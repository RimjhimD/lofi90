"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

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
  /** Keep this one open until it's dismissed (Esc, swipe or its action) instead of timing out. */
  persist?: boolean;
}

/** Every word the island says, so it can be translated. Counts come in as numbers. */
export interface IslandLabels {
  /** Accessible name of the island region. */
  region: string;
  /** Pill text when nothing is waiting. */
  quiet: string;
  /** Pill text while notifications are held because someone is typing. */
  waiting: (count: number) => string;
  /** Badge for notifications queued behind the one on show. */
  more: (count: number) => string;
  /** Icon used when an item has none. */
  icon: ReactNode;
  /** Announced to screen readers when a live activity finishes. */
  finished: (title: string) => string;
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
  /** Pill and status text; anything left out keeps its English default. */
  labels?: Partial<IslandLabels>;
  /** Colours per tone; info falls back to `accent` when not set. */
  tones?: Partial<Record<IslandTone, string>>;
  /** How long a typing pause must be before held notifications show, in ms. */
  typingPauseMs?: number;
  /** Widest the expanded card gets, in px. */
  maxWidth?: number;
  /** Freeze one look without timers, for docs and tests: the card open, or held while typing. */
  preview?: "open" | "held";
  className?: string;
}

const TONES: Record<IslandTone, string> = { info: "", success: "#C6FF3D", warning: "#FFB547", error: "#FF6B57" };
const IDLE = { w: 132, h: 36 };
const LIVE = { w: 230, h: 36 };
const LABELS: IslandLabels = {
  region: "Notifications",
  quiet: "quiet",
  waiting: (n) => `${n} waiting`,
  more: (n) => `+${n}`,
  icon: "●",
  finished: (title) => `Done: ${title}`,
};

const MOTION = "(prefers-reduced-motion: reduce)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(MOTION);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useReducedMotion = () => useSyncExternalStore(subscribe, () => window.matchMedia(MOTION).matches, () => false);

/** Dark or light text on a tone colour, whichever contrasts more. Non-hex colours get dark text. */
function textOn(hex: string): string {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  if (!/^#?[0-9a-f]{6}/i.test(hex) || Number.isNaN(n)) return "#0B0D0C";
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // luminance of #0B0D0C ≈ 0.004 and #F4F6F2 ≈ 0.91
  return (l + 0.05) / 0.054 >= 0.96 / (l + 0.05) ? "#0B0D0C" : "#F4F6F2";
}

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
  labels,
  tones,
  typingPauseMs = 1200,
  maxWidth = 380,
  preview,
  className = "",
}: IslandNotificationProps) {
  const id = useId();
  const t = { ...LABELS, ...labels };
  const reduced = useReducedMotion();
  const [typing, setTyping] = useState(false);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  // id of the item that had keyboard focus; a stale id (the item is gone) counts as not focused
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [height, setHeight] = useState(84);
  const [width, setWidth] = useState(360);
  const body = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; dy: number } | null>(null);
  const latest = useRef(onDismiss);
  const closing = useRef(0);
  useEffect(() => {
    latest.current = onDismiss;
  });
  useEffect(() => () => clearTimeout(closing.current), []);

  // Watch for typing anywhere on the page; a pause of typingPauseMs ends it.
  useEffect(() => {
    if (!holdWhileTyping) return;
    let pause = 0;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (!el.closest("input, textarea, [contenteditable='true']")) return;
      setTyping(true);
      clearTimeout(pause);
      pause = window.setTimeout(() => setTyping(false), typingPauseMs);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(pause);
    };
  }, [holdWhileTyping, typingPauseMs]);

  const held = preview === "held" || (!preview && holdWhileTyping && typing);
  // Live activities stay in the pill; regular notifications take turns in the card.
  const live = items.find((i) => i.progress !== undefined && i.progress < 1);
  const current = items.find((i) => i.progress === undefined || i.progress >= 1);
  const waiting = items.filter((i) => i !== current && i !== live).length;
  const showCard = !!current && !held && (preview === "open" || (!preview && open));
  const focused = !!current && focusedId === current.id;
  // A finished live activity that isn't on show yet (queued or held) still gets announced.
  const finished = items.filter((i) => i.progress !== undefined && i.progress >= 1 && (held || i !== current)).at(-1);

  // Open the card for the next notification (unless someone is typing).
  useEffect(() => {
    if (!current || held || preview) return;
    const t = window.setTimeout(() => setOpen(true), 60);
    return () => clearTimeout(t);
  }, [current, held, preview]);

  // Auto-close after `duration`, paused while hovered or focused; `persist` items wait to be dismissed.
  useEffect(() => {
    if (!showCard || hovered || focused || !current || current.persist || preview) return;
    const timer = window.setTimeout(() => close(current.id), duration);
    return () => clearTimeout(timer);
    // close is stable enough for this timer; we only restart it when the card, hover or focus changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCard, hovered, focused, current?.id, current?.persist, duration, preview]);

  // Size the card to its content so the morph lands exactly on it.
  useEffect(() => {
    const el = body.current;
    const sh = shell.current?.parentElement;
    if (!el || !sh) return;
    const ro = new ResizeObserver(() => {
      setHeight(el.scrollHeight);
      setWidth(Math.min(maxWidth, sh.clientWidth - 24));
    });
    ro.observe(el);
    ro.observe(sh);
    return () => ro.disconnect();
  }, [current?.id, maxWidth]);

  function close(itemId: string) {
    setOpen(false);
    clearTimeout(closing.current);
    closing.current = window.setTimeout(() => latest.current(itemId), reduced ? 0 : morphMs * 0.6);
  }

  const size = showCard ? { w: width, h: height } : live ? LIVE : IDLE;
  const tone = current?.tone ?? "info";
  const toneColor = { ...TONES, ...tones }[tone] || accent;
  const ease = "cubic-bezier(.32,1.45,.45,1)";

  return (
    <div className={`${position === "fixed" ? "fixed" : "absolute"} inset-x-0 top-3 z-50 flex justify-center ${className}`}>
      <div
        ref={shell}
        role="region"
        aria-label={t.region}
        aria-describedby={`${id}-live`}
        tabIndex={showCard ? 0 : -1}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocusedId(current?.id ?? null)}
        onBlur={(e) => {
          // only when focus leaves the island, not when it moves to the action button
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusedId(null);
        }}
        onKeyDown={(e) => {
          if (!current || !showCard) return;
          if (e.key === "Escape") close(current.id);
          // Enter on the action button is the button's own click; only handle Enter on the shell itself.
          if (e.key === "Enter" && current.action && e.target === e.currentTarget) {
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
        className="relative overflow-hidden bg-black text-[var(--k-text,#E9EDE8)] outline-none ring-1 ring-white/10 focus-visible:ring-2 focus-visible:ring-[#C6FF3D]"
        style={{
          // the island is always black hardware, so its text keeps the dark-stage colours on any page
          ["--k-text" as string]: "#E9EDE8",
          ["--k-mute" as string]: "#8A938D",
          ["--k-line" as string]: "#3A433F",
          ["--k-panel" as string]: "#121614",
          ["--k-panel-2" as string]: "#181D1B",
          ["--k-acc-text" as string]: "#C6FF3D",
          ["--k-err-text" as string]: "#FF8F7E",
          ["--k-warn-text" as string]: "#FFD08A",
          width: size.w,
          height: size.h,
          borderRadius: showCard ? 26 : 18,
          transition: reduced ? "none" : `width ${morphMs}ms ${ease}, height ${morphMs}ms ${ease}, border-radius ${morphMs}ms ${ease}`,
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
            <span className="font-mono text-[0.62rem] text-[var(--k-mute,#8A938D)]">{held && current ? t.waiting(waiting + 1) : waiting > 0 ? t.more(waiting) : t.quiet}</span>
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
                {current.icon ?? t.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{current.title}</p>
                {current.body && <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-[var(--k-mute,#8A938D)]">{current.body}</p>}
                {current.action && (
                  <button
                    type="button"
                    tabIndex={showCard ? 0 : -1}
                    onClick={() => {
                      current.action!.onClick();
                      close(current.id);
                    }}
                    className="mt-2 rounded-full px-3 py-1 text-xs font-semibold transition hover:brightness-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    style={{ background: toneColor, color: textOn(toneColor) }}
                  >
                    {current.action.label}
                  </button>
                )}
              </div>
              {waiting > 0 && <span className="font-mono text-[0.6rem] text-[var(--k-mute,#8A938D)]">{t.more(waiting)}</span>}
            </>
          )}
        </div>
      </div>
      <p id={`${id}-live`} role="status" aria-live="polite" className="sr-only">
        {[current && !held ? `${current.title}. ${current.body ?? ""}` : "", finished ? t.finished(finished.title) : ""].filter(Boolean).join(" ")}
      </p>
    </div>
  );
}
