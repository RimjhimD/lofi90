import type { Entry } from "@/lib/registry";
import type { Playground } from "@/lib/playgrounds";

const DIR = "src/library/hourglass-upload-loader";

export const ENTRY: Entry = {
  slug: "hourglass-upload-loader",
  ext: "08",
  name: "Hourglass Upload Loader",
  type: "loader",
  week: 4,
  icon: "⏳",
  summary: "An hourglass whose sand is the real upload. Honest time left, and it tips over when the connection drops.",
  why: "Upload bars lie. They jump to 99% and sit there, spin with no idea how long is left, or freeze without a word when the Wi-Fi drops, and you can't pause or retry. Here the sand in an hourglass is the real number of bytes: the top bulb is what's left, the bottom pile is what's sent. Speed is measured and smoothed, so the time left counts down calmly and only shows once it's known. Lose the connection and the hourglass lies on its side and says it will carry on. Pause, resume and retry are real buttons.",
  files: [
    { label: "HourglassUploadLoader.tsx", path: `${DIR}/HourglassUploadLoader.tsx` },
    { label: "hourglass.ts", path: `${DIR}/hourglass.ts` },
  ],
  usagePath: `${DIR}/usage.tsx`,
  promptPath: `${DIR}/prompt.md`,
  props: [
    { name: "loaded", type: "number", default: "required", description: "Bytes sent so far, straight from xhr.upload.onprogress." },
    { name: "total", type: "number", default: "required", description: "File size in bytes. 0 means unknown: the sand trickles in a loop and only bytes sent are shown." },
    { name: "status", type: '"idle" | "uploading" | "paused" | "offline" | "done" | "error"', default: "required", description: "What your upload is doing. The hourglass stands, tilts, lies down, turns over or cracks to match." },
    { name: "fileName", type: "string", default: '""', description: "Shown under the hourglass and used in the accessible name." },
    { name: "onPause", type: "() => void", default: "—", description: "Shows a Pause button while uploading." },
    { name: "onResume", type: "() => void", default: "—", description: "Shows a Resume button while paused." },
    { name: "onRetry", type: "() => void", default: "—", description: "Shows a Retry button after an error." },
    { name: "onCancel", type: "() => void", default: "—", description: "Shows a Cancel button until the upload is done." },
    { name: "errorMessage", type: "string", default: "—", description: "Your own error text, shown instead of the default." },
    { name: "disabled", type: "boolean", default: "false", description: "Turns the buttons off." },
    { name: "labels", type: "Partial<HourglassLabels>", default: "English defaults", description: "Every piece of text: states, sizes, speed, time left (short and spoken), the progress value text and the four buttons." },
    { name: "accent", type: "string", default: '"#FFB547"', description: "Sand colour; also the check badge and the Resume/Retry buttons, with readable text picked for you." },
    { name: "etaStyle", type: '"words" | "clock"', default: '"words"', description: '"about 40s left" or "0:40 left".' },
    { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Hourglass and text size." },
    { name: "previewState", type: "{ status; progress?: number | null; total?: number; speed?: number }", default: "—", description: "Render one state frozen, with a made-up progress, for docs and tests." },
    { name: "className", type: "string", default: '""', description: "Extra classes for the card." },
  ],
  tryIt: [
    "Press Start upload and watch the sand. The time left waits until it has measured the speed.",
    "Switch the network offline: the hourglass tips over. Switch it back and it stands up and carries on.",
    "Try slow 3G, Pause and Resume, or Fail it and then Retry.",
  ],
  flow: [
    { icon: "📤", title: "Your code uploads", text: "xhr.upload.onprogress hands loaded and total to the hourglass. It never sends anything itself." },
    {
      icon: "⏳",
      title: "Sand falls",
      text: "The top bulb is the bytes left, the bottom pile the bytes sent, matched by area so half really looks like half.",
      branches: [{ label: "Size unknown", text: "Sand trickles in a loop; only bytes sent are shown.", tone: "neutral" }],
    },
    {
      icon: "⏱️",
      title: "Time left is measured",
      text: "Speed is sampled every half second and smoothed. Until it's sure it says \"working it out…\".",
      branches: [
        { label: "Line gets slower", text: "Time left rises gently, never in jumps.", tone: "neutral" },
        { label: "Nothing moving", text: "It says it is waiting for the network.", tone: "bad" },
      ],
    },
    {
      icon: "📶",
      title: "Pause or lose the connection",
      text: "Paused tilts it; offline lays it on its side. The time left hides and paused time never counts as slow.",
      branches: [
        { label: "Back online", text: "It stands up and carries on.", tone: "good" },
        { label: "Upload fails", text: "The glass cracks, Retry appears.", tone: "bad" },
      ],
    },
    { icon: "✓", title: "Uploaded", text: "The last grain lands, the hourglass turns over and a check pops on." },
  ],
  useWhen: ["Uploading big files: video, photo sets, backups", "Mobile or flaky connections where uploads stall or drop", "Anywhere people need to know whether to wait or come back later"],
  avoidWhen: ["Tiny uploads that finish in under a second: just show done", "Many files at once: use a list with one small bar per file"],
  accessibility: [
    "role=\"progressbar\" with aria-valuenow and aria-valuetext like \"42%, about 40 seconds left\"",
    "State changes (paused, offline, failed, uploaded) are announced in a role=\"status\" region, not every byte",
    "Pause, Resume, Retry and Cancel are real buttons with a visible focus ring",
    "Reduced motion: no falling stream, no tilting, no flip and no shake; the numbers still update",
  ],
  support: "Works in all modern browsers. No extra packages.",
};

export const PLAYGROUND: Playground = {
  initial: { accent: "#FFB547", size: "md", etaStyle: "words" },
  controls: [
    {
      key: "accent",
      label: "Sand colour",
      type: "color",
      options: [
        { value: "#FFB547", label: "Amber" },
        { value: "#C6FF3D", label: "Lime" },
        { value: "#3DD9FF", label: "Cyan" },
        { value: "#FF6B57", label: "Coral" },
        { value: "#B79CFF", label: "Lilac" },
        { value: "#E9EDE8", label: "White" },
      ],
    },
    { key: "etaStyle", label: "Time left", type: "segment", options: [{ value: "words", label: "About 40s" }, { value: "clock", label: "0:40" }] },
    { key: "size", label: "Size", type: "segment", options: [{ value: "sm", label: "S" }, { value: "md", label: "M" }, { value: "lg", label: "L" }] },
  ],
};

export const CARD_STATE = "uploading";

export const TICKER: [string, string, "acc" | "warn" | "mute"] = ["hourglass-upload-loader", "4.2 MB of 12 MB · about 40s left · sand still falling", "acc"];
