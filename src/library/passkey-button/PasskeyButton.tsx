"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

export type PasskeyIntent = "signin" | "register";
type Status = "idle" | "working" | "success" | "error";
type Support = "checking" | "supported" | "unsupported";

export interface PasskeyLabels {
  signin: string;
  register: string;
  working: string;
  success: string;
  retry: string;
  unsupported: string;
  otherDevice: string;
  fallback: string;
}

export interface PasskeyButtonProps {
  /** "signin" for returning users, "register" to create a passkey. */
  intent?: PasskeyIntent;
  /** Runs the WebAuthn sign-in ceremony (navigator.credentials.get). Throw to show the error state. */
  onSignIn: () => Promise<void>;
  /** Runs the WebAuthn registration ceremony (navigator.credentials.create). Needed when intent is "register". */
  onRegister?: () => Promise<void>;
  /** Sign in with a phone or security key (cross-device / hybrid). Shows a secondary link when set. */
  onUseOtherDevice?: () => Promise<void>;
  /** Fallback such as "use a password". Shown under the button and when passkeys are unsupported. */
  onFallback?: () => void;
  /** Override any piece of text. */
  labels?: Partial<PasskeyLabels>;
  disabled?: boolean;
  /** Skip browser detection. Useful for previews and tests. */
  supportOverride?: Exclude<Support, "checking">;
  className?: string;
}

const DEFAULT_LABELS: PasskeyLabels = {
  signin: "Sign in with passkey",
  register: "Create a passkey",
  working: "Waiting for your device…",
  success: "You're in",
  retry: "Try again",
  unsupported: "Passkeys aren't supported in this browser",
  otherDevice: "Use a phone or security key",
  fallback: "Use password instead",
};

/** Fingerprint ridges, inner to outer. Each path uses pathLength=1 so it can be "drawn". */
const RIDGES = [
  "M24 22.5c0 4 .4 8.3-1.4 12",
  "M20.2 24c.2-2.3 1.8-4 3.8-4s3.7 1.7 3.8 4.2c.2 4.2-.2 8.8-2.2 12.5",
  "M16.7 30.5c.4-2.2.2-4.5.2-6.6 0-4 3.2-7.4 7.1-7.4s7.3 3.4 7.3 7.6c0 3 .1 6.3-.6 9.2",
  "M18.6 38.8c-1.2-1.6-1.7-3.5-1.8-5.4",
  "M13.6 32.3c.2-2.6 0-5.4 0-8.2 0-6 4.7-10.9 10.4-10.9 5.8 0 10.5 4.9 10.5 11 0 1.8.1 3.7 0 5.5",
  "M33.4 36.3c.5-1 .8-2.2 1-3.4",
  "M11 20.4c2.2-5.4 7.2-9.2 13-9.2s10.8 3.7 13 9",
  "M15.2 9.7A17 17 0 0 1 24 7.4c3.1 0 6.1.8 8.7 2.3",
];

function friendlyError(err: unknown, intent: PasskeyIntent): string {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError") return "Cancelled or timed out. Nothing was shared.";
  if (name === "InvalidStateError" && intent === "register") return "This device already has a passkey for this account.";
  if (name === "SecurityError") return "Passkeys need a secure (https) page.";
  if (err instanceof Error && err.message) return err.message;
  return "Something went wrong. Please try again.";
}

const noopSubscribe = () => () => {};

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function PasskeyButton({
  intent = "signin",
  onSignIn,
  onRegister,
  onUseOtherDevice,
  onFallback,
  labels,
  disabled = false,
  supportOverride,
  className = "",
}: PasskeyButtonProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  // Passkey support never changes while the page is open, so there is nothing to subscribe to.
  const detected = useSyncExternalStore<Support>(
    noopSubscribe,
    () => (typeof window.PublicKeyCredential === "function" ? "supported" : "unsupported"),
    () => "checking",
  );
  const buttonRef = useRef<HTMLButtonElement>(null);
  const ridgeRefs = useRef<(SVGPathElement | null)[]>([]);
  const statusId = useId();
  const support: Support = supportOverride ?? detected;

  const unsupported = support === "unsupported";
  const busy = status === "working";
  const blocked = disabled || unsupported || busy || support === "checking";

  async function run(action: () => Promise<void>) {
    if (blocked) return;
    setError("");
    setStatus("working");
    try {
      await action();
      setStatus("success");
      if (!reducedMotion()) {
        buttonRef.current?.animate([{ transform: "scale(1)" }, { transform: "scale(1.05)" }, { transform: "scale(1)" }], {
          duration: 380,
          easing: "cubic-bezier(.3,1.8,.5,1)",
        });
      }
    } catch (err) {
      setError(friendlyError(err, intent));
      setStatus("error");
      if (!reducedMotion()) {
        buttonRef.current?.animate(
          [{ transform: "translateX(0)" }, { transform: "translateX(-7px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }],
          { duration: 340 },
        );
      }
    }
  }

  const primary = () => {
    if (intent === "register") {
      if (!onRegister) throw new Error("PasskeyButton: onRegister is required when intent is \"register\".");
      return run(onRegister);
    }
    return run(onSignIn);
  };

  const label = unsupported
    ? text.unsupported
    : busy
      ? text.working
      : status === "success"
        ? text.success
        : status === "error"
          ? text.retry
          : intent === "register"
            ? text.register
            : text.signin;

  // While waiting, the ridges draw themselves from the centre outwards, over and over.
  useEffect(() => {
    if (!busy || reducedMotion()) return;
    const animations = ridgeRefs.current.map((path, i) =>
      path?.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
        duration: 650,
        delay: i * 110,
        endDelay: (RIDGES.length - i) * 110 + 300,
        iterations: Infinity,
        easing: "ease-out",
        fill: "both",
      }),
    );
    return () => animations.forEach((a) => a?.cancel());
  }, [busy]);

  const tone =
    status === "success"
      ? "bg-[#00C49A] text-[#20201C]"
      : status === "error"
        ? "bg-[#FFE3E3] text-[#20201C]"
        : unsupported || disabled
          ? "bg-[#E7E1D2] text-[#6B665A]"
          : "bg-[#FFB800] text-[#20201C]";

  return (
    <div className={`flex w-full max-w-sm flex-col items-stretch gap-2 ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={primary}
        disabled={disabled || unsupported}
        aria-busy={busy}
        aria-describedby={statusId}
        className={`group flex h-16 items-center gap-3 rounded-[20px] border-4 border-[#20201C] px-3 pr-5 text-left text-base font-extrabold shadow-[0_5px_0_#20201C] transition-[transform,box-shadow,background-color] duration-150 hover:-translate-y-0.5 hover:shadow-[0_7px_0_#20201C] active:translate-y-1 active:shadow-[0_1px_0_#20201C] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#3BB2F6] disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_5px_0_#20201C] ${tone}`}
      >
        <span
          aria-hidden="true"
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border-[3px] border-[#20201C] ${
            status === "success" ? "bg-white" : "bg-[#FFFDF6]"
          }`}
        >
          {status === "success" ? (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#20201C" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} strokeDasharray="1" className="[stroke-dashoffset:0] transition-[stroke-dashoffset] duration-500" />
            </svg>
          ) : (
            <svg viewBox="0 0 48 48" className="h-8 w-8 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6" fill="none" strokeLinecap="round" strokeWidth="2.6">
              {RIDGES.map((d, i) => (
                <path key={`ghost-${i}`} d={d} stroke="#20201C" strokeOpacity="0.15" />
              ))}
              {RIDGES.map((d, i) => (
                <path
                  key={d}
                  ref={(el) => {
                    ridgeRefs.current[i] = el;
                  }}
                  d={d}
                  stroke={status === "error" ? "#E5484D" : "#20201C"}
                  pathLength={1}
                  strokeDasharray="1"
                  strokeDashoffset={0}
                />
              ))}
            </svg>
          )}
        </span>
        <span className="min-w-0 flex-1 leading-tight">{label}</span>
        {busy && (
          <span aria-hidden="true" className="h-5 w-5 shrink-0 animate-spin rounded-full border-[3px] border-[#20201C] border-t-transparent" />
        )}
      </button>

      <p id={statusId} role="status" aria-live="polite" className={`min-h-5 px-1 text-sm font-semibold ${status === "error" ? "text-[#B42318]" : "text-[#5c5849]"}`}>
        {status === "error" ? error : status === "success" ? "Signed in with your passkey. No password needed." : unsupported ? "You can still sign in another way." : ""}
      </p>

      {(onUseOtherDevice || onFallback) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 text-sm font-bold">
          {onUseOtherDevice && !unsupported && (
            <button
              type="button"
              onClick={() => run(onUseOtherDevice)}
              disabled={blocked}
              className="rounded underline decoration-2 underline-offset-4 hover:text-[#2B7FB0] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#3BB2F6] disabled:opacity-50"
            >
              📱 {text.otherDevice}
            </button>
          )}
          {onFallback && (
            <button
              type="button"
              onClick={onFallback}
              disabled={busy}
              className="rounded underline decoration-2 underline-offset-4 hover:text-[#2B7FB0] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#3BB2F6] disabled:opacity-50"
            >
              🔑 {text.fallback}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
