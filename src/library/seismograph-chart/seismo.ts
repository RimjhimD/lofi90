/** Small pure helpers for SeismographChart: text placeholders, a nice value scale, a smooth line and colour contrast. */

export interface Reading {
  /** Time of the reading, in milliseconds (Date.now() style). */
  t: number;
  v: number;
}

/** Every visible and announced string. {name} placeholders are filled in. */
export interface SeismographLabels {
  pause: string;
  /** Button that leaves pause and jumps back to now. */
  live: string;
  liveChip: string;
  pausedChip: string;
  spikeChip: string;
  /** {s} = seconds since the last reading. */
  stale: string;
  empty: string;
  loading: string;
  /** Red-ink label on the paper. {v} value, {time} time. */
  spike: string;
  /** {v} = threshold. */
  threshold: string;
  /** Crosshair readout while paused. {v} value with unit, {time} time. */
  readout: string;
  /** Chart summary read by screen readers. {label} {v} {low} {high} {n} */
  summary: string;
  emptySummary: string;
  spikeAnnounce: string;
  /** {time} = time of the newest reading. */
  pausedAnnounce: string;
  liveAnnounce: string;
  hintLive: string;
  hintPaused: string;
  showTable: string;
  hideTable: string;
  /** {n} = number of rows. */
  tableCaption: string;
  colTime: string;
  colValue: string;
  colNote: string;
  noteSpike: string;
  noteHigh: string;
  spikesTitle: string;
  /** {time} = time of the reading shown big while paused. */
  at: string;
}

export const DEFAULT_LABELS: SeismographLabels = {
  pause: "Pause",
  live: "Live ▸",
  liveChip: "Live",
  pausedChip: "Paused",
  spikeChip: "Spike",
  stale: "No data for {s}s",
  empty: "Waiting for the first reading",
  loading: "Loading readings…",
  spike: "Spike {v} · {time}",
  threshold: "Alert at {v}",
  readout: "{time} · {v}",
  summary: "{label}. Now {v}. Low {low}, high {high} on screen. Spikes: {n}.",
  emptySummary: "{label}. No readings yet.",
  spikeAnnounce: "Spike: {v} at {time}.",
  pausedAnnounce: "Paused at {time}. Arrow keys step through readings.",
  liveAnnounce: "Back to live.",
  hintLive: "Space pauses. Drag the paper to look back.",
  hintPaused: "Arrows step through readings, Shift jumps 10. Space or Esc goes live.",
  showTable: "Show as table",
  hideTable: "Hide table",
  tableCaption: "Last {n} readings",
  colTime: "Time",
  colValue: "Value",
  colNote: "Note",
  noteSpike: "Spike",
  noteHigh: "Above alert",
  spikesTitle: "Spikes",
  at: "at {time}",
};

/** Replace {name} placeholders in a label. Unknown names are left as they are. */
export const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));

const pad = (n: number) => String(n).padStart(2, "0");
/** Local wall-clock time, HH:MM:SS. */
export const clockTime = (t: number) => {
  const d = new Date(t);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
/** Rounds to one decimal and drops a trailing .0, the same on server and browser. */
export const plainNumber = (v: number) => String(Math.round(v * 10) / 10);

function niceStep(raw: number) {
  const p = 10 ** Math.floor(Math.log10(raw));
  const f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}

/** A value range with round tick steps. Fixed min/max win; otherwise the range hugs the data (and the threshold) with some padding. */
export function niceRange(values: number[], min?: number, max?: number, threshold?: number) {
  const vs = threshold == null ? values : [...values, threshold];
  let lo = min ?? (vs.length ? Math.min(...vs) : 0);
  let hi = max ?? (vs.length ? Math.max(...vs) : 100);
  if (hi - lo < 1e-9) {
    lo -= 1;
    hi += 1;
  }
  const padding = (hi - lo) * 0.12;
  const step = niceStep((hi - lo + padding * 2) / 4);
  if (min == null) {
    lo = Math.floor((lo - padding) / step) * step;
    if (lo < 0 && vs.every((v) => v >= 0)) lo = 0;
  }
  if (max == null) hi = Math.ceil((hi + padding) / step) * step;
  const ticks: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-6; v += step) ticks.push(Math.round(v / step) * step);
  return { lo, hi, ticks };
}

/** Index of the reading closest in time to t (readings sorted by time). */
export function nearestIndex(rs: Reading[], t: number) {
  let a = 0;
  let b = rs.length - 1;
  if (b < 0) return -1;
  while (b - a > 1) {
    const m = (a + b) >> 1;
    if (rs[m].t < t) a = m;
    else b = m;
  }
  return Math.abs(rs[a].t - t) <= Math.abs(rs[b].t - t) ? a : b;
}

const n2 = (n: number) => n.toFixed(1);
/** A smooth line through the points (Catmull-Rom as cubic curves). A point with gap=true starts a new piece, so missing data shows as a break. */
export function smoothPath(pts: { x: number; y: number; gap: boolean }[]) {
  let d = "";
  for (let i = 0; i < pts.length; i++) {
    const p2 = pts[i];
    if (i === 0 || p2.gap) {
      d += `M${n2(p2.x)} ${n2(p2.y)}`;
      continue;
    }
    const p1 = pts[i - 1];
    const p0 = i >= 2 && !p1.gap ? pts[i - 2] : p1;
    const p3 = i + 1 < pts.length && !pts[i + 1].gap ? pts[i + 1] : p2;
    d += `C${n2(p1.x + (p2.x - p0.x) / 6)} ${n2(p1.y + (p2.y - p0.y) / 6)} ${n2(p2.x - (p3.x - p1.x) / 6)} ${n2(p2.y - (p3.y - p1.y) / 6)} ${n2(p2.x)} ${n2(p2.y)}`;
  }
  return d;
}

/** Dark text on light colours, white on dark ones, so any hex fill stays readable. Other colours get dark text. */
export function textOn(hex: string): string {
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
