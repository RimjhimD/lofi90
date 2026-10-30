"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ControlValues } from "@/site/Controls";
import { say } from "@/site/log";
import { OpenNowHours, readableOn, type OpenNowHoursProps, type OpenStatus, type WeeklyHours } from "./OpenNowHours";
import { addDays, partsIn, wallToInstant } from "./hours";

const TZ = "Asia/Dhaka";
const HOURS: WeeklyHours = {
  mon: [["10:00", "13:30"], ["14:30", "20:00"]],
  tue: [["10:00", "13:30"], ["14:30", "20:00"]],
  wed: [["10:00", "13:30"], ["14:30", "20:00"]],
  thu: [["10:00", "13:30"], ["14:30", "20:00"]],
  fri: [["15:00", "21:00"]],
  sat: [["10:00", "14:00"], ["18:00", "01:00"]],
  sun: [["10:00", "20:00"]],
};
const ZONES = [
  { tz: "Europe/London", label: "London" },
  { tz: "Asia/Dhaka", label: "Dhaka" },
  { tz: "America/New_York", label: "New York" },
];
const STEP = 15;
const WEEK = 7 * 1440;

// Midnight today in Dhaka, read once on the client (the server renders the loading state).
let anchor = 0;
const getAnchor = () => {
  if (!anchor) {
    const p = partsIn(Date.now(), TZ);
    anchor = wallToInstant(p.y, p.m, p.d, 0, TZ);
  }
  return anchor;
};
const noSub = () => () => {};
const minuteNow = () => Math.floor(Date.now() / 60000);
const iso = ([y, m, d]: [number, number, number]) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const btn =
  "rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] px-2.5 py-1 text-xs font-semibold text-[var(--k-text,#E9EDE8)] transition-colors hover:border-[var(--k-acc-text,#C6FF3D)] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)] aria-pressed:border-[var(--k-acc-text,#C6FF3D)] aria-pressed:bg-[var(--k-panel-2,#181D1B)]";

/** Live preview: a salon's hours card. Scrub the clock through the week and switch the visitor's city. */
export default function OpenNowHoursDemo({ controls = {} }: { controls?: ControlValues }) {
  const look = controls as Pick<OpenNowHoursProps, "accent" | "size" | "soonMinutes">;
  const accent = look.accent ?? "#C6FF3D";
  const base = useSyncExternalStore(noSub, getAnchor, () => 0);
  const [offset, setOffset] = useState<number | null>(null); // minutes after midnight today; null = real clock
  const [visitor, setVisitor] = useState(ZONES[0].tz);
  const touched = useRef(false);
  const liveMinute = useSyncExternalStore(noSub, minuteNow, () => 0);

  const today = base ? partsIn(base, TZ) : null;
  const holiday = today ? iso(addDays(today.y, today.m, today.d, 2)) : "";
  const exceptions = holiday ? [{ date: holiday, hours: "closed" as const, label: "Closed for Puja holiday" }] : [];

  // Once on load: run the clock through a closing time so the colours change on their own.
  useEffect(() => {
    if (!base || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const p = partsIn(base, TZ);
    const start = new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay();
    let day = 0;
    while (day === 2 || (start + day) % 7 === 5 || (start + day) % 7 === 6) day++; // a plain 8 PM closing, not the holiday
    const from = day * 1440 + 19 * 60 + 15;
    const timers: number[] = [];
    for (let i = 0; i <= 18; i++)
      timers.push(window.setTimeout(() => !touched.current && setOffset(from + i * 5), 700 + i * 160));
    return () => timers.forEach(clearTimeout);
  }, [base]);

  const fmt = (min: number) =>
    new Intl.DateTimeFormat(undefined, { weekday: "short", hour: "numeric", minute: "2-digit", timeZone: TZ }).format(base + min * 60000);

  const report = (s: OpenStatus) => {
    const left = s.minutesLeft ?? 0;
    const lines: Record<OpenStatus["kind"], [string, "good" | "wait" | "bad" | "info"]> = {
      open: [`Open now. Green, and it counts down to closing: ${left} min left.`, "good"],
      overnight: ["Open late. This range runs past midnight, so it stays open into the next day.", "good"],
      "open-24h": ["Open all day.", "good"],
      "closing-soon": [`Closing soon. Under ${look.soonMinutes ?? 30} minutes left, so it turns amber and shows the last booking time.`, "wait"],
      "closed-opens-later-today": ["Closed for the lunch break. It says when it opens again today.", "bad"],
      "closed-opens-tomorrow": ["Closed. It says when it opens tomorrow, in the salon's own time.", "bad"],
      "closed-opens-later": ["Closed for a few days. It names the day it opens again.", "bad"],
      holiday: ["Holiday: the date's exception replaces the normal hours and shows its reason.", "bad"],
    };
    say(...lines[s.kind]);
  };

  const cta = (label: string, msg: string) => (
    <button
      type="button"
      onClick={() => say(msg, "info")}
      style={{ background: accent, color: readableOn(accent) }}
      className="rounded-lg px-3.5 py-2 text-sm font-bold transition-[filter,transform] hover:brightness-110 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)]"
    >
      {label}
    </button>
  );

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <OpenNowHours
        {...look}
        name="Bella Salon · Dhanmondi"
        hours={HOURS}
        timeZone={TZ}
        exceptions={exceptions}
        now={base && offset !== null ? base + offset * 60000 : undefined}
        visitorTimeZone={visitor}
        onStatusChange={report}
        ctaWhenOpen={cta("Call now", "Call now pressed. Shown only while the salon is open.")}
        ctaWhenClosed={cta("Book online", "Book online pressed. Shown while the salon is closed, instead of Call now.")}
      />

      <div className="w-full max-w-[380px] space-y-3 text-xs text-[var(--k-mute,#8A938D)]">
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label htmlFor="onh-time" className="font-semibold text-[var(--k-text,#E9EDE8)]">
              Try another time
            </label>
            <span className="tabular-nums">{base ? (offset === null ? "Real time" : `${fmt(offset)} in Dhaka`) : ""}</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="onh-time"
              type="range"
              min={0}
              max={WEEK - STEP}
              step={STEP}
              disabled={!base}
              value={offset ?? (base ? Math.floor((liveMinute - base / 60000) / STEP) * STEP : 0)}
              aria-valuetext={base && offset !== null ? fmt(offset) : "Real time"}
              onChange={(e) => {
                touched.current = true;
                setOffset(Number(e.target.value));
              }}
              className="h-6 flex-1 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)]"
              style={{ accentColor: accent }}
            />
            <button
              type="button"
              className={btn}
              disabled={offset === null}
              onClick={() => {
                touched.current = true;
                setOffset(null);
                say("Back on the real clock. It updates every minute and sleeps while the tab is hidden.");
              }}
            >
              Now
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="You are in">
          <span className="mr-1 font-semibold text-[var(--k-text,#E9EDE8)]">You are in:</span>
          {ZONES.map((z) => (
            <button
              key={z.tz}
              type="button"
              aria-pressed={visitor === z.tz}
              className={btn}
              onClick={() => {
                setVisitor(z.tz);
                say(
                  z.tz === TZ ? "Visitor in Dhaka: same zone as the salon, so no extra line." : `Visitor in ${z.label}: the salon's times also show in ${z.label} time.`,
                  "info",
                );
              }}
            >
              {z.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
