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
    slug: "tape-measure-input",
    tryIt: ["Grab the metal hook and pull the tape out.", "Let go between marks: it snaps to the nearest step.", "Press Home, or push it all the way in, and it zips back."],
    ext: "02",
    name: "Tape Measure Input",
    type: "input",
    week: 1,
    icon: "📏",
    summary: "A number input you pull out like a tape measure. It snaps to the step and zips back in.",
    why: "A plain number box gives no sense of size, and a thin slider is fiddly and says nothing about what you're measuring. This input is a tape measure: pull the hook and the tape slides out with real marks on it, the case counts as you go, and letting go snaps to the nearest step with a little bounce. You feel the length you're picking, and it still works fully from the keyboard.",
    files: [{ label: "TapeMeasureInput.tsx", path: "src/library/tape-measure-input/TapeMeasureInput.tsx" }],
    usagePath: "src/library/tape-measure-input/usage.tsx",
    promptPath: "src/library/tape-measure-input/prompt.md",
    props: [
      { name: "value", type: "number", default: "required", description: "The current value." },
      { name: "onChange", type: "(value: number) => void", default: "required", description: "Called live while the tape moves, always on the step grid." },
      { name: "onSettle", type: "(value: number) => void", default: "—", description: "Called once a value is chosen: hook let go, track click or key press." },
      { name: "min", type: "number", default: "0", description: "Lowest value; the tape is fully in." },
      { name: "max", type: "number", default: "200", description: "Highest value; the tape is fully out." },
      { name: "step", type: "number", default: "1", description: "What it snaps to." },
      { name: "unit", type: "string", default: '"cm"', description: "Printed after the number." },
      { name: "label", type: "string", default: '"Length"', description: "Visible label, also the slider's name." },
      { name: "accent", type: "string", default: '"#C6FF3D"', description: "Tape colour." },
      { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Case and tape size." },
      { name: "disabled", type: "boolean", default: "false", description: "Dims and locks it." },
      { name: "preview", type: "{ value: number; pulling?: boolean }", default: "—", description: "Freeze one look without interaction, for docs and tests." },
      { name: "className", type: "string", default: '""', description: "Extra classes for the wrapper." },
    ],
    flow: [
      { icon: "🪝", title: "Grab the hook", text: "Drag the metal end hook. The marks slide out of the case with it." },
      {
        icon: "📏",
        title: "Pull it out",
        text: "The case counts live, and onChange fires on every step.",
        branches: [
          { label: "Fast pull", text: "The thin metal flexes a little, then steadies.", tone: "neutral" },
          { label: "Past the end", text: "It gives a little, then pulls back to max.", tone: "neutral" },
        ],
      },
      { icon: "🎯", title: "Let go", text: "It snaps to the nearest step with a small bounce, then onSettle fires." },
      { icon: "⚡", title: "Back to min", text: "Home key, or push it all the way in: the tape zips home and the case jolts.", branches: [{ label: "Click the track", text: "The tape slides straight there.", tone: "good" }] },
    ],
    useWhen: ["Lengths, widths and heights for made-to-measure products", "Any number with a real physical size: distance, fabric, cable, timber", "Settings where you want the size to be felt, not just typed"],
    avoidWhen: ["Exact numbers people already know, like a postcode or a price — use a text field", "Very large ranges with tiny steps — the marks get too dense"],
    accessibility: [
      "The hook is a real role=\"slider\" with aria-valuemin/max/now and aria-valuetext like \"120 cm\", named by the visible label",
      "Arrow keys ±step, Shift+arrow and PageUp/PageDown ±10 steps, Home/End for min/max; visible focus ring",
      "Reduced motion jumps straight to values: no spring, wobble or jolt",
    ],
    support: "Works in all modern browsers, with mouse, touch and pen. No extra packages.",
  },
  {
    slug: "string-nav",
    tryIt: ["Move your pointer just under the links. The string bends toward it.", "Click a link to pluck the string and watch the bead ride over.", "Turn Tension and Wobble up or down to change how it rings."],
    ext: "03",
    name: "Plucked String Nav",
    type: "navbar",
    week: 2,
    icon: "🎸",
    summary: "Links on a taut string: click one to pluck it, and a glowing bead rides the ring to the new page.",
    why: "Most navbars mark the current page with an underline that just jumps. Here the links sit on a string: it leans toward your pointer, rings when you click, and a bead rides it over to the new page, so you see where you are and where you went. It is still an ordinary nav underneath: real links, aria-current, arrow keys, and no motion at all for people who turn it off.",
    files: [{ label: "StringNav.tsx", path: "src/library/string-nav/StringNav.tsx" }],
    usagePath: "src/library/string-nav/usage.tsx",
    promptPath: "src/library/string-nav/prompt.md",
    props: [
      { name: "items", type: "{ id: string; label: string; href?: string }[]", default: "required", description: "The links, left to right. With href they render as real links." },
      { name: "value", type: "string", default: "required", description: "The id of the active item. The bead sits under it." },
      { name: "onChange", type: "(id: string) => void", default: "required", description: "Called when another item is picked. Route there yourself." },
      { name: "accent", type: "string", default: '"#C6FF3D"', description: "Bead and glow colour." },
      { name: "tension", type: "number", default: "5", description: "How stiff the string is, 1–10. Higher rings faster and stops sooner." },
      { name: "wobble", type: "number", default: "9", description: "Pluck strength in px, 0–16. 0 turns the ring off." },
      { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Text size, padding and string band height." },
      { name: "label", type: "string", default: '"Main"', description: "Accessible name of the nav landmark." },
      { name: "preview", type: "{ pull?: { x: number; y: number }; plucked?: boolean }", default: "—", description: "Freeze one look without physics, for docs and tests." },
      { name: "className", type: "string", default: '""', description: "Extra classes for the nav." },
    ],
    flow: [
      { icon: "〰", title: "Resting string", text: "Links sit on a straight string between two pegs; the bead marks the current page." },
      { icon: "☝", title: "Pointer near", text: "The string bends toward the cursor and springs back when it leaves." },
      {
        icon: "🎸",
        title: "Pluck",
        text: "A click rings the string; tension sets how fast it fades, wobble sets how hard.",
        branches: [
          { label: "Reduced motion", text: "No ring; the bead jumps straight there.", tone: "neutral" },
          { label: "Wobble 0", text: "The string stays still; only the bead moves.", tone: "neutral" },
        ],
      },
      { icon: "●", title: "Bead rides over", text: "The bead slides to the new link along the ringing string, then settles.", branches: [{ label: "Done", text: "onChange fires with the new id.", tone: "good" }] },
    ],
    useWhen: ["Portfolio, studio and music sites with 3–6 top links", "Landing pages that want one playful touch", "Section tabs where seeing the move helps"],
    avoidWhen: ["Big menus or dropdowns — use a normal navbar", "Dense dashboards where motion distracts"],
    accessibility: [
      "A real nav landmark with buttons or links; aria-current=\"page\" on the active one",
      "Arrow keys, Home and End move focus (roving tabindex); Enter or Space picks",
      "With reduced motion there is no pull and no ring, and the bead jumps",
    ],
    support: "Works in all modern browsers. No extra packages. The pull needs a pointer; tap and keys pluck it.",
  },
  {
    slug: "vinyl-crate-carousel",
    tryIt: ["Scroll or drag over the crate, or press ← →, to flip through the records.", "Click the front record (or Play) to pull it out.", "Watch it spin, then press Esc or Put back."],
    ext: "04",
    name: "Vinyl Crate Carousel",
    type: "section",
    week: 2,
    icon: "💿",
    summary: "Flip through albums standing in a record crate, then pull one out and watch it spin.",
    why: "Most carousels slide flat cards sideways, and you can't tell where you are or what's coming next. This one works like flicking through records in a shop: the front sleeve tips toward you to show the next one, and the ones behind stay in view as a stack. Pull one out and the sleeve slides one way while the disc slides the other and starts spinning, so choosing an item feels like an event.",
    files: [{ label: "VinylCrateCarousel.tsx", path: "src/library/vinyl-crate-carousel/VinylCrateCarousel.tsx" }],
    usagePath: "src/library/vinyl-crate-carousel/usage.tsx",
    promptPath: "src/library/vinyl-crate-carousel/prompt.md",
    props: [
      { name: "records", type: "{ id; title; artist; year?; colors: [string, string]; pattern? }[]", default: "required", description: "The albums. Covers are drawn from the two colours; pattern is sun, bands, rings, split, grid or wave." },
      { name: "label", type: "string", default: '"Records"', description: "Accessible name, e.g. \"Staff picks\"." },
      { name: "index", type: "number", default: "—", description: "Controlled: which record is at the front. Pair it with onChange." },
      { name: "initialIndex", type: "number", default: "0", description: "Uncontrolled: which record is at the front first." },
      { name: "onChange", type: "(index: number) => void", default: "—", description: "Called whenever the front record changes." },
      { name: "onPlay", type: "(record) => void", default: "—", description: "Called when a record is pulled out and starts spinning." },
      { name: "onPutBack", type: "(record) => void", default: "—", description: "Called when the playing record goes back in the crate." },
      { name: "accent", type: "string", default: '"#C6FF3D"', description: "Glow behind the disc, the Play button and the focus ring." },
      { name: "rpm", type: "33 | 45", default: "33", description: "How fast the disc spins once it's out." },
      { name: "flipMs", type: "number", default: "450", description: "How long one flip takes. Pulling out takes 1.6× this." },
      { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Cover size; it also shrinks to fit narrow screens." },
      { name: "preview", type: "{ index: number; pulled?: boolean }", default: "—", description: "Freeze one look without input, for docs and tests." },
      { name: "className", type: "string", default: '""', description: "Extra classes for the wrapper." },
    ],
    flow: [
      { icon: "📦", title: "Records in a crate", text: "Sleeves stand front to back; you see the top edges of the ones behind." },
      {
        icon: "↓",
        title: "Flip",
        text: "Scroll, drag down or press →: the front sleeve tips toward you and the next one shows.",
        branches: [
          { label: "Going back", text: "Drag up or ←: the last sleeve lifts upright again.", tone: "neutral" },
          { label: "At either end", text: "That button turns off and the page scrolls as normal.", tone: "neutral" },
        ],
      },
      { icon: "💿", title: "Pull it out", text: "Click the record or press Enter: the sleeve slides left, the disc slides right, the arm swings on and it spins." },
      { icon: "↩", title: "Put it back", text: "Esc or Put back: the disc slides into the sleeve and it drops back into the crate.", branches: [{ label: "Reduced motion", text: "A quick crossfade instead, and no spinning.", tone: "good" }] },
    ],
    useWhen: ["Music, podcasts, playlists and anything with cover art", "Featured picks or a small curated set (5–20 items)", "Product pages that want one memorable moment"],
    avoidWhen: ["Long lists people need to search or compare — use a grid", "Items without a strong visual — the crate is the whole point"],
    accessibility: [
      "A labelled carousel region; each sleeve is a slide named \"3 of 8: Title — Artist\"",
      "Real Previous / Play / Next buttons; ← → Home End flip, Enter plays, Esc puts it back",
      "A polite live region announces the front record and \"Now playing\"; reduced motion crossfades and stops the spin",
    ],
    support: "Works in all modern browsers (uses CSS 3D transforms, color-mix and container units). No extra packages.",
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
  {
    slug: "boarding-pass-card",
    tryIt: ["Grab the stub and pull it away from the dotted line.", "Let go early and it snaps back; pull further and it rips off.", "Watch the CHECKED IN stamp land, then press Reset for a fresh pass."],
    ext: "06",
    name: "Boarding Pass Card",
    type: "card",
    week: 3,
    icon: "🎫",
    summary: "A boarding pass whose stub you tear off along the perforation to check in.",
    why: "Check-in is usually one more grey button that's easy to press by accident and gives no sense that anything happened. Here you tear the stub off the pass, a physical gesture that's hard to do by mistake. Let go early and it springs back; pull past the tear point and it rips away and a CHECKED IN stamp lands on the pass. Keyboard users get a real button that does the same.",
    files: [{ label: "BoardingPassCard.tsx", path: "src/library/boarding-pass-card/BoardingPassCard.tsx" }],
    usagePath: "src/library/boarding-pass-card/usage.tsx",
    promptPath: "src/library/boarding-pass-card/prompt.md",
    props: [
      { name: "pass", type: "BoardingPass", default: "required", description: "from/to { code, city }, passenger, flight, date, boards, gate, seat, group?, cabin?, gateChanged?" },
      { name: "airline", type: "string", default: "required", description: "Airline name, shown top left." },
      { name: "onTear", type: "() => void", default: "—", description: "Runs when the stub is torn off: the check-in." },
      { name: "onPeelStart", type: "() => void", default: "—", description: "Runs when someone starts pulling the stub." },
      { name: "onSnapBack", type: "() => void", default: "—", description: "Runs when the stub is let go too early and springs back." },
      { name: "torn", type: "boolean", default: "—", description: "Controlled: is the stub torn off?" },
      { name: "defaultTorn", type: "boolean", default: "false", description: "Uncontrolled starting value." },
      { name: "accent", type: "string", default: '"#C6FF3D"', description: "Stamp, plane and hint arrow colour." },
      { name: "tearDistance", type: "number", default: "110", description: "How far, in px, the stub must be pulled before it rips." },
      { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Maximum width and type size." },
      { name: "preview", type: '"ready" | "tearing" | "torn"', default: "—", description: "Freeze one look without dragging, for docs and tests." },
      { name: "className", type: "string", default: '""', description: "Extra classes for the wrapper." },
    ],
    flow: [
      { icon: "🎫", title: "Pass ready", text: "Stub on, dotted perforation, a small plane gliding along the route." },
      {
        icon: "✋",
        title: "Pull the stub",
        text: "It peels around the perforation, gets stiffer the further you pull, and the edge turns jagged.",
        branches: [{ label: "Let go early", text: "It springs back into place.", tone: "neutral" }],
      },
      { icon: "✂", title: "It rips", text: "Past the tear point the stub flies off; the torn edge stays on the pass." },
      {
        icon: "✓",
        title: "Checked in",
        text: "A CHECKED IN stamp thumps down with the seat and gate, and onTear runs.",
        branches: [{ label: "Keyboard", text: "The “Tear stub to check in” button does the same.", tone: "good" }],
      },
    ],
    useWhen: ["Travel, event and cinema check-in", "Redeeming a ticket, voucher or coupon", "Any one-time confirm that should feel deliberate"],
    avoidWhen: ["Actions people repeat many times a day", "Forms where a plain submit button is expected"],
    accessibility: [
      "A real “Tear stub to check in” button does the whole tear from the keyboard",
      "Check-in is announced in a polite live region: “Checked in. Seat 14A, gate B12.”",
      "Reduced motion: no peel, throw or gliding plane; the stamp just appears",
    ],
    support: "Works in all modern browsers (uses container queries and @property). No extra packages.",
  },
];

export const findEntry = (slug: string) => ENTRIES.find((e) => e.slug === slug);
export const pad = (n: number) => String(n).padStart(2, "0");
