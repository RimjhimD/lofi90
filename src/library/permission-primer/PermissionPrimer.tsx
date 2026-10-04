"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

export type PermissionKind = "camera" | "microphone" | "geolocation" | "notifications";
export type PrimerState = "checking" | "prompt" | "asking" | "granted" | "denied" | "unsupported";
type Browser = "chrome" | "edge" | "safari" | "firefox" | "other";

export interface PermissionPrimerProps {
  /** Which browser permission you're about to ask for. */
  permission: PermissionKind;
  /** Controls whether the primer is shown. */
  open: boolean;
  /** Called when the primer wants to close (Not now, Esc, backdrop, or after success). */
  onOpenChange: (open: boolean) => void;
  /** Why your app needs it, in one or two plain sentences. This is what makes people say yes. */
  reason: string;
  /** Optional heading. Defaults to "Allow camera?" etc. */
  title?: string;
  /** Up to three short benefits shown as a checklist. */
  benefits?: string[];
  /** Called once access is granted (also when it was already granted before). */
  onGranted?: () => void;
  /** Called when the user (or browser) blocks access. */
  onDenied?: () => void;
  /**
   * Runs the real browser prompt. Defaults to the right browser API for `permission`.
   * Return "granted" or "denied". Pass your own to reuse a stream or for testing.
   */
  request?: () => Promise<"granted" | "denied">;
  /** Close automatically this long after access is granted. Set 0 to stay open. */
  autoCloseMs?: number;
  /** Show one state without running anything. For docs, tests and design reviews. */
  previewState?: Exclude<PrimerState, "checking">;
}

const COPY: Record<PermissionKind, { noun: string; allow: string; title: string }> = {
  camera: { noun: "camera", allow: "Allow camera", title: "Turn on your camera?" },
  microphone: { noun: "microphone", allow: "Allow microphone", title: "Turn on your microphone?" },
  geolocation: { noun: "location", allow: "Share location", title: "Share your location?" },
  notifications: { noun: "notifications", allow: "Turn on notifications", title: "Get notified?" },
};

const RECOVERY: Record<Browser, string[]> = {
  chrome: ["Click the icon to the left of the web address (the sliders or lock).", "Find {noun} and switch it to Allow.", "Press Try again below."],
  edge: ["Click the lock icon to the left of the web address.", "Open Permissions for this site and set {noun} to Allow.", "Press Try again below."],
  safari: ["In the menu bar choose Safari, then Settings for This Website.", "Set {noun} to Allow.", "Press Try again below."],
  firefox: ["Click the permissions icon to the left of the web address.", "Remove the Blocked {noun} entry.", "Press Try again below, then choose Allow."],
  other: ["Open your browser's site settings for this page.", "Set {noun} to Allow.", "Press Try again below."],
};

function detectBrowser(): Browser {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return "edge";
  if (/Firefox\//.test(ua)) return "firefox";
  if (/Chrome\//.test(ua)) return "chrome";
  if (/Safari\//.test(ua)) return "safari";
  return "other";
}

function isSupported(permission: PermissionKind): boolean {
  if (typeof window === "undefined") return false;
  if (!window.isSecureContext) return false;
  if (permission === "notifications") return "Notification" in window;
  if (permission === "geolocation") return "geolocation" in navigator;
  return !!navigator.mediaDevices?.getUserMedia;
}

/** Reads the current state without prompting, so we never show the primer for nothing. */
async function queryState(permission: PermissionKind): Promise<"granted" | "denied" | "prompt"> {
  if (permission === "notifications" && "Notification" in window) {
    return Notification.permission === "default" ? "prompt" : Notification.permission;
  }
  try {
    const name = (permission === "microphone" ? "microphone" : permission) as PermissionName;
    const status = await navigator.permissions.query({ name });
    return status.state;
  } catch {
    return "prompt"; // Some browsers can't query this permission; just ask.
  }
}

async function defaultRequest(permission: PermissionKind): Promise<"granted" | "denied"> {
  if (permission === "notifications") {
    return (await Notification.requestPermission()) === "granted" ? "granted" : "denied";
  }
  if (permission === "geolocation") {
    return new Promise((resolve) =>
      navigator.geolocation.getCurrentPosition(
        () => resolve("granted"),
        (err) => resolve(err.code === err.PERMISSION_DENIED ? "denied" : "granted"),
        { timeout: 15000 },
      ),
    );
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia(permission === "camera" ? { video: true } : { audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return "granted";
  } catch {
    return "denied";
  }
}

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function Icon({ permission }: { permission: PermissionKind }) {
  const common = { fill: "none", stroke: "#1A1A17", strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 48 48" className="h-11 w-11" aria-hidden="true">
      {permission === "camera" && (
        <>
          <rect x="5" y="14" width="26" height="20" rx="5" {...common} fill="#E8E2D2" />
          <path d="M31 21l11-6v18l-11-6z" {...common} fill="#E8E2D2" />
        </>
      )}
      {permission === "microphone" && (
        <>
          <rect x="17" y="5" width="14" height="24" rx="7" {...common} fill="#D7263D" />
          <path d="M11 22a13 13 0 0 0 26 0M24 35v8M17 43h14" {...common} />
        </>
      )}
      {permission === "geolocation" && (
        <>
          <path d="M24 44s14-13 14-24a14 14 0 0 0-28 0c0 11 14 24 14 24z" {...common} fill="#D7263D" />
          <circle cx="24" cy="20" r="5" {...common} fill="#FFFFFF" />
        </>
      )}
      {permission === "notifications" && (
        <>
          <path d="M12 34V22a12 12 0 0 1 24 0v12l3 4H9z" {...common} fill="#E8E2D2" />
          <path d="M20 42a4 4 0 0 0 8 0" {...common} />
        </>
      )}
    </svg>
  );
}

export function PermissionPrimer({
  permission,
  open,
  onOpenChange,
  reason,
  title,
  benefits = [],
  onGranted,
  onDenied,
  request,
  autoCloseMs = 1400,
  previewState,
}: PermissionPrimerProps) {
  const copy = COPY[permission];
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  const [state, setState] = useState<PrimerState>("checking");
  const [browser, setBrowser] = useState<Browser>("other");
  const shown = previewState ?? state;
  const inline = previewState !== undefined;

  const callbacks = useRef({ onGranted, onDenied, onOpenChange });
  useEffect(() => {
    callbacks.current = { onGranted, onDenied, onOpenChange };
  }, [onGranted, onDenied, onOpenChange]);

  const finishGranted = useCallback(() => {
    setState("granted");
    callbacks.current.onGranted?.();
    if (autoCloseMs > 0) window.setTimeout(() => callbacks.current.onOpenChange(false), autoCloseMs);
  }, [autoCloseMs]);

  // Open / close the native <dialog> (it gives us the focus trap, Esc and inert background for free).
  useEffect(() => {
    if (inline) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      if (!reducedMotion()) {
        cardRef.current?.animate(
          [{ transform: "translateY(40px) scale(.92)", opacity: 0 }, { transform: "none", opacity: 1 }],
          { duration: 380, easing: "cubic-bezier(.3,1.6,.5,1)" },
        );
      }
    }
    if (!open && dialog.open) dialog.close();
  }, [open, inline]);

  // Each time it opens, check what the browser already knows before asking anything.
  useEffect(() => {
    if (!open || inline) return;
    let cancelled = false;
    const run = async () => {
      setBrowser(detectBrowser());
      if (!isSupported(permission)) return setState("unsupported");
      setState("checking");
      const current = await queryState(permission);
      if (cancelled) return;
      if (current === "granted") finishGranted();
      else if (current === "denied") setState("denied");
      else setState("prompt");
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [open, inline, permission, finishGranted]);

  async function ask() {
    setState("asking");
    const result = await (request ? request() : defaultRequest(permission));
    if (result === "granted") finishGranted();
    else {
      setState("denied");
      callbacks.current.onDenied?.();
    }
  }

  async function retry() {
    const current = await queryState(permission);
    if (current === "granted") finishGranted();
    else if (current === "prompt") void ask();
    else if (!reducedMotion()) {
      cardRef.current?.animate(
        [{ transform: "translateX(0)" }, { transform: "translateX(-8px)" }, { transform: "translateX(7px)" }, { transform: "translateX(0)" }],
        { duration: 340 },
      );
    }
  }

  const heading =
    shown === "granted"
      ? `${copy.noun[0].toUpperCase()}${copy.noun.slice(1)} is on`
      : shown === "denied"
        ? `${copy.noun[0].toUpperCase()}${copy.noun.slice(1)} is blocked`
        : shown === "unsupported"
          ? `${copy.noun[0].toUpperCase()}${copy.noun.slice(1)} isn't available here`
          : (title ?? copy.title);

  const steps = RECOVERY[inline ? "chrome" : browser].map((s) => s.replace("{noun}", copy.noun));

  const card = (
    <div
      ref={cardRef}
      className="relative w-full max-w-[420px] rounded-md border-2 border-[#1A1A17] bg-[#FFFFFF] p-5 text-[#1A1A17] shadow-[6px_6px_0_#1A1A17]"
    >
      {/* Where the real browser prompt will appear: top-left, by the address bar. */}
      {shown === "asking" && (
        <div aria-hidden="true" className="absolute -left-3 -top-14 flex items-center gap-2 rounded-[4px] border-2 border-[#1A1A17] bg-[#D7263D] px-3 py-1 text-xs font-extrabold text-white shadow-[3px_3px_0_#1A1A17] motion-safe:animate-bounce">
          ↖ Your browser is asking up here
        </div>
      )}

      <div className="flex items-start gap-3">
        <div
          className={`grid h-16 w-16 shrink-0 place-items-center rounded-md border-2 border-[#1A1A17] ${
            shown === "granted" ? "bg-[#0E3B2E]" : shown === "denied" ? "bg-[#FBE4E6]" : "bg-[#F2EEE3]"
          }`}
        >
          {shown === "granted" ? (
            <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="#F2EEE3" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          ) : shown === "checking" ? (
            <span aria-hidden="true" className="h-8 w-8 animate-spin rounded-full border-2 border-[#1A1A17] border-t-transparent" />
          ) : (
            <span className="relative">
              <Icon permission={permission} />
              {(shown === "denied" || shown === "unsupported") && (
                <span aria-hidden="true" className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border-2 border-[#1A1A17] bg-[#D7263D] text-xs font-black text-white">
                  ✕
                </span>
              )}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h2 id={titleId} className="text-xl font-black leading-tight">
            {heading}
          </h2>
          <p id={descId} className="mt-1 text-sm font-semibold leading-snug text-[#5E5A50]">
            {shown === "denied"
              ? `Your browser is blocking ${copy.noun} for this site, so it won't ask again by itself. You can turn it back on in a few clicks:`
              : shown === "unsupported"
                ? `This browser or page can't use ${copy.noun} (it needs a secure https page and a modern browser). You can keep going without it.`
                : shown === "granted"
                  ? "Thanks! You're all set."
                  : shown === "asking"
                    ? `Choose "Allow" in the browser popup to continue.`
                    : reason}
          </p>
        </div>
      </div>

      {(shown === "prompt" || shown === "checking") && benefits.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {benefits.slice(0, 3).map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm font-bold">
              <span aria-hidden="true" className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-[#1A1A17] bg-[#0E3B2E] text-[10px] text-[#F2EEE3]">✓</span>
              {b}
            </li>
          ))}
        </ul>
      )}

      {shown === "denied" && (
        <ol className="mt-4 space-y-2">
          {steps.map((s, i) => (
            <li key={s} className="flex items-start gap-2.5 rounded-md border-2 border-[#1A1A17] bg-[#F2EEE3] px-3 py-2 text-sm font-bold">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-[#1A1A17] bg-white text-xs font-black">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-end gap-2.5">
        {shown !== "granted" && (
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-[4px] px-4 py-2 text-sm font-extrabold underline decoration-2 underline-offset-4 hover:bg-[#F2EEE3] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#D7263D]"
          >
            {shown === "unsupported" || shown === "denied" ? "Continue without" : "Not now"}
          </button>
        )}
        {(shown === "prompt" || shown === "asking" || shown === "checking") && (
          <button
            type="button"
            onClick={ask}
            disabled={shown !== "prompt"}
            className="flex items-center gap-2 rounded-[4px] border-2 border-[#1A1A17] bg-[#D7263D] px-5 py-2 text-sm font-black text-white shadow-[3px_3px_0_#1A1A17] transition-transform hover:-translate-y-0.5 active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_#1A1A17] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#0E3B2E] disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {shown === "asking" && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            {shown === "asking" ? "Waiting for you…" : copy.allow}
          </button>
        )}
        {shown === "denied" && (
          <button
            type="button"
            onClick={retry}
            className="rounded-[4px] border-2 border-[#1A1A17] bg-[#D7263D] px-5 py-2 text-sm font-black text-white shadow-[3px_3px_0_#1A1A17] transition-transform hover:-translate-y-0.5 active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_#1A1A17] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#1A1A17]"
          >
            Try again
          </button>
        )}
        {shown === "granted" && autoCloseMs === 0 && (
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-[4px] border-2 border-[#1A1A17] bg-[#0E3B2E] px-5 py-2 text-sm font-black text-[#F2EEE3] shadow-[3px_3px_0_#1A1A17] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#1A1A17]"
          >
            Done
          </button>
        )}
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {heading}
      </p>
    </div>
  );

  if (inline) {
    return (
      <div role="group" aria-labelledby={titleId} aria-describedby={descId} className="w-full max-w-[420px]">
        {card}
      </div>
    );
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descId}
      onCancel={(e) => {
        e.preventDefault();
        onOpenChange(false);
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
      className="m-auto w-[min(420px,calc(100vw-2rem))] overflow-visible bg-transparent p-0 backdrop:bg-[#1A1A17]/55 backdrop:backdrop-blur-[2px]"
    >
      {card}
    </dialog>
  );
}
