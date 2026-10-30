"use client";

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  WEEKDAYS,
  getOpenStatus,
  partsIn,
  rangesOf,
  safeZone,
  tzOffset,
  wallToInstant,
  type DayHours,
  type HoursException,
  type OpenKind,
  type OpenStatus,
  type WeeklyHours,
} from "./hours";

export type { DayHours, HoursException, OpenKind, OpenStatus, WeeklyHours, Weekday, TimeRange } from "./hours";
export { getOpenStatus } from "./hours";

/** Every state the block can show. "loading" is the server render, before the visitor's clock is known. */
export type OpenNowState = OpenKind | "loading";

/** Every word it says. {in} = time left, {time} = a clock time, {when} = today / tomorrow / a weekday, {last} = last booking time. */
export interface OpenNowLabels {
  /** Heading when no `name` is given. */
  title: string;
  openNow: string;
  closingSoon: string;
  openLate: string;
  open24h: string;
  closed: string;
  loading: string;
  closesIn: string;
  closesSoon: string;
  closesLate: string;
  closesOn: string;
  alwaysOpen: string;
  opensToday: string;
  opensTomorrow: string;
  opensOn: string;
  opensNever: string;
  today: string;
  tomorrow: string;
  minutes: string;
  hours: string;
  hoursMinutes: string;
  /** Short name of the business's place, e.g. "Dhaka". Defaults to the city in the time zone name. */
  place: string;
  /** {time} in the shop's zone, {place}, {local} in the visitor's zone. */
  visitorTime: string;
  specialToday: string;
  /** {date} and {label} of the next exception. */
  upcoming: string;
  specialHours: string;
  showWeek: string;
  hideWeek: string;
  closedDay: string;
  allDay: string;
  rangeDash: string;
  rangeJoin: string;
  /** Accessible name of the today bar. {ranges} lists today's hours, {time} is now. */
  timeline: string;
  /** Announced when the state changes (no countdown, so it isn't repeated every minute). {status}, {when}, {time}. */
  announceOpen: string;
  announceClosed: string;
}

const DEFAULT_LABELS: OpenNowLabels = {
  title: "Opening hours",
  openNow: "Open now",
  closingSoon: "Closing soon",
  openLate: "Open late",
  open24h: "Open 24 hours",
  closed: "Closed",
  loading: "Checking opening hours…",
  closesIn: "Closes in {in} ({time})",
  closesSoon: "Closes in {in} ({time}) · last bookings {last}",
  closesLate: "Open past midnight · closes {when} at {time}",
  closesOn: "Open all day · closes {when} at {time}",
  alwaysOpen: "Open around the clock",
  opensToday: "Opens today at {time}",
  opensTomorrow: "Opens tomorrow at {time}",
  opensOn: "Opens {when} at {time}",
  opensNever: "No opening hours in the next week",
  today: "today",
  tomorrow: "tomorrow",
  minutes: "{m} min",
  hours: "{h} h",
  hoursMinutes: "{h} h {m} min",
  place: "",
  visitorTime: "{time} in {place} = {local} your time",
  specialToday: "Today: {label}",
  upcoming: "Coming up · {date}: {label}",
  specialHours: "Special hours",
  showWeek: "See all hours",
  hideWeek: "Hide hours",
  closedDay: "Closed",
  allDay: "Open 24 hours",
  rangeDash: " – ",
  rangeJoin: ", ",
  timeline: "Today: {ranges}. Now {time}.",
  announceOpen: "{status}. Closes {when} at {time}.",
  announceClosed: "{status}. Opens {when} at {time}.",
};

export interface OpenNowHoursProps {
  /** Weekly hours: mon…sun → "closed", "24h" or ranges like [["09:00","13:00"],["14:00","20:00"]]. Missing days are closed. */
  hours: WeeklyHours;
  /** The business's IANA zone, e.g. "Asia/Dhaka". All open/closed math happens here. */
  timeZone: string;
  /** Holidays and special hours by date ("YYYY-MM-DD"), with an optional label. */
  exceptions?: readonly HoursException[];
  /** Fixed time (for tests and demos). Without it the block follows the real clock, minute by minute. */
  now?: Date | number;
  /** Minutes before closing that count as "closing soon" (amber). */
  soonMinutes?: number;
  /** Last bookings this many minutes before closing, shown while closing soon. */
  lastBookingMinutes?: number;
  /** Show the visitor's own time when their zone differs. */
  showVisitorTime?: boolean;
  /** The visitor's zone. Detected from the browser when left out. */
  visitorTimeZone?: string;
  /** Shown while open, e.g. a Call now link. */
  ctaWhenOpen?: ReactNode;
  /** Shown while closed, e.g. a Book online link. */
  ctaWhenClosed?: ReactNode;
  /** Heading, e.g. the shop name. */
  name?: string;
  /** Locale for times and day names. */
  locale?: string;
  labels?: Partial<OpenNowLabels>;
  /** Called when the state changes (not every minute). */
  onStatusChange?: (status: OpenStatus) => void;
  /** Days ahead an upcoming holiday is shown. */
  lookaheadDays?: number;
  /** Start with the week table open. */
  defaultExpanded?: boolean;
  /** Draw one state still, without a clock or listeners. */
  previewState?: OpenNowState;
  /** Now-marker and today highlight. */
  accent?: string;
  openColor?: string;
  soonColor?: string;
  closedColor?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: { box: "max-w-[300px] p-3.5 text-[0.8rem]", head: "text-base", bar: "h-5" },
  md: { box: "max-w-[380px] p-4 text-sm", head: "text-lg", bar: "h-7" },
  lg: { box: "max-w-[460px] p-5 text-base", head: "text-2xl", bar: "h-8" },
};
const DAY = 1440;
const NONE: readonly HoursException[] = [];

// The clock: one tick per minute, lined up with the minute boundary, asleep while the tab is hidden.
const minuteNow = () => Math.floor(Date.now() / 60000) * 60000;
function subscribeClock(cb: () => void) {
  let t = 0;
  const schedule = () => {
    clearTimeout(t);
    if (document.hidden) return;
    t = window.setTimeout(() => {
      cb();
      schedule();
    }, 60000 - (Date.now() % 60000) + 30);
  };
  const onVisible = () => {
    if (!document.hidden) cb();
    schedule();
  };
  document.addEventListener("visibilitychange", onVisible);
  schedule();
  return () => {
    clearTimeout(t);
    document.removeEventListener("visibilitychange", onVisible);
  };
}
const noSubscribe = () => () => {};
const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const serverNull = () => null;

/** Dark text on light colours, white on dark ones. */
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
const tint = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

// Stand-in week for still previews when the given hours can't show the asked-for state.
const SAMPLE: WeeklyHours = { mon: [["10:00", "13:30"], ["14:30", "20:00"]], tue: [["10:00", "20:00"]], wed: [["10:00", "20:00"]], thu: "closed", fri: [["10:00", "20:00"]], sat: [["17:00", "02:00"]], sun: "24h" };
const SAMPLE_EXCEPTIONS: HoursException[] = [{ date: "2026-01-08", hours: "closed", label: "Closed for Puja holiday" }];

/** First moment in the coming week (15-minute steps) where these hours are in `kind`. */
function findMoment(kind: OpenKind, base: number, input: Omit<Parameters<typeof getOpenStatus>[0], "now">) {
  for (let i = 0; i < 8 * 96; i++) {
    const t = base + i * 15 * 60000;
    if (getOpenStatus({ ...input, now: t }).kind === kind) return t;
  }
  return null;
}

/**
 * A business-hours block that answers "can I go now?" at a glance: open, closing soon or closed, and when that
 * changes, worked out on the business's own clock. Shows today as a bar with a now marker, the visitor's own time
 * when their zone differs, holidays, and the full week on demand.
 */
export function OpenNowHours({
  hours,
  timeZone,
  exceptions = NONE,
  now,
  soonMinutes = 30,
  lastBookingMinutes = 15,
  showVisitorTime = true,
  visitorTimeZone,
  ctaWhenOpen,
  ctaWhenClosed,
  name,
  locale,
  labels,
  onStatusChange,
  lookaheadDays = 14,
  defaultExpanded = false,
  previewState,
  accent = "#C6FF3D",
  openColor = "#5BE38A",
  soonColor = "#FFB547",
  closedColor = "#FF6B57",
  size = "md",
  className = "",
}: OpenNowHoursProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const ids = useId();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const zone = safeZone(timeZone);
  const still = previewState !== undefined;
  const fixed = now === undefined ? undefined : +now;

  const clock = useSyncExternalStore(still || fixed !== undefined ? noSubscribe : subscribeClock, minuteNow, serverNull);
  const detected = useSyncExternalStore(noSubscribe, browserZone, serverNull);
  const visitor = still ? null : (visitorTimeZone ? safeZone(visitorTimeZone) : detected);

  // Still previews look for a real moment in the hours that shows the state, so the preview never lies.
  const preview = useMemo(() => {
    if (!previewState || previewState === "loading") return null;
    const own = { hours, timeZone: zone, exceptions, soonMinutes, lookaheadDays };
    const base = fixed ?? wallToInstant(2026, 1, 5, 0, zone);
    const t = findMoment(previewState, base, own);
    if (t !== null) return { input: own, at: t };
    const sample = { hours: SAMPLE, timeZone: zone, exceptions: SAMPLE_EXCEPTIONS, soonMinutes, lookaheadDays };
    const base2 = wallToInstant(2026, 1, 5, 0, zone);
    return { input: sample, at: findMoment(previewState, base2, sample) ?? base2 };
  }, [previewState, hours, zone, exceptions, soonMinutes, lookaheadDays, fixed]);

  const at = preview ? preview.at : still ? null : (fixed ?? clock);
  const status = useMemo(
    () => (at === null ? null : getOpenStatus(preview ? { ...preview.input, now: at } : { hours, timeZone: zone, exceptions, soonMinutes, lookaheadDays, now: at })),
    [at, preview, hours, zone, exceptions, soonMinutes, lookaheadDays],
  );
  const shownHours = preview ? preview.input.hours : hours;

  const f = useMemo(() => {
    const wall = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
    const zoned = (tz: string, day: boolean) => new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: tz, ...(day ? { weekday: "short" } : {}) });
    const longDay = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" });
    const date = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
    return {
      wall: (min: number) => wall.format(Date.UTC(1970, 0, 1, 0, ((min % DAY) + DAY) % DAY)),
      inZone: (ms: number, tz: string, day = false) => zoned(tz, day).format(ms),
      day: (wd: number) => longDay.format(Date.UTC(1970, 0, 4 + wd)),
      date: (isoDate: string) => {
        const [y, m, d] = isoDate.split("-").map(Number);
        return date.format(Date.UTC(y, m - 1, d));
      },
    };
  }, [locale]);

  const span = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h === 0 ? fill(text.minutes, { m }) : m === 0 ? fill(text.hours, { h }) : fill(text.hoursMinutes, { h, m });
  };
  const dayText = (dh: DayHours) =>
    dh === "closed" ? text.closedDay : dh === "24h" ? text.allDay : rangesOf(dh).map(([s, e]) => f.wall(s) + text.rangeDash + f.wall(e)).join(text.rangeJoin);

  const kind: OpenNowState = status ? status.kind : "loading";
  const color = !status ? "var(--k-line,#3A433F)" : kind === "closing-soon" ? soonColor : status.open ? openColor : closedColor;
  const heading = { open: text.openNow, overnight: text.openLate, "open-24h": text.open24h, "closing-soon": text.closingSoon, loading: text.loading }[kind as string] ?? text.closed;

  let detail = "";
  let visitorLine = "";
  let announce = "";
  if (status) {
    const c = status.changeAt;
    const k = c === null ? 0 : Math.floor(c / DAY);
    const when = k === 0 ? text.today : k === 1 ? text.tomorrow : f.day((status.week[0].weekday + k) % 7);
    const v = { in: span(status.minutesLeft ?? 0), time: c === null ? "" : f.wall(c), when, last: c === null ? "" : f.wall(c - lastBookingMinutes) };
    if (c === null) detail = status.open ? text.alwaysOpen : text.opensNever;
    else if (status.open)
      detail = fill(kind === "closing-soon" ? text.closesSoon : kind === "overnight" ? text.closesLate : kind === "open-24h" ? text.closesOn : text.closesIn, v);
    else detail = fill(k === 0 ? text.opensToday : k === 1 ? text.opensTomorrow : text.opensOn, v);
    announce = c === null ? `${heading}. ${detail}` : fill(status.open ? text.announceOpen : text.announceClosed, { ...v, status: heading });
    if (status.todayException?.label) announce += ` ${status.todayException.label}.`;

    const ms = status.changeInstant;
    if (showVisitorTime && visitor && ms !== null && tzOffset(ms, visitor) !== tzOffset(ms, zone)) {
      const sameDay = partsIn(ms, visitor).d === partsIn(ms, zone).d;
      const place = text.place || zone.split("/").pop()!.replace(/_/g, " ");
      visitorLine = fill(text.visitorTime, { time: f.inZone(ms, zone), place, local: f.inZone(ms, visitor, !sameDay) });
    }
  }
  // Report only when the state or its target time changes, not on every minute tick.
  const spoken = status ? `${kind}|${status.changeAt}` : "";

  const latest = useRef({ onStatusChange, status });
  useEffect(() => {
    latest.current = { onStatusChange, status };
  });
  useEffect(() => {
    if (!spoken || still) return;
    const s = latest.current.status;
    if (s) latest.current.onStatusChange?.(s);
  }, [spoken, still]);

  const sz = SIZES[size];
  const mute = "text-[var(--k-mute,#8A938D)]";
  const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)]";
  const cta = !still && status ? (status.open ? ctaWhenOpen : ctaWhenClosed) : null;
  const week = status ? status.week : [1, 2, 3, 4, 5, 6, 0].map((wd) => ({ date: String(wd), weekday: wd, hours: shownHours[WEEKDAYS[wd]] ?? ("closed" as DayHours), exception: undefined }));
  const ticks = [0, 6, 12, 18, 24].map((h) => f.wall(h * 60).replace(/:00/, ""));
  const ranges = status ? status.todayRanges : [];

  return (
    <section
      aria-labelledby={`${ids}-t`}
      aria-busy={!status || undefined}
      className={`w-full ${sz.box} rounded-2xl border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] text-[var(--k-text,#E9EDE8)] shadow-[0_10px_30px_-14px_var(--k-shadow,rgba(0,0,0,.9))] ${className}`}
    >
      <h3 id={`${ids}-t`} className={`mb-2 text-[0.85em] font-semibold ${mute}`}>
        {name ?? text.title}
      </h3>

      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className={`relative inline-block size-2.5 shrink-0 rounded-full ${!status ? "motion-safe:animate-pulse" : ""}`}
          style={{ background: color, boxShadow: `0 0 0 4px ${tint(color, 22)}` }}
        />
        <p className={`${sz.head} font-bold leading-tight ${!status ? mute : ""}`}>{heading}</p>
      </div>
      {status ? (
        <p className="mt-1 min-h-[1.4em] font-medium">{detail}</p>
      ) : (
        <span aria-hidden="true" className="mt-2 block h-3 w-2/3 rounded bg-[var(--k-panel-2,#181D1B)] motion-safe:animate-pulse" />
      )}
      {status?.todayException?.label && (
        <p className="mt-1.5 inline-flex rounded-md border px-2 py-0.5 text-[0.85em] font-semibold" style={{ borderColor: tint(color, 60), background: tint(color, 12) }}>
          {fill(text.specialToday, { label: status.todayException.label })}
        </p>
      )}
      {visitorLine && <p className={`mt-1 text-[0.85em] ${mute}`}>{visitorLine}</p>}

      {/* Today as a bar: open ranges tinted, the current one stronger, a marker at now. */}
      <div
        role="img"
        aria-label={status ? fill(text.timeline, { ranges: ranges.length ? ranges.map(([s, e]) => f.wall(s) + text.rangeDash + f.wall(e)).join(text.rangeJoin) : text.closedDay, time: f.wall(Math.floor(status.nowMin)) }) : text.loading}
        className={`relative mt-3.5 ${sz.bar} overflow-hidden rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-panel-2,#181D1B)]`}
      >
        {ranges.map(([s, e]) => {
          const here = status!.open && s <= status!.nowMin && status!.nowMin < e;
          return <span key={s} className="absolute inset-y-0" style={{ left: `${(s / DAY) * 100}%`, width: `${((e - s) / DAY) * 100}%`, background: tint(here ? color : openColor, here ? 45 : 22) }} />;
        })}
        {status && (
          <span
            aria-hidden="true"
            className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-[var(--k-text,#E9EDE8)] motion-safe:transition-[left] motion-safe:duration-300"
            style={{ left: `${(status.nowMin / DAY) * 100}%` }}
          >
            <span className="absolute -top-px left-1/2 size-2 -translate-x-1/2 rounded-full border border-[var(--k-text,#E9EDE8)]" style={{ background: accent }} />
          </span>
        )}
      </div>
      <div aria-hidden="true" className={`mt-1 flex justify-between text-[0.7em] ${mute}`}>
        {ticks.map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>

      {cta && <div className="mt-3.5 flex flex-wrap gap-2">{cta}</div>}

      {status?.upcoming && (
        <p className={`mt-3 text-[0.85em] ${mute}`}>{fill(text.upcoming, { date: f.date(status.upcoming.date), label: status.upcoming.label ?? text.specialHours })}</p>
      )}

      <div className="mt-3 border-t border-[var(--k-line,#3A433F)] pt-2.5">
        {still ? (
          <span className={`text-[0.85em] font-semibold ${mute}`}>{text.showWeek}</span>
        ) : (
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={`${ids}-w`}
            onClick={() => setExpanded((x) => !x)}
            className={`inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 -ml-1.5 text-[0.85em] font-semibold text-[var(--k-text,#E9EDE8)] transition-colors hover:bg-[var(--k-panel-2,#181D1B)] active:translate-y-px ${focus}`}
          >
            <span aria-hidden="true" className={`inline-block motion-safe:transition-transform ${expanded ? "rotate-90" : ""}`}>
              ›
            </span>
            {expanded ? text.hideWeek : text.showWeek}
          </button>
        )}
        <table id={`${ids}-w`} hidden={still || !expanded} className="mt-2 w-full border-collapse text-[0.9em]">
          <caption className="sr-only">{name ?? text.title}</caption>
          <tbody>
            {week.map((d, i) => {
              const today = !!status && i === 0;
              return (
                <tr key={d.date} aria-current={today ? "date" : undefined} className={today ? "bg-[var(--k-panel-2,#181D1B)] font-semibold" : ""}>
                  <th scope="row" className="relative py-1.5 pl-2.5 pr-3 text-left align-top font-semibold">
                    {today && <span aria-hidden="true" className="absolute inset-y-1 left-0 w-[3px] rounded" style={{ background: accent }} />}
                    {f.day(d.weekday)}
                  </th>
                  <td className="py-1.5 pr-2 text-right align-top tabular-nums">
                    {dayText(d.hours)}
                    {d.exception && <span className={`block text-[0.85em] font-normal ${mute}`}>{d.exception.label ?? text.specialHours}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {still ? "" : announce}
      </p>
    </section>
  );
}

/** Text colour that reads on a hex accent, for CTA buttons placed in the slots. */
export const readableOn = textOn;
