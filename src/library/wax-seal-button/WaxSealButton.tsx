"use client";

import { useEffect, useId, useImperativeHandle, useRef, useState, useSyncExternalStore, type Ref } from "react";

export type SealState = "idle" | "sealing" | "queued" | "retrying" | "sent" | "error";

export interface SealLabels {
  idle: string;
  sealing: string;
  queued: string;
  /** {s} is replaced with the seconds left. */
  retrying: string;
  sent: string;
  error: string;
  /** Status line while the request is on its way. */
  sealingHint: string;
  queuedHint: string;
  /** Said once when a retry is planned. {s} seconds, {n} attempt number, {max} attempts allowed. */
  retryingHint: string;
  sentHint: string;
  /** {message} is replaced with the error's message (or errorFallback). */
  errorHint: string;
  errorFallback: string;
}

/** Throw this shape from onSubmit to tell the button whether trying again makes sense. */
export type SealError = Error & { status?: number; retryable?: boolean; retryAfterMs?: number };

export interface SealRetryInfo {
  attempt: number;
  delayMs: number;
  error: unknown;
  key: string;
}

export interface WaxSealButtonHandle {
  /** Back to idle. The next press gets a fresh idempotency key. Drops any answer still on its way. */
  reset: () => void;
  /** The key of the current attempt-cycle, or null before the first press. */
  key: () => string | null;
}

export interface WaxSealButtonProps {
  /** Do the real request here and send `key` as the Idempotency-Key. Retries reuse the same key. */
  onSubmit: (key: string) => Promise<unknown> | unknown;
  onSuccess?: (result: unknown, key: string) => void;
  /** Non-retryable failure, or retries used up. The button can be pressed again (same key). */
  onError?: (error: unknown, key: string) => void;
  onRetry?: (info: SealRetryInfo) => void;
  /** Pressed while offline (or the connection dropped mid-request). It sends by itself when back online. */
  onQueued?: (key: string) => void;
  /** A press that was ignored because it is already sealed. */
  onDuplicate?: () => void;
  /** Retries after the first try, for 408/429/5xx, `retryable: true` or a network failure while online. */
  maxRetries?: number;
  /** First retry delay; doubles each time. An error's `retryAfterMs` wins. */
  baseDelayMs?: number;
  /** After success, go back to idle with a fresh key after this long. Omit to stay sealed. */
  resetAfterMs?: number;
  /** Override connection detection (defaults to navigator.onLine and the online/offline events). */
  online?: boolean;
  labels?: Partial<SealLabels>;
  disabled?: boolean;
  /** Force the sending look and block presses. */
  pending?: boolean;
  /** Show one state without running anything. */
  previewState?: SealState;
  /** Wax colour. Hex colours get readable button text automatically. */
  accent?: string;
  size?: "sm" | "md" | "lg";
  /** 1–2 characters pressed into the seal. */
  glyph?: string;
  className?: string;
  ref?: Ref<WaxSealButtonHandle>;
}

const DEFAULT_LABELS: SealLabels = {
  idle: "Send",
  sealing: "Sending…",
  queued: "Sealed · will send when you're back online",
  retrying: "Retrying in {s}s…",
  sent: "Sent",
  error: "Try again",
  sealingHint: "Sealed. Sending now, extra presses are ignored.",
  queuedHint: "You're offline. It's sealed and will send by itself when you're back.",
  retryingHint: "The server is busy. Trying again in {s} seconds, attempt {n} of {max}.",
  sentHint: "Done. It went through once.",
  errorHint: "Not sent: {message}. Press to try again, it won't go through twice.",
  errorFallback: "something went wrong",
};

const SIZES = {
  sm: { btn: "min-w-[180px] gap-2.5 py-2 pl-2 pr-3.5 text-sm", seal: 28 },
  md: { btn: "min-w-[230px] gap-3 py-2.5 pl-2.5 pr-5 text-[0.95rem]", seal: 36 },
  lg: { btn: "min-w-[280px] gap-3.5 py-3 pl-3 pr-6 text-lg", seal: 46 },
};
const RETRY_STATUS = new Set([408, 429, 500, 502, 503, 504]);

/** A fresh idempotency key. crypto.randomUUID needs a secure context, so fall back to getRandomValues, then Math.random. */
function newKey(): string {
  const c = typeof crypto !== "undefined" ? crypto : undefined;
  if (c?.randomUUID) return c.randomUUID();
  const b = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(b);
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 15) | 64;
  b[8] = (b[8] & 63) | 128;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const field = (err: unknown, k: string): unknown => (err && typeof err === "object" ? (err as Record<string, unknown>)[k] : undefined);
const isRetryable = (err: unknown) => field(err, "retryable") === true || RETRY_STATUS.has(Number(field(err, "status")));
const isNetwork = (err: unknown) => err instanceof TypeError;
/** Runs an app callback; if it throws, log it and carry on so it can't derail the send. */
function safe(fn: () => void) {
  try {
    fn();
  } catch (err) {
    console.error(err);
  }
}

/** Dark text on light colours, white on dark ones. Non-hex colours get dark text. */
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
const mix = (c: string, other: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, ${other})`;

/** The wax blob: a lumpy circle, worked out once so server and browser draw the same shape. */
const BLOB = (() => {
  const n = 26;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const r = 45 + 2.4 * Math.sin(i * 2.7) + 1.6 * Math.cos(i * 5.3);
    return [50 + r * Math.cos(a), 50 + r * Math.sin(a)].map((v) => Math.round(v * 10) / 10);
  });
  const mid = (p: number[], q: number[]) => `${Math.round(((p[0] + q[0]) / 2) * 10) / 10} ${Math.round(((p[1] + q[1]) / 2) * 10) / 10}`;
  let d = `M${mid(pts[n - 1], pts[0])}`;
  pts.forEach((p, i) => (d += ` Q${p[0]} ${p[1]} ${mid(p, pts[(i + 1) % n])}`));
  return d + "Z";
})();

const subOnline = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};
const MOTION = "(prefers-reduced-motion: reduce)";
const subMotion = (cb: () => void) => {
  const mq = window.matchMedia(MOTION);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/**
 * A submit button that stamps a wax seal on itself when pressed. Once sealed it ignores more presses, sends one
 * idempotency key with every try, waits for the connection when offline, and retries busy-server errors by itself.
 */
export function WaxSealButton({
  onSubmit,
  onSuccess,
  onError,
  onRetry,
  onQueued,
  onDuplicate,
  maxRetries = 3,
  baseDelayMs = 1000,
  resetAfterMs,
  online,
  labels,
  disabled = false,
  pending = false,
  previewState,
  accent = "#FF6B57",
  size = "md",
  glyph = "✓",
  className = "",
  ref,
}: WaxSealButtonProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const statusId = `${uid}-status`;
  const btn = useRef<HTMLButtonElement>(null);
  const sealRef = useRef<HTMLSpanElement>(null);
  const glint = useRef<SVGRectElement>(null);
  const [live, setLive] = useState<SealState>("idle");
  const [retry, setRetry] = useState({ until: 0, attempt: 0, delay: 0 });
  const [now, setNow] = useState(0);
  const [message, setMessage] = useState("");

  const browserOnline = useSyncExternalStore(subOnline, () => navigator.onLine, () => true);
  const reduced = useSyncExternalStore(subMotion, () => window.matchMedia(MOTION).matches, () => false);
  const isOnline = online ?? browserOnline;

  // Mutable truth for async code: the lock is a ref so two presses in the same tick can't both get through.
  const lock = useRef(false);
  const keyRef = useRef<string | null>(null);
  const gen = useRef(0);
  const timers = useRef({ retry: 0, reset: 0 });
  const latest = useRef({ onSubmit, onSuccess, onError, onRetry, onQueued, onDuplicate, maxRetries, baseDelayMs, resetAfterMs, isOnline, reduced, text });
  useEffect(() => {
    latest.current = { onSubmit, onSuccess, onError, onRetry, onQueued, onDuplicate, maxRetries, baseDelayMs, resetAfterMs, isOnline, reduced, text };
  });

  const animate = (el: Element | null, frames: Keyframe[], opts: KeyframeAnimationOptions) => {
    if (!latest.current.reduced && el && "animate" in el) el.animate(frames, opts);
  };

  function clearTimers() {
    clearTimeout(timers.current.retry);
    clearTimeout(timers.current.reset);
  }

  function reset() {
    gen.current++;
    clearTimers();
    keyRef.current = null;
    lock.current = false;
    setMessage("");
    setLive("idle");
  }

  async function send(attempt: number) {
    const g = gen.current;
    const key = keyRef.current;
    const p = latest.current;
    if (!key) return;
    if (!p.isOnline) {
      setLive("queued");
      safe(() => p.onQueued?.(key));
      return;
    }
    setLive("sealing");
    let result: unknown;
    try {
      result = await p.onSubmit(key);
    } catch (err) {
      if (g !== gen.current) return;
      const q = latest.current;
      if (!q.isOnline && isNetwork(err)) {
        setLive("queued");
        safe(() => q.onQueued?.(key));
        return;
      }
      if ((isRetryable(err) || isNetwork(err)) && attempt < q.maxRetries) {
        const hinted = field(err, "retryAfterMs");
        const delay = typeof hinted === "number" && hinted >= 0 && Number.isFinite(hinted) ? hinted : q.baseDelayMs * 2 ** attempt;
        const t = Date.now();
        setRetry({ until: t + delay, attempt: attempt + 1, delay });
        setNow(t);
        setLive("retrying");
        timers.current.retry = window.setTimeout(() => sendRef.current(attempt + 1), delay);
        safe(() => q.onRetry?.({ attempt: attempt + 1, delayMs: delay, error: err, key }));
        return;
      }
      const msg = err instanceof Error && err.message ? err.message : q.text.errorFallback;
      setMessage(msg);
      setLive("error");
      lock.current = false;
      animate(sealRef.current, [{ transform: "rotate(0)" }, { transform: "rotate(-7deg)" }, { transform: "rotate(5deg)" }, { transform: "rotate(0)" }], { duration: 320 });
      safe(() => q.onError?.(err, key));
      return;
    }
    if (g !== gen.current) return;
    setLive("sent");
    requestAnimationFrame(() =>
      animate(glint.current, [{ transform: "translateX(-90px)", opacity: 0 }, { opacity: 0.85, offset: 0.4 }, { transform: "translateX(90px)", opacity: 0 }], { duration: 900, easing: "ease-in-out" }),
    );
    const after = latest.current.resetAfterMs;
    if (after != null) timers.current.reset = window.setTimeout(reset, after);
    // App code in onSuccess must never turn a finished payment into a retry or an error.
    safe(() => latest.current.onSuccess?.(result, key));
  }
  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  });

  const resetRef = useRef(reset);
  useEffect(() => {
    resetRef.current = reset;
  });
  useImperativeHandle(ref, () => ({ reset: () => resetRef.current(), key: () => keyRef.current }), []);

  // Back online while queued: send with the same key.
  useEffect(() => {
    if (previewState || live !== "queued" || !isOnline) return;
    const t = window.setTimeout(() => sendRef.current(0), 0);
    return () => clearTimeout(t);
  }, [live, isOnline, previewState]);

  // Tick the visible retry countdown.
  useEffect(() => {
    if (previewState || live !== "retrying") return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [live, previewState]);

  // Unmounting drops anything still running.
  useEffect(
    () => () => {
      gen.current++;
      clearTimers();
    },
    [],
  );

  function press() {
    if (disabled || pending || previewState) return;
    if (lock.current) {
      safe(() => latest.current.onDuplicate?.());
      return;
    }
    lock.current = true;
    keyRef.current ??= newKey();
    setMessage("");
    const restamp = live === "error";
    requestAnimationFrame(() => {
      animate(
        sealRef.current,
        restamp
          ? [{ transform: "scale(1)" }, { transform: "scale(1.15, .85)" }, { transform: "scale(1)" }]
          : [
              { transform: "translateY(-30px) scale(1.7) rotate(-16deg)", opacity: 0 },
              { transform: "translateY(0) scale(1.2, .8) rotate(-4deg)", opacity: 1, offset: 0.55 },
              { transform: "scale(.94, 1.07)", offset: 0.78 },
              { transform: "none" },
            ],
        { duration: restamp ? 260 : 540, easing: "cubic-bezier(.3,.7,.3,1)" },
      );
      animate(btn.current, [{ transform: "translateY(0)" }, { transform: "translateY(2px)", offset: 0.55 }, { transform: "translateY(0)" }], { duration: 300 });
    });
    void send(0);
  }

  const state: SealState = previewState ?? (pending ? "sealing" : live);
  const locked = disabled || pending || !!previewState || (state !== "idle" && state !== "error");
  const busy = state === "sealing" || state === "retrying";
  const secs = previewState ? 3 : Math.max(0, Math.ceil((retry.until - now) / 1000));
  const plannedSecs = previewState ? 3 : Math.ceil(retry.delay / 1000);
  const shownMessage = previewState === "error" ? "card declined" : message || text.errorFallback;
  const S = SIZES[size];

  const label = state === "retrying" ? text.retrying.replace("{s}", String(secs)) : text[state];
  const hint =
    state === "sealing"
      ? text.sealingHint
      : state === "queued"
        ? text.queuedHint
        : state === "retrying"
          ? text.retryingHint.replace("{s}", String(plannedSecs)).replace("{n}", String(previewState ? 2 : retry.attempt + 1)).replace("{max}", String(maxRetries + 1))
          : state === "sent"
            ? text.sentHint
            : state === "error"
              ? text.errorHint.replace("{message}", shownMessage)
              : "";
  const hintTone =
    state === "error"
      ? "text-[var(--k-err-text,#FF8A7A)]"
      : state === "queued" || state === "retrying"
        ? "text-[var(--k-warn-text,#FFD08A)]"
        : state === "sent"
          ? "text-[var(--k-acc-text,#C6FF3D)]"
          : "text-[var(--k-mute,#8A938D)]";

  const idleLook = state === "idle" && !disabled;
  const fill = idleLook ? { background: accent, color: textOn(accent) } : undefined;
  const motion = locked
    ? state === "idle" || disabled
      ? "cursor-not-allowed"
      : "cursor-default"
    : "hover:-translate-y-px hover:brightness-110 hover:shadow-[0_14px_32px_-12px_var(--k-shadow,rgba(0,0,0,.9))] active:translate-y-px active:brightness-95 active:shadow-[0_4px_12px_-8px_var(--k-shadow,rgba(0,0,0,.9))]";
  const tone = idleLook ? "" : state === "error" ? "bg-[var(--k-panel,#121614)] text-[var(--k-err-text,#FF8A7A)]" : "bg-[var(--k-panel,#121614)] text-[var(--k-text,#E9EDE8)]";

  const dark = mix(accent, "#000", 62);
  const light = mix(accent, "#fff", 55);
  const sealFilter = state === "queued" ? "grayscale(.9) brightness(1.08)" : state === "error" ? "saturate(.75)" : undefined;
  const seal = S.seal;
  const g = glyph.slice(0, 2) || " ";

  return (
    <div className={`inline-flex max-w-full flex-col items-center gap-2 ${className}`}>
      <button
        ref={btn}
        type="button"
        onClick={press}
        onKeyDown={(e) => e.repeat && (e.key === "Enter" || e.key === " ") && e.preventDefault()}
        disabled={disabled}
        aria-disabled={!disabled && locked ? true : undefined}
        aria-busy={busy || undefined}
        aria-describedby={statusId}
        style={fill}
        className={`relative inline-flex max-w-full items-center ${S.btn} rounded-xl border border-[var(--k-line,#3A433F)] text-left font-bold shadow-[0_10px_30px_-14px_var(--k-shadow,rgba(0,0,0,.9))] transition-[background-color,color,box-shadow,transform,filter] duration-150 ${motion} focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--k-acc-text,#C6FF3D)] disabled:bg-[var(--k-panel-2,#181D1B)] disabled:text-[var(--k-mute,#8A938D)] disabled:shadow-none ${tone}`}
      >
        <span aria-hidden="true" className="relative shrink-0" style={{ width: seal, height: seal }}>
          {/* where the seal will land */}
          <span className={`absolute inset-0 rounded-full border-2 border-dashed border-current transition-opacity ${state === "idle" ? "opacity-60" : "opacity-0"}`} />
          {busy && (
            <span
              className="absolute -inset-1.5 rounded-full motion-safe:animate-pulse"
              style={{ background: `radial-gradient(circle, ${mix(accent, "transparent", 70)} 30%, transparent 70%)` }}
            />
          )}
          <span
            ref={sealRef}
            className={`absolute -inset-[12%] transition-[opacity,filter] duration-300 ${state === "idle" ? "opacity-0" : "opacity-100"}`}
            style={{ filter: sealFilter }}
          >
            <svg viewBox="0 0 100 100" className="size-full overflow-visible drop-shadow-[0_2px_2px_rgba(0,0,0,.35)]">
              <defs>
                <radialGradient id={`${uid}-wax`} cx="38%" cy="32%" r="75%">
                  <stop offset="0" style={{ stopColor: light }} />
                  <stop offset=".45" style={{ stopColor: accent }} />
                  <stop offset="1" style={{ stopColor: dark }} />
                </radialGradient>
                <clipPath id={`${uid}-clip`}>
                  <path d={BLOB} />
                </clipPath>
              </defs>
              <path d={BLOB} fill={`url(#${uid}-wax)`} style={{ stroke: dark }} strokeWidth="1.5" />
              <circle cx="50" cy="50" r="31" fill="none" style={{ stroke: dark }} strokeWidth="2.5" opacity=".7" />
              <circle cx="50" cy="51.2" r="31" fill="none" style={{ stroke: light }} strokeWidth="1" opacity=".55" />
              {[0, 1, 2].map((i) => (
                <text
                  key={i}
                  x={i === 0 ? 48.8 : i === 1 ? 51.2 : 50}
                  y={i === 0 ? 48.8 : i === 1 ? 51.2 : 50}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={g.length > 1 ? 28 : 36}
                  fontWeight={800}
                  fontFamily="Georgia, 'Times New Roman', serif"
                  style={{ fill: i === 0 ? dark : i === 1 ? light : mix(accent, "#000", 82) }}
                  opacity={i === 1 ? 0.6 : 1}
                >
                  {g}
                </text>
              ))}
              {state === "error" && (
                <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="56,5 49,27 58,40 46,57 54,73 47,95" style={{ stroke: mix(accent, "#000", 30) }} strokeWidth="3.2" />
                  <polyline points="58,40 73,47 86,62" style={{ stroke: mix(accent, "#000", 30) }} strokeWidth="2.4" />
                  <polyline points="57.5,6 50.5,27 59.5,40 47.5,57 55.5,73" style={{ stroke: light }} strokeWidth=".9" opacity=".7" />
                </g>
              )}
              <g clipPath={`url(#${uid}-clip)`}>
                <g transform="rotate(25 50 50)">
                  <rect ref={glint} x="39" y="-20" width="22" height="140" fill="#fff" opacity="0" />
                </g>
              </g>
            </svg>
          </span>
        </span>
        <span className="min-w-0">{label}</span>
      </button>
      <p id={statusId} role="status" aria-live="polite" className={`min-h-5 max-w-[34ch] text-center text-xs font-semibold ${hintTone}`}>
        {hint}
      </p>
    </div>
  );
}
