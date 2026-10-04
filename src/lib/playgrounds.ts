import type { Control, ControlValues } from "@/site/Controls";

const ACCENTS = [
  { value: "#C6FF3D", label: "Lime" },
  { value: "#3DD9FF", label: "Cyan" },
  { value: "#FFB547", label: "Amber" },
  { value: "#FF6B57", label: "Coral" },
  { value: "#B79CFF", label: "Lilac" },
  { value: "#E9EDE8", label: "White" },
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
    initial: { color: "#C6FF3D", fuseColor: "#FFB547", spark: "pulse", size: "md", delayMs: 5000 },
    controls: [
      { key: "color", label: "Button colour", type: "color", options: ACCENTS },
      {
        key: "fuseColor",
        label: "Fuse colour",
        type: "color",
        options: [
          { value: "#FFB547", label: "Amber" },
          { value: "#FF6B57", label: "Coral" },
          { value: "#3DD9FF", label: "Cyan" },
          { value: "#E9EDE8", label: "White" },
        ],
      },
      { key: "spark", label: "Spark", type: "segment", options: [{ value: "pulse", label: "Pulse" }, { value: "steady", label: "Steady" }, { value: "none", label: "None" }] },
      { key: "size", label: "Size", type: "segment", options: SIZES },
      { key: "delayMs", label: "Fuse length", type: "slider", min: 2000, max: 10000, step: 1000, unit: "s", scale: 0.001 },
    ],
  },
  "secret-key-field": {
    initial: { accent: "#C6FF3D", drain: "ring", size: "md", peekMs: 3000, visibleChars: 4 },
    controls: [
      { key: "accent", label: "Accent", type: "color", options: ACCENTS },
      { key: "drain", label: "Peek countdown", type: "segment", options: [{ value: "ring", label: "Ring" }, { value: "bar", label: "Bar" }, { value: "none", label: "None" }] },
      { key: "size", label: "Size", type: "segment", options: SIZES },
      { key: "peekMs", label: "Peek time", type: "slider", min: 1000, max: 8000, step: 500, unit: "s", scale: 0.001 },
      { key: "visibleChars", label: "Characters shown", type: "slider", min: 2, max: 8, step: 1 },
    ],
  },
  "rolodex-carousel": {
    initial: { accent: "#C6FF3D", flipMs: 450, behind: 4, tilt: 7 },
    controls: [
      { key: "accent", label: "Wheel colour", type: "color", options: ACCENTS },
      { key: "flipMs", label: "Flip speed", type: "slider", min: 150, max: 1200, step: 50, unit: "ms" },
      { key: "behind", label: "Cards behind", type: "slider", min: 1, max: 6, step: 1 },
      { key: "tilt", label: "Lean", type: "slider", min: 0, max: 16, step: 1, unit: "°" },
    ],
  },
  "split-bill-card": {
    initial: { accent: "#C6FF3D", coin: "#FFC94A", coinMotion: "drop", taxRate: 0.08, tipRate: 0.18 },
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
  "island-notification": {
    initial: { accent: "#3DD9FF", morphMs: 520, duration: 4000, hold: "on" },
    controls: [
      { key: "accent", label: "Glow", type: "color", options: ACCENTS },
      { key: "morphMs", label: "Morph speed", type: "slider", min: 200, max: 1200, step: 50, unit: "ms" },
      { key: "duration", label: "Stays open", type: "slider", min: 2000, max: 8000, step: 500, unit: "s", scale: 0.001 },
      { key: "hold", label: "Wait while typing", type: "segment", options: [{ value: "on", label: "On" }, { value: "off", label: "Off" }] },
    ],
  },
};
