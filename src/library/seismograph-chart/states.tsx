"use client";

import { useEffect, useState } from "react";
import { SeismographChart, type Reading } from "./SeismographChart";

/** A fixed afternoon so the still previews look the same on the server and in the browser. */
const BASE = Date.UTC(2026, 9, 27, 14, 2, 0);
const pad = (n: number) => String(n).padStart(2, "0");
const utcTime = (t: number) => {
  const d = new Date(t);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
};
const wave = (i: number) => 44 + 12 * Math.sin(i / 6) + 6 * Math.sin(i * 1.7);
/** 80 readings 0.7 s apart; spikes at the given indexes. */
const sample = (spikeAt: number[]) => Array.from({ length: 80 }, (_, i) => ({ t: BASE + i * 700, v: spikeAt.includes(i) ? 128 + (i % 5) * 4 : wave(i) }));
const CALM = sample([]);
const WITH_SPIKE = sample([30, 31]);
const SPIKE_NOW = sample([30, 31, 79]);

/** A real feed for the moving states: readings every 0.7 s, with a burst every few seconds if asked. */
function Feed({ bursts = false }: { bursts?: boolean }) {
  const [points, setPoints] = useState<Reading[]>([]);
  useEffect(() => {
    let i = 0;
    const add = () => {
      const t = Date.now();
      const v = bursts && i % 12 >= 10 ? 130 + (i % 3) * 6 : wave(i);
      i++;
      setPoints((ps) => [...ps.slice(-120), { t, v }]);
    };
    const first = window.setTimeout(() => {
      const now = Date.now();
      setPoints(Array.from({ length: 40 }, (_, j) => ({ t: now - (40 - j) * 700, v: wave(j - 40) })));
    }, 0);
    const id = window.setInterval(add, 700);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [bursts]);
  return <SeismographChart points={points} label="Signups per minute" unit="/min" threshold={100} size="sm" windowMs={30000} announceEveryMs={0} />;
}

const still = { label: "Signups per minute", unit: "/min", threshold: 100, size: "sm", windowMs: 40000, formatTime: utcTime } as const;

/** Every state. Live and Spike run a real feed; the rest are still. */
export const SEISMOGRAPH_CHART_STATES = [
  { id: "live", label: "Live", note: "The pen writes each reading; the paper scrolls smoothly between them.", node: <Feed /> },
  { id: "spike", label: "Spike", note: "A crossing over the alert line: the needle kicks, red ink marks it and it is labelled.", node: <Feed bursts /> },
  { id: "spike-still", label: "Spike (still)", note: "The same moment frozen: red tick on the paper edge, the label and a glowing pen.", node: <SeismographChart {...still} points={SPIKE_NOW} previewState="spike" /> },
  { id: "paused", label: "Paused", note: "The paper stops. A crosshair reads out the time and value of any reading.", node: <SeismographChart {...still} points={WITH_SPIKE} previewState="paused" /> },
  { id: "stale", label: "Stale", note: "No reading for over 10 s: the pen lifts, the needle rests and it says how long.", node: <SeismographChart {...still} points={CALM} previewState="stale" /> },
  { id: "empty", label: "Empty", note: "Nothing has arrived yet. Pause and table are switched off (disabled) until it does.", node: <SeismographChart {...still} points={[]} previewState="empty" /> },
  { id: "loading", label: "Loading", note: "History is still loading. The chart is marked busy.", node: <SeismographChart {...still} points={[]} loading previewState="loading" /> },
];
