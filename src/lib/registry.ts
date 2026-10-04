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
    slug: "merge-tag-input",
    ext: "01",
    name: "Merge Tag Input",
    type: "input",
    week: 1,
    icon: "{}",
    summary: "Write a text with {{first_name}} tags and see exactly what three real customers will receive.",
    why: "\"Hi {{first_name}}\" goes out as \"Hi ,\" to every customer without a name, and a typo like {{frist_name}} goes out as raw braces. This field paints every tag green, amber or red as you type, previews the message for real contacts, and fixes each problem in one click.",
    files: [{ label: "MergeTagInput.tsx", path: "src/library/merge-tag-input/MergeTagInput.tsx" }],
    usagePath: "src/library/merge-tag-input/usage.tsx",
    promptPath: "src/library/merge-tag-input/prompt.md",
    props: [
      { name: "value", type: "string", default: "required", description: "The message text (controlled)." },
      { name: "onChange", type: "(value: string) => void", default: "required", description: "Called with the new text, including after a one-click fix." },
      { name: "fields", type: "{ key: string; label: string; fallback?: string }[]", default: "required", description: "The merge fields this message may use, each with an optional fallback. Anything else is flagged." },
      { name: "samples", type: "{ label: string; values: Record<string, string | undefined> }[]", default: "required", description: "Contacts to preview against. Include one with missing data." },
      { name: "label", type: "string", default: '"Message"', description: "Field label." },
      { name: "suggestedFallback", type: "string", default: '"there"', description: "Fallback offered when a field has none of its own, giving {{key | there}}." },
      { name: "disabled", type: "boolean", default: "false", description: "Read-only, e.g. while a campaign is sending." },
      { name: "className", type: "string", default: '""', description: "Extra classes for the wrapper." },
    ],
    flow: [
      { icon: "⌨", title: "Type the message", text: "Type {{ and pick a field from the list, or keep typing." },
      {
        icon: "🎨",
        title: "Tags light up",
        text: "Every tag is coloured inside the field as you type.",
        branches: [
          { label: "Real field, always filled", text: "Green.", tone: "good" },
          { label: "Blank for someone", text: "Amber, names who.", tone: "neutral" },
          { label: "Not a field", text: "Red, suggests the one you meant.", tone: "bad" },
        ],
      },
      { icon: "💬", title: "See what they get", text: "The message is shown as a text bubble for each sample customer." },
      { icon: "🔧", title: "Fix in one click", text: "Add a fallback (\"Hi there\") or swap in the right field." },
    ],
    useWhen: ["SMS and email templates with merge fields", "Appointment reminders and follow-ups", "Any message builder where some contacts have missing data"],
    avoidWhen: ["Plain text with no merge fields", "As the only check — validate again on the server before sending"],
    accessibility: [
      "Real <textarea> with a visible label; the colour layer behind it is hidden from screen readers",
      "Field suggestions are a proper listbox: ↑ ↓ to move, Enter or Tab to insert, Esc to close",
      "Every problem is announced in a role=\"status\" region and has a real button to fix it",
    ],
    support: "Works in all modern browsers. No extra packages.",
  },
  {
    slug: "retry-countdown-loader",
    ext: "02",
    name: "Retry Countdown Loader",
    type: "loader",
    week: 1,
    icon: "↻",
    summary: "Retries with growing waits — 1s, 2s, 4s, 8s — and draws each wait to scale so you can see why.",
    why: "When a text or webhook fails, most apps either give up or hammer the server every second. This loader tries again with growing waits, shows exactly when the next try is, uses the server's own \"wait 20 seconds\" when it gives one, and pauses while you're offline instead of burning tries.",
    files: [{ label: "RetryCountdownLoader.tsx", path: "src/library/retry-countdown-loader/RetryCountdownLoader.tsx" }],
    usagePath: "src/library/retry-countdown-loader/usage.tsx",
    promptPath: "src/library/retry-countdown-loader/prompt.md",
    props: [
      { name: "task", type: "(attempt: number) => Promise<unknown>", default: "required", description: "The work to try. Throw to fail this try." },
      { name: "label", type: "string", default: "required", description: "What is being done, e.g. \"Sending the reminder text\"." },
      { name: "maxAttempts", type: "number", default: "5", description: "How many tries before giving up." },
      { name: "baseDelayMs", type: "number", default: "1000", description: "Wait before the 2nd try. Doubles after each failure." },
      { name: "maxDelayMs", type: "number", default: "30000", description: "The longest it will ever wait." },
      { name: "onSuccess", type: "(result) => void", default: "—", description: "Called with the task's result." },
      { name: "onGiveUp", type: "(error) => void", default: "—", description: "Called after the last try fails." },
      { name: "previewState", type: '"running" | "waiting" | "server-wait" | "offline" | "success" | "failed" | "cancelled"', default: "—", description: "Render one state without running anything." },
      { name: "className", type: "string", default: '""', description: "Extra classes for the card." },
    ],
    flow: [
      { icon: "▶", title: "First try", text: "Runs your task as soon as it appears." },
      {
        icon: "✕",
        title: "It fails",
        text: "Waits before trying again, longer each time: 1s, 2s, 4s, 8s.",
        branches: [
          { label: "Server says how long", text: "Waits exactly that (Retry-After), shown in amber.", tone: "neutral" },
          { label: "You go offline", text: "Countdown pauses until you're back.", tone: "neutral" },
        ],
      },
      { icon: "⏱", title: "Countdown", text: "Shows the next try in seconds. Retry now skips the wait, Cancel stops." },
      {
        icon: "✓",
        title: "Done or gave up",
        text: "Says which try worked.",
        branches: [{ label: "All tries failed", text: "Shows the last error and Start over.", tone: "bad" }],
      },
    ],
    useWhen: ["Sending texts or emails through a provider that rate-limits", "Webhook calls and API requests that sometimes time out", "Uploads on shaky mobile connections"],
    avoidWhen: ["Payments or anything not safe to repeat — make it idempotent first", "Errors that will never fix themselves, like 401 or 404"],
    accessibility: [
      "Status and countdown are announced in a role=\"status\" region; aria-busy while a try is running",
      "Retry now, Cancel and Start over are real buttons with visible focus",
      "The pulsing lamp stops for people who prefer reduced motion",
    ],
    support: "Works in all modern browsers. Uses navigator.onLine to pause while offline.",
  },
];

export const findEntry = (slug: string) => ENTRIES.find((e) => e.slug === slug);
export const pad = (n: number) => String(n).padStart(2, "0");
