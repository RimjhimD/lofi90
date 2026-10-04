import type { Control, ControlValues } from "@/site/Controls";

const ACCENTS = [
  { value: "#D7263D", label: "Signal red" },
  { value: "#1A1A17", label: "Ink" },
  { value: "#0E3B2E", label: "Bottle green" },
  { value: "#1D4ED8", label: "Blue" },
  { value: "#C2410C", label: "Burnt orange" },
  { value: "#0F766E", label: "Teal" },
];
const SIZES = [
  { value: "sm", label: "S" },
  { value: "md", label: "M" },
  { value: "lg", label: "L" },
];

export interface Playground {
  controls: Control[];
  initial: ControlValues;
}

/** The live controls shown under each component's preview. Keys are the component's own prop names. */
export const PLAYGROUNDS: Record<string, Playground> = {
  "undo-fuse-button": {
    initial: { color: "#D7263D", fuseColor: "#A86A00", spark: "pulse", size: "md", delayMs: 5000 },
    controls: [
      { key: "color", label: "Button colour", type: "color", options: ACCENTS },
      {
        key: "fuseColor",
        label: "Fuse colour",
        type: "color",
        options: [
          { value: "#A86A00", label: "Amber" },
          { value: "#D7263D", label: "Red" },
          { value: "#1A1A17", label: "Ink" },
          { value: "#0F766E", label: "Teal" },
        ],
      },
      { key: "spark", label: "Spark", type: "segment", options: [{ value: "pulse", label: "Pulse" }, { value: "steady", label: "Steady" }, { value: "none", label: "None" }] },
      { key: "size", label: "Size", type: "segment", options: SIZES },
      { key: "delayMs", label: "Fuse length", type: "slider", min: 2000, max: 10000, step: 1000, unit: "s", scale: 0.001 },
    ],
  },
  "secret-key-field": {
    initial: { accent: "#D7263D", drain: "ring", size: "md", peekMs: 3000, visibleChars: 4 },
    controls: [
      { key: "accent", label: "Accent", type: "color", options: ACCENTS },
      { key: "drain", label: "Peek countdown", type: "segment", options: [{ value: "ring", label: "Ring" }, { value: "bar", label: "Bar" }, { value: "none", label: "None" }] },
      { key: "size", label: "Size", type: "segment", options: SIZES },
      { key: "peekMs", label: "Peek time", type: "slider", min: 1000, max: 8000, step: 500, unit: "s", scale: 0.001 },
      { key: "visibleChars", label: "Characters shown", type: "slider", min: 2, max: 8, step: 1 },
    ],
  },
  "rolodex-carousel": {
    initial: { accent: "#D7263D", flipMs: 450, behind: 4, tilt: 7 },
    controls: [
      { key: "accent", label: "Wheel colour", type: "color", options: ACCENTS },
      { key: "flipMs", label: "Flip speed", type: "slider", min: 150, max: 1200, step: 50, unit: "ms" },
      { key: "behind", label: "Cards behind", type: "slider", min: 1, max: 6, step: 1 },
      { key: "tilt", label: "Lean", type: "slider", min: 0, max: 16, step: 1, unit: "°" },
    ],
  },
  "split-bill-card": {
    initial: { accent: "#D7263D", coin: "#FFC94A", coinMotion: "drop", taxRate: 0.08, tipRate: 0.18 },
    controls: [
      { key: "accent", label: "Accent", type: "color", options: ACCENTS },
      {
        key: "coin",
        label: "Coins",
        type: "color",
        options: [
          { value: "#FFC94A", label: "Gold" },
          { value: "#D9DDE3", label: "Silver" },
          { value: "#E0965A", label: "Copper" },
          { value: "#9BE3C2", label: "Mint" },
        ],
      },
      { key: "coinMotion", label: "Coin motion", type: "segment", options: [{ value: "drop", label: "Drop" }, { value: "pop", label: "Pop" }, { value: "none", label: "None" }] },
      { key: "taxRate", label: "Tax", type: "slider", min: 0, max: 0.2, step: 0.01, unit: "%", scale: 100 },
      { key: "tipRate", label: "Tip", type: "slider", min: 0, max: 0.3, step: 0.01, unit: "%", scale: 100 },
    ],
  },
};
