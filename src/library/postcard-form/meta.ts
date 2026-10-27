import type { Entry } from "@/lib/registry";
import type { Playground } from "@/lib/playgrounds";

export const ENTRY: Entry = {
  slug: "postcard-form",
  ext: "09",
  name: "Postcard Form",
  type: "form",
  week: 5,
  icon: "📮",
  summary: "A contact form on a postcard. It keeps your draft, waits in the mailbox while offline, and the stamp is the send button.",
  why: "Contact forms lose the whole message on an accidental refresh, fail without a word when you're offline, and pile every error on you in red after you press send. This one is a postcard that saves your draft as you write and brings it back after a refresh. It checks each field as you leave it, right under that field. Sent while offline, it waits in the mailbox and goes by itself when you're back. Press the stamp and it sticks on, gets a postmark with today's date, and slides into the letterbox.",
  files: [
    { label: "PostcardForm.tsx", path: "src/library/postcard-form/PostcardForm.tsx" },
    { label: "parts.tsx", path: "src/library/postcard-form/parts.tsx" },
  ],
  usagePath: "src/library/postcard-form/usage.tsx",
  promptPath: "src/library/postcard-form/prompt.md",
  props: [
    { name: "onSend", type: "(values: PostcardValues) => Promise<void>", default: "required", description: "Sends the card. Resolve when it's delivered; reject (throw) to bounce it back with the words kept." },
    { name: "draftKey", type: "string", default: '"postcard-form"', description: "localStorage key for the draft. Use a different one per form." },
    { name: "topics", type: "string[]", default: "—", description: "Shows an optional topic select when given." },
    { name: "minMessageLength", type: "number", default: "10", description: "Shortest message it will send." },
    { name: "maxLength", type: "number", default: "1000", description: "Longest message. The counter turns amber at 90%." },
    { name: "labels", type: "Partial<PostcardLabels>", default: "English defaults", description: "Every piece of text: title, recipient, field labels and placeholders, stamp, postmark, date and \"ago\" formats, restored note, each error, mailbox, sent and button text." },
    { name: "accent", type: "string", default: '"#3DD9FF"', description: "Stamp colour and postmark ink. Hex colours get readable text on the stamp." },
    { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Card width, text and stamp size." },
    { name: "disabled", type: "boolean", default: "false", description: "Turns the whole card off." },
    { name: "online", type: "boolean", default: "follows the browser", description: "Force the network state. Left out, it follows navigator.onLine and the online/offline events." },
    { name: "previewState", type: '"empty" | "filled" | "invalid" | "sending" | "mailbox" | "sent" | "error"', default: "—", description: "Draw one state still, without storage or timers." },
    { name: "onDraftSave", type: "(values) => void", default: "—", description: "Runs after the draft is written to storage." },
    { name: "onDraftRestore", type: "(values, savedAt: number) => void", default: "—", description: "Runs when a saved draft is brought back on load." },
    { name: "onInvalid", type: "(fields: PostcardField[]) => void", default: "—", description: "Runs when send is pressed with fields to fix." },
    { name: "onQueue", type: "(values) => void", default: "—", description: "Runs when the card goes into the mailbox because you're offline." },
    { name: "onError", type: "(error: unknown) => void", default: "—", description: "Runs when onSend rejects." },
    { name: "className", type: "string", default: '""', description: "Extra classes for the wrapper." },
  ],
  tryIt: [
    "Write a few words, then press Refresh the page. Your draft comes back.",
    "Turn the network off and press the stamp. The card waits in the mailbox; turn it back on and it sends.",
    "Set the server to fail and send. The card bounces back with every word kept.",
  ],
  flow: [
    { icon: "✍️", title: "Write", text: "The draft is saved on this device 0.4 s after you stop typing.", branches: [{ label: "Refresh or tab closed", text: "It comes back with \"Restored your draft\" and a Discard link.", tone: "good" }] },
    { icon: "🔍", title: "Leave a field", text: "That field is checked and any problem shows right under it.", branches: [{ label: "Something to fix on send", text: "Focus jumps to the first one and the stamp shakes. Nothing is sent.", tone: "bad" }] },
    { icon: "📮", title: "Press the stamp", text: "It sticks on. The postmark inks today's date while onSend runs.", branches: [{ label: "Offline", text: "It waits in the mailbox and sends by itself once, when you're back.", tone: "neutral" }] },
    { icon: "✉️", title: "Posted", text: "The card slides into the letterbox and the draft is cleared.", branches: [{ label: "Server fails", text: "It bounces back with your words and Try again.", tone: "bad" }] },
  ],
  useWhen: ["Contact and feedback forms where people write more than a line", "Support or enquiry forms used on phones with patchy signal", "Anywhere losing a long message would make someone give up"],
  avoidWhen: ["Long multi-step forms with many fields — use a stepped form", "Shared or public computers where a saved draft could be read by the next person"],
  accessibility: [
    "A real <form> with <label>s and native inputs; Enter sends, Ctrl/Cmd+Enter sends from the message, and the stamp is a real submit button",
    "Errors sit under their field, linked with aria-describedby and aria-invalid; on send, focus moves to the first one",
    "Sending, mailbox, limit and result are announced in role=\"status\"; a failure uses role=\"alert\" and Try again gets focus",
    "Stick, ink, shake and slide animations are off with reduced motion",
  ],
  support: "Works in all modern browsers (needs container queries). Drafts use localStorage; if it's blocked the form still works without them. No extra packages.",
};

export const PLAYGROUND: Playground = {
  initial: { accent: "#3DD9FF", size: "md", minMessageLength: 10, maxLength: 1000 },
  controls: [
    {
      key: "accent",
      label: "Stamp & ink",
      type: "color",
      options: [
        { value: "#3DD9FF", label: "Cyan" },
        { value: "#C6FF3D", label: "Lime" },
        { value: "#FFB547", label: "Amber" },
        { value: "#FF6B57", label: "Coral" },
        { value: "#B79CFF", label: "Lilac" },
        { value: "#1B3A6B", label: "Navy" },
      ],
    },
    { key: "size", label: "Size", type: "segment", options: [{ value: "sm", label: "S" }, { value: "md", label: "M" }, { value: "lg", label: "L" }] },
    { key: "minMessageLength", label: "Shortest message", type: "slider", min: 0, max: 60, step: 5, unit: " chars" },
    { key: "maxLength", label: "Longest message", type: "slider", min: 100, max: 2000, step: 100, unit: " chars" },
  ],
};

export const CARD_STATE = "sending";

export const TICKER: [string, string, "acc" | "warn" | "mute"] = ["postcard-form", "stamp stuck · postmarked today, in the letterbox", "acc"];
