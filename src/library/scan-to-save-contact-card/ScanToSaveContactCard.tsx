"use client";

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { encodeQr, qrPath, type QrEcc } from "./qr";
import { buildVCard, fullName, initials, vcfFileName, type Contact } from "./vcard";

export type { Contact, ContactAddress, ContactEmail, ContactPhone } from "./vcard";

export type ContactCardState = "default" | "qr-zoomed" | "saved" | "mobile" | "vertical" | "minimal" | "disabled" | "loading";

export interface ContactCardLabels {
  save: string;
  saved: string;
  /** Mark after the saved label. Empty string hides it. */
  savedMark: string;
  /** Status line after the file is downloaded. {name} is replaced with the person's name. */
  savedHint: string;
  /** Under the QR code. */
  qrHint: string;
  /** Under the button when the QR code is hidden on a phone. */
  mobileHint: string;
  /** Accessible name of the QR button. {name} is replaced. */
  zoom: string;
  /** Title of the enlarged QR view. {name} is replaced. */
  zoomTitle: string;
  zoomHint: string;
  close: string;
  copy: string;
  copied: string;
  /** Accessible names of the copy buttons. {value} is replaced. */
  copyEmail: string;
  copyPhone: string;
  copiedEmail: string;
  copiedPhone: string;
  copyFailed: string;
  loading: string;
  /** Shown instead of the QR code when the details are too long to encode. */
  tooLong: string;
  cell: string;
  work: string;
  home: string;
  email: string;
}

export interface ScanToSaveContactCardProps {
  /** The person. Everything on the card, in the QR code and in the .vcf file comes from here. */
  contact: Contact;
  /** Width of the QR code on the card, in pixels. */
  qrSize?: number;
  /** "desktop-only" hides the QR code on phones (you can't scan your own screen) and leaves the button. */
  showQr?: "always" | "desktop-only";
  /** "auto" detects a phone from a touch-only screen. Force one to test. */
  device?: "auto" | "desktop" | "mobile";
  layout?: "horizontal" | "vertical";
  /** QR error correction. Higher survives glare and smudges but makes the code denser. */
  ecLevel?: Exclude<QrEcc, "H">;
  /** Button and avatar colour. Hex colours get readable text automatically. */
  accent?: string;
  /** Colour of the QR modules. Keep it dark; the code is always drawn on white. */
  qrColor?: string;
  size?: "sm" | "md" | "lg";
  /** Show the photo or initials circle. */
  showAvatar?: boolean;
  /** Download file name. Defaults to the person's name, e.g. "maya-ortiz.vcf". */
  fileName?: string;
  labels?: Partial<ContactCardLabels>;
  /** Runs after the .vcf file is handed to the browser, with the exact file text. */
  onSave?: (vcard: string, contact: Contact) => void;
  onCopy?: (kind: "email" | "phone", value: string) => void;
  /** Runs when the large QR view opens or closes. */
  onZoom?: (open: boolean) => void;
  disabled?: boolean;
  /** Contact still loading: draws a skeleton and blocks the button. */
  loading?: boolean;
  /** Draw one state still, without downloads, clipboard or dialogs. */
  previewState?: ContactCardState;
  className?: string;
}

const DEFAULT_LABELS: ContactCardLabels = {
  save: "Save contact",
  saved: "Saved",
  savedMark: "✓",
  savedHint: "{name} downloaded. Open the file to add to contacts.",
  qrHint: "Point your phone camera here",
  mobileHint: "Opens your phone's add-contact screen.",
  zoom: "Show a larger QR code for {name}",
  zoomTitle: "Scan to save {name}",
  zoomHint: "Open your phone's camera and point it at the code. Tap the contact banner that appears.",
  close: "Close",
  copy: "Copy",
  copied: "Copied",
  copyEmail: "Copy email {value}",
  copyPhone: "Copy phone number {value}",
  copiedEmail: "Email copied.",
  copiedPhone: "Phone number copied.",
  copyFailed: "Couldn't copy. Select the text instead.",
  loading: "Loading contact…",
  tooLong: "Too many details for a QR code. Use the button.",
  cell: "mobile",
  work: "work",
  home: "home",
  email: "email",
};

const SIZES = {
  sm: { card: "gap-4 p-4", name: "text-base", sub: "text-xs", row: "text-xs", av: "size-10 text-sm", btn: "px-3 py-1.5 text-xs" },
  md: { card: "gap-5 p-5", name: "text-lg", sub: "text-sm", row: "text-[0.8rem]", av: "size-14 text-base", btn: "px-4 py-2 text-sm" },
  lg: { card: "gap-6 p-6", name: "text-xl", sub: "text-base", row: "text-sm", av: "size-16 text-lg", btn: "px-5 py-2.5 text-base" },
};

const NOTE_MS = 4000;
const QUIET = 4;

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

const COARSE = "(hover: none) and (pointer: coarse)";
const subscribeCoarse = (cb: () => void) => {
  const m = window.matchMedia(COARSE);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
const isCoarse = () => window.matchMedia(COARSE).matches;
const serverFalse = () => false;

const fill = (s: string, name: string, value = "") => s.replace("{name}", name).replace("{value}", value);

/** The QR code as one crisp SVG path on white, with the standard 4-module quiet zone. */
function QrSvg({ path, modules, px, color, className = "" }: { path: string; modules: number; px: number | string; color: string; className?: string }) {
  const box = modules + QUIET * 2;
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${box} ${box}`} style={{ width: px, height: px }} shapeRendering="crispEdges" className={`block rounded-lg ${className}`}>
      <rect width={box} height={box} fill="#FFFFFF" />
      <path d={path} fill={color} />
    </svg>
  );
}

/**
 * A profile card with a live QR code. A phone camera pointed at the screen reads a vCard and offers to save
 * the person; the Save button downloads the same card as a .vcf, which on a phone opens the add-contact screen.
 */
export function ScanToSaveContactCard({
  contact,
  qrSize = 128,
  showQr = "desktop-only",
  device = "auto",
  layout = "horizontal",
  ecLevel = "M",
  accent = "#C6FF3D",
  qrColor = "#0B0D0C",
  size = "md",
  showAvatar = true,
  fileName,
  labels,
  onSave,
  onCopy,
  onZoom,
  disabled = false,
  loading = false,
  previewState,
  className = "",
}: ScanToSaveContactCardProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const sz = SIZES[size];
  const titleId = useId();
  const statusId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const timers = useRef<number[]>([]);
  const savedTimer = useRef(0);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [note, setNote] = useState<{ text: string; bad?: boolean } | null>(null);
  const [badPhoto, setBadPhoto] = useState<string | null>(null);
  const coarse = useSyncExternalStore(subscribeCoarse, isCoarse, serverFalse);
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      clearTimeout(savedTimer.current);
    },
    [],
  );

  const p = previewState;
  const isLoading = loading || p === "loading";
  const isDisabled = disabled || p === "disabled";
  const locked = isLoading || isDisabled || !!p;
  const isMobile = p === "mobile" || device === "mobile" || (device === "auto" && coarse && !p);
  const vertical = layout === "vertical" || p === "vertical";
  const avatarOn = showAvatar && p !== "minimal";
  const isSaved = saved || p === "saved";
  const name = fullName(contact) || contact.org || "";

  // The QR carries the card without the photo link: smaller code, and cameras don't fetch photos anyway.
  const qrText = buildVCard(contact, { includePhoto: false });
  const qr = useMemo(() => {
    try {
      const code = encodeQr(qrText, { ecc: ecLevel });
      return { path: qrPath(code, QUIET), modules: code.size };
    } catch {
      return null;
    }
  }, [qrText, ecLevel]);
  const qrVisible = !isMobile || showQr === "always";

  function later(fn: () => void, ms = NOTE_MS) {
    timers.current.push(window.setTimeout(fn, ms));
  }

  function save() {
    if (locked) return;
    const vcard = buildVCard(contact);
    const url = URL.createObjectURL(new Blob([vcard], { type: "text/vcard;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName ?? vcfFileName(contact);
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    later(() => URL.revokeObjectURL(url), 10000);
    setSaved(true);
    setNote({ text: fill(text.savedHint, name) });
    clearTimeout(savedTimer.current);
    savedTimer.current = window.setTimeout(() => setSaved(false), NOTE_MS);
    onSave?.(vcard, contact);
  }

  function copy(kind: "email" | "phone", value: string, key: string) {
    if (locked) return;
    const done = () => {
      setCopied(key);
      setNote({ text: kind === "email" ? text.copiedEmail : text.copiedPhone });
      later(() => setCopied((c) => (c === key ? null : c)), 1800);
      onCopy?.(kind, value);
    };
    const fail = () => setNote({ text: text.copyFailed, bad: true });
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(value).then(done, fail);
    else fail();
  }

  function zoom() {
    if (locked || !qr) return;
    dialog.current?.showModal();
    onZoom?.(true);
  }

  const btnBase = `rounded-lg font-bold transition-[background-color,color,box-shadow,transform,filter] duration-150 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)]`;
  const live = locked ? "cursor-not-allowed" : "hover:-translate-y-px hover:brightness-110 hover:shadow-[0_12px_28px_-12px_var(--k-shadow,rgba(0,0,0,.9))] active:translate-y-px active:brightness-95";
  const chip = `ml-auto shrink-0 rounded-md border border-[var(--k-line,#3A433F)] px-1.5 py-0.5 text-[0.68rem] font-semibold text-[var(--k-mute,#8A938D)] transition-colors hover:border-[var(--k-acc-text,#C6FF3D)] hover:text-[var(--k-text,#E9EDE8)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--k-acc-text,#C6FF3D)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[var(--k-line,#3A433F)]`;
  const sk = "rounded bg-[var(--k-panel-2,#181D1B)] motion-safe:animate-pulse";

  const photo = contact.photoUrl && badPhoto !== contact.photoUrl ? contact.photoUrl : null;
  const avatar = avatarOn && (
    <div
      aria-hidden="true"
      className={`${sz.av} grid shrink-0 place-items-center overflow-hidden rounded-full font-extrabold`}
      style={{ background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 50%, #3DD9FF))`, color: textOn(accent) }}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" className="size-full object-cover" onError={() => setBadPhoto(photo)} />
      ) : (
        initials(contact)
      )}
    </div>
  );

  const rows = [
    ...(contact.phones ?? []).map((ph, i) => ({ key: `p${i}`, kind: "phone" as const, tag: text[ph.type ?? "cell"], value: ph.number })),
    ...(contact.emails ?? []).map((em, i) => ({ key: `e${i}`, kind: "email" as const, tag: em.type ? text[em.type] : text.email, value: em.address })),
  ];

  const info = isLoading ? (
    <div className={`flex min-w-[190px] flex-1 flex-col gap-3 ${vertical ? "items-center" : ""}`}>
      {avatarOn && <div className={`${sz.av} ${sk} rounded-full`} />}
      <div className={`h-4 w-36 ${sk}`} />
      <div className={`h-3 w-28 ${sk}`} />
      <div className={`h-3 w-44 ${sk}`} />
    </div>
  ) : (
    <div className={`flex min-w-0 flex-1 flex-col gap-3 ${vertical ? "items-center text-center" : "min-w-[190px]"}`}>
      <div className={`flex items-center gap-3 ${vertical ? "flex-col" : ""}`}>
        {avatar}
        <div className="min-w-0">
          <p className={`${sz.name} font-bold leading-tight text-[var(--k-text,#E9EDE8)]`}>{name}</p>
          {(contact.title || contact.org) && (
            <p className={`${sz.sub} text-[var(--k-mute,#8A938D)]`}>{[contact.title, contact.org].filter(Boolean).join(" · ")}</p>
          )}
        </div>
      </div>
      {rows.length > 0 && (
        <ul className={`flex w-full flex-col gap-1 ${sz.row}`}>
          {rows.map((r) => (
            <li key={r.key} className="flex min-w-0 items-center gap-2">
              <span className="w-11 shrink-0 text-left text-[var(--k-mute,#8A938D)]">{r.tag}</span>
              <span className="min-w-0 truncate text-left text-[var(--k-text,#E9EDE8)]">{r.value}</span>
              {p !== "minimal" && (
                <button
                  type="button"
                  className={chip}
                  disabled={isDisabled}
                  aria-label={fill(r.kind === "email" ? text.copyEmail : text.copyPhone, name, r.value)}
                  onClick={() => copy(r.kind, r.value, r.key)}
                >
                  {copied === r.key ? text.copied : text.copy}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const button = (
    <button
      type="button"
      onClick={save}
      disabled={isDisabled || isLoading}
      aria-busy={isLoading || undefined}
      aria-describedby={statusId}
      style={!isSaved && !isDisabled && !isLoading ? { background: accent, color: textOn(accent) } : undefined}
      className={`${btnBase} ${sz.btn} ${live} whitespace-nowrap ${vertical || isMobile ? "w-full" : "self-start"} border border-[var(--k-line,#3A433F)] ${isSaved ? "bg-[var(--k-panel-2,#181D1B)] text-[var(--k-acc-text,#C6FF3D)]" : ""} disabled:bg-[var(--k-panel-2,#181D1B)] disabled:text-[var(--k-mute,#8A938D)]`}
    >
      {isLoading && <span aria-hidden="true" className="mr-2 inline-block size-3 rounded-full border-2 border-current border-t-transparent align-[-1px] motion-safe:animate-spin" />}
      {isLoading ? text.loading : isSaved ? text.saved : text.save}
      {isSaved && !isLoading && text.savedMark && <span aria-hidden="true"> {text.savedMark}</span>}
    </button>
  );

  const qrBlock = qrVisible && (
    <div className="flex shrink-0 flex-col items-center gap-2">
      {isLoading ? (
        <div className={sk} style={{ width: qrSize, height: qrSize }} />
      ) : qr ? (
        <button
          type="button"
          onClick={zoom}
          disabled={isDisabled}
          aria-haspopup="dialog"
          aria-label={fill(text.zoom, name)}
          className={`rounded-xl border border-[var(--k-line,#3A433F)] bg-white p-1 transition-[transform,box-shadow] duration-150 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)] disabled:cursor-not-allowed disabled:opacity-40 ${locked ? "" : "cursor-zoom-in hover:scale-[1.03] hover:shadow-[0_0_0_3px_var(--k-acc-text,#C6FF3D)] motion-reduce:hover:scale-100"}`}
        >
          <QrSvg path={qr.path} modules={qr.modules} px={qrSize} color={qrColor} />
        </button>
      ) : (
        <p className="max-w-[10rem] text-center text-xs text-[var(--k-warn-text,#FFB547)]" style={{ width: qrSize }}>
          {text.tooLong}
        </p>
      )}
      {qr && !isLoading && <p style={{ maxWidth: Math.max(qrSize + 10, 120) }} className="text-center text-[0.7rem] font-semibold text-[var(--k-mute,#8A938D)]">{text.qrHint}</p>}
    </div>
  );

  const status = p === "saved" ? fill(text.savedHint, name) : isMobile && !p ? (note?.text ?? text.mobileHint) : p === "mobile" ? text.mobileHint : (note?.text ?? "");

  return (
    <div
      inert={p ? true : undefined}
      aria-busy={isLoading || undefined}
      className={`relative w-full ${vertical ? "max-w-[20rem]" : "max-w-[34rem]"} rounded-2xl border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] text-[var(--k-text,#E9EDE8)] shadow-[0_14px_40px_-18px_var(--k-shadow,rgba(0,0,0,.9))] ${className}`}
    >
      <div className={`flex ${sz.card} ${vertical ? "flex-col items-center" : "flex-wrap items-center justify-center"}`}>
        <div className={`flex flex-1 flex-col gap-4 ${vertical ? "w-full min-w-0 items-center" : "min-w-[12rem]"}`}>
          {info}
          {!vertical && button}
        </div>
        {qrBlock}
        {vertical && button}
      </div>
      <p
        id={statusId}
        role="status"
        aria-live="polite"
        className={`min-h-5 px-5 pb-3 text-xs font-semibold ${vertical ? "text-center" : ""} ${note?.bad ? "text-[var(--k-err-text,#FF8A7A)]" : "text-[var(--k-mute,#8A938D)]"}`}
      >
        {status}
      </p>

      {p === "qr-zoomed" && qr && (
        <div className="absolute inset-0 grid place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--k-bg,#0B0D0C)_80%,transparent)] p-3 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 rounded-xl border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] p-3 shadow-[0_14px_40px_-18px_var(--k-shadow,rgba(0,0,0,.9))]">
            <p className="text-xs font-bold">{fill(text.zoomTitle, name)}</p>
            <QrSvg path={qr.path} modules={qr.modules} px={Math.round(qrSize * 1.45)} color={qrColor} />
          </div>
        </div>
      )}

      {!p && qr && (
        <dialog
          ref={dialog}
          aria-labelledby={titleId}
          onClose={() => onZoom?.(false)}
          onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
          className="m-auto w-[min(92vw,26rem)] rounded-2xl border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] p-5 text-[var(--k-text,#E9EDE8)] shadow-[0_24px_60px_-20px_var(--k-shadow,rgba(0,0,0,.9))] transition-[opacity,scale] duration-200 backdrop:bg-black/70 backdrop:backdrop-blur-sm starting:scale-90 starting:opacity-0 motion-reduce:transition-none"
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <h2 id={titleId} className="text-base font-bold">{fill(text.zoomTitle, name)}</h2>
            <QrSvg path={qr.path} modules={qr.modules} px="min(76vw, 20rem)" color={qrColor} />
            <p className="text-sm text-[var(--k-mute,#8A938D)]">{text.zoomHint}</p>
            <button
              type="button"
              autoFocus
              onClick={() => dialog.current?.close()}
              className={`${btnBase} ${sz.btn} border border-[var(--k-line,#3A433F)] bg-[var(--k-panel-2,#181D1B)] text-[var(--k-text,#E9EDE8)] hover:border-[var(--k-acc-text,#C6FF3D)]`}
            >
              {text.close}
            </button>
          </div>
        </dialog>
      )}
    </div>
  );
}
