export type ComponentType =
  | "button"
  | "input"
  | "form"
  | "card"
  | "modal"
  | "table"
  | "loader"
  | "navbar"
  | "section"
  | "chart";

export const TYPES: { id: ComponentType; label: string; color: string }[] = [
  { id: "button", label: "Buttons", color: "#FF5D5D" },
  { id: "input", label: "Inputs", color: "#3BB2F6" },
  { id: "form", label: "Forms", color: "#9B5DE5" },
  { id: "card", label: "Cards", color: "#FFB800" },
  { id: "modal", label: "Modals", color: "#00C49A" },
  { id: "table", label: "Tables", color: "#FF5D5D" },
  { id: "loader", label: "Loaders", color: "#3BB2F6" },
  { id: "navbar", label: "Navbars", color: "#9B5DE5" },
  { id: "section", label: "Sections", color: "#FFB800" },
  { id: "chart", label: "Charts", color: "#00C49A" },
];

export interface PropDoc {
  name: string;
  type: string;
  default: string;
  description: string;
}

export interface Entry {
  slug: string;
  /** Phone extension, dial it on the home page. */
  ext: string;
  name: string;
  type: ComponentType;
  week: number;
  icon: string;
  /** One line for cards and the phone. */
  summary: string;
  /** What problem it solves, shown on the component page. */
  why: string;
  /** Files shown in the Source tab, relative to the repo root. */
  files: { label: string; path: string }[];
  usagePath: string;
  promptPath: string;
  props: PropDoc[];
  /** "How it works": the steps drawn as a flow on the page. */
  flow: FlowStep[];
  useWhen: string[];
  avoidWhen: string[];
  accessibility: string[];
  support: string;
}

export interface FlowStep {
  icon: string;
  title: string;
  text: string;
  /** Side branches off this step, e.g. "user cancels". */
  branches?: { label: string; text: string; tone: "good" | "bad" | "neutral" }[];
}

export const ENTRIES: Entry[] = [
  {
    slug: "idempotent-run-button",
    ext: "01",
    name: "Idempotent Run Button",
    type: "button",
    week: 1,
    icon: "🛡",
    summary: "Runs an action once per key. Press it twice and it bounces off a shield instead of sending again.",
    why: "Double-clicks, slow networks, a second open tab or a webhook retry can fire the same action twice, and then 400 customers get the same text message twice or a card gets charged twice. This button remembers which keys already ran. A repeat with the same key is blocked with a clear \"already done 12s ago\" message, and a new key runs normally.",
    files: [{ label: "IdempotentRunButton.tsx", path: "src/library/idempotent-run-button/IdempotentRunButton.tsx" }],
    usagePath: "src/library/idempotent-run-button/usage.tsx",
    promptPath: "src/library/idempotent-run-button/prompt.md",
    props: [
      { name: "runKey", type: "string", default: "required", description: "Names this exact action, e.g. campaign + date. Same key only runs once inside the window." },
      { name: "onRun", type: "(runKey: string) => Promise<string | void>", default: "required", description: "Does the work. Return a short result to show, or throw to show the error state." },
      { name: "windowMs", type: "number", default: "60000", description: "How long a finished key stays locked." },
      { name: "storage", type: '"memory" | "session"', default: '"memory"', description: "Session also blocks repeats after a page refresh in the same tab." },
      { name: "labels", type: "Partial<RunLabels>", default: "English defaults", description: "Override any text: run, running, done, blocked, retry." },
      { name: "onBlocked", type: "({ runKey, ranAt }) => void", default: "—", description: "Fires every time a repeat is stopped, e.g. to log it." },
      { name: "disabled", type: "boolean", default: "false", description: "Turns the button off." },
      { name: "previewState", type: '"idle" | "running" | "done" | "blocked" | "error"', default: "—", description: "Render one state without running anything. For docs and tests." },
      { name: "className", type: "string", default: '""', description: "Extra classes for the wrapper." },
    ],
    flow: [
      { icon: "👆", title: "User presses Run", text: "The button carries a key that names the action, like promo-oct-04." },
      {
        icon: "🔎",
        title: "Checks the key",
        text: "Has this key already run, or is it running right now?",
        branches: [
          { label: "Yes, inside the window", text: "Shield slams down: already done 12s ago. Nothing runs.", tone: "bad" },
          { label: "New key", text: "Runs normally.", tone: "good" },
        ],
      },
      {
        icon: "⚙️",
        title: "onRun does the work",
        text: "Your send, charge or webhook call. Extra presses are ignored while it runs.",
        branches: [{ label: "It fails", text: "Key is not saved, so Try again is safe.", tone: "neutral" }],
      },
      { icon: "🔒", title: "Key is locked", text: "Green with the result. When the window ends the shield cracks and Run is ready." },
    ],
    useWhen: [
      "Send buttons for SMS or email campaigns, invoices and reminders",
      "Pay, refund or charge actions",
      "Manual \"Run workflow\" or \"Retry webhook\" buttons in admin tools",
    ],
    avoidWhen: [
      "As your only protection: send the same key to your server as an Idempotency-Key header too",
      "Actions that are meant to repeat, like Like or Add to cart",
    ],
    accessibility: [
      "Real <button> with aria-busy while running and a visible focus ring",
      "Result, block reason and countdown are announced in a role=\"status\" live region",
      "Shield slam, sweep, shake and crack are skipped for people who prefer reduced motion",
    ],
    support: "Works in all modern browsers. Session storage falls back to in-page memory in private mode.",
  },
  {
    slug: "permission-primer",
    ext: "02",
    name: "Permission Primer",
    type: "modal",
    week: 1,
    icon: "🎥",
    summary: "Explains why you need the camera, location or notifications before the browser asks, and fixes it when blocked.",
    why: "If someone clicks Block on the browser's camera, mic, location or notification popup, the browser never asks again, and most users never find the setting to undo it. Apps lose the feature for good. This modal asks nicely first, skips itself if access is already granted, points to where the real popup appears, and if access is blocked it shows the exact steps for that browser to turn it back on.",
    files: [{ label: "PermissionPrimer.tsx", path: "src/library/permission-primer/PermissionPrimer.tsx" }],
    usagePath: "src/library/permission-primer/usage.tsx",
    promptPath: "src/library/permission-primer/prompt.md",
    props: [
      { name: "permission", type: '"camera" | "microphone" | "geolocation" | "notifications"', default: "required", description: "Which browser permission you're about to ask for." },
      { name: "open", type: "boolean", default: "required", description: "Shows or hides the primer (controlled)." },
      { name: "onOpenChange", type: "(open: boolean) => void", default: "required", description: "Called on Not now, Esc, backdrop click, or after success." },
      { name: "reason", type: "string", default: "required", description: "Why your app needs it, in plain words. This is what gets the yes." },
      { name: "title", type: "string", default: '"Turn on your camera?"…', description: "Optional heading." },
      { name: "benefits", type: "string[]", default: "[]", description: "Up to three short promises shown as a checklist." },
      { name: "onGranted", type: "() => void", default: "—", description: "Fires when access is granted, also instantly if it already was." },
      { name: "onDenied", type: "() => void", default: "—", description: "Fires when the user or browser blocks access." },
      { name: "request", type: '() => Promise<"granted" | "denied">', default: "real browser API", description: "Override the browser call, e.g. to reuse a stream or for tests." },
      { name: "autoCloseMs", type: "number", default: "1400", description: "Close this long after success. 0 keeps it open with a Done button." },
      { name: "previewState", type: '"prompt" | "asking" | "granted" | "denied" | "unsupported"', default: "—", description: "Render one state inline without asking anything. For docs and tests." },
    ],
    flow: [
      { icon: "👆", title: "User starts a feature", text: "They press Join call, Find stores, Remind me… and the primer opens." },
      {
        icon: "🔎",
        title: "Checks quietly first",
        text: "Asks the browser what it already knows, without any popup.",
        branches: [
          { label: "Already allowed", text: "Skips the primer and starts the feature.", tone: "good" },
          { label: "Already blocked", text: "Jumps straight to the fix-it steps.", tone: "bad" },
        ],
      },
      { icon: "💬", title: "Explains why", text: "Your reason and benefits, in plain words. Not now is always there." },
      {
        icon: "↖",
        title: "Browser asks",
        text: "Points at the corner where the real popup appears.",
        branches: [
          { label: "Allow", text: "Green check, onGranted, closes itself.", tone: "good" },
          { label: "Block", text: "Shows browser-specific steps to turn it back on.", tone: "bad" },
        ],
      },
    ],
    useWhen: [
      "Video calls, voice notes or QR scanning (camera / microphone)",
      "Store finders, delivery tracking, local results (location)",
      "Reminders and alerts people actually want (notifications)",
    ],
    avoidWhen: [
      "On page load: only open it after the user starts the feature that needs it",
      "If the feature works fine without the permission: just ask for nothing",
    ],
    accessibility: [
      "Native <dialog> with showModal: focus is trapped, Esc closes, background is inert",
      "Labelled by its title and description; each state is announced in a live region",
      "Every action is a real button with a visible focus ring; motion respects reduced-motion",
    ],
    support: "Works in all modern browsers on https pages. Permission checking uses the Permissions API where available and falls back to just asking.",
  },
];

export const findEntry = (slug: string) => ENTRIES.find((e) => e.slug === slug);
export const pad = (n: number) => String(n).padStart(2, "0");
