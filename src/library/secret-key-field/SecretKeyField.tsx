"use client";

import { useEffect, useId, useRef, useState } from "react";

export type KeyExposure = "secret" | "publishable" | "any";

export interface SecretKeyFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  /** Where this value ends up. "publishable" means it ships to the browser, so a secret here is an error. */
  expects?: KeyExposure;
  /** How many characters at the end stay readable while hidden. */
  visibleChars?: number;
  /** Longest a peek can last, even if the button is still held. */
  peekMs?: number;
  /** After Copy, overwrite the clipboard after this long. 0 turns it off. */
  clearClipboardMs?: number;
  placeholder?: string;
  disabled?: boolean;
  /** Render with the key shown, for docs and tests. */
  previewRevealed?: boolean;
  /** Focus ring and peek countdown colour. */
  accent?: string;
  /** How the peek countdown is drawn: a ring around the eye, a bar under the field, or not at all. */
  drain?: "ring" | "bar" | "none";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const FIELD = { sm: "py-1.5 text-xs", md: "py-2 text-sm", lg: "py-3 text-base" };
const ICON = { sm: "h-8 w-8 text-sm", md: "h-10 w-10 text-base", lg: "h-12 w-12 text-lg" };

interface KeyKind {
  test: RegExp;
  name: string;
  secret: boolean;
  live?: boolean;
}

/** Well-known key shapes, so the field can say what you pasted. */
const KINDS: KeyKind[] = [
  { test: /^sk_live_/, name: "Stripe secret key", secret: true, live: true },
  { test: /^rk_live_/, name: "Stripe restricted key", secret: true, live: true },
  { test: /^sk_test_/, name: "Stripe secret key", secret: true, live: false },
  { test: /^pk_live_/, name: "Stripe publishable key", secret: false, live: true },
  { test: /^pk_test_/, name: "Stripe publishable key", secret: false, live: false },
  { test: /^(gh[pousr]_|github_pat_)/, name: "GitHub token", secret: true },
  { test: /^AKIA[0-9A-Z]{16}$/, name: "AWS access key", secret: true },
  { test: /^xox[abpr]-/, name: "Slack token", secret: true },
  { test: /^AIza[0-9A-Za-z_-]{20,}$/, name: "Google API key", secret: false },
];

const identify = (v: string) => KINDS.find((k) => k.test.test(v));

/** Strip what usually sneaks in with a paste: surrounding quotes, spaces, line breaks. */
function clean(raw: string): { value: string; removed: string[] } {
  const removed: string[] = [];
  let v = raw;
  if (/^\s|\s$/.test(v)) removed.push("spaces at the ends");
  v = v.trim();
  if (/^["'`].*["'`]$/.test(v)) {
    removed.push("quotes");
    v = v.slice(1, -1);
  }
  if (/\s/.test(v)) {
    removed.push("line breaks inside");
    v = v.replace(/\s+/g, "");
  }
  return { value: v, removed };
}

export function SecretKeyField({
  value,
  onChange,
  label,
  expects = "any",
  visibleChars = 4,
  peekMs = 3000,
  clearClipboardMs = 30_000,
  placeholder = "Paste your key",
  disabled = false,
  previewRevealed,
  accent = "#C6FF3D",
  drain = "ring",
  size = "md",
  className = "",
}: SecretKeyFieldProps) {
  const id = useId();
  const [peeking, setPeeking] = useState(false);
  const [note, setNote] = useState("");
  const [clearing, setClearing] = useState(0);
  const peekTimer = useRef(0);
  const ring = useRef<SVGCircleElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  const revealed = previewRevealed ?? peeking;
  const kind = value ? identify(value) : undefined;
  const tail = value.slice(-visibleChars);

  const error =
    expects === "publishable" && kind?.secret
      ? `This is a ${kind.name}. Anything in this field is sent to the browser — paste the publishable key instead.`
      : "";
  const warning =
    expects === "secret" && kind && !kind.secret
      ? `This looks like a ${kind.name}. This field needs the secret one.`
      : kind?.live
        ? "Live key: this touches real money and real customers."
        : "";

  function startPeek() {
    if (!value || disabled) return;
    setPeeking(true);
    clearTimeout(peekTimer.current);
    peekTimer.current = window.setTimeout(() => setPeeking(false), peekMs);
  }
  function stopPeek() {
    clearTimeout(peekTimer.current);
    setPeeking(false);
  }

  // Count down the clipboard wipe once a copy has been made.
  useEffect(() => {
    if (clearing <= 0) return;
    const t = window.setTimeout(() => {
      if (clearing <= 1000) {
        void navigator.clipboard?.writeText("");
        setNote("Clipboard cleared.");
        setClearing(0);
      } else setClearing((c) => c - 1000);
    }, 1000);
    return () => clearTimeout(t);
  }, [clearing]);

  useEffect(() => () => clearTimeout(peekTimer.current), []);

  // The ring around the eye drains while you peek, showing how long until it hides again.
  useEffect(() => {
    if (!peeking) return;
    const a =
      drain === "ring"
        ? ring.current?.animate([{ strokeDashoffset: "0px" }, { strokeDashoffset: "1px" }], { duration: peekMs, easing: "linear", fill: "forwards" })
        : drain === "bar"
          ? bar.current?.animate([{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }], { duration: peekMs, easing: "linear", fill: "forwards" })
          : undefined;
    return () => a?.cancel();
  }, [peeking, peekMs, drain]);

  const iconBtn =
    `relative grid ${ICON[size]} shrink-0 place-items-center border-l-2 border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] text-base hover:bg-[var(--k-panel-2,#181D1B)] focus-visible:z-10 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50`;

  return (
    <div className={`w-full max-w-md text-[var(--k-text,#E9EDE8)] ${className}`} style={{ ["--accent" as string]: accent }}>
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <label htmlFor={id} className="text-sm font-bold">{label}</label>
        {kind && (
          <span className={`rounded-md border px-1.5 py-px text-[0.68rem] font-bold ${kind.secret ? "border-[#FF6B57]/40 bg-[#FF6B57]/10 text-[var(--k-err-text,#FF8F7E)]" : "border-[var(--k-line,#3A433F)] bg-[var(--k-panel-2,#181D1B)] text-[var(--k-text,#E9EDE8)]"}`}>
            {kind.name}
            {kind.live !== undefined && <span className={kind.live ? "text-[#FF6B57]" : "text-[var(--k-mute,#8A938D)]"}>{kind.live ? " · LIVE" : " · TEST"}</span>}
          </span>
        )}
      </div>

      <div className={`relative flex border-2 bg-[var(--k-panel,#121614)] focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-[var(--accent)] ${error ? "border-[#FF6B57]" : "border-[var(--k-line,#3A433F)]"}`}>
        <input
          id={id}
          type={revealed ? "text" : "password"}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={!!error}
          aria-describedby={`${id}-status`}
          onChange={(e) => onChange(e.target.value)}
          onPaste={(e) => {
            const raw = e.clipboardData.getData("text");
            const { value: v, removed } = clean(raw);
            if (!removed.length) return;
            e.preventDefault();
            onChange(v);
            setNote(`Removed ${removed.join(" and ")} from the paste.`);
          }}
          className={`min-w-0 flex-1 bg-transparent px-3 ${FIELD[size]} font-mono tracking-wide outline-none disabled:cursor-not-allowed`}
        />
        {value && !revealed && (
          <span aria-hidden="true" className="hidden items-center pr-2 font-mono text-xs text-[var(--k-mute,#8A938D)] sm:flex">
            ends <b className="ml-1 text-[var(--k-text,#E9EDE8)]">{tail}</b>
          </span>
        )}
        <button
          type="button"
          disabled={!value || disabled}
          aria-label={revealed ? "Hiding when you let go" : "Hold to show the key"}
          aria-pressed={revealed}
          onPointerDown={startPeek}
          onPointerUp={stopPeek}
          onPointerLeave={stopPeek}
          onKeyDown={(e) => (e.key === " " || e.key === "Enter") && !e.repeat && (e.preventDefault(), startPeek())}
          onKeyUp={(e) => (e.key === " " || e.key === "Enter") && stopPeek()}
          className={iconBtn}
        >
          {revealed ? "◉" : "◎"}
          {(peeking || previewRevealed) && drain === "ring" && (
            <svg aria-hidden="true" viewBox="0 0 40 40" className="absolute inset-0.5 -rotate-90">
              <circle ref={ring} cx="20" cy="20" r="17" fill="none" stroke={accent} strokeWidth="2.5" pathLength={1} strokeDasharray="1" strokeDashoffset={previewRevealed && !peeking ? 0.4 : 0} />
            </svg>
          )}
        </button>
        <button
          type="button"
          disabled={!value || disabled}
          aria-label="Copy key without showing it"
          onClick={async () => {
            await navigator.clipboard?.writeText(value);
            setNote(clearClipboardMs ? "Copied without showing it." : "Copied.");
            setClearing(clearClipboardMs);
          }}
          className={iconBtn}
        >
          ⧉
        </button>
        {(peeking || previewRevealed) && drain === "bar" && (
          <span ref={bar} aria-hidden="true" className="absolute inset-x-0 -bottom-0.5 h-1 origin-left" style={{ background: accent, transform: previewRevealed && !peeking ? "scaleX(.6)" : undefined }} />
        )}
      </div>

      <div id={`${id}-status`} role="status" aria-live="polite" className="mt-2 space-y-1 text-sm">
        {error && <p className="border-l-4 border-[#FF6B57] bg-[#FF6B57]/10 px-2.5 py-1.5 font-semibold text-[var(--k-err-text,#FF8F7E)]">✕ {error}</p>}
        {!error && warning && <p className="border-l-4 border-[#FFB547] bg-[#FFB547]/10 px-2.5 py-1.5 text-[var(--k-warn-text,#FFD08A)]">! {warning}</p>}
        {note && <p className="text-[var(--k-mute,#8A938D)]">{note}</p>}
        {clearing > 0 && (
          <p className="flex flex-wrap items-center gap-2 text-[var(--k-mute,#8A938D)]">
            Clipboard clears in {Math.ceil(clearing / 1000)}s.
            <button type="button" onClick={() => { setClearing(0); setNote("Kept on the clipboard."); }} className="rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] px-1.5 text-xs font-bold text-[var(--k-text,#E9EDE8)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]">
              Keep it
            </button>
          </p>
        )}
        {!value && !note && <p className="text-xs text-[var(--k-mute,#8A938D)]">Hold ◎ to peek for up to {Math.round(peekMs / 1000)}s. ⧉ copies without showing it.</p>}
      </div>
    </div>
  );
}
