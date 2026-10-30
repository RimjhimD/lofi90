"use client";

import { useState } from "react";
import { useLoop } from "@/lib/loop";
import { OpenNowHours, type OpenNowState, type WeeklyHours } from "./OpenNowHours";
import { wallToInstant } from "./hours";

const TZ = "Asia/Dhaka";
const SALON: WeeklyHours = {
  mon: [["10:00", "13:30"], ["14:30", "20:00"]],
  tue: [["10:00", "20:00"]],
  wed: [["10:00", "20:00"]],
  thu: [["10:00", "20:00"]],
  fri: [["15:00", "21:00"]],
  sat: [["18:00", "01:00"]],
};
const PHARMACY: WeeklyHours = { mon: "24h", tue: "24h", wed: "24h", thu: "24h", fri: "24h", sat: "24h", sun: "24h" };
// Monday 5 Jan 2026, midnight in Dhaka; the holiday is that Wednesday.
const MONDAY = wallToInstant(2026, 1, 5, 0, TZ);
const EXCEPTIONS = [{ date: "2026-01-07", hours: "closed" as const, label: "Closed for Puja holiday" }];

const still = (state: OpenNowState, hours = SALON, name = "Bella Salon") => (
  <OpenNowHours previewState={state} hours={hours} timeZone={TZ} exceptions={EXCEPTIONS} now={MONDAY} name={name} size="sm" />
);

/** Looping scene: the clock runs from 7:20 PM past closing time, so the block goes green → amber → red. */
function ClosingScene() {
  const [step, setStep] = useState(0);
  const { ref, run, stop } = useLoop(4600, [600, 1300, 2000, 2700, 3400].map((ms) => [ms, (root: HTMLElement) => root.querySelector<HTMLElement>("[data-tick]")?.click()]));
  // Each loop starts at 7:20 PM again (adjusted during render, not in an effect).
  const [seen, setSeen] = useState(run);
  if (seen !== run) {
    setSeen(run);
    setStep(0);
  }
  return (
    <div ref={ref} onClick={stop} className="w-full">
      <button type="button" hidden data-tick onClick={() => setStep((s) => s + 1)} />
      <OpenNowHours hours={SALON} timeZone={TZ} visitorTimeZone={TZ} now={MONDAY + (19 * 60 + 20 + step * 12) * 60000} name="Bella Salon" size="sm" />
    </div>
  );
}

/** Every state: still previews found in real hours, plus one live closing-time loop. */
export const OPEN_NOW_HOURS_STATES = [
  { id: "open", label: "Open", note: "Green, with the time left until closing.", node: still("open") },
  { id: "closing-soon", label: "Closing soon", note: "Under soonMinutes left: amber, with the last booking time.", node: still("closing-soon") },
  { id: "live", label: "Closing time (live)", note: "The clock runs past 8 PM: green, then amber, then red.", node: <ClosingScene /> },
  { id: "closed-opens-later-today", label: "Closed, opens later today", note: "A lunch break: it says when it opens again.", node: still("closed-opens-later-today") },
  { id: "closed-opens-tomorrow", label: "Closed, opens tomorrow", note: "Closed for the night, with tomorrow's opening time.", node: still("closed-opens-tomorrow") },
  { id: "holiday", label: "Holiday", note: "A dated exception replaces the normal hours and shows why.", node: still("holiday") },
  { id: "overnight", label: "Open past midnight", note: "A 6 PM – 1 AM range stays open into the next day.", node: still("overnight") },
  { id: "open-24h", label: "Open 24 hours", note: "Every day open all day: the whole bar is green.", node: still("open-24h", PHARMACY, "City Pharmacy") },
  { id: "loading", label: "Loading (server)", note: "Before the visitor's clock is known: a calm skeleton, no wrong guess.", node: still("loading") },
];
