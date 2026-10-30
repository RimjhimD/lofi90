import type { Entry } from "@/lib/registry";
import type { Playground } from "@/lib/playgrounds";

export const ENTRY: Entry = {
  slug: "polaroid-card",
  ext: "13",
  name: "Polaroid Card",
  type: "card",
  week: 7,
  icon: "📸",
  summary: "An image card shaped like an instant photo. It develops while the image really loads, and says so when it fails.",
  why: "Image cards usually handle loading badly. The page jumps when the photo arrives, you stare at a blank box while it loads, a failed link shows the browser's ugly broken-image icon, and missing alt text goes unnoticed until an accessibility audit. This card reserves the photo's space up front so nothing moves. While the image loads, the print develops from a dark chemical tint and clears only once the picture is loaded and decoded. A slow load says so, a failed one turns into an overexposed print with a Retry button, and a missing alt attribute gets a yellow sticky note while you develop.",
  files: [{ label: "PolaroidCard.tsx", path: "src/library/polaroid-card/PolaroidCard.tsx" }],
  usagePath: "src/library/polaroid-card/usage.tsx",
  promptPath: "src/library/polaroid-card/prompt.md",
  props: [
    { name: "src", type: "string", default: "—", description: "The photo URL. Until it is set, the card shows the developing print in its reserved space." },
    { name: "alt", type: "string", default: "—", description: "Describe the photo. alt=\"\" means decoration and is fine. Leaving it out shows the missing-alt note in development and warns once in the console." },
    { name: "width / height", type: "number", default: "—", description: "The photo's real size. Used for the aspect ratio so space is reserved before it loads." },
    { name: "aspectRatio", type: "number", default: "4 / 3", description: "Width divided by height of the photo window. Wins over width/height." },
    { name: "srcSet / sizes", type: "string", default: "—", description: "Passed straight to the <img> for responsive images." },
    { name: "loading", type: '"lazy" | "eager"', default: '"lazy"', description: "Native lazy loading. Use eager for photos at the top of the page." },
    { name: "caption", type: "ReactNode", default: "—", description: "The handwritten line under the photo." },
    { name: "date", type: "string", default: "—", description: "A small second line, like \"Aug 2026\"." },
    { name: "href", type: "string", default: "—", description: "Makes the whole card a link." },
    { name: "onSelect", type: "(selected: boolean) => void", default: "—", description: "Makes the whole card a toggle button. Called with the new value." },
    { name: "selected", type: "boolean", default: "false", description: "Holds the card with a strip of tape and sets aria-pressed." },
    { name: "disabled", type: "boolean", default: "false", description: "Fades the card and stops it being clicked." },
    { name: "placeholderColor", type: "string", default: '"#3C2A1E"', description: "Colour under the photo while it develops." },
    { name: "blurDataURL", type: "string", default: "—", description: "A tiny blurred preview shown under the developing tint." },
    { name: "slowAfterMs", type: "number", default: "4000", description: "After this long the caption says \"Still developing… slow connection\". The clock starts once src is set and the card is in view (or loading is eager), so lazy photos below the fold never count as slow." },
    { name: "maxRetries", type: "number", default: "2", description: "How many times the Retry button asks again by itself, with a cache-busting ?retry=n." },
    { name: "cacheBust", type: "boolean", default: "true", description: "Retries add ?retry=n so the browser asks again. Turn off for signed URLs (S3, CloudFront), where an extra param breaks the signature, and use onRetry to get a fresh signed URL." },
    { name: "onRetry", type: "() => void", default: "—", description: "Your own retry. When given, Retry calls this and you change src yourself, e.g. with a freshly signed URL." },
    { name: "onLoad", type: "(img: HTMLImageElement) => void", default: "—", description: "Runs once the photo is loaded and decoded." },
    { name: "onError", type: "(info: { src: string; attempt: number }) => void", default: "—", description: "Runs each time the photo fails." },
    { name: "labels", type: "Partial<PolaroidLabels>", default: "English defaults", description: "Every piece of text: developing, slow, error, retry, gaveUp ({n} = tries), missingAlt, missingAltHint." },
    { name: "altGuard", type: '"dev" | "always" | "off"', default: '"dev"', description: "When the missing-alt sticky note shows." },
    { name: "accent", type: "string", default: '"#C6FF3D"', description: "Tape colour when selected, and the Retry button. Hex colours get readable text automatically." },
    { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Card width: 180, 240 or 300px, never wider than its container." },
    { name: "tilt", type: "number", default: "-2", description: "Degrees the card turns as it lifts on hover or focus." },
    { name: "previewState", type: '"developing" | "developed" | "slow" | "error" | "missing-alt" | "selected" | "disabled"', default: "—", description: "Render one state without running timers." },
    { name: "className", type: "string", default: '""', description: "Extra classes for the wrapper." },
  ],
  tryIt: [
    "Turn on Throttle and press Reload photos. The prints keep their size and slowly develop.",
    "The right photo has no alt text, so it wears a yellow sticky note. Click any print to pin it.",
  ],
  flow: [
    { icon: "📐", title: "Space is reserved", text: "The frame takes its size from width and height or aspectRatio before any pixels arrive, so the page never jumps." },
    {
      icon: "🧪",
      title: "The print develops",
      text: "A dark brown-teal tint sits over the placeholder and slowly thins while the image loads.",
      branches: [
        { label: "Slow network", text: "Once the photo is in view and requested, after slowAfterMs the caption says it is still developing.", tone: "neutral" },
        { label: "Reduced motion", text: "No slow drift, just a quick fade at the end.", tone: "neutral" },
      ],
    },
    { icon: "🖼️", title: "Loaded and decoded", text: "Only after the load event and decode() does the tint clear and onLoad fire." },
    {
      icon: "💥",
      title: "If it fails",
      text: "The print turns overexposed with a light leak, the caption says so, and Retry asks again with a cache-busting URL.",
      branches: [
        { label: "Retry works", text: "It develops like normal.", tone: "good" },
        { label: "Out of retries", text: "It says how many tries it made and stops.", tone: "bad" },
      ],
    },
    { icon: "📝", title: "Alt check", text: "No alt attribute at all: a yellow sticky note and one console warning in development. alt=\"\" counts as decoration." },
  ],
  useWhen: ["Photo albums, galleries and moodboards", "User-uploaded images where links can break", "Picking a cover photo or favourites from a set"],
  avoidWhen: ["Hero images or product shots where a playful frame doesn't fit the brand", "Dense image grids of tiny thumbnails, where the frame takes too much room"],
  accessibility: [
    "A real <img> with the alt you pass; a missing alt is flagged, not silently filled in",
    "With href it is one link, with onSelect one button with aria-pressed; Retry is a separate button, never nested",
    "Slow and failed loads are announced in a role=\"status\" region; pressing Retry keeps focus on the card and returns it to Retry if the photo fails again",
    "Visible focus ring on light and dark stages; reduced motion swaps the develop for a quick fade",
  ],
  support: "Works in all modern browsers. Uses img.decode() where available. No extra packages.",
};

export const PLAYGROUND: Playground = {
  initial: { accent: "#C6FF3D", size: "sm", tilt: -2, slowAfterMs: 4000 },
  controls: [
    {
      key: "accent",
      label: "Tape colour",
      type: "color",
      options: [
        { value: "#C6FF3D", label: "Lime" },
        { value: "#3DD9FF", label: "Cyan" },
        { value: "#FFB547", label: "Amber" },
        { value: "#FF6B57", label: "Coral" },
        { value: "#B79CFF", label: "Lilac" },
        { value: "#E9EDE8", label: "White" },
      ],
    },
    { key: "size", label: "Size", type: "segment", options: [{ value: "sm", label: "S" }, { value: "md", label: "M" }, { value: "lg", label: "L" }] },
    { key: "tilt", label: "Tilt on hover", type: "slider", min: -8, max: 8, step: 1, unit: "°" },
    { key: "slowAfterMs", label: "Slow after", type: "slider", min: 1000, max: 8000, step: 500, unit: "s", scale: 0.001 },
  ],
};

export const CARD_STATE = "missing-alt";

export const TICKER: [string, string, "acc" | "warn" | "mute"] = ["polaroid-card", "print developed · lake day, no layout shift", "acc"];
