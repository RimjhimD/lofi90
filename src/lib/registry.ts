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
  /** "Try it": three short steps shown above the live preview. */
  tryIt: string[];
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
    tryIt: ["Pick a folder, then press Delete.", "Watch the fuse burn along the button's edge. That's your undo window.", "Press it again before it burns out to keep the folder, or let it burn to delete."],
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
      { name: "color", type: "string", default: '"#D7263D"', description: "Button colour before it is pressed." },
      { name: "fuseColor", type: "string", default: '"#A86A00"', description: "Colour of the burning fuse." },
      { name: "spark", type: '"pulse" | "steady" | "none"', default: '"pulse"', description: "How the spark at the burning end moves." },
      { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Button size." },
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
    tryIt: ["Press “Live secret in the public box”.", "The field turns red and blocks it, and says why.", "Try the other buttons, or paste a messy key and see it cleaned."],
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
      { name: "accent", type: "string", default: '"#D7263D"', description: "Focus ring and peek countdown colour." },
      { name: "drain", type: '"ring" | "bar" | "none"', default: '"ring"', description: "How the peek countdown is drawn." },
      { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Field size." },
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
  {
    slug: "rolodex-carousel",
    tryIt: ["Drag a card, scroll, or use the ← → arrow keys to flip.", "Type a letter, like M or Y, to jump straight to that name.", "Watch the cards behind tilt and fan as you go."],
    ext: "03",
    name: "Rolodex Carousel",
    type: "section",
    week: 2,
    icon: "🗂",
    summary: "A carousel that flips like a desk rolodex. Type a letter and it spins straight to that tab.",
    why: "Most carousels slide sideways and make you click past every slide to reach the one you want. A rolodex was built for finding things fast: cards flip over a hinge, the next few peek out behind, and every card has an A–Z tab. Type M and it spins through to the M's.",
    files: [{ label: "RolodexCarousel.tsx", path: "src/library/rolodex-carousel/RolodexCarousel.tsx" }],
    usagePath: "src/library/rolodex-carousel/usage.tsx",
    promptPath: "src/library/rolodex-carousel/prompt.md",
    props: [
      { name: "cards", type: "{ id; title; subtitle?; body?: ReactNode; tab? }[]", default: "required", description: "The cards. The A–Z tab is the title's first letter unless you set tab." },
      { name: "label", type: "string", default: "required", description: "Accessible name, e.g. \"Contacts\"." },
      { name: "initialIndex", type: "number", default: "0", description: "Which card is showing first." },
      { name: "onChange", type: "(index: number) => void", default: "—", description: "Called whenever the showing card changes." },
      { name: "accent", type: "string", default: '"#D7263D"', description: "Side wheel and focus colour." },
      { name: "flipMs", type: "number", default: "450", description: "How long one flip takes." },
      { name: "behind", type: "number", default: "4", description: "How many cards peek out behind." },
      { name: "tilt", type: "number", default: "7", description: "Degrees each card behind leans back." },
      { name: "className", type: "string", default: '""', description: "Extra classes for the wrapper." },
    ],
    flow: [
      { icon: "🗂", title: "Cards on a rod", text: "The current card stands up; the next four peek out behind it." },
      { icon: "↕", title: "Flip", text: "Scroll, drag up or down, use the arrow keys or ▲ ▼. Each card swings over the hinge." },
      { icon: "🔤", title: "Type a letter", text: "Press M (or click it in the A–Z strip) and it spins fast through every card to the M tab." },
      { icon: "📣", title: "Announced", text: "Screen readers hear \"Maya Chen, card 10 of 16\" once it settles." },
    ],
    useWhen: ["Contacts, clients or suppliers", "Recipe boxes, flash cards, glossaries", "Any long alphabetical list people browse by first letter"],
    avoidWhen: ["Unsorted content with no natural A–Z order", "Comparing items side by side — use a table"],
    accessibility: [
      "Carousel region with a label; each card is a labelled group (\"3 of 16\")",
      "Only the showing card is exposed; the rest are hidden and inert",
      "Full keyboard: arrows, Page Up/Down, Home/End and letters; reduced motion jumps without the spin",
    ],
    support: "Works in all modern browsers. Uses CSS 3D transforms and the inert attribute.",
  },
  {
    slug: "split-bill-card",
    tryIt: ["Drag a name (Sam, Maya, Jo) onto a dish, or tap a name and then the dishes.", "Each person's total updates with their share of tax and tip.", "The shares always add up to the exact bill, to the cent."],
    ext: "04",
    name: "Split-the-Bill Card",
    type: "card",
    week: 2,
    icon: "🧾",
    summary: "Drag friends onto receipt lines; shared dishes split, tax and tip follow what you ate, to the exact cent.",
    why: "Splitting a bill evenly is unfair to the person who had a salad, and splitting it properly usually means a calculator and an argument over the last cent. Drag each person onto what they had: shared dishes split themselves, tax and tip follow what each person ate, and the shares always add back up to the exact total.",
    files: [{ label: "SplitBillCard.tsx", path: "src/library/split-bill-card/SplitBillCard.tsx" }],
    usagePath: "src/library/split-bill-card/usage.tsx",
    promptPath: "src/library/split-bill-card/prompt.md",
    props: [
      { name: "items", type: "{ id; name; cents }[]", default: "required", description: "Receipt lines, priced in cents so totals are exact." },
      { name: "people", type: "{ id; name; color }[]", default: "required", description: "Who is splitting, with an avatar colour each." },
      { name: "taxRate", type: "number", default: "0.08", description: "Tax as a fraction of the food." },
      { name: "tipRate", type: "number", default: "0.15", description: "Tip as a fraction of the food." },
      { name: "currency", type: "string", default: '"USD"', description: "Currency code for formatting." },
      { name: "locale", type: "string", default: '"en-US"', description: "Locale for formatting." },
      { name: "initialAssignments", type: "Record<itemId, personId[]>", default: "{}", description: "Who had what to start with." },
      { name: "onChange", type: "(assignments, totals) => void", default: "—", description: "Called after every change, totals in cents." },
      { name: "title", type: "string", default: '"Dinner"', description: "Shown at the top of the receipt." },
      { name: "accent", type: "string", default: '"#D7263D"', description: "Focus ring and selected-person colour." },
      { name: "coin", type: "string", default: '"#FFC94A"', description: "Coin colour." },
      { name: "coinMotion", type: '"drop" | "pop" | "none"', default: '"drop"', description: "How coins arrive on the stacks." },
      { name: "className", type: "string", default: '""', description: "Extra classes for the wrapper." },
    ],
    flow: [
      { icon: "👤", title: "Pick a person", text: "Tap a name, or start dragging it." },
      {
        icon: "🧾",
        title: "Claim lines",
        text: "Tap receipt lines or drop the name on them. Their avatar pops onto the line.",
        branches: [{ label: "Two people on one line", text: "The dish is split evenly between them.", tone: "neutral" }],
      },
      { icon: "➗", title: "Tax and tip", text: "Shared out by what each person ate, not evenly." },
      {
        icon: "🪙",
        title: "Coins stack up",
        text: "Everyone's total rises as a stack of coins.",
        branches: [
          { label: "Lines left unclaimed", text: "Says what's left over; one button shares it out.", tone: "bad" },
          { label: "All claimed", text: "\"Adds up to the cent\".", tone: "good" },
        ],
      },
    ],
    useWhen: ["Splitting a restaurant or group-order bill", "Shared household or trip expenses with itemised receipts", "Any checkout where several people pay for different lines"],
    avoidWhen: ["Equal splits — a simple divide is clearer", "Very long receipts — group lines into categories first"],
    accessibility: [
      "People and receipt lines are real toggle buttons (aria-pressed); tapping works everywhere, dragging is an extra",
      "Every change is announced in a role=\"status\" region",
      "Figures use tabular numbers; avatar pops and coin drops are off with reduced motion",
    ],
    support: "Works in all modern browsers. Drag and drop needs a mouse; tap works on touch screens.",
  },
  {
    slug: "island-notification",
    tryIt: ["Press “New message”. The pill at the top grows into a card.", "Press “Burst of 3”. It shows one and counts the rest, no pile-up.", "Click in the text box and fire one: it waits until you stop typing."],
    ext: "05",
    name: "Island Notification",
    type: "modal",
    week: 3,
    icon: "💊",
    summary: "A black pill that morphs into each notification, queues the rest, and waits while you're typing.",
    why: "Toasts pile up in a corner, cover what you're reading and pop up in the middle of a sentence you're typing. This island stays a small pill until something arrives, then morphs into a card sized to the message and shrinks back. Several take turns, uploads live inside the pill as a progress ring, and if you're typing it holds everything until you pause.",
    files: [{ label: "IslandNotification.tsx", path: "src/library/island-notification/IslandNotification.tsx" }],
    usagePath: "src/library/island-notification/usage.tsx",
    promptPath: "src/library/island-notification/prompt.md",
    props: [
      { name: "items", type: "IslandItem[]", default: "required", description: "The queue, oldest first: id, title, body, icon, tone, action, progress." },
      { name: "onDismiss", type: "(id: string) => void", default: "required", description: "Called when a notification is done (timed out, swiped, Esc or action)." },
      { name: "duration", type: "number", default: "4000", description: "How long a card stays open. Hovering pauses it." },
      { name: "morphMs", type: "number", default: "520", description: "How long the pill-to-card morph takes." },
      { name: "holdWhileTyping", type: "boolean", default: "true", description: "Wait while someone is typing; deliver when they pause." },
      { name: "accent", type: "string", default: '"#3DD9FF"', description: "Idle glow and info colour." },
      { name: "position", type: '"fixed" | "absolute"', default: '"fixed"', description: "Pin to the window, or stay inside the parent." },
      { name: "preview", type: '"open" | "held"', default: "—", description: "Freeze one look without timers, for docs and tests." },
      { name: "className", type: "string", default: '""', description: "Extra classes for the wrapper." },
    ],
    flow: [
      { icon: "●", title: "Quiet pill", text: "A small black pill with a glowing dot sits at the top." },
      {
        icon: "💬",
        title: "Something arrives",
        text: "The pill stretches into a card sized to the message, then shrinks back.",
        branches: [
          { label: "You're typing", text: "It waits, dot turns amber: \"1 waiting\".", tone: "neutral" },
          { label: "Several at once", text: "They take turns; the pill shows +2.", tone: "neutral" },
        ],
      },
      { icon: "⬆", title: "Read or dismiss", text: "Hover to pause, swipe up or Esc to dismiss, Enter for the action." },
      { icon: "◔", title: "Live activity", text: "Uploads and timers live in the pill as a progress ring until they finish." },
    ],
    useWhen: ["Chat, booking and payment alerts", "Background tasks: uploads, exports, syncs", "Apps where people type a lot and hate being interrupted"],
    avoidWhen: ["Errors that block the page — show them in place", "More than a few notifications a minute — group them first"],
    accessibility: [
      "Each notification is announced in a polite live region",
      "The action is a real button; Esc dismisses and Enter runs the action when the card has focus",
      "Hover pauses the timer; the morph is turned off for reduced motion",
    ],
    support: "Works in all modern browsers. No extra packages.",
  },
];

export const findEntry = (slug: string) => ENTRIES.find((e) => e.slug === slug);
export const pad = (n: number) => String(n).padStart(2, "0");
