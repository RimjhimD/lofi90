"use client";

import { useId } from "react";
import type { PostcardLabels } from "./PostcardForm";

export const PAPER = "#F7F2E5";

export const DEFAULT_LABELS: PostcardLabels = {
  title: "Send us a postcard",
  to: "To: The team",
  from: "From",
  message: "Your message",
  messagePlaceholder: "Dear team,",
  name: "Name",
  namePlaceholder: "Your name",
  email: "Email",
  emailPlaceholder: "you@example.com",
  topic: "Topic",
  topicPlaceholder: "Pick one (optional)",
  stamp: "Stamp it to send",
  stampBusy: "Posting your card",
  stampArt: "✺",
  stampValue: "1ST",
  postmark: "POSTED",
  date: (d) => d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }),
  ago: (ms) => {
    const m = Math.round(ms / 60000);
    if (m < 1) return "a moment ago";
    if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60);
    return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
  },
  restored: (ago) => `Restored your draft from ${ago}`,
  discard: "Discard",
  saved: "Draft saved",
  counter: (n, max) => `${n} / ${max}`,
  nearLimit: (max) => `Getting close to the ${max} character limit.`,
  atLimit: (max) => `That's the ${max} character limit.`,
  errName: "Please add your name.",
  errEmailRequired: "Please add your email so we can reply.",
  errEmail: "That email looks incomplete, like name@example.com.",
  errMessage: "Write a few words first.",
  errShort: (min, n) => `A little more, please: at least ${min} characters (${n} so far).`,
  invalid: (n) => (n === 1 ? "One thing to fix before it can go." : `${n} things to fix before it can go.`),
  sending: "Posting your card…",
  mailbox: "Waiting in the mailbox · sends when you're back online",
  takeBack: "Take it back",
  error: "It didn't go through. Your words are still here.",
  tryAgain: "Try again",
  sent: "Posted ✓",
  sentNote: "It's on its way. We'll reply by email.",
  writeAnother: "Write another",
};

/** Dark text on light colours, white on dark ones, so any hex accent stays readable on the stamp. */
export function textOn(hex: string): string {
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

export const CSS = `
.pcf-paper { background-color: ${PAPER}; background-image: radial-gradient(120% 90% at 0% 0%, rgba(255,255,255,.55), transparent 60%); }
.pcf-lined { background-image: repeating-linear-gradient(transparent 0 calc(1.8em - 1px), rgba(27,58,107,.24) calc(1.8em - 1px) 1.8em); background-attachment: local; line-height: 1.8em; }
.pcf-perf { background: radial-gradient(circle, ${PAPER} 2.4px, transparent 2.9px) -4px -4px / 8px 8px, #fff; }
.pcf-ink .pcf-ring { stroke-dasharray: 1; animation: pcf-draw 1.1s ease-in-out infinite alternate; }
.pcf-stick { animation: pcf-stick .34s cubic-bezier(.2,.8,.3,1.25) both; }
.pcf-thud { animation: pcf-thud .3s ease-out both; }
.pcf-slide { animation: pcf-slide .95s .2s cubic-bezier(.55,0,.75,.05) forwards; }
@keyframes pcf-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes pcf-stick { from { transform: rotate(-16deg) scale(1.4); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes pcf-thud { from { transform: scale(1.5); opacity: 0; } to { transform: none; opacity: .9; } }
@keyframes pcf-slide { to { transform: translateY(-118%); } }
@media (prefers-reduced-motion: reduce) {
  .pcf-ink .pcf-ring, .pcf-stick, .pcf-thud { animation: none !important; }
  .pcf-slide { animation: none; display: none; }
}`;

/** The ink circle with the date, plus the wavy cancellation lines. Decorative: the status line says the same thing. */
export function Postmark({ ink, date, word, inking, className = "" }: { ink: string; date: string; word: string; inking?: boolean; className?: string }) {
  const arc = `pcf-arc${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg viewBox="0 0 128 80" aria-hidden="true" className={`${inking ? "pcf-ink" : ""} ${className}`}>
      <defs>
        <path id={arc} d="M19 42 a21 21 0 0 1 42 0" />
      </defs>
      <g fill="none" stroke={ink} strokeLinecap="round">
        <circle className="pcf-ring" cx="40" cy="40" r="31" strokeWidth="2.5" pathLength={1} />
        <circle cx="40" cy="40" r="25.5" strokeWidth="1" />
        {[30, 38, 46, 54].map((y) => (
          <path key={y} d={`M76 ${y} q6.5 -5 13 0 t13 0 t13 0 t11 0`} strokeWidth="2" />
        ))}
      </g>
      <text fill={ink} fontSize="7.5" fontWeight="800" letterSpacing="1.4">
        <textPath href={`#${arc}`} startOffset="50%" textAnchor="middle">{word}</textPath>
      </text>
      <text x="40" y="51" fill={ink} fontSize="8" fontWeight="800" textAnchor="middle">{date}</text>
    </svg>
  );
}
