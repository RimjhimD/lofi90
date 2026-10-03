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
}

export const ENTRIES: Entry[] = [
  {
    slug: "passkey-button",
    ext: "01",
    name: "Passkey Button",
    type: "button",
    week: 1,
    icon: "👆",
    summary: "Passwordless sign-in. The fingerprint draws itself while your device checks you.",
    why: "Passkeys are replacing passwords, but every site hand-builds the button and forgets the hard parts: browsers without support, the user cancelling the prompt, creating a passkey for new users, and signing in with a phone instead. This button handles all of those states with clear words, so people always know what's happening.",
    files: [{ label: "PasskeyButton.tsx", path: "src/library/passkey-button/PasskeyButton.tsx" }],
    usagePath: "src/library/passkey-button/usage.tsx",
    promptPath: "src/library/passkey-button/prompt.md",
    props: [
      { name: "intent", type: '"signin" | "register"', default: '"signin"', description: "Sign in a returning user or create a passkey for a new one." },
      { name: "onSignIn", type: "() => Promise<void>", default: "required", description: "Runs navigator.credentials.get. Throw to show the error state." },
      { name: "onRegister", type: "() => Promise<void>", default: "—", description: "Runs navigator.credentials.create. Needed when intent is register." },
      { name: "onUseOtherDevice", type: "() => Promise<void>", default: "—", description: "Shows a 'Use a phone or security key' link." },
      { name: "onFallback", type: "() => void", default: "—", description: "Shows a 'Use password instead' link, also used when passkeys are unsupported." },
      { name: "labels", type: "Partial<PasskeyLabels>", default: "English defaults", description: "Override any text: signin, register, working, success, retry, unsupported, otherDevice, fallback." },
      { name: "disabled", type: "boolean", default: "false", description: "Turns the button off." },
      { name: "supportOverride", type: '"supported" | "unsupported"', default: "auto-detect", description: "Skip browser detection, for previews and tests." },
      { name: "className", type: "string", default: '""', description: "Extra classes for the wrapper." },
    ],
  },
  {
    slug: "filter-verdict-card",
    ext: "02",
    name: "Filter Verdict Card",
    type: "card",
    week: 1,
    icon: "🔎",
    summary: "Shows exactly why an automation ran or skipped a contact, condition by condition.",
    why: "\"Why didn't my workflow run?\" is the most common automation question. The answer is usually one filter condition: a missing phone number, or a tag saved as \"VIP\" when the filter checks \"vip\". This card checks a record against the conditions in order, shows expected vs actual for each, and names the one that blocked it in plain English.",
    files: [
      { label: "FilterVerdictCard.tsx", path: "src/library/filter-verdict-card/FilterVerdictCard.tsx" },
      { label: "evaluate.ts", path: "src/library/filter-verdict-card/evaluate.ts" },
      { label: "evaluate.test.ts", path: "src/library/filter-verdict-card/evaluate.test.ts" },
    ],
    usagePath: "src/library/filter-verdict-card/usage.tsx",
    promptPath: "src/library/filter-verdict-card/prompt.md",
    props: [
      { name: "record", type: "Record<string, unknown>", default: "required", description: "The record being checked, e.g. a CRM contact." },
      { name: "conditions", type: "Condition[]", default: "required", description: "{ field, op, value?, label? } checked in order. Fields can be dot paths like address.city." },
      { name: "title", type: "string", default: "required", description: "Big title, e.g. the contact's name." },
      { name: "subtitle", type: "string", default: "—", description: "Small line under the title, e.g. the workflow name." },
      { name: "mode", type: '"all" | "any"', default: '"all"', description: "all = first failure blocks. any = first match passes." },
      { name: "animate", type: "boolean", default: "true", description: "Check the rows one by one. Off automatically for reduced motion." },
      { name: "stepMs", type: "number", default: "450", description: "Delay per row when animating." },
      { name: "runKey", type: "number", default: "0", description: "Change it to run the check again." },
      { name: "onVerdict", type: "(v: Verdict) => void", default: "—", description: "Called with the result once it's shown." },
      { name: "className", type: "string", default: '""', description: "Extra classes for the card." },
    ],
  },
];

export const typeOf = (id: ComponentType) => TYPES.find((t) => t.id === id)!;
export const findEntry = (slug: string) => ENTRIES.find((e) => e.slug === slug);
export const pad = (n: number) => String(n).padStart(2, "0");
