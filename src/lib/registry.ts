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
    flow: [
      { icon: "👆", title: "User taps the button", text: "Instead of typing a password, they press Sign in with passkey." },
      {
        icon: "🔐",
        title: "Device checks them",
        text: "The browser asks for a fingerprint, face or screen lock. The ridges redraw while you wait.",
        branches: [
          { label: "Cancels or times out", text: "Shakes and says nothing was shared. Try again.", tone: "bad" },
          { label: "Uses a phone instead", text: "Phone or security key via QR code.", tone: "neutral" },
        ],
      },
      { icon: "🖥", title: "Your server verifies", text: "onSignIn sends the signed result to your server. Throw to show an error." },
      { icon: "✅", title: "Signed in", text: "Button turns green: no password was typed or stored." },
    ],
    useWhen: [
      "Login and sign-up pages that want passwordless sign-in",
      "Re-confirming identity before something sensitive (payments, deleting an account)",
      "Offering new users to save a passkey after their first login",
    ],
    avoidWhen: [
      "Your backend can't verify WebAuthn yet: add that first (e.g. SimpleWebAuthn)",
      "As the only way in: always keep a fallback such as a password or email link",
    ],
    accessibility: [
      "Real <button> with aria-busy while waiting and a visible focus ring",
      "Status and errors are announced in a role=\"status\" live region",
      "Animations are skipped for people who prefer reduced motion",
    ],
    support: "Passkeys work in current Chrome, Edge, Safari and Firefox. Older browsers get the clear unsupported state with the fallback link.",
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

export const typeOf = (id: ComponentType) => TYPES.find((t) => t.id === id)!;
export const findEntry = (slug: string) => ENTRIES.find((e) => e.slug === slug);
export const pad = (n: number) => String(n).padStart(2, "0");
