import type { Entry } from "@/lib/registry";
import type { Playground } from "@/lib/playgrounds";

export const ENTRY: Entry = {
  slug: "tab-progress-loader",
  ext: "10",
  name: "Tab Progress Loader",
  type: "loader",
  week: 5,
  icon: "⏳",
  summary: "A progress loader that keeps counting in the browser tab. Switch away and the tab icon fills as a ring and the title says \"42% · Exporting\".",
  why: "Long exports, uploads and report jobs take minutes, so people switch to another tab and forget. Then they either come back too early and wait, or come back much later. This loader keeps reporting in the browser tab itself: the little tab icon fills up as a ring, the title shows the percent, and when it is done the icon turns into a green ✓ (or a red ! if it failed). An optional notification says it's ready. When you come back, the tab's own title and icon return.",
  files: [
    { label: "TabProgressLoader.tsx", path: "src/library/tab-progress-loader/TabProgressLoader.tsx" },
    { label: "tab.tsx", path: "src/library/tab-progress-loader/tab.tsx" },
  ],
  usagePath: "src/library/tab-progress-loader/usage.tsx",
  promptPath: "src/library/tab-progress-loader/prompt.md",
  props: [
    { name: "progress", type: "number | null", default: "required", description: "0–100. Use null when the length is unknown: the bar slides and the tab icon spins." },
    { name: "status", type: '"idle" | "running" | "done" | "error" | "cancelled"', default: "required", description: "Where the job is. Done and error show ✓ or ! in the tab until the user comes back." },
    { name: "label", type: "string", default: '"Exporting report"', description: "What is happening. Shown on the card and in the tab title." },
    { name: "tabMode", type: '"hidden-only" | "always" | "off"', default: '"hidden-only"', description: "When the tab shows progress: only while the user is on another tab, all the time, or never." },
    { name: "notify", type: "boolean", default: "false", description: "Send a system notification if the job ends while the tab is hidden. Clicking it brings the tab back. Permission is asked from a click only." },
    { name: "sound", type: "boolean", default: "false", description: "Play a short, quiet chime when done." },
    { name: "onCancel", type: "() => void", default: "—", description: "Shows a Cancel button while running." },
    { name: "onRetry", type: "() => void", default: "—", description: "Shows a Try again button after an error." },
    { name: "errorMessage", type: "string", default: "—", description: "Shown instead of the default error hint." },
    { name: "disabled", type: "boolean", default: "false", description: "Locks Cancel, e.g. when the job can no longer be stopped, and says so." },
    { name: "variant", type: '"bar" | "ring"', default: '"bar"', description: "In-page look: a bar with the percent, or a ring with the percent inside." },
    { name: "tabPreview", type: "boolean", default: "false", description: "Draw a small mock browser tab strip that mirrors what the real tab shows." },
    { name: "labels", type: "Partial<TabProgressLabels>", default: "English defaults", description: "Every string: card headings and hints, time left ({t}), buttons, tab titles ({p}, {label}, {title}), notification text, announcements and the mock tab names." },
    { name: "previewState", type: '"idle" | "running" | "indeterminate" | "done" | "error" | "cancelled" | "disabled"', default: "—", description: "Draw one state with sample values. Nothing runs and the real tab is never touched." },
    { name: "accent", type: "string", default: '"#C6FF3D"', description: "Bar and tab ring colour." },
    { name: "doneColor", type: "string", default: '"#2FB863"', description: "Colour of the ✓ tab icon and the finished bar." },
    { name: "errorColor", type: "string", default: '"#E5484D"', description: "Colour of the ! tab icon and the failed bar." },
    { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Card size." },
    { name: "className", type: "string", default: '""', description: "Extra classes for the wrapper." },
  ],
  tryIt: [
    "Press Export sales report.",
    "Switch to another browser tab and look at this tab: the icon fills as a ring and the title counts up.",
    "Come back after it finishes and the tab returns to normal. Try Make it fail and Unknown length too.",
  ],
  flow: [
    { icon: "▶", title: "Job starts", text: "The card shows the label, a bar and a time-left estimate from the real speed." },
    {
      icon: "👀",
      title: "You switch tabs",
      text: "This tab's icon becomes a ring that fills with the percent, and the title reads \"42% · Exporting report\".",
      branches: [
        { label: "Unknown length", text: "The icon spins and the title says Working.", tone: "neutral" },
        { label: "Cancel", text: "The tab goes straight back to normal.", tone: "neutral" },
      ],
    },
    {
      icon: "✓",
      title: "It finishes",
      text: "The icon turns into a green ✓ and the title says Ready.",
      branches: [
        { label: "Notify on", text: "A notification says it's ready; clicking it opens the tab.", tone: "good" },
        { label: "It fails", text: "A red ! icon and a Failed title, with Try again on the card.", tone: "bad" },
      ],
    },
    { icon: "↩", title: "You come back", text: "The page's own title and icon are put back exactly as they were." },
  ],
  useWhen: ["Exports, imports and uploads that take more than a few seconds", "Report, video or image generation people wait on", "Any job where people are likely to switch tabs while they wait"],
  avoidWhen: ["Quick actions under a few seconds: a plain spinner is enough", "Pages that run several jobs at once: only one can own the tab"],
  accessibility: [
    "The bar is a role=\"progressbar\" with aria-valuenow, left out when the length is unknown",
    "The start, every 25% and the outcome are announced in a role=\"status\" region, not every tick",
    "Cancel and Try again are real buttons with a visible focus ring; notification permission is only asked from a click",
    "Reduced motion: no sliding bar, no spinning icon, no animated widths",
  ],
  support: "Favicon and title updates work in all modern desktop browsers. Mobile browsers mostly hide tab icons, so the card still does the job there. No extra packages.",
};

export const PLAYGROUND: Playground = {
  initial: { accent: "#C6FF3D", size: "md", variant: "bar", tabMode: "hidden-only" },
  controls: [
    {
      key: "accent",
      label: "Accent",
      type: "color",
      options: [
        { value: "#C6FF3D", label: "Lime" },
        { value: "#3DD9FF", label: "Cyan" },
        { value: "#FFB547", label: "Amber" },
        { value: "#B79CFF", label: "Lilac" },
      ],
    },
    { key: "size", label: "Size", type: "segment", options: [{ value: "sm", label: "S" }, { value: "md", label: "M" }, { value: "lg", label: "L" }] },
    { key: "variant", label: "Style", type: "segment", options: [{ value: "bar", label: "Bar" }, { value: "ring", label: "Ring" }] },
    { key: "tabMode", label: "Tab shows progress", type: "segment", options: [{ value: "hidden-only", label: "When away" }, { value: "always", label: "Always" }, { value: "off", label: "Off" }] },
  ],
};

export const CARD_STATE = "running";

export const TICKER: [string, string, "acc" | "warn" | "mute"] = ["tab-progress-loader", "tab title · 42% · exporting sales report", "acc"];
