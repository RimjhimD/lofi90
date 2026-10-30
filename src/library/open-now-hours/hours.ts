/**
 * Time-zone math for OpenNowHours. Everything is worked out on the business's own wall clock with
 * Intl.DateTimeFormat, then turned back into real instants so "closes in" stays right across DST changes.
 * No libraries.
 */

export type Weekday = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
export const WEEKDAYS: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/** "HH:MM" open and close, 24-hour clock. A close at or before the open runs past midnight ("18:00"–"02:00"). */
export type TimeRange = readonly [open: string, close: string];
/** A day: closed, open all day, or one or more ranges (two ranges = a lunch break). */
export type DayHours = "closed" | "24h" | readonly TimeRange[];
export type WeeklyHours = Partial<Record<Weekday, DayHours>>;

/** Holiday or special hours for one date ("YYYY-MM-DD" in the business's zone). Replaces that weekday's hours. */
export interface HoursException {
  date: string;
  hours: DayHours;
  label?: string;
}

export type OpenKind =
  | "open"
  | "closing-soon"
  | "overnight"
  | "open-24h"
  | "closed-opens-later-today"
  | "closed-opens-tomorrow"
  | "closed-opens-later"
  | "holiday";

export interface DayInfo {
  date: string;
  /** 0 = Sunday. */
  weekday: number;
  hours: DayHours;
  exception?: HoursException;
}

export interface OpenStatus {
  kind: OpenKind;
  open: boolean;
  /** The business's wall clock right now, in minutes since its midnight. */
  nowMin: number;
  /** Next change (closing when open, opening when closed) in wall minutes from today's midnight; null if none within a week. */
  changeAt: number | null;
  /** The same moment as a real timestamp (ms). */
  changeInstant: number | null;
  /** Whole minutes until that change. */
  minutesLeft: number | null;
  /** Open ranges of today, clipped to 0–1440, for the timeline. */
  todayRanges: [number, number][];
  /** Seven days starting today, with exceptions applied. */
  week: DayInfo[];
  todayException?: HoursException;
  /** The next exception after today within the look-ahead. */
  upcoming?: HoursException;
}

const DAY = 1440;
const fmtCache = new Map<string, Intl.DateTimeFormat>();

/** A zone Intl understands; an unknown one falls back to UTC instead of throwing. */
export function safeZone(tz: string): string {
  if (fmtCache.has(tz)) return tz;
  try {
    zoneFmt(tz);
    return tz;
  } catch {
    return "UTC";
  }
}

function zoneFmt(tz: string) {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" });
    fmtCache.set(tz, f);
  }
  return f;
}

/** Wall-clock parts of an instant in a zone. */
export function partsIn(ms: number, tz: string) {
  const p: Record<string, number> = {};
  for (const { type, value } of zoneFmt(tz).formatToParts(ms)) if (type !== "literal") p[type] = Number(value);
  return { y: p.year, m: p.month, d: p.day, h: p.hour % 24, mi: p.minute, s: p.second };
}

/** How far a zone is ahead of UTC at an instant, in ms. */
export function tzOffset(ms: number, tz: string) {
  const p = partsIn(ms, tz);
  const whole = ms - (((ms % 1000) + 1000) % 1000);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - whole;
}

/** The real instant of a wall-clock time in a zone (a gap or overlap at a DST change resolves to the first match). */
export function wallToInstant(y: number, m: number, d: number, minutes: number, tz: string) {
  const guess = Date.UTC(y, m - 1, d, 0, minutes);
  const first = guess - tzOffset(guess, tz);
  return guess - tzOffset(first, tz);
}

export function addDays(y: number, m: number, d: number, k: number): [number, number, number] {
  const t = new Date(Date.UTC(y, m - 1, d + k));
  return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()];
}

const iso = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const weekdayOf = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d)).getUTCDay();

function toMin(hhmm: string) {
  const [h, m = "0"] = hhmm.split(":");
  return Math.min(DAY, Math.max(0, Number(h) * 60 + Number(m)));
}

/** A day's open ranges in minutes from its own midnight; overnight ones end after 1440. */
export function rangesOf(hours: DayHours): [number, number][] {
  if (hours === "closed") return [];
  if (hours === "24h") return [[0, DAY]];
  return hours.map(([a, b]) => {
    const s = toMin(a);
    const e = toMin(b);
    return [s, e <= s ? e + DAY : e] as [number, number];
  });
}

function merge(list: [number, number][]) {
  const out: [number, number][] = [];
  for (const [s, e] of [...list].sort((a, b) => a[0] - b[0])) {
    const last = out[out.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  }
  return out;
}

export function resolveDay(weekly: WeeklyHours, exceptions: readonly HoursException[], y: number, m: number, d: number): DayInfo {
  const date = iso(y, m, d);
  const weekday = weekdayOf(y, m, d);
  const exception = exceptions.find((x) => x.date === date);
  return { date, weekday, hours: exception ? exception.hours : (weekly[WEEKDAYS[weekday]] ?? "closed"), exception };
}

export interface StatusInput {
  hours: WeeklyHours;
  timeZone: string;
  now: number;
  exceptions?: readonly HoursException[];
  soonMinutes?: number;
  /** How many days ahead an upcoming exception is shown. */
  lookaheadDays?: number;
}

/** Where a business stands at `now`: open or closed, why, and when that changes. Pure. */
export function getOpenStatus({ hours, timeZone, now, exceptions = [], soonMinutes = 30, lookaheadDays = 14 }: StatusInput): OpenStatus {
  const tz = safeZone(timeZone);
  const p = partsIn(now, tz);
  const nowMin = p.h * 60 + p.mi + p.s / 60;

  // Yesterday (for ranges running past midnight) through a week ahead, joined into continuous open spans.
  const days: DayInfo[] = [];
  const spans: [number, number][] = [];
  for (let k = -1; k <= 7; k++) {
    const info = resolveDay(hours, exceptions, ...addDays(p.y, p.m, p.d, k));
    days.push(info);
    for (const [s, e] of rangesOf(info.hours)) spans.push([k * DAY + s, k * DAY + e]);
  }
  const open = merge(spans);
  const cur = open.find(([s, e]) => s <= nowMin && nowMin < e);
  const next = cur ? undefined : open.find(([s]) => s > nowMin);
  let changeAt: number | null = cur ? cur[1] : next ? next[0] : null;
  if (changeAt !== null && changeAt >= 8 * DAY) changeAt = null; // still open at the end of the week we looked at

  const instantOf = (wall: number) => {
    const k = Math.floor(wall / DAY);
    return wallToInstant(...addDays(p.y, p.m, p.d, k), wall - k * DAY, tz);
  };
  const changeInstant = changeAt === null ? null : instantOf(changeAt);
  const minutesLeft = changeInstant === null ? null : Math.max(0, Math.ceil((changeInstant - now) / 60000));

  const today = days[1];
  let kind: OpenKind;
  if (cur) {
    if (minutesLeft !== null && minutesLeft <= soonMinutes) kind = "closing-soon";
    else if (cur[0] <= 0 && cur[1] >= DAY) kind = "open-24h";
    else if (cur[0] < 0 || cur[1] > DAY) kind = "overnight";
    else kind = "open";
  } else if (today.exception) kind = "holiday";
  else if (changeAt !== null && changeAt < DAY) kind = "closed-opens-later-today";
  else if (changeAt !== null && changeAt < 2 * DAY) kind = "closed-opens-tomorrow";
  else kind = "closed-opens-later";

  const todayRanges = open
    .filter(([s, e]) => e > 0 && s < DAY)
    .map(([s, e]) => [Math.max(0, s), Math.min(DAY, e)] as [number, number]);

  const last = iso(...addDays(p.y, p.m, p.d, lookaheadDays));
  const upcoming = [...exceptions].filter((x) => x.date > today.date && x.date <= last).sort((a, b) => (a.date < b.date ? -1 : 1))[0];

  return { kind, open: !!cur, nowMin, changeAt, changeInstant, minutesLeft, todayRanges, week: days.slice(1, 8), todayException: today.exception, upcoming };
}
