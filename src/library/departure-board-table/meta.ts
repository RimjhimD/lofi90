import type { Entry } from "@/lib/registry";
import type { Playground } from "@/lib/playgrounds";

export const ENTRY: Entry = {
  slug: "departure-board-table",
  ext: "10",
  name: "Departure Board Table",
  type: "table",
  week: 5,
  icon: "🛫",
  summary: "A live table drawn as a split-flap board. Changed cells flip to the new value, and updates wait while you're reading.",
  why: "Live tables (order queues, support tickets, deliveries, builds) change silently. People miss that a status changed, rows jump around while they're about to click one, and screen readers either hear nothing or hear every tiny change. This board flips each changed cell letter by letter like an airport sign and marks it for a few seconds, so changes are seen. While your pointer or focus is on it, new updates wait and a pill counts them. Screen readers get one short summary per batch.",
  files: [
    { label: "DepartureBoardTable.tsx", path: "src/library/departure-board-table/DepartureBoardTable.tsx" },
    { label: "Flap.tsx", path: "src/library/departure-board-table/Flap.tsx" },
  ],
  usagePath: "src/library/departure-board-table/usage.tsx",
  promptPath: "src/library/departure-board-table/prompt.md",
  props: [
    { name: "rows", type: "T[]", default: "required", description: "The current rows. Pass a new array whenever your data updates." },
    { name: "getRowId", type: "(row: T) => string", default: "required", description: "A stable id per row. Changes are matched by this id and the column key." },
    { name: "columns", type: "BoardColumn<T>[]", default: "required", description: "{ key, header, value(row), width? in characters, align?, tone?(row) ok/warn/bad/neutral, announce?, sortable? }." },
    { name: "caption", type: "string", default: "required", description: "Board title, also the table caption." },
    { name: "rowLabel", type: "(row: T) => string", default: "first column", description: "How a row is named when changes are announced, e.g. \"Order 1042\"." },
    { name: "holdOnHover", type: "boolean", default: "true", description: "Hold updates while the pointer is on the board or focus is inside it." },
    { name: "flipMs", type: "number", default: "60", description: "Time per letter step of a flip." },
    { name: "markMs", type: "number", default: "4000", description: "How long a changed cell stays marked." },
    { name: "loading", type: "boolean", default: "false", description: "Tiles spin to random letters and the table is marked busy." },
    { name: "error", type: "boolean | string", default: "false", description: "Show SERVICE INTERRUPTED. A string replaces the hint under it." },
    { name: "onRetry", type: "() => void", default: "—", description: "Adds a Retry button to the error state." },
    { name: "updatedAt", type: "number | Date", default: "—", description: "When the data was fetched. Shows \"Last update 2 min ago\"." },
    { name: "stale", type: "boolean", default: "false", description: "Force the stale look: dimmed board and a warning." },
    { name: "staleAfterMs", type: "number", default: "60000", description: "Data older than this (from updatedAt) counts as stale on its own." },
    { name: "sortBy", type: "{ key: string; dir: \"asc\" | \"desc\" } | null", default: "null", description: "Starting sort. Header buttons cycle ascending, descending, off." },
    { name: "onSortChange", type: "(sort) => void", default: "—", description: "Runs when someone changes the sort." },
    { name: "onApply", type: "(summary) => void", default: "—", description: "Runs after updates land: { changed, added, removed }." },
    { name: "onHoldChange", type: "(held: boolean, waiting: number) => void", default: "—", description: "Runs when holding starts or stops." },
    { name: "labels", type: "Partial<BoardLabels>", default: "English defaults", description: "Every string: the waiting pill, Show now, the announcements (changed, added, removed, more), empty, error, retry, last update and stale text." },
    { name: "accent", type: "string", default: '"#FFB547"', description: "Letter colour of neutral cells and the changed marker." },
    { name: "toneColors", type: "Partial<Record<BoardTone, string>>", default: "green / yellow / coral", description: "Letter colours for ok, warn and bad cells." },
    { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Tile size." },
    { name: "uppercase", type: "boolean", default: "true", description: "Print values in capitals like a real board." },
    { name: "previewState", type: '"live" | "flipping" | "held" | "loading" | "empty" | "error" | "stale"', default: "—", description: "Render one state without running anything." },
    { name: "className", type: "string", default: '""', description: "Extra classes for the wrapper." },
  ],
  tryIt: [
    "Watch the board for a few seconds: an order's status flips letter by letter and stays marked.",
    "Rest your mouse on the board. New orders wait and a pill counts them. Move away and they flip in.",
    "Press Fail feed, then Retry. Or press Make stale and see the board admit its data is old.",
  ],
  flow: [
    { icon: "📥", title: "New rows arrive", text: "The board compares them with what's on show, by row id and column." },
    {
      icon: "✋",
      title: "Is someone reading?",
      text: "Pointer or focus on the board: the update waits and a pill counts it.",
      branches: [
        { label: "Show now", text: "Applies the waiting updates straight away.", tone: "good" },
        { label: "Move away", text: "The waiting updates flip in.", tone: "neutral" },
      ],
    },
    {
      icon: "🔤",
      title: "Cells flip",
      text: "Only changed cells flip, letter by letter. New rows flip in from blank; removed rows flip blank and leave.",
      branches: [{ label: "Reduced motion", text: "No flips, the value just changes.", tone: "neutral" }],
    },
    { icon: "🟧", title: "Marked and announced", text: "Changed cells keep a fading marker. Screen readers hear one short summary of the batch." },
    {
      icon: "⚠️",
      title: "Feed trouble",
      text: "The board says so instead of showing old data as current.",
      branches: [
        { label: "Feed fails", text: "SERVICE INTERRUPTED with Retry.", tone: "bad" },
        { label: "Data too old", text: "Board dims, shows when it last updated.", tone: "bad" },
      ],
    },
  ],
  useWhen: ["Order queues, kitchen or pickup boards", "Support tickets, deliveries or build status that update on their own", "Wall screens where people glance to see what changed"],
  avoidWhen: ["Big data tables people edit or filter heavily", "Data that changes many times a second; flips can't keep up"],
  accessibility: [
    "A real <table> with caption, column headers and row headers; tiles are hidden and the real value is read",
    "Changes are announced in short polite batches, never per letter; noisy columns can opt out",
    "Updates wait while focus is inside, so keyboard users aren't moved around; Show now keeps focus on the board",
    "Sort buttons set aria-sort; reduced motion turns flips off but keeps the changed marker",
  ],
  support: "Works in all modern browsers. No extra packages.",
};

const ACCENTS = [
  { value: "#FFB547", label: "Amber" },
  { value: "#C6FF3D", label: "Lime" },
  { value: "#3DD9FF", label: "Cyan" },
  { value: "#E9EDE8", label: "White" },
  { value: "#FF6B57", label: "Coral" },
];

export const PLAYGROUND: Playground = {
  initial: { accent: "#FFB547", size: "md", flipMs: 60, holdOnHover: "on" },
  controls: [
    { key: "accent", label: "Letter colour", type: "color", options: ACCENTS },
    { key: "size", label: "Size", type: "segment", options: [{ value: "sm", label: "S" }, { value: "md", label: "M" }, { value: "lg", label: "L" }] },
    { key: "flipMs", label: "Flip speed", type: "slider", min: 30, max: 200, step: 10, unit: "ms" },
    { key: "holdOnHover", label: "Hold while reading", type: "segment", options: [{ value: "on", label: "On" }, { value: "off", label: "Off" }] },
  ],
};

export const CARD_STATE = "flipping";

export const TICKER: [string, string, "acc" | "warn" | "mute"] = ["departure-board-table", "order #1043 · BAKING → READY · 2 updates held", "acc"];
