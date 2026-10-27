import type { Entry } from "@/lib/registry";
import type { Playground } from "@/lib/playgrounds";

export const ENTRY: Entry = {
  slug: "seismograph-chart",
  ext: "11",
  name: "Seismograph Chart",
  type: "chart",
  week: 6,
  icon: "📈",
  summary: "A live line chart drawn by a pen on scrolling paper. Pause it, scrub back to any spike, and read it as a table.",
  why: "Live charts for things like signups per minute or errors per second usually jump each time a reading lands, scroll the interesting moment away before you can read it, and say nothing to a screen reader. This chart is a seismograph: a pen on the right writes onto paper that glides left smoothly between readings. When a value crosses your alert line the needle kicks, the paper gets a red-ink mark and the spike is labelled with its value and time. Press Space or drag the paper to stop it and step back through the last five minutes with a crosshair. It goes quiet when off screen, tells you when the data has stopped, and announces only spikes and a calm summary, with the last readings one click away as a real table.",
  files: [
    { label: "SeismographChart.tsx", path: "src/library/seismograph-chart/SeismographChart.tsx" },
    { label: "seismo.ts", path: "src/library/seismograph-chart/seismo.ts" },
  ],
  usagePath: "src/library/seismograph-chart/usage.tsx",
  promptPath: "src/library/seismograph-chart/prompt.md",
  props: [
    { name: "points", type: "{ t: number; v: number }[]", default: "required", description: "Readings, oldest first, t in milliseconds. Controlled: append new readings and trim old ones in the parent." },
    { name: "label", type: "string", default: "required", description: "Chart name, shown as the caption and used in the screen-reader summary." },
    { name: "windowMs", type: "number", default: "60000", description: "How much time fits on the paper at once." },
    { name: "historyMs", type: "number", default: "300000", description: "How far back you can scrub while paused. Older readings are ignored." },
    { name: "min / max", type: "number", default: "auto", description: "Fixed scale. Leave out for a scale that fits the readings on screen with round steps and some padding." },
    { name: "threshold", type: "number", default: "—", description: "The alert line. Each upward crossing is a spike." },
    { name: "unit", type: "string", default: '""', description: 'Added after values, e.g. "/min".' },
    { name: "formatValue / formatTime", type: "(n: number) => string", default: "1 decimal / HH:MM:SS", description: "How values and times are written everywhere." },
    { name: "onSpike", type: "(point) => void", default: "—", description: "Fires once per new crossing. Readings already there when the chart mounts don't fire." },
    { name: "paused / defaultPaused", type: "boolean", default: "— / false", description: "Controlled or uncontrolled pause." },
    { name: "onPausedChange", type: "(paused: boolean) => void", default: "—", description: "Called when the user pauses or goes live." },
    { name: "staleAfterMs", type: "number", default: "10000", description: "No reading for this long: the pen lifts and it says \"No data for 12s\"." },
    { name: "announceEveryMs", type: "number", default: "30000", description: "How often the screen-reader summary is announced while live. 0 turns it off." },
    { name: "tableRows", type: "number", default: "10", description: "Rows in the \"Show as table\" view." },
    { name: "loading", type: "boolean", default: "false", description: "Shows the loading state and marks the chart busy." },
    { name: "labels", type: "Partial<SeismographLabels>", default: "English defaults", description: "Every piece of text: buttons, chips, spike label, readout, hints, table headings and all announcements, with {v}, {time}, {s} and {n} placeholders." },
    { name: "accent", type: "string", default: '"#C6FF3D"', description: "Ink colour of the line and pen; also the Live button (text colour picked automatically)." },
    { name: "spikeColor", type: "string", default: '"#FF5D5D"', description: "Red ink for spike marks and the alert line." },
    { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Paper height: 150, 200 or 260px. Width follows the container." },
    { name: "previewState", type: '"live" | "paused" | "spike" | "empty" | "stale" | "loading"', default: "—", description: "Render one state without running anything." },
    { name: "className", type: "string", default: '""', description: "Extra classes for the wrapper." },
  ],
  tryIt: [
    "Watch the pen write signups onto the paper, then press Cause a spike.",
    "Press Pause (or Space on the chart) and drag the paper, or use the arrow keys, to read the spike. Live ▸ takes you back.",
    "Press Stop the feed and wait 10 seconds: the pen lifts and the chart says how long there has been no data.",
  ],
  flow: [
    { icon: "📥", title: "A reading arrives", text: "The parent appends { t, v } to points. The line is redrawn once; it is not redrawn every frame." },
    {
      icon: "🖋️",
      title: "The pen writes, the paper moves",
      text: "A requestAnimationFrame loop slides the paper left with real time and the needle eases to the new value.",
      branches: [
        { label: "Off screen or tab hidden", text: "The loop stops until you can see it again.", tone: "neutral" },
        { label: "Reduced motion", text: "No gliding: the paper steps once per reading.", tone: "neutral" },
      ],
    },
    {
      icon: "📍",
      title: "Crosses the alert line",
      text: "The needle kicks, a red tick and label go on the paper, onSpike fires once and the spike is announced.",
      branches: [{ label: "Stays above", text: "No new spike until it drops back below and crosses again.", tone: "neutral" }],
    },
    {
      icon: "⏸️",
      title: "Pause and scrub",
      text: "Space, the Pause button or a drag freezes the paper. Arrows or dragging move a crosshair through the last five minutes.",
      branches: [{ label: "Live ▸", text: "Jumps back to now.", tone: "good" }],
    },
    {
      icon: "🔇",
      title: "Data stops",
      text: "After staleAfterMs the pen lifts, the needle rests and the chip says how long it has been.",
      branches: [{ label: "Readings resume", text: "The pen drops back and a gap stays on the paper.", tone: "good" }],
    },
  ],
  useWhen: ["Live counters on an ops or launch dashboard: signups, orders, errors", "API latency or queue depth where a spike must be noticed and inspected", "Any feed people watch and then want to stop and read"],
  avoidWhen: ["Static or historical reports, where a normal line chart is clearer", "Comparing many series at once; this draws one line"],
  accessibility: [
    "The chart is focusable with role=\"img\" and a summary label: current value, low and high on screen, spike count",
    "Only spikes and a summary every 30 s are announced, never every reading",
    "Keyboard: Space pauses, arrows (Shift for 10) and Home/End scrub, Esc goes live; Show as table gives a real <table>",
    "Visible focus ring on light and dark stages; reduced motion makes the paper step instead of glide",
  ],
  support: "Works in all modern browsers. Uses requestAnimationFrame, IntersectionObserver and ResizeObserver. No extra packages.",
};

export const PLAYGROUND: Playground = {
  initial: { accent: "#C6FF3D", size: "md", threshold: 100, windowMs: 60000 },
  controls: [
    {
      key: "accent",
      label: "Ink colour",
      type: "color",
      options: [
        { value: "#C6FF3D", label: "Lime" },
        { value: "#3DD9FF", label: "Cyan" },
        { value: "#FFB547", label: "Amber" },
        { value: "#B79CFF", label: "Lilac" },
        { value: "#E9EDE8", label: "White" },
      ],
    },
    { key: "size", label: "Size", type: "segment", options: [{ value: "sm", label: "S" }, { value: "md", label: "M" }, { value: "lg", label: "L" }] },
    { key: "threshold", label: "Alert line", type: "slider", min: 60, max: 160, step: 5, unit: "/min" },
    { key: "windowMs", label: "Paper shows", type: "slider", min: 20000, max: 120000, step: 10000, unit: "s", scale: 0.001 },
  ],
};

export const CARD_STATE = "spike";

export const TICKER: [string, string, "acc" | "warn" | "mute"] = ["seismograph-chart", "needle kicked · spike 142/min at 14:03:21", "acc"];
