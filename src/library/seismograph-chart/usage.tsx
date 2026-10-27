"use client";

import { useEffect, useState } from "react";
import { SeismographChart, type Reading } from "@/library/seismograph-chart/SeismographChart";

const HISTORY = 5 * 60 * 1000;

// Errors per second from a server-sent event stream. The chart is controlled: append each reading
// and trim anything older than the history you want to scrub through.
export function ErrorRateMonitor() {
  const [points, setPoints] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // History and the stream can arrive in either order: merge by time, drop duplicates, keep the last 5 minutes.
    const merge = (incoming: Reading[]) =>
      setPoints((ps) => {
        const byTime = new Map([...ps, ...incoming].map((p) => [p.t, p]));
        const all = [...byTime.values()].sort((a, b) => a.t - b.t);
        const newest = all.length ? all[all.length - 1].t : 0;
        return all.filter((p) => p.t >= newest - HISTORY);
      });
    const valid = (x: unknown): x is Reading =>
      typeof x === "object" && x !== null && Number.isFinite((x as Reading).t) && Number.isFinite((x as Reading).v);

    fetch("/api/metrics/errors?last=300")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`History failed: ${r.status}`))))
      .then((history: unknown) => {
        if (!cancelled && Array.isArray(history)) merge(history.filter(valid));
      })
      .catch((err) => console.warn(err))
      .finally(() => !cancelled && setLoading(false));

    const stream = new EventSource("/api/metrics/errors/stream");
    stream.onmessage = (e) => {
      try {
        const reading: unknown = JSON.parse(e.data);
        if (valid(reading)) merge([reading]);
      } catch {
        // ignore a malformed message; the next one will arrive shortly
      }
    };
    return () => {
      cancelled = true;
      stream.close();
    };
  }, []);

  return (
    <SeismographChart
      label="Errors per second"
      unit="/s"
      points={points}
      loading={loading}
      threshold={25}
      windowMs={60_000}
      historyMs={HISTORY}
      staleAfterMs={15_000}
      onSpike={(p) => fetch("/api/alerts", { method: "POST", body: JSON.stringify({ metric: "errors", ...p }) })}
    />
  );
}
