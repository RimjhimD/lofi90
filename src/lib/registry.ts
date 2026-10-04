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
    slug: "undo-fuse-button",
    ext: "01",
    name: "Undo Fuse Button",
    type: "button",
    week: 1,
    icon: "🧨",
    summary: "Press Delete and a fuse burns around the button. Press again before it burns out and nothing happens.",
    why: "\"Are you sure?\" pop-ups get clicked through without reading, and undo after the fact means the server already deleted something. This button does nothing until a visible fuse finishes burning around its own border, so changing your mind is just a second press. It waits while your mouse is on it and while the tab is hidden, so it never goes off while you're not looking.",
    files: [{ label: "UndoFuseButton.tsx", path: "src/library/undo-fuse-button/UndoFuseButton.tsx" }],
    usagePath: "src/library/undo-fuse-button/usage.tsx",
    promptPath: "src/library/undo-fuse-button/prompt.md",
    props: [
      { name: "onCommit", type: "() => void | Promise<void>", default: "required", description: "Runs when the fuse burns out. Do the real delete here." },
      { name: "onUndo", type: "() => void", default: "—", description: "Runs if the user cancels in time." },
      { name: "delayMs", type: "number", default: "5000", description: "How long the fuse burns." },
      { name: "labels", type: "Partial<FuseLabels>", default: "English defaults", description: "idle, burning (with {s} for seconds), paused, done, undone." },
      { name: "disabled", type: "boolean", default: "false", description: "Turns the button off." },
      { name: "previewState", type: '"idle" | "burning" | "done" | "undone"', default: "—", description: "Render one state without running anything." },
      { name: "className", type: "string", default: '""', description: "Extra classes for the wrapper." },
    ],
    flow: [
      { icon: "👆", title: "Press Delete", text: "Nothing is deleted yet. The fuse lights at the top-left corner." },
      {
        icon: "🧨",
        title: "The fuse burns",
        text: "It runs around the button's border, counting down the seconds.",
        branches: [
          { label: "Mouse on the button", text: "The fuse waits until you move away.", tone: "neutral" },
          { label: "Tab hidden", text: "It waits until you come back.", tone: "neutral" },
        ],
      },
      { icon: "↺", title: "Press again to undo", text: "Click or Esc before it ends: \"Kept\", nothing changed.", branches: [{ label: "Undone", text: "onUndo fires.", tone: "good" }] },
      { icon: "✓", title: "Burns out", text: "Only now does onCommit run and the item is deleted." },
    ],
    useWhen: ["Deleting files, messages or records", "Sending or archiving something that can't be pulled back", "Anywhere a confirm dialog is just clicked through"],
    avoidWhen: ["Actions that must happen instantly", "Truly irreversible, high-stakes actions — ask for typed confirmation instead"],
    accessibility: [
      "Real <button>; Esc also undoes while the fuse burns",
      "The countdown and outcome are announced in a role=\"status\" region",
      "The fuse waits while the tab is hidden; flash and spark pulse are off with reduced motion",
    ],
    support: "Works in all modern browsers. No extra packages.",
  },
  {
    slug: "secret-key-field",
    ext: "02",
    name: "Secret Key Field",
    type: "input",
    week: 1,
    icon: "🔑",
    summary: "Shows only the last 4 characters, peeks while held, and stops a secret key from landing in a public field.",
    why: "API keys get pasted into the wrong box all the time: a secret key into a field that ships to every visitor, a key with a stray space or quotes, or one left sitting on the clipboard. This field names the key you pasted, cleans the paste, lets you peek only while you hold the button, copies without showing, wipes the clipboard after 30 seconds, and refuses a secret key where a public one belongs.",
    files: [{ label: "SecretKeyField.tsx", path: "src/library/secret-key-field/SecretKeyField.tsx" }],
    usagePath: "src/library/secret-key-field/usage.tsx",
    promptPath: "src/library/secret-key-field/prompt.md",
    props: [
      { name: "value", type: "string", default: "required", description: "The key (controlled)." },
      { name: "onChange", type: "(value: string) => void", default: "required", description: "Called with the new value, already cleaned after a paste." },
      { name: "label", type: "string", default: "required", description: "Field label." },
      { name: "expects", type: '"secret" | "publishable" | "any"', default: '"any"', description: "Where the value ends up. A secret in a publishable field is an error." },
      { name: "visibleChars", type: "number", default: "4", description: "How many ending characters stay readable while hidden." },
      { name: "peekMs", type: "number", default: "3000", description: "Longest a peek lasts, even if still held." },
      { name: "clearClipboardMs", type: "number", default: "30000", description: "Wipe the clipboard this long after Copy. 0 turns it off." },
      { name: "placeholder", type: "string", default: '"Paste your key"', description: "Placeholder text." },
      { name: "disabled", type: "boolean", default: "false", description: "Locks the field." },
      { name: "previewRevealed", type: "boolean", default: "—", description: "Render with the key shown, for docs and tests." },
      { name: "className", type: "string", default: '""', description: "Extra classes for the wrapper." },
    ],
    flow: [
      { icon: "📋", title: "Paste a key", text: "Spaces, quotes and line breaks that came along are removed, and it says which." },
      {
        icon: "🔎",
        title: "It reads the key",
        text: "Names it — Stripe, GitHub, AWS, Slack, Google — and marks LIVE or TEST.",
        branches: [
          { label: "Secret in a public field", text: "Red: it would ship to every visitor.", tone: "bad" },
          { label: "Live key", text: "Amber: real money, real customers.", tone: "neutral" },
        ],
      },
      { icon: "◎", title: "Hold to peek", text: "Shown only while held, and never longer than 3 seconds." },
      { icon: "⧉", title: "Copy without showing", text: "The clipboard is wiped after 30 seconds unless you keep it." },
    ],
    useWhen: ["Settings pages for API keys and tokens", "Connecting a payment, email or SMS provider", "Developer dashboards and admin panels"],
    avoidWhen: ["Passwords people type from memory — use a normal password field", "Keys you never need to see again — show them once and store a hash"],
    accessibility: [
      "Real <input> with a label; aria-invalid and a role=\"status\" message when a key is in the wrong field",
      "Peek works with the mouse or by holding Space/Enter on the button; both buttons have clear labels",
      "Visible focus on every control; the full key is only rendered while peeking",
    ],
    support: "Works in all modern browsers. Copy and clipboard wiping need a secure (https) page.",
  },
];

export const findEntry = (slug: string) => ENTRIES.find((e) => e.slug === slug);
export const pad = (n: number) => String(n).padStart(2, "0");
