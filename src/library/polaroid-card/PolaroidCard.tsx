"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";

export type PolaroidState = "developing" | "developed" | "slow" | "error" | "missing-alt" | "selected" | "disabled";

export interface PolaroidLabels {
  /** Status line while the photo is still loading. */
  developing: string;
  /** Status line once loading takes longer than slowAfterMs. */
  slow: string;
  /** Status line when the image failed to load. */
  error: string;
  /** Text of the retry button. */
  retry: string;
  /** Shown instead of the retry button once every retry is used up. {n} is the number of tries. */
  gaveUp: string;
  /** The yellow sticky note when alt is missing. */
  missingAlt: string;
  /** Second line of the sticky note, and the console warning. */
  missingAltHint: string;
}

export interface PolaroidCardProps {
  src?: string;
  /** Describe the photo. Use alt="" for pure decoration. Leaving it out shows the missing-alt note in development. */
  alt?: string;
  /** Intrinsic size of the image. Used for the aspect ratio when aspectRatio is not given. */
  width?: number;
  height?: number;
  /** Width divided by height of the photo window, e.g. 4 / 3. Wins over width/height. */
  aspectRatio?: number;
  srcSet?: string;
  sizes?: string;
  loading?: "lazy" | "eager";
  /** Handwritten line under the photo. */
  caption?: ReactNode;
  /** Small second line, e.g. "Aug 2026". */
  date?: string;
  /** Makes the whole card a link. */
  href?: string;
  /** Makes the whole card a toggle button. Called with the new selected value. */
  onSelect?: (selected: boolean) => void;
  /** Shows a strip of tape on top and sets aria-pressed. */
  selected?: boolean;
  disabled?: boolean;
  /** Colour under the photo while it develops. */
  placeholderColor?: string;
  /** Tiny blurred preview (data URL) shown under the photo while it develops. */
  blurDataURL?: string;
  /** After this long without a load, the caption says the connection is slow. */
  slowAfterMs?: number;
  /** How many times the card re-requests a failed photo by itself (when onRetry is not given). */
  maxRetries?: number;
  /** Retries add ?retry=n so the browser asks the server again. Turn off for signed URLs (S3, CloudFront), where extra query params break the signature; use onRetry to fetch a fresh signed URL instead. */
  cacheBust?: boolean;
  /** Your own retry. When given, the Retry button calls this instead of re-requesting by itself (e.g. to get a fresh signed URL). */
  onRetry?: () => void;
  /** Runs once the photo has loaded and decoded. */
  onLoad?: (img: HTMLImageElement) => void;
  /** Runs when the photo fails. attempt starts at 0. */
  onError?: (info: { src: string; attempt: number }) => void;
  labels?: Partial<PolaroidLabels>;
  /** When to show the missing-alt sticky note: only in development (default), always, or never. */
  altGuard?: "dev" | "always" | "off";
  /** Tape colour when selected, and the retry button. */
  accent?: string;
  size?: "sm" | "md" | "lg";
  /** Degrees the card turns as it lifts on hover or focus. */
  tilt?: number;
  /** Render one state without running timers. */
  previewState?: PolaroidState;
  className?: string;
}

const DEFAULT_LABELS: PolaroidLabels = {
  developing: "Developing…",
  slow: "Still developing… slow connection",
  error: "Couldn't load this photo",
  retry: "Retry",
  gaveUp: "Gave up after {n} tries",
  missingAlt: "Missing alt text",
  missingAltHint: 'Add alt, or alt="" if it is decoration.',
};

const SIZES = {
  sm: { w: "w-[180px]", cap: "text-[0.95rem]", small: "text-[0.66rem]" },
  md: { w: "w-[240px]", cap: "text-[1.1rem]", small: "text-[0.72rem]" },
  lg: { w: "w-[300px]", cap: "text-[1.3rem]", small: "text-[0.8rem]" },
};

/** System handwriting fonts only, no downloads. Ends in the generic cursive family. */
const HAND = '"Segoe Print", "Bradley Hand", "Marker Felt", "Chalkboard SE", "Comic Sans MS", "Comic Neue", cursive';
/** Dark brown to teal, like instant film before it clears. */
const CHEMICAL = "linear-gradient(160deg, #2B1D14 0%, #3C2A1E 38%, #22403D 78%, #173331 100%)";
const UNDEVELOPED = "sepia(0.9) saturate(0.35) brightness(0.5) contrast(0.85)";
/** Overexposed print with a warm light leak in two corners. */
const BLOWN =
  "radial-gradient(circle at 88% 8%, rgba(255,128,64,.55), transparent 42%), radial-gradient(circle at 8% 92%, rgba(255,196,96,.4), transparent 48%), linear-gradient(135deg, #FBF8F1, #F1EADD)";

const MOTION = "(prefers-reduced-motion: reduce)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(MOTION);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useReducedMotion = () => useSyncExternalStore(subscribe, () => window.matchMedia(MOTION).matches, () => false);

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

/** Adds ?retry=n so the browser asks the server again instead of reusing the failed response. */
function bust(url: string, n: number): string {
  if (!n || /^(data|blob):/i.test(url)) return url;
  const [base, hash] = url.split("#");
  return `${base}${base.includes("?") ? "&" : "?"}retry=${n}${hash !== undefined ? `#${hash}` : ""}`;
}
const bustSet = (set: string, n: number) =>
  n
    ? set
        .split(",")
        .map((part) => {
          const [url, ...rest] = part.trim().split(/\s+/);
          return [bust(url, n), ...rest].join(" ");
        })
        .join(", ")
    : set;

const DEV = process.env.NODE_ENV !== "production";

/**
 * An image card shaped like an instant photo. Space is reserved from the photo's size so nothing jumps,
 * the print "develops" from a dark chemical tint while it really loads, a failed load becomes an
 * overexposed print with a Retry button, and a missing alt attribute gets a yellow sticky note in development.
 */
export function PolaroidCard({
  src,
  alt,
  width,
  height,
  aspectRatio,
  srcSet,
  sizes,
  loading = "lazy",
  caption,
  date,
  href,
  onSelect,
  selected = false,
  disabled = false,
  placeholderColor = "#3C2A1E",
  blurDataURL,
  slowAfterMs = 4000,
  maxRetries = 2,
  cacheBust = true,
  onRetry,
  onLoad,
  onError,
  labels,
  altGuard = "dev",
  accent = "#C6FF3D",
  size = "md",
  tilt = -2,
  previewState,
  className = "",
}: PolaroidCardProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const reduce = useReducedMotion();
  const img = useRef<HTMLImageElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const cardEl = useRef<HTMLElement | null>(null);
  // After Retry is pressed (and unmounts), focus goes to the card, then back to Retry if it fails again.
  const refocus = useRef(false);
  const [seen, setSeen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // Results are stored with the request they belong to, so a new src or a retry starts fresh without an effect.
  const [result, setResult] = useState<{ key: string; status: "loaded" | "error" } | null>(null);
  const [slowKey, setSlowKey] = useState<string | null>(null);
  const [driftKey, setDriftKey] = useState<string | null>(null);
  const settled = useRef<string | null>(null);
  const warned = useRef(false);
  const latest = useRef({ onLoad, onError });
  useEffect(() => {
    latest.current = { onLoad, onError };
  });

  const url = src ? (cacheBust ? bust(src, attempt) : src) : "";
  const reqKey = `${attempt}|${src ?? ""}`;
  const live = result?.key === reqKey ? result.status : "developing";
  const status: "developing" | "developed" | "error" =
    previewState === "developing" || previewState === "slow" ? "developing" : previewState === "error" ? "error" : live === "loaded" ? "developed" : live;
  const reqKeyRef = useRef(reqKey);
  useEffect(() => {
    reqKeyRef.current = reqKey;
  });
  const slow = previewState === "slow" || (!previewState && status === "developing" && slowKey === reqKey);
  const isSelected = previewState === "selected" || selected;
  const isDisabled = previewState === "disabled" || disabled;
  const guardOn = altGuard === "always" || (altGuard === "dev" && DEV);
  const showAltNote = previewState === "missing-alt" || (alt === undefined && guardOn);
  const triesLeft = onRetry ? true : attempt < maxRetries;

  function settle(key: string, next: "loaded" | "error") {
    if (settled.current === key) return;
    settled.current = key;
    if (next === "loaded") refocus.current = false;
    setResult({ key, status: next });
    const el = img.current;
    if (next === "loaded" && el) latest.current.onLoad?.(el);
    if (next === "error") latest.current.onError?.({ src: src ?? "", attempt });
  }
  function loaded(key: string) {
    const el = img.current;
    // Wait for decode() too, so the print clears only once the pixels are ready to paint.
    if (!el) return;
    el.decode()
      .catch(() => {})
      .then(() => {
        if (reqKeyRef.current === key) settle(key, "loaded");
      });
  }
  // The image may have finished before React attached its handlers (cached, or loaded before hydration).
  useEffect(() => {
    const el = img.current;
    if (!el || !url || !el.complete) return;
    let on = true;
    if (el.naturalWidth > 0) {
      el.decode()
        .catch(() => {})
        .then(() => on && settle(reqKey, "loaded"));
    } else {
      Promise.resolve().then(() => on && settle(reqKey, "error"));
    }
    return () => {
      on = false;
    };
    // settle only reads refs and props captured for this request
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reqKey]);

  // A lazy image is only requested near the viewport, so the slow clock starts when the card is in view.
  useEffect(() => {
    const el = wrap.current;
    if (!el || seen || previewState || loading === "eager" || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [seen, previewState, loading]);
  const requested = !!src && (loading === "eager" || seen);

  // Slow connection: say so in the caption once a requested image passes slowAfterMs.
  useEffect(() => {
    if (previewState || status !== "developing" || !requested) return;
    const t = window.setTimeout(() => setSlowKey(reqKey), slowAfterMs);
    return () => clearTimeout(t);
  }, [reqKey, status, previewState, slowAfterMs, requested]);

  // Start the slow drift of the chemical tint one frame after mount, so the transition has a start point.
  useEffect(() => {
    if (previewState) return;
    let b = 0;
    const a = requestAnimationFrame(() => {
      b = requestAnimationFrame(() => setDriftKey(reqKey));
    });
    return () => {
      cancelAnimationFrame(a);
      cancelAnimationFrame(b);
    };
  }, [reqKey, previewState]);

  // Missing alt: warn once per card, in development, so it shows up before an audit does.
  useEffect(() => {
    if (previewState || alt !== undefined || !guardOn || warned.current) return;
    warned.current = true;
    console.warn(`PolaroidCard: ${text.missingAlt} for ${src ?? "(no src yet)"}. ${text.missingAltHint}`);
  }, [alt, guardOn, previewState, src, text.missingAlt, text.missingAltHint]);

  function retry() {
    // The Retry button is about to unmount: keep focus on the card instead of losing it to the page.
    refocus.current = true;
    cardEl.current?.focus();
    if (onRetry) return onRetry();
    if (attempt >= maxRetries) return;
    setAttempt((n) => n + 1);
  }

  // Tint: thick at first, thinning slowly while loading, gone once the photo is decoded.
  const drifting = !previewState && driftKey === reqKey && !reduce;
  const tint = status === "developed" ? 0 : status === "error" ? 0 : previewState === "slow" ? 0.6 : previewState === "developing" ? 0.78 : drifting ? 0.55 : 0.92;
  const tintMs = status === "developed" ? (reduce ? 200 : 1400) : drifting ? slowAfterMs * 1.5 : 0;
  const ratio = aspectRatio ?? (width && height ? width / height : 4 / 3);
  const S = SIZES[size];
  const interactive = !!(href || onSelect) && !isDisabled && !previewState;
  const statusText = status === "error" ? text.error : slow ? text.slow : status === "developing" ? text.developing : "";
  const announce = status === "error" ? text.error : slow ? text.slow : "";

  const photo = (
    <span className="relative block w-full overflow-hidden bg-[#1A1411]" style={{ aspectRatio: String(ratio) }}>
      {status !== "error" && (
        <>
          {/* placeholder underneath: colour and optional blurred preview */}
          <span
            aria-hidden="true"
            className="absolute inset-0 scale-110"
            style={{ background: placeholderColor, backgroundImage: blurDataURL ? `url("${blurDataURL}")` : undefined, backgroundSize: "cover", backgroundPosition: "center", filter: blurDataURL ? "blur(10px)" : undefined }}
          />
          {url && previewState !== "developing" && previewState !== "slow" && (
            // A plain <img> on purpose: native lazy loading, srcSet and decode(), and it works with any host.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={img}
              key={reqKey}
              src={url}
              srcSet={srcSet ? (cacheBust ? bustSet(srcSet, attempt) : srcSet) : undefined}
              sizes={sizes}
              alt={alt}
              width={width}
              height={height}
              loading={loading}
              decoding="async"
              onLoad={() => loaded(reqKey)}
              onError={() => settle(reqKey, "error")}
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                opacity: status === "developed" ? 1 : 0,
                filter: status === "developed" ? "none" : UNDEVELOPED,
                transition: `opacity ${reduce ? 200 : 900}ms ease-out, filter ${reduce ? 200 : 1400}ms ease-out`,
              }}
            />
          )}
          <span aria-hidden="true" className="absolute inset-0" style={{ background: CHEMICAL, opacity: tint, transition: `opacity ${tintMs}ms ${status === "developed" ? "ease-out" : "linear"}` }} />
          {status === "developing" && !reduce && (
            <span aria-hidden="true" className="absolute inset-0 motion-safe:animate-pulse" style={{ background: "radial-gradient(circle at 30% 30%, rgba(255,240,210,.10), transparent 60%)" }} />
          )}
        </>
      )}
      {status === "error" && (
        <span aria-hidden="true" className="absolute inset-0 grid place-items-center" style={{ background: BLOWN }}>
          <svg viewBox="0 0 24 24" className="size-[22%] text-[#8A7B6A]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 15l5-5 4 4 2-2 7 7" />
            <path d="M4 3l16 18" />
          </svg>
        </span>
      )}
    </span>
  );

  const Cap = href || onSelect ? "span" : "figcaption";
  const body = (
    <>
      {photo}
      <Cap className={`block px-[2%] pt-[7%] ${status === "error" ? "pr-[34%]" : ""}`}>
        {caption && (
          <span className={`block -rotate-1 leading-snug text-[#1F2A44] ${S.cap}`} style={{ fontFamily: HAND }}>
            {caption}
          </span>
        )}
        {date && <span className={`mt-0.5 block text-[#5F5A52] ${S.small}`} style={{ fontFamily: HAND }}>{date}</span>}
        <span className={`mt-1 block min-h-[1.3em] font-semibold ${S.small} ${status === "error" ? "text-[#B42318]" : slow ? "text-[#92400E]" : "text-[#5F5A52]"}`}>
          {statusText}
          {status === "error" && !triesLeft && <span className="block font-normal">{text.gaveUp.replace("{n}", String(maxRetries + 1))}</span>}
        </span>
      </Cap>
    </>
  );

  const frame = `relative block w-full rounded-[3px] bg-[#FBFAF6] p-[6%] pb-[9%] text-left shadow-[0_14px_30px_-14px_rgba(0,0,0,.65),0_0_0_1px_rgba(0,0,0,.08)] transition-[box-shadow,transform,filter,opacity] duration-200 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--k-acc-text,#C6FF3D)] ${
    interactive ? "cursor-pointer hover:shadow-[0_24px_40px_-16px_rgba(0,0,0,.7),0_0_0_1px_rgba(0,0,0,.08)] active:scale-[.985] active:brightness-95" : ""
  } ${isDisabled ? "cursor-not-allowed opacity-55 grayscale" : ""}`;

  const setCard = (el: HTMLElement | null) => {
    cardEl.current = el;
  };
  const setRetry = (el: HTMLButtonElement | null) => {
    if (!el || !refocus.current) return;
    refocus.current = false;
    const at = document.activeElement;
    if (!at || at === document.body || at === cardEl.current) el.focus();
  };
  let card: ReactNode;
  if (onSelect) {
    card = (
      <button ref={setCard} type="button" aria-pressed={isSelected} disabled={isDisabled} onClick={() => !previewState && onSelect(!isSelected)} className={frame}>
        {body}
      </button>
    );
  } else if (href) {
    card = isDisabled ? (
      <span ref={setCard} role="link" aria-disabled="true" tabIndex={-1} className={frame}>
        {body}
      </span>
    ) : (
      <a ref={setCard} href={previewState ? undefined : href} className={frame}>
        {body}
      </a>
    );
  } else {
    card = (
      <figure ref={setCard} tabIndex={-1} className={frame}>
        {body}
      </figure>
    );
  }

  const lift = interactive
    ? "hover:[transform:translateY(-6px)_rotate(var(--tilt))] focus-within:[transform:translateY(-6px)_rotate(var(--tilt))] active:[transform:translateY(-2px)_rotate(var(--tilt))]"
    : "";

  return (
    <div
      ref={wrap}
      className={`relative inline-block max-w-full ${S.w} transition-transform duration-300 ease-out motion-reduce:transition-none ${lift} ${className}`}
      style={{ "--tilt": `${tilt}deg` } as CSSProperties}
    >
      {card}
      {isSelected && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-3 left-1/2 h-7 w-[38%] -translate-x-1/2 -rotate-3 shadow-[0_2px_4px_rgba(0,0,0,.18)]"
          style={{ background: `color-mix(in srgb, ${accent} 72%, transparent)`, backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,.18) 0 2px, transparent 2px 6px)" }}
        />
      )}
      {status === "error" && !isDisabled && triesLeft && (
        <button
          ref={setRetry}
          type="button"
          onClick={previewState ? undefined : retry}
          className="absolute bottom-[6%] right-[6%] rounded-md border border-[#1F2A44]/40 px-2.5 py-1 text-xs font-bold shadow-sm transition-[filter,transform] hover:brightness-110 active:scale-95 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#1F2A44]"
          style={{ background: accent, color: textOn(accent) }}
        >
          ↻ {text.retry}
        </button>
      )}
      {showAltNote && (
        <span
          role="note"
          title={text.missingAltHint}
          className="absolute -right-2 -top-2 max-w-[62%] rotate-3 bg-[#FFE36E] px-2 py-1.5 text-[0.68rem] font-bold leading-tight text-[#3A2E00] shadow-[0_6px_12px_-6px_rgba(0,0,0,.5)]"
        >
          ⚠ {text.missingAlt}
          <span className="block font-normal">{text.missingAltHint}</span>
        </span>
      )}
      <span role="status" aria-live="polite" className="sr-only">
        {announce}
      </span>
    </div>
  );
}
