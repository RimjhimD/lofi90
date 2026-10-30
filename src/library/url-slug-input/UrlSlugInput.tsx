"use client";

import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes } from "react";
import { DEFAULT_STOP_WORDS, cleanSuggestions, defaultSuggestions, sanitizeTyping, slugify, trimDashes } from "./slug";

/** What the field holds. `locked` means the slug follows the title. */
export interface SlugDraft {
  title: string;
  slug: string;
  locked: boolean;
  /** Only meaningful for a published page whose slug changed: add a redirect from the old address. */
  redirect?: boolean;
}

/** What onChange reports: the draft plus the last availability answer (null while unknown or checking). */
export interface SlugValue extends SlugDraft {
  redirect: boolean;
  available: boolean | null;
}

export type SlugStatus = "empty" | "idle" | "checking" | "available" | "taken" | "error";
export type UrlSlugPreview = "empty" | "typing" | "checking" | "available" | "taken" | "manual" | "published" | "error" | "disabled";

export interface UrlSlugLabels {
  title: string;
  placeholder: string;
  /** Accessible name of the slug box. */
  address: string;
  /** Shown in the slug spot while it is empty. */
  slugPlaceholder: string;
  /** Word that replaces "&" in the slug. */
  and: string;
  checking: string;
  free: string;
  taken: string;
  freeMark: string;
  takenMark: string;
  error: string;
  retry: string;
  /** Lock button name while the slug follows the title. */
  follows: string;
  /** Lock button name while the slug is edited by hand. */
  manual: string;
  resync: string;
  /** {max} is replaced with maxLength. */
  shortened: string;
  suggestions: string;
  finding: string;
  noSuggestions: string;
  warnTitle: string;
  /** {old} is replaced with the old address. */
  warnBody: string;
  redirect: string;
  /** Announcements. {url} is the full address, {n} a count. */
  announceFree: string;
  announceTaken: string;
  announceSuggestions: string;
  announceError: string;
}

export interface UrlSlugInputProps {
  /** Controlled value. Leave out to let the field keep its own state. */
  value?: SlugDraft;
  defaultValue?: Partial<SlugDraft>;
  onChange?: (value: SlugValue) => void;
  /** Printed before the slug, e.g. "mysite.com/blog/". */
  prefix?: string;
  /** Answers "is this slug free?". Gets an AbortSignal; older checks are aborted and ignored. Throw to show the error state. */
  checkAvailability?: (slug: string, signal: AbortSignal) => Promise<boolean>;
  /** Wait after the last keystroke before checking, in ms. */
  debounceMs?: number;
  /** Your own ideas for a taken slug. Each one is still checked before it is shown. */
  suggest?: (slug: string, ctx: { title: string; year: number }) => string[];
  maxSuggestions?: number;
  /** Longest slug; a longer one is cut at a word break. */
  maxLength?: number;
  /** Drop small words like "the", "and", "of". */
  removeStopWords?: boolean;
  stopWords?: string[];
  /** The page is live: changing its slug shows a warning and a redirect choice. */
  published?: boolean;
  /** The live slug of a published page. */
  originalSlug?: string;
  /** Form field names; the slug is sent in a hidden input. */
  names?: { title?: string; slug?: string; redirect?: string };
  /** Every status change, with the slug it is about. */
  onStatusChange?: (status: SlugStatus, slug: string) => void;
  /** A suggestion was picked. */
  onPick?: (slug: string) => void;
  labels?: Partial<UrlSlugLabels>;
  /** Highlight colour of the slug. */
  accent?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  /** Draw one state still, with sample text. Nothing runs and nothing is focusable. */
  previewState?: UrlSlugPreview;
  className?: string;
}

const DEFAULT_LABELS: UrlSlugLabels = {
  title: "Page title",
  placeholder: "Give your page a title",
  address: "Web address",
  slugPlaceholder: "your-page-title",
  and: "and",
  checking: "Checking…",
  free: "Free",
  taken: "Taken",
  freeMark: "✓",
  takenMark: "✕",
  error: "Couldn't check",
  retry: "Retry",
  follows: "The address follows the title. Edit it by hand",
  manual: "You're editing the address by hand. Make it follow the title again",
  resync: "Re-sync with title",
  shortened: "Shortened to {max} characters at a word break.",
  suggestions: "Free instead:",
  finding: "Finding free addresses…",
  noSuggestions: "No free versions found. Edit the address by hand.",
  warnTitle: "Old links will break",
  warnBody: "Links to {old} will stop working.",
  redirect: "Add a redirect from the old address",
  announceFree: "{url} is free.",
  announceTaken: "{url} is taken.",
  announceSuggestions: "{n} free suggestions below.",
  announceError: "Couldn't check {url}. Try again.",
};

const SIZES = {
  sm: { field: "px-3 py-2 text-sm", url: "px-2.5 py-1.5 text-xs", lab: "text-xs", pill: "px-2 py-0.5 text-[0.7rem]" },
  md: { field: "px-3.5 py-2.5 text-base", url: "px-3 py-2 text-[0.8rem]", lab: "text-xs", pill: "px-2.5 py-1 text-xs" },
  lg: { field: "px-4 py-3 text-lg", url: "px-3.5 py-2.5 text-sm", lab: "text-sm", pill: "px-3 py-1 text-sm" },
};

const SAMPLE = "Café & Crème: 10 Best Recipes!";
type Still = { title: string; slug?: string; locked?: boolean; status: SlugStatus; sugg?: string[]; caret?: "title" | "slug"; original?: string };
const PREVIEWS: Record<UrlSlugPreview, Still> = {
  empty: { title: "", status: "empty" },
  typing: { title: "Café & Crème: 10 Be", status: "idle", caret: "title" },
  checking: { title: SAMPLE, status: "checking" },
  available: { title: SAMPLE, status: "available" },
  taken: { title: SAMPLE, status: "taken", sugg: ["cafe-and-creme-10-best-recipes-2026", "cafe-creme-10-best-recipes", "cafe-and-creme-10-best-recipes-2"] },
  manual: { title: SAMPLE, slug: "creme-recipes", locked: false, status: "available", caret: "slug" },
  published: { title: SAMPLE, slug: "cafe-and-creme-10-best-recipes", locked: false, status: "available", original: "cafe-creme-recipes" },
  error: { title: SAMPLE, status: "error" },
  disabled: { title: SAMPLE, status: "idle" },
};

const tint = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;
const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
const RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)]";

/** A real button, or an inert look-alike for still previews (which sit inside links). */
function Btn({ still, className = "", children, ...rest }: { still: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  if (still) return <span aria-hidden="true" className={className}>{children}</span>;
  return (
    <button type="button" className={`${className} ${RING}`} {...rest}>
      {children}
    </button>
  );
}

function LockIcon({ open }: { open: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d={open ? "M5.5 7V5a2.5 2.5 0 0 1 4.9-.7" : "M5.5 7V5a2.5 2.5 0 0 1 5 0v2"} />
    </svg>
  );
}

/**
 * A title field that builds a clean web address underneath it as you type, checks whether it is free,
 * and offers free versions when it is taken. The address follows the title until you unlock it and edit it.
 */
export function UrlSlugInput({
  value,
  defaultValue,
  onChange,
  prefix = "mysite.com/blog/",
  checkAvailability,
  debounceMs = 400,
  suggest,
  maxSuggestions = 3,
  maxLength = 60,
  removeStopWords = false,
  stopWords = DEFAULT_STOP_WORDS,
  published = false,
  originalSlug,
  names,
  onStatusChange,
  onPick,
  labels,
  accent = "#C6FF3D",
  size = "md",
  disabled = false,
  previewState,
  className = "",
}: UrlSlugInputProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const S = SIZES[size];
  const uid = useId();
  const still = !!previewState;
  const off = disabled || previewState === "disabled";
  const slugRef = useRef<HTMLInputElement>(null);
  const [inner, setInner] = useState<SlugDraft>(() => ({
    title: defaultValue?.title ?? "",
    slug: defaultValue?.slug ?? "",
    locked: defaultValue?.locked ?? !published,
    redirect: defaultValue?.redirect ?? true,
  }));
  const [result, setResult] = useState<{ slug: string; status: "available" | "taken" | "error" } | null>(null);
  const [sugg, setSugg] = useState<{ slug: string; list: string[] } | null>(null);
  const [retry, setRetry] = useState(0);

  const draft = value ?? inner;
  const redirect = draft.redirect ?? true;
  const opts = { and: text.and, removeStopWords, stopWords, maxLength };
  const autoSlug = slugify(draft.title, opts);
  const slug = draft.locked ? autoSlug : draft.slug;
  const finalSlug = trimDashes(slug);
  const shortened = draft.locked && autoSlug !== slugify(draft.title, { ...opts, maxLength: Infinity });

  const status: SlugStatus = !finalSlug
    ? "empty"
    : result?.slug === finalSlug
      ? result.status
      : !checkAvailability || off
        ? "idle"
        : "checking";
  const available = status === "available" ? true : status === "taken" ? false : null;
  const suggList = status === "taken" && sugg?.slug === finalSlug ? sugg.list : null;

  const latest = useRef({ checkAvailability, suggest, onChange, onStatusChange, title: draft.title, stopWords, and: text.and, maxLength });
  const current = useRef<SlugValue>({ ...draft, slug, redirect, available });
  useEffect(() => {
    latest.current = { checkAvailability, suggest, onChange, onStatusChange, title: draft.title, stopWords, and: text.and, maxLength };
    current.current = { ...draft, slug, redirect, available };
  });

  // Check the newest slug after a pause in typing. A newer slug aborts the older check, and late answers are ignored.
  const hasChecker = !!checkAvailability;
  useEffect(() => {
    if (still || off || !hasChecker || !finalSlug) return;
    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      const L = latest.current;
      const check = L.checkAvailability;
      if (!check) return;
      try {
        const ok = await check(finalSlug, ctrl.signal);
        if (ctrl.signal.aborted) return;
        setResult({ slug: finalSlug, status: ok ? "available" : "taken" });
        if (ok) return;
        const year = new Date().getFullYear();
        const ideas = L.suggest ? L.suggest(finalSlug, { title: L.title, year }) : defaultSuggestions(finalSlug, { year, stopWords: L.stopWords, maxLength: L.maxLength });
        const candidates = cleanSuggestions(ideas, finalSlug, L.and, L.maxLength);
        const answers = await Promise.all(candidates.map((c) => check(c, ctrl.signal).then((free) => (free ? c : ""), () => "")));
        if (ctrl.signal.aborted) return;
        setSugg({ slug: finalSlug, list: answers.filter(Boolean).slice(0, maxSuggestions) });
      } catch {
        if (!ctrl.signal.aborted) setResult({ slug: finalSlug, status: "error" });
      }
    }, debounceMs);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [finalSlug, retry, still, off, hasChecker, debounceMs, maxSuggestions]);

  // Report each new status once; report a settled answer through onChange too, so `available` stays current.
  const reported = useRef("");
  useEffect(() => {
    if (still) return;
    const key = `${status}|${finalSlug}`;
    if (reported.current === key) return;
    reported.current = key;
    latest.current.onStatusChange?.(status, finalSlug);
    if (status === "available" || status === "taken") latest.current.onChange?.({ ...current.current, available: status === "available" });
  }, [status, finalSlug, still]);

  function emit(patch: Partial<SlugDraft>, avail: boolean | null) {
    const next = { ...draft, slug, redirect, ...patch };
    if (next.locked) next.slug = slugify(next.title, opts);
    if (!value) setInner(next);
    onChange?.({ ...next, redirect: next.redirect ?? true, available: avail });
  }
  const toggleLock = () => {
    if (!draft.locked) return emit({ locked: true }, null);
    emit({ locked: false, slug: autoSlug }, available);
    requestAnimationFrame(() => slugRef.current?.focus());
  };
  const pick = (s: string) => {
    setResult({ slug: s, status: "available" });
    onPick?.(s);
    emit({ locked: false, slug: s }, true);
  };

  // What to draw: live values, or a frozen sample for previews.
  const pv = previewState ? PREVIEWS[previewState] : null;
  const v = pv
    ? { title: pv.title, locked: pv.locked ?? true, slug: pv.slug ?? slugify(pv.title, opts), status: pv.status, sugg: pv.sugg ?? null, original: pv.original, redirect: true, shortened: false }
    : { title: draft.title, locked: draft.locked, slug, status, sugg: suggList, original: originalSlug, redirect, shortened };
  const warn = (pv ? !!pv.original : published) && !!v.original && !!trimDashes(v.slug) && trimDashes(v.slug) !== v.original;
  const canResync = !v.locked && trimDashes(v.slug) !== slugify(v.title, opts);

  const url = prefix + finalSlug;
  const announce =
    status === "available"
      ? fill(text.announceFree, { url })
      : status === "taken"
        ? `${fill(text.announceTaken, { url })}${suggList?.length ? ` ${fill(text.announceSuggestions, { n: suggList.length })}` : ""}`
        : status === "error"
          ? fill(text.announceError, { url })
          : "";

  const hl = { background: tint(accent, 22), boxShadow: `0 0 0 1px ${tint(accent, 55)}` };
  const caret = <span aria-hidden="true" className="ml-px inline-block h-[1.05em] w-0.5 align-[-0.15em] bg-[var(--k-acc-text,#C6FF3D)] motion-safe:animate-pulse" />;
  const fieldCls = `w-full rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-panel-2,#181D1B)] text-[var(--k-text,#E9EDE8)] placeholder:text-[var(--k-mute,#8A938D)] transition-colors hover:border-[var(--k-mute,#8A938D)] focus:border-[var(--k-acc-text,#C6FF3D)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-[var(--k-line,#3A433F)] ${S.field}`;
  const boxTone =
    v.status === "available" ? "border-[var(--k-acc-text,#C6FF3D)]" : v.status === "taken" || v.status === "error" ? "border-[var(--k-err-text,#FF8A7A)]" : "border-[var(--k-line,#3A433F)]";
  const titleId = `${uid}-title`;
  const urlId = `${uid}-url`;
  const linkBtn = "rounded px-1 font-semibold text-[var(--k-acc-text,#C6FF3D)] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className={`w-full max-w-md ${off ? "opacity-70" : ""} ${className}`} data-state={previewState ?? status}>
      {still ? (
        <span className={`mb-1.5 block font-semibold text-[var(--k-mute,#8A938D)] ${S.lab}`}>{text.title}</span>
      ) : (
        <label htmlFor={titleId} className={`mb-1.5 block font-semibold text-[var(--k-mute,#8A938D)] ${S.lab}`}>
          {text.title}
        </label>
      )}
      {still ? (
        <div className={`${fieldCls} min-h-[2.75em] truncate ${off ? "opacity-60" : ""}`}>
          {v.title || <span className="text-[var(--k-mute,#8A938D)]">{text.placeholder}</span>}
          {pv?.caret === "title" && caret}
        </div>
      ) : (
        <input
          id={titleId}
          name={names?.title}
          value={draft.title}
          onChange={(e) => emit({ title: e.target.value }, draft.locked ? null : available)}
          placeholder={text.placeholder}
          disabled={off}
          autoComplete="off"
          aria-describedby={urlId}
          className={fieldCls}
        />
      )}

      <div id={urlId} className={`mt-2.5 flex min-w-0 items-center gap-1.5 rounded-lg border bg-[var(--k-bg,#0E1110)] font-mono transition-colors ${boxTone} ${S.url}`}>
        <span className="max-w-[48%] shrink-0 truncate text-[var(--k-mute,#8A938D)]">{prefix}</span>
        {!v.locked && !still ? (
          <input
            ref={slugRef}
            value={slug}
            onChange={(e) => emit({ slug: sanitizeTyping(e.target.value, text.and, maxLength) }, null)}
            onBlur={() => slug !== finalSlug && emit({ slug: finalSlug }, available)}
            aria-label={text.address}
            maxLength={maxLength}
            disabled={off}
            spellCheck={false}
            autoComplete="off"
            placeholder={text.slugPlaceholder}
            style={hl}
            className="min-w-0 flex-1 rounded bg-transparent px-1 text-[var(--k-text,#E9EDE8)] placeholder:text-[var(--k-mute,#8A938D)] focus:outline-2 focus:outline-offset-1 focus:outline-[var(--k-acc-text,#C6FF3D)]"
          />
        ) : (
          <span className="min-w-0 flex-1 truncate">
            {v.slug ? (
              <span style={hl} className={`rounded px-0.5 text-[var(--k-text,#E9EDE8)] ${v.locked ? "" : "underline decoration-dashed underline-offset-4"}`}>
                {v.slug}
              </span>
            ) : (
              <span className="text-[var(--k-mute,#8A938D)]">{text.slugPlaceholder}</span>
            )}
            {pv?.caret === "slug" && caret}
          </span>
        )}
        <span className="flex shrink-0 items-center gap-1 whitespace-nowrap font-sans text-xs font-semibold">
          {v.status === "checking" && (
            <span className="flex items-center gap-1 text-[var(--k-mute,#8A938D)]">
              <span aria-hidden="true" className="inline-block size-2.5 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin" />
              {text.checking}
            </span>
          )}
          {v.status === "available" && <span className="text-[var(--k-acc-text,#C6FF3D)]">{text.freeMark} {text.free}</span>}
          {v.status === "taken" && <span className="text-[var(--k-err-text,#FF8A7A)]">{text.takenMark} {text.taken}</span>}
          {v.status === "error" && (
            <>
              <span className="text-[var(--k-err-text,#FF8A7A)]">{text.error}</span>
              <Btn still={still} disabled={off} onClick={() => {
                  setResult(null);
                  setRetry((n) => n + 1);
                }} className={linkBtn}>
                {text.retry}
              </Btn>
            </>
          )}
        </span>
        <Btn
          still={still}
          disabled={off}
          onClick={toggleLock}
          aria-label={v.locked ? text.follows : text.manual}
          title={v.locked ? text.follows : text.manual}
          className={`grid size-7 shrink-0 place-items-center rounded-md border transition-colors disabled:cursor-not-allowed ${
            v.locked
              ? "border-[var(--k-line,#3A433F)] text-[var(--k-mute,#8A938D)] hover:border-[var(--k-mute,#8A938D)] hover:text-[var(--k-text,#E9EDE8)]"
              : "border-[var(--k-acc-text,#C6FF3D)] text-[var(--k-acc-text,#C6FF3D)] hover:bg-[var(--k-panel-2,#181D1B)]"
          } active:scale-95`}
        >
          <LockIcon open={!v.locked} />
        </Btn>
      </div>

      {(v.shortened || canResync) && (
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--k-mute,#8A938D)]">
          <span>{v.shortened ? fill(text.shortened, { max: maxLength }) : ""}</span>
          {canResync && (
            <Btn still={still} disabled={off} onClick={() => emit({ locked: true }, null)} className={linkBtn}>
              ↺ {text.resync}
            </Btn>
          )}
        </div>
      )}

      {v.status === "taken" && (
        <div role={still ? undefined : "group"} aria-label={still ? undefined : text.suggestions} className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {v.sugg === null ? (
            <span className="text-xs text-[var(--k-mute,#8A938D)]">{text.finding}</span>
          ) : v.sugg.length === 0 ? (
            <span className="text-xs text-[var(--k-mute,#8A938D)]">{text.noSuggestions}</span>
          ) : (
            <>
              <span className="text-xs font-semibold text-[var(--k-mute,#8A938D)]">{text.suggestions}</span>
              {v.sugg.map((s) => (
                <Btn
                  key={s}
                  still={still}
                  disabled={off}
                  data-suggestion={s}
                  onClick={() => pick(s)}
                  className={`max-w-full truncate rounded-full border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] font-mono text-[var(--k-text,#E9EDE8)] transition-colors hover:border-[var(--k-acc-text,#C6FF3D)] active:scale-[.97] ${S.pill}`}
                >
                  {s}
                </Btn>
              ))}
            </>
          )}
        </div>
      )}

      {warn && (
        <div className="mt-3 rounded-lg border border-[var(--k-warn-text,#FFB547)] p-3 text-xs text-[var(--k-text,#E9EDE8)]" style={{ background: "color-mix(in srgb, var(--k-warn-text,#FFB547) 8%, transparent)" }}>
          <p className="font-bold text-[var(--k-warn-text,#FFB547)]">{text.warnTitle}</p>
          <p className="mt-0.5 break-all text-[var(--k-mute,#8A938D)]">{fill(text.warnBody, { old: prefix + v.original })}</p>
          {still ? (
            <span className="mt-2 flex items-center gap-2">
              <span aria-hidden="true" className="grid size-3.5 place-items-center rounded-sm bg-[var(--k-warn-text,#FFB547)] text-[0.6rem] font-black text-[var(--k-bg,#0E1110)]">✓</span>
              {text.redirect}
            </span>
          ) : (
            <label className="mt-2 flex w-fit cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                name={names?.redirect}
                checked={redirect}
                disabled={off}
                onChange={(e) => emit({ redirect: e.target.checked }, available)}
                className={`size-3.5 accent-[var(--k-warn-text,#FFB547)] ${RING}`}
              />
              {text.redirect}
            </label>
          )}
        </div>
      )}

      {!still && (
        <>
          <p role="status" aria-live="polite" className="sr-only">
            {announce}
          </p>
          {names?.slug && <input type="hidden" name={names.slug} value={finalSlug} />}
        </>
      )}
    </div>
  );
}
