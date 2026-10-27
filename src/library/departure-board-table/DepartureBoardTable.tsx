"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { FLAPS, FlapText, Mark, fit, noise, textOn, useReducedMotion } from "./Flap";

export type BoardTone = "ok" | "warn" | "bad" | "neutral";
export type BoardState = "live" | "flipping" | "held" | "loading" | "empty" | "error" | "stale";
export interface BoardSort {
  key: string;
  dir: "asc" | "desc";
}

export interface BoardColumn<T> {
  key: string;
  header: string;
  value: (row: T) => string;
  /** Width in tiles (characters). Longer values are cut with "…"; the full value is still read out. */
  width?: number;
  align?: "left" | "right";
  /** Colour of this cell's letters. */
  tone?: (row: T) => BoardTone;
  /** Include changes to this column in the screen-reader summary. Turn off for noisy columns like a countdown. */
  announce?: boolean;
  sortable?: boolean;
}

/** Every word the board shows or says. */
export interface BoardLabels {
  /** Pill text while updates are held. */
  waiting: (count: number) => string;
  showNow: string;
  /** Said once when updates start waiting because the pointer or focus is on the board. */
  heldNotice: string;
  changed: (row: string, column: string, value: string) => string;
  added: (row: string) => string;
  removed: (row: string) => string;
  /** Tail of a long batch: "and 4 more changes". */
  more: (count: number) => string;
  loading: string;
  /** Flapped onto the board when there are no rows. */
  empty: string;
  emptyHint: string;
  /** Flapped onto the board when the feed fails. */
  error: string;
  errorHint: string;
  retry: string;
  /** Footer: "Last update 2 min ago". */
  updated: (ago: string) => string;
  ago: (ms: number) => string;
  stale: string;
  /** Read after a sortable header's name. */
  sortHint: string;
}

export interface DepartureBoardTableProps<T> {
  rows: T[];
  getRowId: (row: T) => string;
  columns: BoardColumn<T>[];
  /** Board title, also the table's caption. */
  caption: string;
  /** How a row is named in announcements. Defaults to the first column's header and value. */
  rowLabel?: (row: T) => string;
  /** Hold incoming updates while the pointer is on the board or focus is inside it. */
  holdOnHover?: boolean;
  /** Time per letter step of a flip, in ms. */
  flipMs?: number;
  /** How long a changed cell stays marked, in ms. */
  markMs?: number;
  loading?: boolean;
  /** true or a message: the board shows the service-interrupted state. A string replaces the hint. */
  error?: boolean | string;
  onRetry?: () => void;
  /** When the data was last fetched. */
  updatedAt?: number | Date;
  /** Force the stale look. */
  stale?: boolean;
  /** Data older than this counts as stale (needs updatedAt). */
  staleAfterMs?: number;
  /** Starting sort. Headers cycle ascending, descending, off. */
  sortBy?: BoardSort | null;
  onSortChange?: (sort: BoardSort | null) => void;
  /** Runs after updates land on the board. */
  onApply?: (summary: { changed: number; added: number; removed: number }) => void;
  /** Runs when holding starts or stops; `waiting` is how many updates are queued. */
  onHoldChange?: (held: boolean, waiting: number) => void;
  labels?: Partial<BoardLabels>;
  /** Letter colour of neutral cells and of the changed marker. */
  accent?: string;
  toneColors?: Partial<Record<BoardTone, string>>;
  size?: "sm" | "md" | "lg";
  uppercase?: boolean;
  /** Show one state without running anything. */
  previewState?: BoardState;
  className?: string;
}

const DEFAULT_LABELS: BoardLabels = {
  waiting: (n) => `${n} update${n === 1 ? "" : "s"} waiting`,
  showNow: "Show now",
  heldNotice: "New updates are waiting. They appear when you move off the board, or press Show now.",
  changed: (row, col, v) => `${row} ${col.toLowerCase()} changed to ${v}`,
  added: (row) => `${row} added`,
  removed: (row) => `${row} removed`,
  more: (n) => `and ${n} more change${n === 1 ? "" : "s"}`,
  loading: "Loading the board",
  empty: "NOTHING SCHEDULED",
  emptyHint: "New rows will flip in here.",
  error: "SERVICE INTERRUPTED",
  errorHint: "We couldn't get the latest updates.",
  retry: "Retry",
  updated: (ago) => `Last update ${ago}`,
  ago: (ms) => (ms < 10000 ? "just now" : ms < 60000 ? `${Math.round(ms / 1000)} s ago` : ms < 3600000 ? `${Math.floor(ms / 60000)} min ago` : `${Math.floor(ms / 3600000)} h ago`),
  stale: "May be out of date",
  sortHint: "sort",
};
const TONES: Record<Exclude<BoardTone, "neutral">, string> = { ok: "#7EE08A", warn: "#FFD27A", bad: "#FF8A7A" };
const SIZES = { sm: "text-[11px]", md: "text-[13px]", lg: "text-[16px]" };
const BOARD = "#0F1110";
const ANNOUNCE_MS = 900;
const MAX_SAID = 3;

const isKeyboardFocus = (el: Element) => {
  try {
    return el.matches(":focus-visible");
  } catch {
    return true;
  }
};

const cellKey = (id: string, key: string) => `${id}\u0000${key}`;

interface Diff {
  changed: { id: string; key: string }[];
  added: string[];
  removed: { id: string; index: number }[];
  count: number;
}

/** Which cells changed, which rows are new and which are gone, matched by row id and column key. */
function diffRows<T>(prev: T[], next: T[], getRowId: (r: T) => string, columns: BoardColumn<T>[]): Diff {
  const before = new Map(prev.map((r, i) => [getRowId(r), { r, i }]));
  const after = new Set<string>();
  const d: Diff = { changed: [], added: [], removed: [], count: 0 };
  for (const r of next) {
    const id = getRowId(r);
    after.add(id);
    const old = before.get(id);
    if (!old) d.added.push(id);
    else for (const c of columns) if (c.value(old.r) !== c.value(r)) d.changed.push({ id, key: c.key });
  }
  for (const [id, { i }] of before) if (!after.has(id)) d.removed.push({ id, index: i });
  // one update per row touched, however many of its cells changed
  d.count = new Set([...d.changed.map((c) => c.id), ...d.added, ...d.removed.map((r) => r.id)]).size;
  return d;
}

interface Snap<T> {
  rows: T[];
  /** cell key -> when it last changed */
  marks: Record<string, number>;
  /** ids of rows that arrived in the latest update; they flip in from blank */
  added: Record<string, true>;
  /** removed rows, flipping to blank before they leave */
  ghosts: { id: string; row: T; index: number; at: number }[];
}

/**
 * A live table drawn as an airport split-flap board. Changed cells flip letter by letter to the new value and
 * stay marked for a few seconds. While the pointer or focus is on the board, updates wait so rows never jump
 * under you; screen readers get a short summary of each batch instead of every letter.
 */
export function DepartureBoardTable<T>({
  rows,
  getRowId,
  columns,
  caption,
  rowLabel,
  holdOnHover = true,
  flipMs = 60,
  markMs = 4000,
  loading = false,
  error = false,
  onRetry,
  updatedAt,
  stale = false,
  staleAfterMs = 60000,
  sortBy = null,
  onSortChange,
  onApply,
  onHoldChange,
  labels,
  accent = "#FFB547",
  toneColors,
  size = "md",
  uppercase = true,
  previewState,
  className = "",
}: DepartureBoardTableProps<T>) {
  const t = { ...DEFAULT_LABELS, ...labels };
  const captionId = useId();
  const reduced = useReducedMotion();
  const still = reduced || !!previewState;
  const [snap, setSnap] = useState<Snap<T>>(() => ({ rows, marks: {}, added: {}, ghosts: [] }));
  const snapRef = useRef(snap);
  // Mounted while loading: the first rows that arrive are the starting point, not a batch of changes.
  const seeded = useRef(!loading);
  const [hover, setHover] = useState(false);
  const [focusIn, setFocusIn] = useState(false);
  const [sort, setSort] = useState<BoardSort | null>(sortBy);
  const [said, setSaid] = useState("");
  const [now, setNow] = useState(0);
  const [spin, setSpin] = useState(0);
  const queue = useRef<string[]>([]);
  const timers = useRef(new Set<number>());
  const region = useRef<HTMLDivElement>(null);

  const isLoading = previewState === "loading" || (!previewState && loading);
  const isError = previewState === "error" || (!previewState && !!error);
  const held = !previewState && holdOnHover && (hover || focusIn);
  // Counted even when not held, so the count is still known in the moment the hold is released.
  const pending = useMemo(() => (rows === snap.rows ? 0 : diffRows(snap.rows, rows, getRowId, columns).count), [snap.rows, rows, getRowId, columns]);
  const waiting = previewState === "held" ? 3 : pending;

  const latest = useRef({ getRowId, columns, rowLabel, t, markMs, flipMs, still, onApply, onHoldChange, waiting });
  useEffect(() => {
    latest.current = { getRowId, columns, rowLabel, t, markMs, flipMs, still, onApply, onHoldChange, waiting };
  });
  useEffect(() => {
    const set = timers.current;
    return () => set.forEach(clearTimeout);
  }, []);

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  };

  /** Batch announcements: collect for a moment, then say a short summary once. */
  const announce = (lines: string[]) => {
    if (!lines.length) return;
    const first = queue.current.length === 0;
    queue.current.push(...lines);
    if (!first) return;
    later(() => {
      const q = queue.current;
      queue.current = [];
      const text = q.slice(0, MAX_SAID).join(". ") + (q.length > MAX_SAID ? `, ${latest.current.t.more(q.length - MAX_SAID)}` : "") + ".";
      setSaid(text);
    }, ANNOUNCE_MS);
  };

  /** Put new rows on the board: mark what changed, keep removed rows as ghosts until they've flipped blank. */
  const applyRef = useRef((next: T[]) => {
    const { getRowId: gid, columns: cols, rowLabel: rl, t: tx, markMs: mm, flipMs: fm, still: st, onApply: done } = latest.current;
    const prev = snapRef.current;
    const d = diffRows(prev.rows, next, gid, cols);
    // First real data after an initial load: put it up quietly, nothing has "changed" yet.
    if (!seeded.current) {
      seeded.current = true;
      snapRef.current = { rows: next, marks: {}, added: {}, ghosts: [] };
      setSnap(snapRef.current);
      return;
    }
    // Same values (maybe a new order or a tone change): render it, but nothing to mark or announce.
    if (d.count === 0) {
      snapRef.current = { ...prev, rows: next };
      setSnap(snapRef.current);
      return;
    }
    const at = Date.now();
    const name = (r: T) => (rl ? rl(r) : `${cols[0]?.header ?? ""} ${cols[0]?.value(r) ?? ""}`.trim());
    const byId = new Map(next.map((r) => [gid(r), r]));
    const oldById = new Map(prev.rows.map((r) => [gid(r), r]));
    const marks: Record<string, number> = {};
    for (const [k, v] of Object.entries(prev.marks)) if (at - v < mm) marks[k] = v;
    const lines: string[] = [];
    for (const c of d.changed) {
      marks[cellKey(c.id, c.key)] = at;
      const col = cols.find((x) => x.key === c.key)!;
      const row = byId.get(c.id)!;
      if (col.announce !== false) lines.push(tx.changed(name(row), col.header, col.value(row)));
    }
    const added: Record<string, true> = {};
    for (const id of d.added) {
      added[id] = true;
      for (const c of cols) marks[cellKey(id, c.key)] = at;
      lines.push(tx.added(name(byId.get(id)!)));
    }
    const ghosts = prev.ghosts.filter((g) => !byId.has(g.id));
    for (const r of d.removed) {
      ghosts.push({ id: r.id, row: oldById.get(r.id)!, index: r.index, at });
      lines.push(tx.removed(name(oldById.get(r.id)!)));
    }
    const s: Snap<T> = { rows: next, marks, added, ghosts };
    snapRef.current = s;
    setSnap(s);
    if (d.removed.length) {
      // long enough for the widest row to finish flipping blank
      const widest = cols.reduce((n, c) => n + (c.width ?? 8), 0);
      const leave = st ? 700 : (widest * 0.6 + 6) * fm + 500;
      later(() => {
        const cur = snapRef.current;
        const left = cur.ghosts.filter((g) => Date.now() - g.at < leave);
        if (left.length === cur.ghosts.length) return;
        snapRef.current = { ...cur, ghosts: left };
        setSnap(snapRef.current);
      }, leave + 20);
    }
    announce(lines);
    done?.({ changed: d.changed.length, added: d.added.length, removed: d.removed.length });
  });

  // Apply incoming rows unless the board is being read, loading or showing an error.
  useEffect(() => {
    if (previewState || held || loading || error || rows === snapRef.current.rows) return;
    const id = window.setTimeout(() => applyRef.current(rows), 0);
    return () => clearTimeout(id);
  }, [rows, held, loading, error, previewState]);

  // Tell the parent when holding starts or stops; say once that updates are waiting.
  const hasWaiting = waiting > 0;
  const wasHeld = useRef(false);
  useEffect(() => {
    if (previewState || wasHeld.current === held) return;
    wasHeld.current = held;
    latest.current.onHoldChange?.(held, latest.current.waiting);
  }, [held, previewState]);
  useEffect(() => {
    if (!held || !hasWaiting) return;
    const id = window.setTimeout(() => setSaid(latest.current.t.heldNotice), 0);
    return () => clearTimeout(id);
  }, [held, hasWaiting]);

  // A clock for "Last update … ago" and the automatic stale check.
  useEffect(() => {
    if (previewState || updatedAt == null) return;
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 5000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [updatedAt, previewState]);

  // Loading: every tile spins to random letters.
  useEffect(() => {
    if (!isLoading || still) return;
    const id = window.setInterval(() => setSpin((n) => n + 1), Math.max(240, flipMs * 6));
    return () => clearInterval(id);
  }, [isLoading, still, flipMs]);

  const age = previewState === "stale" ? 125000 : updatedAt != null && now ? Math.max(0, now - +updatedAt) : null;
  const isStale = previewState === "stale" || (!previewState && (stale || (age != null && age > staleAfterMs)));

  const widths = useMemo(() => {
    const all = [...snap.rows, ...snap.ghosts.map((g) => g.row)];
    return columns.map((c) => c.width ?? Math.min(18, Math.max(3, c.header.length, ...all.map((r) => c.value(r).length))));
  }, [columns, snap.rows, snap.ghosts]);

  // Rows on show: the live ones in order, ghosts at their old place, then the chosen sort (stable).
  const list = useMemo(() => {
    const items = [
      ...snap.rows.map((row, i) => ({ row, id: getRowId(row), ghost: false, order: i })),
      ...snap.ghosts.map((g) => ({ row: g.row, id: g.id, ghost: true, order: g.index - 0.5 })),
    ].sort((a, b) => a.order - b.order);
    const col = sort && columns.find((c) => c.key === sort.key);
    if (!col || !sort) return items;
    const dir = sort.dir === "asc" ? 1 : -1;
    return items
      .map((it, i) => ({ it, i }))
      .sort((a, b) => dir * col.value(a.it.row).localeCompare(col.value(b.it.row), undefined, { numeric: true, sensitivity: "base" }) || a.i - b.i)
      .map((x) => x.it);
  }, [snap.rows, snap.ghosts, sort, columns, getRowId]);

  const toggleSort = (key: string) => {
    const next: BoardSort | null = sort?.key !== key ? { key, dir: "asc" } : sort.dir === "asc" ? { key, dir: "desc" } : null;
    setSort(next);
    onSortChange?.(next);
  };

  const colorOf = (tone: BoardTone | undefined) => (tone && tone !== "neutral" ? { ...TONES, ...toneColors }[tone] : (toneColors?.neutral ?? accent));
  const span = columns.length;
  // static previews mark one column in the first rows, so the "changed" look is visible
  const demoCol = Math.min(3, columns.length - 1);
  const previewMark = previewState === "live" || previewState === "held" || previewState === "flipping";

  const message = (big: string, hint: string, extra?: React.ReactNode, alert?: boolean) => (
    <tr>
      <td colSpan={span} className="px-3 py-6 text-center">
        <div role={alert ? "alert" : undefined}>
          <span className="sr-only">{big}. </span>
          <FlapText text={fit(big, big.length, "left", uppercase)} stepMs={flipMs} still={still} enter={!still} />
          <p className="mt-3 font-sans text-xs font-semibold text-[#B9C0BA]">{hint}</p>
        </div>
        {extra}
      </td>
    </tr>
  );

  return (
    <div
      className={`relative w-fit max-w-full pt-3 ${className}`}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      // Only keyboard focus holds updates. A mouse click also focuses (the scroll region, a button), and that
      // focus would outlast the pointer and hold updates forever; the pointer hold covers mouse users.
      onFocus={(e) => setFocusIn(isKeyboardFocus(e.target))}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setFocusIn(false)}
    >
      {(previewState === "held" || (held && waiting > 0)) && (
        <div
          className="absolute right-3 top-0 z-10 flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold shadow-[0_8px_20px_-8px_var(--k-shadow,rgba(0,0,0,.9))]"
          style={{ background: accent, color: textOn(accent) }}
        >
          <span>{t.waiting(waiting)}</span>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => {
              if (previewState) return;
              applyRef.current(rows);
              // the pill is about to go: keep focus on the board so it doesn't fall to the page
              region.current?.focus();
            }}
            className="rounded-full underline underline-offset-2 hover:no-underline active:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
          >
            {t.showNow}
          </button>
        </div>
      )}
      <div
        className="rounded-xl border border-[#2A2F2C] p-2 shadow-[0_18px_40px_-18px_var(--k-shadow,rgba(0,0,0,.9))] sm:p-3"
        style={{ background: `linear-gradient(180deg, #161917, ${BOARD})` }}
      >
        <div
          ref={region}
          role="region"
          aria-labelledby={captionId}
          tabIndex={0}
          className="max-w-full overflow-x-auto rounded-md focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ outlineColor: accent }}
        >
          <table
            aria-busy={isLoading || undefined}
            className={`border-separate border-spacing-0 font-mono ${SIZES[size]} transition-[opacity,filter] duration-300 ${isStale ? "opacity-70 saturate-50" : ""}`}
          >
            <caption id={captionId} className="px-1 pb-2 text-left font-sans text-[0.8em] font-black uppercase tracking-[0.2em] text-[#E9EDE8]">
              {caption}
              {isLoading && <span className="sr-only">. {t.loading}</span>}
            </caption>
            <thead>
              <tr>
                {columns.map((c, ci) => {
                  const active = sort?.key === c.key ? sort.dir : null;
                  const canSort = c.sortable !== false && !isLoading && !isError;
                  return (
                    <th
                      key={c.key}
                      scope="col"
                      aria-sort={active === "asc" ? "ascending" : active === "desc" ? "descending" : undefined}
                      className={`whitespace-nowrap border-b border-[#2A2F2C] px-1.5 pb-1.5 font-sans text-[0.72em] font-bold uppercase tracking-wider text-[#B9C0BA] ${c.align === "right" ? "text-right" : "text-left"} ${ci === 0 ? "sticky left-0 z-[1]" : ""}`}
                      style={ci === 0 ? { background: BOARD } : undefined}
                    >
                      {canSort ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(c.key)}
                          className="inline-flex items-center gap-1 rounded px-0.5 uppercase hover:text-[#F4F6F2] active:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-1"
                          style={{ outlineColor: accent }}
                        >
                          {c.header}
                          <span className="sr-only">, {t.sortHint}</span>
                          <span aria-hidden="true" className={active ? "" : "opacity-40"} style={active ? { color: accent } : undefined}>
                            {active === "desc" ? "▼" : "▲"}
                          </span>
                        </button>
                      ) : (
                        c.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {isError ? (
                message(
                  t.error,
                  typeof error === "string" && error ? error : t.errorHint,
                  onRetry && (
                    <button
                      type="button"
                      onClick={() => !previewState && onRetry()}
                      className="mt-3 rounded-md border px-3 py-1 font-sans text-xs font-bold transition hover:brightness-125 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{ borderColor: accent, color: accent, outlineColor: accent }}
                    >
                      {t.retry}
                    </button>
                  ),
                  true,
                )
              ) : isLoading ? (
                Array.from({ length: 4 }, (_, r) => (
                  <tr key={r}>
                    {columns.map((c, ci) => (
                      <td key={c.key} className={`px-1.5 py-1 ${ci === 0 ? "sticky left-0 z-[1]" : ""}`} style={{ color: accent, ...(ci === 0 ? { background: BOARD } : {}) }}>
                        <FlapText
                          text={Array.from({ length: widths[ci] }, (_, i) => (still ? "·" : FLAPS[1 + (noise(spin, r * 31 + ci, i) % (FLAPS.length - 1))])).join("")}
                          stepMs={flipMs}
                          still={still}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : list.length === 0 || previewState === "empty" ? (
                message(t.empty, t.emptyHint)
              ) : (
                list.map(({ row, id, ghost }, ri) => (
                  <tr key={id} aria-hidden={ghost || undefined}>
                    {columns.map((c, ci) => {
                      const v = c.value(row);
                      const stamp = previewMark && ri < 2 && ci === demoCol ? 1 : snap.marks[cellKey(id, c.key)];
                      const Cell = ci === 0 ? "th" : "td";
                      return (
                        <Cell
                          key={c.key}
                          scope={ci === 0 ? "row" : undefined}
                          className={`px-1.5 py-1 font-normal ${c.align === "right" ? "text-right" : "text-left"} ${ci === 0 ? "sticky left-0 z-[1]" : "relative"}`}
                          style={{ color: colorOf(c.tone?.(row)), ...(ci === 0 ? { background: BOARD } : {}) }}
                        >
                          {stamp !== undefined && !ghost && <Mark stamp={stamp} ms={markMs} color={accent} still={!!previewState} />}
                          <span className="sr-only">{v}</span>
                          <FlapText
                            text={ghost ? " ".repeat(widths[ci]) : fit(v, widths[ci], c.align, uppercase)}
                            stepMs={flipMs}
                            still={still}
                            enter={!!snap.added[id]}
                            pose={previewState === "flipping" && ri < 2 && ci === demoCol}
                          />
                        </Cell>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {(age != null || isStale) && (
          <p className="mt-2 flex flex-wrap items-center gap-2 px-1 font-sans text-[0.7rem] font-semibold text-[#B9C0BA]">
            {age != null && <span>{t.updated(t.ago(age))}</span>}
            {isStale && (
              <span className="rounded-full border border-[#FFD27A]/60 px-2 py-0.5 text-[#FFD27A]">
                <span aria-hidden="true">⚠ </span>
                {t.stale}
              </span>
            )}
          </p>
        )}
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {said}
      </p>
    </div>
  );
}
