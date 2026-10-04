"use client";

import { useEffect, useId, useRef, useState } from "react";

export type RunStatus = "idle" | "running" | "done" | "blocked" | "error";
export type RunStorage = "memory" | "session";

export interface RunLabels {
  run: string;
  running: string;
  done: string;
  blocked: string;
  retry: string;
}

export interface IdempotentRunButtonProps {
  /** One key per real-world action, e.g. "promo-oct-04". The same key only runs once inside the window. */
  runKey: string;
  /** Does the work. Return a short result ("Sent to 400 contacts") or throw to show the error state. */
  onRun: (runKey: string) => Promise<string | void>;
  /** How long a finished key stays locked, in milliseconds. */
  windowMs?: number;
  /** "memory" forgets on reload; "session" also blocks repeats after a refresh in the same tab. */
  storage?: RunStorage;
  /** Override any piece of text. */
  labels?: Partial<RunLabels>;
  /** Fires every time a repeat is stopped, with when the key first ran. */
  onBlocked?: (info: { runKey: string; ranAt: number }) => void;
  disabled?: boolean;
  /** Show one state without running anything. For docs, tests and design reviews. */
  previewState?: RunStatus;
  className?: string;
}

const DEFAULT_LABELS: RunLabels = {
  run: "Run",
  running: "Running…",
  done: "Done",
  blocked: "Already done",
  retry: "Try again",
};

const PREFIX = "idempotent-run:";
// Shared by every button on the page, so two buttons with the same key still run once.
const memory = new Map<string, number>();
const inFlight = new Set<string>();

function readRun(key: string, storage: RunStorage): number | null {
  if (storage === "session") {
    try {
      const value = window.sessionStorage.getItem(PREFIX + key);
      return value ? Number(value) : null;
    } catch {
      return memory.get(key) ?? null;
    }
  }
  return memory.get(key) ?? null;
}

function writeRun(key: string, storage: RunStorage, at: number) {
  memory.set(key, at);
  if (storage === "session") {
    try {
      window.sessionStorage.setItem(PREFIX + key, String(at));
    } catch {
      // Private mode or full storage: memory still blocks repeats on this page.
    }
  }
}

/** 12 → "12s", 150 → "2m", 7200 → "2h". */
function short(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  return `${Math.round(s / 3600)}h`;
}

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface RunState {
  key: string;
  status: RunStatus;
  ranAt: number;
  message: string;
}

const PREVIEW_AGO = 12_000;

export function IdempotentRunButton({
  runKey,
  onRun,
  windowMs = 60_000,
  storage = "memory",
  labels,
  onBlocked,
  disabled = false,
  previewState,
  className = "",
}: IdempotentRunButtonProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const [run, setRun] = useState<RunState>({ key: runKey, status: "idle", ranAt: 0, message: "" });
  const [now, setNow] = useState(0);
  const [bumps, setBumps] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const shieldRef = useRef<HTMLSpanElement>(null);
  const sweepRef = useRef<HTMLSpanElement>(null);
  const statusId = useId();

  // A new key always starts fresh; the old key's state stays behind.
  const live: RunState = run.key === runKey ? run : { key: runKey, status: "idle", ranAt: 0, message: "" };
  const status = previewState ?? live.status;
  const ago = previewState ? PREVIEW_AGO : now - live.ranAt;
  const left = previewState ? windowMs - PREVIEW_AGO : windowMs - ago;
  const busy = status === "running";

  async function press() {
    if (disabled || previewState || busy) return;
    const key = runKey;
    const pressedAt = Date.now();
    const ranAt = inFlight.has(key) ? pressedAt : readRun(key, storage);

    if (ranAt !== null && pressedAt - ranAt < windowMs) {
      setNow(pressedAt);
      setRun({ key, status: "blocked", ranAt, message: inFlight.has(key) ? "Already running somewhere else on this page." : "" });
      setBumps((n) => n + 1);
      onBlocked?.({ runKey: key, ranAt });
      return;
    }

    inFlight.add(key);
    setRun({ key, status: "running", ranAt: 0, message: "" });
    try {
      const result = await onRun(key);
      const at = Date.now();
      writeRun(key, storage, at);
      setNow(at);
      setRun({ key, status: "done", ranAt: at, message: result || "" });
      if (!reducedMotion()) {
        buttonRef.current?.animate([{ transform: "scale(1)" }, { transform: "scale(1.05)" }, { transform: "scale(1)" }], {
          duration: 380,
          easing: "cubic-bezier(.3,1.8,.5,1)",
        });
      }
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Something went wrong.";
      setRun({ key, status: "error", ranAt: 0, message });
      if (!reducedMotion()) {
        buttonRef.current?.animate(
          [{ transform: "translateX(0)" }, { transform: "translateX(-7px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }],
          { duration: 340 },
        );
      }
    } finally {
      inFlight.delete(key);
    }
  }

  // Every blocked press: the button jumps and bounces off the shield as it slams down.
  useEffect(() => {
    if (bumps === 0 || reducedMotion()) return;
    const shield = shieldRef.current?.animate(
      [
        { transform: "translateY(-46px) rotate(-18deg) scale(1.3)", opacity: 0 },
        { transform: "translateY(4px) rotate(6deg) scale(0.95)", opacity: 1, offset: 0.55 },
        { transform: "translateY(-2px) rotate(-3deg) scale(1.02)", offset: 0.8 },
        { transform: "none", opacity: 1 },
      ],
      { duration: 520, easing: "cubic-bezier(.2,.9,.3,1)" },
    );
    const button = buttonRef.current?.animate(
      [
        { transform: "none" },
        { transform: "translate(6px, -7px) rotate(1.5deg)", offset: 0.35 },
        { transform: "translate(-4px, 2px) rotate(-1deg)", offset: 0.65 },
        { transform: "none" },
      ],
      { duration: 460, easing: "ease-out" },
    );
    return () => {
      shield?.cancel();
      button?.cancel();
    };
  }, [bumps]);

  // While running, a light stripe sweeps across the button.
  useEffect(() => {
    if (!busy || reducedMotion()) return;
    const sweep = sweepRef.current?.animate([{ transform: "translateX(-120%)" }, { transform: "translateX(320%)" }], {
      duration: 1100,
      iterations: Infinity,
      easing: "ease-in-out",
    });
    return () => sweep?.cancel();
  }, [busy]);

  // Count the lock down each second. When it runs out the shield cracks and Run is ready again.
  const ticking = !previewState && (live.status === "blocked" || live.status === "done");
  const { ranAt, key: liveKey } = live;
  useEffect(() => {
    if (!ticking) return;
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t - ranAt < windowMs) return;
      window.clearInterval(id);
      const reset = () => setRun({ key: liveKey, status: "idle", ranAt: 0, message: "" });
      const crack = reducedMotion()
        ? undefined
        : shieldRef.current?.animate(
            [{ transform: "none", opacity: 1 }, { transform: "translateY(26px) rotate(24deg) scale(0.6)", opacity: 0 }],
            { duration: 420, easing: "ease-in", fill: "forwards" },
          );
      if (crack) crack.onfinish = reset;
      else reset();
    }, 1000);
    return () => window.clearInterval(id);
  }, [ticking, ranAt, liveKey, windowMs]);

  const label =
    status === "running"
      ? text.running
      : status === "done"
        ? live.message || (previewState ? "Sent to 400 contacts" : text.done)
        : status === "blocked"
          ? `${text.blocked} · ${short(ago)} ago`
          : status === "error"
            ? text.retry
            : text.run;

  const note =
    status === "running"
      ? "Working. Pressing again won't start a second run."
      : status === "done"
        ? `Finished. This key is locked for ${short(left)} so it can't run twice.`
        : status === "blocked"
          ? live.message || `Stopped a repeat: "${runKey}" already ran ${short(ago)} ago. Nothing ran twice. Free again in ${short(left)}.`
          : status === "error"
            ? `${previewState ? "Carrier timed out." : live.message} Nothing was saved, so retrying is safe.`
            : disabled
              ? "Not available right now."
              : `Same key within ${short(windowMs)} runs only once.`;

  const tone = disabled
    ? "bg-[#E7E1D2] text-[#6B665A]"
    : status === "running"
      ? "bg-[#FFB800] text-[#20201C]"
      : status === "done"
        ? "bg-[#00C49A] text-[#20201C]"
        : status === "blocked"
          ? "bg-[#CDEBFF] text-[#20201C]"
          : status === "error"
            ? "bg-[#FFE3E3] text-[#20201C]"
            : "bg-[#FF5D5D] text-[#20201C]";

  return (
    <div className={`flex w-full max-w-sm flex-col items-stretch gap-2 ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={press}
        disabled={disabled}
        aria-busy={busy}
        aria-describedby={statusId}
        className={`group relative flex h-16 items-center gap-3 rounded-[20px] border-4 border-[#20201C] px-3 pr-4 text-left font-extrabold shadow-[0_5px_0_#20201C] transition-[transform,box-shadow,background-color] duration-150 hover:-translate-y-0.5 hover:shadow-[0_7px_0_#20201C] active:translate-y-1 active:shadow-[0_1px_0_#20201C] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#3BB2F6] disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_5px_0_#20201C] ${tone}`}
      >
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[16px]">
          {busy && <span ref={sweepRef} className="absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-white/45" />}
        </span>

        <span aria-hidden="true" className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full border-[3px] border-[#20201C] bg-[#FFFDF6]">
          {status === "blocked" ? (
            <span ref={shieldRef} className="absolute -inset-2 grid place-items-center">
              <svg viewBox="0 0 48 52" className="h-14 w-14 drop-shadow-[2px_2px_0_#20201C]">
                <path d="M24 3 6 10v14c0 12 7.6 20.4 18 25 10.4-4.6 18-13 18-25V10L24 3Z" fill="#3BB2F6" stroke="#20201C" strokeWidth="4" strokeLinejoin="round" />
                <path d="M16 26.5 22 32l11-12" fill="none" stroke="#FFFDF6" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          ) : status === "done" ? (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#20201C" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          ) : status === "error" ? (
            <span className="text-xl font-black leading-none text-[#B42318]">!</span>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5 translate-x-px transition-transform duration-200 group-hover:scale-125" fill="#20201C">
              <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.4-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" />
            </svg>
          )}
        </span>

        <span className="relative min-w-0 flex-1 leading-tight">
          <span className="block truncate text-base">{label}</span>
          <span className="mt-0.5 inline-block max-w-full truncate rounded-md border-2 border-[#20201C] bg-[#FFFDF6] px-1.5 font-mono text-[11px] font-bold leading-4 text-[#20201C]">
            key: {runKey}
          </span>
        </span>

        {busy && <span aria-hidden="true" className="relative h-5 w-5 shrink-0 animate-spin rounded-full border-[3px] border-[#20201C] border-t-transparent" />}
      </button>

      <p
        id={statusId}
        role="status"
        aria-live="polite"
        className={`min-h-10 px-1 text-sm font-semibold ${status === "error" ? "text-[#B42318]" : "text-[#4A4639]"}`}
      >
        {note}
      </p>
    </div>
  );
}
