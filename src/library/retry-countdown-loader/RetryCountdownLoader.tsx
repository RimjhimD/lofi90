"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

export type RetryPhase = "running" | "waiting" | "success" | "failed" | "cancelled";

export interface RetryCountdownLoaderProps {
  /** The work to try. Gets the attempt number (1-based). Throw to fail this try. */
  task: (attempt: number) => Promise<unknown>;
  /** What is being done, e.g. "Sending the reminder text". */
  label: string;
  maxAttempts?: number;
  /** Wait before the 2nd try; it doubles after each failure. */
  baseDelayMs?: number;
  /** The longest it will ever wait between tries. */
  maxDelayMs?: number;
  onSuccess?: (result: unknown) => void;
  onGiveUp?: (error: unknown) => void;
  /** Show one state without running anything. For docs and tests. */
  previewState?: RetryPhase | "server-wait" | "offline";
  className?: string;
}

/** Throw this (or any error with retryAfterMs) when the server says how long to wait, e.g. a 429 with Retry-After. */
export class RetryAfterError extends Error {
  constructor(message: string, public retryAfterMs: number) {
    super(message);
  }
}

interface Attempt {
  ok: boolean;
  wait: number;
  serverAsked: boolean;
  error?: string;
}

const subscribe = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

const secs = (ms: number) => (ms >= 10_000 ? `${Math.round(ms / 1000)}s` : `${(Math.max(0, ms) / 1000).toFixed(1)}s`);

const PREVIEW: Record<NonNullable<RetryCountdownLoaderProps["previewState"]>, { phase: RetryPhase; attempts: Attempt[]; left: number; online: boolean }> = {
  running: { phase: "running", attempts: [], left: 0, online: true },
  waiting: { phase: "waiting", attempts: [{ ok: false, wait: 1000, serverAsked: false }, { ok: false, wait: 2000, serverAsked: false }], left: 1400, online: true },
  "server-wait": { phase: "waiting", attempts: [{ ok: false, wait: 6000, serverAsked: true, error: "429 Too many requests" }], left: 4200, online: true },
  offline: { phase: "waiting", attempts: [{ ok: false, wait: 2000, serverAsked: false }], left: 1300, online: false },
  success: { phase: "success", attempts: [{ ok: false, wait: 1000, serverAsked: false }, { ok: false, wait: 2000, serverAsked: false }, { ok: true, wait: 0, serverAsked: false }], left: 0, online: true },
  failed: { phase: "failed", attempts: [1000, 2000, 4000, 8000, 0].map((w) => ({ ok: false, wait: w, serverAsked: false, error: "503 Service unavailable" })), left: 0, online: true },
  cancelled: { phase: "cancelled", attempts: [{ ok: false, wait: 1000, serverAsked: false }], left: 0, online: true },
};

export function RetryCountdownLoader({
  task,
  label,
  maxAttempts = 5,
  baseDelayMs = 1000,
  maxDelayMs = 30_000,
  onSuccess,
  onGiveUp,
  previewState,
  className = "",
}: RetryCountdownLoaderProps) {
  const statusId = useId();
  const [phase, setPhase] = useState<RetryPhase>("running");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [left, setLeft] = useState(0);
  const run = useRef(0);
  // Latest callbacks, so a parent re-render (new function identities) never restarts the run.
  const latest = useRef({ task, onSuccess, onGiveUp });
  useEffect(() => {
    latest.current = { task, onSuccess, onGiveUp };
  });
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);

  const plan = (i: number) => Math.min(maxDelayMs, baseDelayMs * 2 ** i);

  const attempt = useCallback(
    async (n: number, runId: number) => {
      setPhase("running");
      try {
        const result = await latest.current.task(n);
        if (run.current !== runId) return;
        setAttempts((a) => [...a, { ok: true, wait: 0, serverAsked: false }]);
        setPhase("success");
        latest.current.onSuccess?.(result);
      } catch (err) {
        if (run.current !== runId) return;
        const asked = typeof (err as { retryAfterMs?: unknown })?.retryAfterMs === "number" ? (err as { retryAfterMs: number }).retryAfterMs : null;
        const wait = n >= maxAttempts ? 0 : (asked ?? Math.min(maxDelayMs, baseDelayMs * 2 ** (n - 1)));
        setAttempts((a) => [...a, { ok: false, wait, serverAsked: asked !== null, error: err instanceof Error ? err.message : String(err) }]);
        if (n >= maxAttempts) {
          setPhase("failed");
          latest.current.onGiveUp?.(err);
        } else {
          setLeft(wait);
          setPhase("waiting");
        }
      }
    },
    [maxAttempts, baseDelayMs, maxDelayMs],
  );

  const start = useCallback(() => {
    const id = ++run.current;
    setAttempts([]);
    setLeft(0);
    void attempt(1, id);
  }, [attempt]);

  // Start once on mount (and never in preview mode).
  useEffect(() => {
    if (previewState) return;
    const t = window.setTimeout(start, 0);
    return () => {
      clearTimeout(t);
      // Invalidate the run on unmount so a late result is ignored; this ref is a counter, not a DOM node.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      run.current++;
    };
  }, [previewState, start]);

  // Count down; the clock stops while the device is offline and resumes when it is back.
  useEffect(() => {
    if (previewState || phase !== "waiting" || !online) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      setLeft((l) => l - (now - last));
      last = now;
    }, 100);
    return () => clearInterval(id);
  }, [phase, online, previewState]);

  const tries = attempts.length;
  useEffect(() => {
    if (previewState || phase !== "waiting" || left > 0) return;
    const id = run.current;
    const t = window.setTimeout(() => void attempt(tries + 1, id), 0);
    return () => clearTimeout(t);
  }, [left, phase, tries, attempt, previewState]);

  const view = previewState ? PREVIEW[previewState] : { phase, attempts, left, online };
  const last = view.attempts[view.attempts.length - 1];
  const current = view.attempts.length + (view.phase === "waiting" || view.phase === "running" ? 1 : 0);
  const waitTotal = last?.wait ?? 0;

  const status =
    view.phase === "running"
      ? `Try ${current} of ${maxAttempts}…`
      : view.phase === "waiting"
        ? !view.online
          ? "You're offline. Paused until the connection is back."
          : last?.serverAsked
            ? `The server asked us to wait. Next try in ${secs(view.left)}.`
            : `Didn't work. Next try in ${secs(view.left)}.`
        : view.phase === "success"
          ? `Done on try ${view.attempts.length}.`
          : view.phase === "failed"
            ? `Gave up after ${view.attempts.length} tries.`
            : "Stopped. Nothing more will be tried.";

  const pill = (bg: string) => `border-2 border-[#1A1A17] px-2.5 py-1 text-xs font-bold ${bg} focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#D7263D]`;

  return (
    <div className={`w-full max-w-md border-2 border-[#1A1A17] bg-white p-4 text-[#1A1A17] shadow-[4px_4px_0_#1A1A17] ${className}`} aria-busy={view.phase === "running"}>
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className={`h-3 w-3 shrink-0 rounded-full ${
            view.phase === "success" ? "bg-[#0E3B2E]" : view.phase === "failed" ? "bg-[#B42318]" : !view.online ? "bg-[#9A9486]" : "bg-[#D7263D] motion-safe:animate-pulse"
          }`}
        />
        <b className="text-sm">{label}</b>
        <span className="ml-auto font-mono text-xs text-[#5E5A50]">
          {Math.min(current || 1, maxAttempts)}/{maxAttempts}
        </span>
      </div>

      {/* The backoff, drawn to scale: each gap is as wide as the wait it stands for. */}
      <div aria-hidden="true" className="mt-4 flex items-center">
        {Array.from({ length: maxAttempts }, (_, i) => {
          const a = view.attempts[i];
          const isNow = i === view.attempts.length && (view.phase === "running" || view.phase === "waiting");
          const gap = a ? a.wait : plan(i);
          const filling = i === view.attempts.length - 1 && view.phase === "waiting";
          const fill = a && i < view.attempts.length - 1 ? 1 : filling && waitTotal ? 1 - view.left / waitTotal : 0;
          return (
            <div key={i} className="contents">
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-[#1A1A17] text-[0.65rem] font-bold ${
                  a?.ok ? "bg-[#0E3B2E] text-white" : a ? "bg-[#1A1A17] text-white" : isNow ? "bg-[#D7263D] text-white motion-safe:animate-pulse" : "bg-white text-[#9A9486]"
                }`}
              >
                {a?.ok ? "✓" : a ? "✕" : i + 1}
              </span>
              {i < maxAttempts - 1 && (
                <span className="relative mx-0.5 h-1.5 min-w-2 bg-[#E8E2D2]" style={{ flexGrow: Math.max(1, gap / 1000) }}>
                  <span className={`absolute inset-y-0 left-0 ${a?.serverAsked ? "bg-[#A86A00]" : "bg-[#D7263D]"}`} style={{ width: `${Math.min(1, fill) * 100}%` }} />
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div aria-hidden="true" className="mt-1 flex justify-between font-mono text-[0.62rem] text-[#5E5A50]">
        {Array.from({ length: maxAttempts - 1 }, (_, i) => (
          <span key={i}>{secs(view.attempts[i]?.wait || plan(i)).replace(".0s", "s")}</span>
        ))}
      </div>

      <p id={statusId} role="status" aria-live="polite" className={`mt-3 text-sm font-semibold ${view.phase === "failed" ? "text-[#B42318]" : view.phase === "success" ? "text-[#0E3B2E]" : ""}`}>
        {status}
      </p>
      {last?.error && view.phase !== "success" && <p className="mt-0.5 font-mono text-xs text-[#5E5A50]">Last error: {last.error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {view.phase === "waiting" && (
          <>
            <button type="button" disabled={!!previewState || !view.online} onClick={() => setLeft(0)} aria-describedby={statusId} className={pill("bg-[#D7263D] text-white disabled:opacity-50")}>
              Retry now
            </button>
            <button
              type="button"
              disabled={!!previewState}
              onClick={() => {
                run.current++;
                setPhase("cancelled");
              }}
              className={pill("bg-white")}
            >
              Cancel
            </button>
          </>
        )}
        {(view.phase === "failed" || view.phase === "cancelled") && (
          <button type="button" disabled={!!previewState} onClick={start} className={pill("bg-white")}>
            Start over
          </button>
        )}
      </div>
    </div>
  );
}
