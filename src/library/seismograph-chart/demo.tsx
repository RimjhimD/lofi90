"use client";

import { useEffect, useRef, useState } from "react";
import type { ControlValues } from "@/site/Controls";
import { say } from "@/site/log";
import { SeismographChart, type Reading, type SeismographChartProps } from "./SeismographChart";

const EVERY = 700;
const HISTORY = 5 * 60 * 1000;

/** A normal minute of signups: a slow swell plus noise. A burst is a campaign email landing. */
const signups = (t: number, burst: boolean) => (burst ? 125 + Math.random() * 35 : 42 + 12 * Math.sin(t / 9000) + (Math.random() - 0.5) * 16);

/** Live preview: a signups-per-minute monitor fed every 0.7 s, with buttons to cause a spike or stop the feed. */
export default function SeismographChartDemo({ controls = {} }: { controls?: ControlValues }) {
  const look = controls as Pick<SeismographChartProps, "accent" | "size" | "threshold" | "windowMs">;
  const threshold = look.threshold ?? 100;
  const [points, setPoints] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [feed, setFeed] = useState(true);
  const [run, setRun] = useState(0);
  const burst = useRef(0);

  // Load the last 30 seconds first, like a real dashboard asking the server for history.
  useEffect(() => {
    const id = window.setTimeout(() => {
      const now = Date.now();
      setPoints(Array.from({ length: 43 }, (_, i) => ({ t: now - (43 - i) * EVERY, v: signups(now - (43 - i) * EVERY, false) })));
      setLoading(false);
      say("History loaded: the last 30 seconds. A new reading now arrives every 0.7 s.", "info");
    }, 900);
    return () => clearTimeout(id);
  }, [run]);

  // The feed. Now and then a burst happens on its own; "Cause a spike" forces one.
  useEffect(() => {
    if (!feed || loading) return;
    const id = window.setInterval(() => {
      if (burst.current === 0 && Math.random() < 0.02) burst.current = 2;
      const isBurst = burst.current > 0;
      if (isBurst) burst.current--;
      const t = Date.now();
      setPoints((ps) => [...ps.filter((p) => p.t >= t - HISTORY), { t, v: signups(t, isBurst) }]);
    }, EVERY);
    return () => clearInterval(id);
  }, [feed, loading]);

  const btn =
    "rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] px-3 py-1.5 text-xs font-semibold text-[var(--k-text,#E9EDE8)] transition-colors hover:border-[var(--k-acc-text,#C6FF3D)] active:translate-y-px focus-visible:outline-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)] disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <SeismographChart
        points={points}
        loading={loading}
        label="Signups per minute"
        unit="/min"
        accent={look.accent}
        size={look.size}
        threshold={threshold}
        windowMs={look.windowMs ?? 60000}
        onSpike={(p) => say(`Spike: ${Math.round(p.v)}/min crossed the alert line at ${threshold}. Red ink on the paper, the needle kicked, onSpike fired once.`, "bad")}
        onPausedChange={(p) =>
          say(p ? "Paused. The paper stops; drag it or use the arrow keys to read any moment. New readings still arrive underneath." : "Live again. The paper jumps back to now.", p ? "wait" : "good")
        }
      />
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          disabled={!feed || loading}
          onClick={() => {
            burst.current = 2;
            say("Burst on the way: the next two readings will jump well above the alert line.", "wait");
          }}
          className={btn}
        >
          Cause a spike
        </button>
        <button
          type="button"
          disabled={loading}
          aria-pressed={!feed}
          onClick={() => {
            setFeed(!feed);
            say(feed ? "Feed stopped. The paper keeps moving with no ink; after 10 s the chart says how long it has had no data." : "Feed back on. The pen drops onto the paper again.", feed ? "wait" : "good");
          }}
          className={btn}
        >
          {feed ? "Stop the feed" : "Start the feed"}
        </button>
        <button
          type="button"
          onClick={() => {
            setPoints([]);
            setLoading(true);
            setFeed(true);
            setRun((r) => r + 1);
            say("Reset. Loading history again.");
          }}
          className={btn}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
