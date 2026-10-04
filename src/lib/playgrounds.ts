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
  "tape-measure-input": {
    initial: { accent: "#C6FF3D", size: "md", step: 5 },
    controls: [
      { key: "accent", label: "Tape colour", type: "color", options: ACCENTS },
      { key: "size", label: "Size", type: "segment", options: SIZES },
      { key: "step", label: "Snaps to", type: "slider", min: 1, max: 20, step: 1, unit: " cm" },
    ],
  },
  "string-nav": {
    initial: { accent: "#C6FF3D", tension: 5, wobble: 9, size: "md" },
    controls: [
      { key: "accent", label: "Bead colour", type: "color", options: ACCENTS },
      { key: "tension", label: "Tension", type: "slider", min: 1, max: 10, step: 1 },
      { key: "wobble", label: "Wobble", type: "slider", min: 0, max: 16, step: 1, unit: "px" },
      { key: "size", label: "Size", type: "segment", options: SIZES },
    ],
  },
  "vinyl-crate-carousel": {
    initial: { accent: "#C6FF3D", rpm: "33", flipMs: 450, size: "md" },
    controls: [
      { key: "accent", label: "Glow", type: "color", options: ACCENTS },
      { key: "rpm", label: "Speed", type: "segment", options: [{ value: "33", label: "33 rpm" }, { value: "45", label: "45 rpm" }] },
      { key: "flipMs", label: "Flip speed", type: "slider", min: 200, max: 1200, step: 50, unit: "ms" },
      { key: "size", label: "Size", type: "segment", options: SIZES },
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
  "boarding-pass-card": {
    initial: { accent: "#C6FF3D", tearDistance: 110, size: "md" },
    controls: [
      { key: "accent", label: "Stamp colour", type: "color", options: ACCENTS },
      { key: "tearDistance", label: "Pull to tear", type: "slider", min: 60, max: 220, step: 10, unit: "px" },
      { key: "size", label: "Size", type: "segment", options: SIZES },
    ],
  },
};
