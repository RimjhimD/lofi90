"use client";

import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { offlineQueue, useConnection, useOfflineQueue, type ConnectionStatus, type OfflineQueue, type Ping, type QueueItemStatus } from "./offline";

export { createOfflineQueue, offlineQueue, queueAction, useOfflineQueue, useConnection, OfflineQueue } from "./offline";
export type { ConnectionStatus, Ping, QueueItem, QueueItemStatus, QueueOptions, FlushResult } from "./offline";

export type NavbarPreviewState = "online" | "offline" | "offline-waiting" | "syncing" | "saved" | "failed" | "slow" | "menu-open";

export interface NavLink {
  label: string;
  href: string;
  active?: boolean;
  disabled?: boolean;
}

export interface NavbarLabels {
  offline: string;
  /** Hint while offline with nothing waiting. */
  offlineEmpty: string;
  waitingOne: string;
  /** {n} = number of changes. */
  waitingMany: string;
  syncingOne: string;
  syncingMany: string;
  saved: string;
  savedMark: string;
  /** Shown after reconnecting when nothing was waiting. */
  backOnline: string;
  failedOne: string;
  failedMany: string;
  retry: string;
  slow: string;
  statusOnline: string;
  statusOffline: string;
  statusSlow: string;
  /** {t} = "2 min ago". */
  lastSynced: string;
  justNow: string;
  minutesAgo: string;
  hoursAgo: string;
  /** Added to the status button's name: clicking it checks the connection now. */
  checkNow: string;
  menu: string;
  closeMenu: string;
  nav: string;
}

export interface OfflineAwareNavbarProps {
  brand: ReactNode;
  links?: NavLink[];
  /** Called on link click; call event.preventDefault() for client-side routing. */
  onNavigate?: (link: NavLink, event: MouseEvent<HTMLAnchorElement>) => void;
  /** Right-hand slot, e.g. an avatar or a button. */
  right?: ReactNode;
  /** Heartbeat that catches "connected but no internet": a URL (HEAD request, any answer counts) or a function returning false / throwing when unreachable. */
  ping?: Ping;
  /** Time between heartbeats while healthy. Failed checks back off from 2s up to this. */
  pingInterval?: number;
  /** The queue to watch and replay. Defaults to the shared one used by queueAction. */
  queue?: OfflineQueue;
  /** How long "All changes saved" stays before the strip slides away. */
  savedMs?: number;
  /** Override detection, e.g. for demos and tests. */
  forceStatus?: ConnectionStatus;
  stripPosition?: "below" | "top";
  /** Called when the connection status changes. */
  onStatusChange?: (status: ConnectionStatus) => void;
  labels?: Partial<NavbarLabels>;
  /** Active link, brand mark and "saved" colour. Hex colours get readable text automatically. */
  accent?: string;
  /** Offline and slow colour. */
  warnColor?: string;
  size?: "sm" | "md" | "lg";
  /** Draw one state still, with sample data. Nothing is listened to and nothing is focusable. */
  previewState?: NavbarPreviewState;
  className?: string;
}

const DEFAULT_LABELS: NavbarLabels = {
  offline: "You're offline",
  offlineEmpty: "Changes will save when you're back",
  waitingOne: "1 change waiting",
  waitingMany: "{n} changes waiting",
  syncingOne: "Back online · syncing 1 change…",
  syncingMany: "Back online · syncing {n} changes…",
  saved: "All changes saved",
  savedMark: "✓",
  backOnline: "Back online",
  failedOne: "1 change couldn't be saved",
  failedMany: "{n} changes couldn't be saved",
  retry: "Retry",
  slow: "Slow connection · saving may take longer",
  statusOnline: "Online",
  statusOffline: "Offline",
  statusSlow: "Slow connection",
  lastSynced: "last synced {t}",
  justNow: "just now",
  minutesAgo: "{n} min ago",
  hoursAgo: "{n} h ago",
  checkNow: "check now",
  menu: "Open menu",
  closeMenu: "Close menu",
  nav: "Main",
};

const SIZES = {
  sm: { bar: "gap-2 px-3 py-2 text-[13px]", link: "px-2 py-1", strip: "px-3 py-1.5 text-xs", icon: 16 },
  md: { bar: "gap-3 px-4 py-2.5 text-sm", link: "px-2.5 py-1.5", strip: "px-4 py-2 text-[13px]", icon: 18 },
  lg: { bar: "gap-4 px-5 py-3.5 text-base", link: "px-3 py-2", strip: "px-5 py-2.5 text-sm", icon: 20 },
};

const tint = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, var(--k-panel,#121614))`;

/** Dark text on light colours, white on dark ones. */
function textOn(hex: string): string {
  let h = hex.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3,4}$/i.test(h)) h = [...h.slice(0, 3)].map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(h)) return "#0B0D0C";
  const n = parseInt(h.slice(0, 6), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.25 ? "#0B0D0C" : "#FFFFFF";
}

const fill = (s: string, n: number) => s.replace("{n}", String(n));
function WifiIcon({ status, size }: { status: ConnectionStatus | "syncing"; size: number }) {
  const dim = status === "offline" ? 0.35 : 1;
  const top = status === "slow" ? 0.3 : dim;
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M2 8.8a15 15 0 0 1 20 0" opacity={top} />
      <path d="M5.2 12.4a10 10 0 0 1 13.6 0" opacity={top} />
      <path d="M8.6 15.9a5 5 0 0 1 6.8 0" opacity={dim} />
      <circle cx="12" cy="19.4" r="1.2" fill="currentColor" stroke="none" opacity={dim} />
      {status === "offline" && <path d="M3 3l18 18" />}
    </svg>
  );
}

/** Small per-item pill for lists: waiting / syncing / failed (with Retry) / saved. */
export function QueueStatusBadge({
  status,
  onRetry,
  labels,
  className = "",
}: {
  status: QueueItemStatus | "saved";
  onRetry?: () => void;
  labels?: Partial<Record<QueueItemStatus | "saved" | "retry", string>>;
  className?: string;
}) {
  const t = { waiting: "Waiting", syncing: "Syncing…", failed: "Not saved", saved: "Saved", retry: "Retry", ...labels };
  const tone = {
    waiting: "bg-[color-mix(in_srgb,#FFB547_18%,transparent)] text-[var(--k-warn-text,#FFB547)]",
    syncing: "bg-[var(--k-panel-2,#181D1B)] text-[var(--k-text,#E9EDE8)]",
    failed: "bg-[color-mix(in_srgb,#FF6B57_16%,transparent)] text-[var(--k-err-text,#FF8A7A)]",
    saved: "text-[var(--k-mute,#8A938D)]",
  }[status];
  return (
    <span className={`inline-flex items-center gap-2 whitespace-nowrap text-xs font-semibold ${className}`}>
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${tone}`}>
        {status === "syncing" && <span aria-hidden="true" className="size-2.5 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin" />}
        {status === "waiting" && <span aria-hidden="true">⏳</span>}
        {t[status]}
      </span>
      {status === "failed" && onRetry && (
        <button type="button" onClick={onRetry} className="rounded-md border border-[var(--k-line,#3A433F)] px-2 py-0.5 font-bold text-[var(--k-text,#E9EDE8)] hover:border-[var(--k-acc-text,#C6FF3D)] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)]">
          {t.retry}
        </button>
      )}
    </span>
  );
}

type Phase = "hidden" | "offline" | "syncing" | "saved" | "failed" | "slow";

/**
 * An app navbar that knows about the connection. When the internet drops, a calm strip slides down saying so and
 * counting the changes that are waiting; on reconnect it replays them in order and says when everything is saved.
 */
export function OfflineAwareNavbar({
  brand,
  links = [],
  onNavigate,
  right,
  ping,
  pingInterval = 30000,
  queue = offlineQueue,
  savedMs = 2500,
  forceStatus,
  stripPosition = "below",
  onStatusChange,
  labels,
  accent = "#C6FF3D",
  warnColor = "#FFB547",
  size = "md",
  previewState,
  className = "",
}: OfflineAwareNavbarProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const s = SIZES[size];
  const preview = !!previewState;
  const ids = useId();
  const [nudge, setNudge] = useState(0);
  const detected = useConnection(!preview && !forceStatus, ping, pingInterval, nudge);
  const live = useOfflineQueue(queue);
  const [recon, setRecon] = useState(false);
  const [flash, setFlash] = useState<{ n: number } | null>(null);
  const [menu, setMenu] = useState(false);
  const [now, setNow] = useState(0);
  const flashTimer = useRef(0);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const menuPanel = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLElement>(null);
  const onChange = useRef(onStatusChange);
  useEffect(() => {
    onChange.current = onStatusChange;
  });

  const net: ConnectionStatus = forceStatus ?? detected;

  const showSaved = (n: number) => {
    clearTimeout(flashTimer.current);
    setFlash({ n });
    flashTimer.current = window.setTimeout(() => setFlash(null), savedMs);
  };
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(flashTimer.current);
    };
  }, []);

  // Tell the queue; going from offline to online replays everything in order.
  useEffect(() => {
    if (preview) return;
    onChange.current?.(net);
    const replay = queue.setOnline(net !== "offline");
    if (!replay) return;
    const t = window.setTimeout(() => setRecon(true), 0);
    // Settle even if the status changes again meanwhile, so "syncing" can never get stuck.
    replay.then((r) => {
      clearTimeout(t);
      if (!mounted.current) return;
      setRecon(false);
      if (r.failed === 0 && queue.isOnline()) showSaved(r.saved);
    });
    // showSaved only reads savedMs and refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [net, queue, preview]);

  // Mobile menu: Esc and clicks outside close it.
  useEffect(() => {
    if (!menu || preview) return;
    menuPanel.current?.querySelector<HTMLElement>("a,[tabindex]")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenu(false);
      menuBtn.current?.focus();
    };
    const down = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setMenu(false);
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", down);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", down);
    };
  }, [menu, preview]);

  function retryAll() {
    setRecon(true);
    queue.retry().then((r) => {
      if (!mounted.current) return;
      setRecon(false);
      if (r.failed === 0 && queue.count === 0) showSaved(r.saved);
    });
  }

  // What the strip says, from the live state or the preview.
  const sample = { offline: [0, 0], "offline-waiting": [2, 0], syncing: [2, 0], failed: [0, 1] } as Record<string, [number, number]>;
  const [pWaiting, pFailed] = sample[previewState ?? ""] ?? [0, 0];
  const waiting = preview ? pWaiting : live.items.filter((i) => i.status !== "failed").length;
  const failed = preview ? pFailed : live.items.filter((i) => i.status === "failed").length;
  const status: ConnectionStatus = preview ? (previewState === "offline" || previewState === "offline-waiting" ? "offline" : previewState === "slow" ? "slow" : "online") : net;

  const phase: Phase = preview
    ? previewState === "offline-waiting"
      ? "offline"
      : previewState === "online" || previewState === "menu-open"
        ? "hidden"
        : (previewState as Phase)
    : net === "offline"
      ? "offline"
      : recon
        ? "syncing"
        : failed > 0
          ? "failed"
          : flash
            ? "saved"
            : net === "slow"
              ? "slow"
              : "hidden";
  const savedCount = preview ? 2 : (flash?.n ?? 0);

  // Keep the last message while the strip slides away.
  const [shown, setShown] = useState<{ phase: Phase; waiting: number; failed: number; saved: number }>({ phase: "offline", waiting: 0, failed: 0, saved: 0 });
  if (phase !== "hidden" && (shown.phase !== phase || shown.waiting !== waiting || shown.failed !== failed || shown.saved !== savedCount)) {
    setShown({ phase, waiting, failed, saved: savedCount });
  }
  const v = phase === "hidden" ? shown : { phase, waiting, failed, saved: savedCount };

  const message = (p: typeof v): [string, string] => {
    switch (p.phase) {
      case "offline":
        return [text.offline, p.waiting ? fill(p.waiting === 1 ? text.waitingOne : text.waitingMany, p.waiting) : text.offlineEmpty];
      case "syncing":
        return [p.waiting ? fill(p.waiting === 1 ? text.syncingOne : text.syncingMany, p.waiting) : text.backOnline, ""];
      case "saved":
        return [p.saved ? `${text.saved} ${text.savedMark}`.trim() : text.backOnline, ""];
      case "failed":
        return [fill(p.failed === 1 ? text.failedOne : text.failedMany, p.failed), ""];
      case "slow":
        return [text.slow, ""];
      default:
        return ["", ""];
    }
  };
  const [msg, sub] = message(v);
  const announce = phase === "hidden" ? "" : [msg, sub].filter(Boolean).join(" · ");

  const stripTone: Record<Phase, string> = {
    offline: tint(warnColor, 16),
    syncing: tint(accent, 10),
    saved: tint(accent, 16),
    failed: tint("#FF6B57", 16),
    slow: tint(warnColor, 9),
    hidden: "transparent",
  };
  const iconColor: Record<Phase, string> = {
    offline: "text-[var(--k-warn-text,#FFB547)]",
    syncing: "text-[var(--k-acc-text,#C6FF3D)]",
    saved: "text-[var(--k-acc-text,#C6FF3D)]",
    failed: "text-[var(--k-err-text,#FF8A7A)]",
    slow: "text-[var(--k-warn-text,#FFB547)]",
    hidden: "",
  };

  // Status dot + tooltip.
  const ago = (() => {
    if (preview) return fill(text.minutesAgo, 2);
    if (!live.lastSyncedAt || !now) return "";
    const m = Math.floor((now - live.lastSyncedAt) / 60000);
    return m < 1 ? text.justNow : m < 60 ? fill(text.minutesAgo, m) : fill(text.hoursAgo, Math.floor(m / 60));
  })();
  const statusName = status === "offline" ? text.statusOffline : status === "slow" ? text.statusSlow : text.statusOnline;
  const tip = ago ? `${statusName} · ${text.lastSynced.replace("{t}", ago)}` : statusName;
  const dot = status === "offline" ? warnColor : status === "slow" ? warnColor : accent;
  const syncingNow = phase === "syncing";

  const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)]";
  const linkCls = (l: NavLink) =>
    `relative rounded-md ${s.link} font-semibold transition-colors ${l.disabled ? "cursor-not-allowed opacity-50" : "hover:bg-[var(--k-panel-2,#181D1B)] hover:text-[var(--k-text,#E9EDE8)] active:translate-y-px"} ${l.active ? "text-[var(--k-text,#E9EDE8)]" : "text-[var(--k-mute,#8A938D)]"} ${focus}`;
  const linkEl = (l: NavLink, i: number, vertical = false) => {
    const bar = l.active && <span aria-hidden="true" className={vertical ? "absolute inset-y-1.5 left-0 w-0.5 rounded-full" : "absolute inset-x-2 -bottom-[3px] h-0.5 rounded-full"} style={{ background: accent }} />;
    const cls = `${linkCls(l)} ${vertical ? "block w-full" : ""}`;
    if (preview || l.disabled)
      return (
        <span key={i} className={cls} aria-disabled={l.disabled || undefined}>
          {l.label}
          {bar}
        </span>
      );
    return (
      <a
        key={i}
        href={l.href}
        aria-current={l.active ? "page" : undefined}
        className={cls}
        onClick={(e) => {
          onNavigate?.(l, e);
          setMenu(false);
        }}
      >
        {l.label}
        {bar}
      </a>
    );
  };

  const menuOpen = preview ? previewState === "menu-open" : menu;
  const open = phase !== "hidden";

  const strip = (
    <div
      className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
      style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      inert={!open}
    >
      <div className="min-h-0 overflow-hidden">
        <div className={`flex items-center gap-2 ${s.strip} border-b border-[var(--k-line,#3A433F)] text-[var(--k-text,#E9EDE8)]`} style={{ background: stripTone[v.phase] }}>
          <span aria-hidden="true" className={`flex shrink-0 ${iconColor[v.phase]}`}>
            {v.phase === "syncing" ? (
              <span className="size-3.5 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin" />
            ) : v.phase === "saved" ? (
              "✓"
            ) : v.phase === "failed" ? (
              "!"
            ) : (
              <WifiIcon status={v.phase === "slow" ? "slow" : "offline"} size={s.icon - 2} />
            )}
          </span>
          <span aria-hidden="true" className="min-w-0 flex-1 truncate font-semibold">
            {msg}
            {sub && v.phase === "offline" && !v.waiting && <span className="ml-2 font-normal text-[var(--k-mute,#8A938D)]">{sub}</span>}
          </span>
          {v.phase === "offline" && v.waiting > 0 && (
            <span aria-hidden="true" className="shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: `color-mix(in srgb, ${warnColor} 22%, transparent)` }}>
              {sub}
            </span>
          )}
          {v.phase === "failed" &&
            (preview ? (
              <span className="shrink-0 rounded-md border border-[var(--k-line,#3A433F)] px-2 py-0.5 text-xs font-bold">{text.retry}</span>
            ) : (
              <button type="button" onClick={retryAll} className={`shrink-0 rounded-md border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] px-2 py-0.5 text-xs font-bold hover:border-[var(--k-acc-text,#C6FF3D)] active:translate-y-px ${focus}`}>
                {text.retry}
              </button>
            ))}
        </div>
      </div>
    </div>
  );

  const statusInner = (
    <>
      <span className="relative flex">
        <WifiIcon status={syncingNow ? "syncing" : status} size={s.icon} />
        <span aria-hidden="true" className={`absolute -right-0.5 -top-0.5 size-2 rounded-full ring-2 ring-[var(--k-panel,#121614)] ${syncingNow ? "motion-safe:animate-pulse" : ""}`} style={{ background: dot }} />
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-full z-20 mt-2 hidden whitespace-nowrap rounded-md border border-[var(--k-line,#3A433F)] bg-[var(--k-panel-2,#181D1B)] px-2 py-1 text-xs font-semibold text-[var(--k-text,#E9EDE8)] shadow-[0_10px_30px_-14px_var(--k-shadow,rgba(0,0,0,.9))] group-hover:block group-focus-visible:block"
      >
        {tip}
      </span>
    </>
  );

  return (
    <header ref={root} className={`@container relative w-full bg-[var(--k-panel,#121614)] text-[var(--k-text,#E9EDE8)] ${className}`}>
      {stripPosition === "top" && strip}
      <div className={`flex items-center border-b border-[var(--k-line,#3A433F)] ${s.bar}`}>
        <div className="mr-auto flex min-w-0 items-center gap-2 font-bold">
          <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-md text-xs" style={{ background: accent, color: textOn(accent) }}>
            {typeof brand === "string" ? brand.slice(0, 1) : "•"}
          </span>
          <span className="truncate">{brand}</span>
        </div>
        <nav aria-label={text.nav} className="hidden items-center gap-1 @lg:flex">
          {links.map((l, i) => linkEl(l, i))}
        </nav>
        {right && <div className="hidden items-center @sm:flex">{right}</div>}
        {preview ? (
          <span className="group relative flex rounded-md p-1.5 text-[var(--k-mute,#8A938D)]" aria-hidden="true">
            {statusInner}
          </span>
        ) : (
          <button
            type="button"
            aria-label={`${tip} · ${text.checkNow}`}
            onPointerEnter={() => setNow(Date.now())}
            onFocus={() => setNow(Date.now())}
            onClick={() => {
              setNow(Date.now());
              setNudge((n) => n + 1);
            }}
            className={`group relative flex rounded-md p-1.5 text-[var(--k-mute,#8A938D)] hover:bg-[var(--k-panel-2,#181D1B)] hover:text-[var(--k-text,#E9EDE8)] active:translate-y-px ${focus}`}
          >
            {statusInner}
          </button>
        )}
        {preview ? (
          <span aria-hidden="true" className="flex rounded-md p-1.5 @lg:hidden">
            <Burger open={menuOpen} />
          </span>
        ) : (
          <button
            ref={menuBtn}
            type="button"
            aria-expanded={menu}
            aria-controls={`${ids}-menu`}
            aria-label={menu ? text.closeMenu : text.menu}
            onClick={() => setMenu((m) => !m)}
            className={`flex rounded-md p-1.5 hover:bg-[var(--k-panel-2,#181D1B)] active:translate-y-px @lg:hidden ${focus}`}
          >
            <Burger open={menu} />
          </button>
        )}
      </div>
      {stripPosition === "below" && strip}
      {menuOpen && (
        <div ref={menuPanel} id={`${ids}-menu`} className="border-b border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] p-2 @lg:hidden">
          <nav aria-label={text.nav} className="flex flex-col gap-0.5">
            {links.map((l, i) => linkEl(l, i, true))}
          </nav>
          {right && <div className="mt-2 border-t border-[var(--k-line,#3A433F)] px-2 pt-2 @sm:hidden">{right}</div>}
        </div>
      )}
      <span role="status" aria-live="polite" className="sr-only">
        {preview ? "" : announce}
      </span>
    </header>
  );
}

function Burger({ open }: { open: boolean }) {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
    </svg>
  );
}
