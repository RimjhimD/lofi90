import type { Entry } from "@/lib/registry";
import type { Playground } from "@/lib/playgrounds";

export const ENTRY: Entry = {
  slug: "wax-seal-button",
  ext: "07",
  name: "Wax Seal Button",
  type: "button",
  week: 4,
  icon: "🔏",
  summary: "Press Pay and a wax seal stamps onto the button. Sealed means it can't go twice, even offline or on a flaky server.",
  why: "Pay and Send buttons fire twice: a double-click, a held Enter key, an impatient re-tap, or a slow network makes people press again, and the card is charged twice. When the connection drops the order is lost, and on a 502 nobody knows whether to click again. This button seals itself on the first press and ignores every press after. It sends one idempotency key with every try so the server can spot repeats, waits and sends by itself when you're offline, and retries busy-server errors on its own with the same key.",
  files: [{ label: "WaxSealButton.tsx", path: "src/library/wax-seal-button/WaxSealButton.tsx" }],
  usagePath: "src/library/wax-seal-button/usage.tsx",
  promptPath: "src/library/wax-seal-button/prompt.md",
  props: [
    { name: "onSubmit", type: "(key: string) => Promise<unknown> | unknown", default: "required", description: "Do the real request here and send key as the Idempotency-Key header. Retries reuse the same key. Throw to fail." },
    { name: "onSuccess", type: "(result: unknown, key: string) => void", default: "—", description: "Runs once the request went through." },
    { name: "onError", type: "(error: unknown, key: string) => void", default: "—", description: "A failure not worth retrying, or retries used up. The seal cracks and the button can be pressed again with the same key." },
    { name: "onRetry", type: "(info: { attempt; delayMs; error; key }) => void", default: "—", description: "A retry was planned after a busy-server error." },
    { name: "onQueued", type: "(key: string) => void", default: "—", description: "Pressed while offline. It sends by itself when the connection is back." },
    { name: "onDuplicate", type: "() => void", default: "—", description: "A press that was ignored because it is already sealed." },
    { name: "maxRetries", type: "number", default: "3", description: "Retries after the first try, for 408, 429, 500, 502, 503, 504, retryable: true, or a network error while online." },
    { name: "baseDelayMs", type: "number", default: "1000", description: "First retry wait; it doubles each time. An error's retryAfterMs wins." },
    { name: "resetAfterMs", type: "number", default: "—", description: "After success, go back to idle with a fresh key after this long. Leave it out to stay sealed." },
    { name: "online", type: "boolean", default: "browser", description: "Override connection detection. By default it follows navigator.onLine and the online/offline events." },
    { name: "labels", type: "Partial<SealLabels>", default: "English defaults", description: "Every piece of text: idle, sealing, queued, retrying ({s}), sent, error, and the status lines (retryingHint uses {s} {n} {max}, errorHint uses {message})." },
    { name: "disabled", type: "boolean", default: "false", description: "Turns the button off." },
    { name: "pending", type: "boolean", default: "false", description: "Force the sending look and block presses." },
    { name: "previewState", type: '"idle" | "sealing" | "queued" | "retrying" | "sent" | "error"', default: "—", description: "Render one state without running anything." },
    { name: "accent", type: "string", default: '"#FF6B57"', description: "Wax colour. The idle button uses it too, with readable text picked automatically." },
    { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Button and seal size." },
    { name: "glyph", type: "string", default: '"✓"', description: "One or two characters pressed into the seal, like a monogram." },
    { name: "ref", type: "Ref<{ reset(); key() }>", default: "—", description: "reset() goes back to idle and the next press gets a fresh key; key() reads the current one." },
    { name: "className", type: "string", default: '""', description: "Extra classes for the wrapper." },
  ],
  tryIt: [
    "Click Spam-click ×5, or double-click Pay yourself. Charges on server stays at 1.",
    "Set Server to Flaky and press Pay: it retries twice with the same key, then pays once.",
    "Go Offline, press Pay, then go Online again. The grey seal warms up and sends by itself.",
  ],
  flow: [
    { icon: "👆", title: "Press Pay", text: "A seal drops onto the button and one idempotency key is made for this payment." },
    {
      icon: "🔏",
      title: "Sealed",
      text: "Every press after this one is ignored, even five clicks in the same instant.",
      branches: [{ label: "Offline", text: "The seal goes grey and waits. It sends by itself when you're back.", tone: "neutral" }],
    },
    {
      icon: "📨",
      title: "Sent with the key",
      text: "onSubmit gets the key; the server uses it to spot repeats.",
      branches: [
        { label: "503, 429, timeout", text: "Waits 1s, 2s, 4s and tries again with the same key.", tone: "neutral" },
        { label: "Declined", text: "The seal cracks and shows why. Press again to retry, same key.", tone: "bad" },
      ],
    },
    { icon: "✨", title: "Paid once", text: "The seal glints and stays. It can't charge again.", branches: [{ label: "resetAfterMs", text: "Goes back to idle with a fresh key.", tone: "good" }] },
  ],
  useWhen: ["Pay, Place order, Book and Send buttons", "Anything that must not happen twice, like a charge or a message", "Forms used on shaky mobile connections"],
  avoidWhen: ["Actions that are safe to repeat, like Save or Like", "Servers that don't support idempotency keys. The button still stops double-clicks, but retries could repeat"],
  accessibility: [
    "Real <button>; Enter and Space work, and a held-down key only sends once",
    "Every change is told in a role=\"status\" region; aria-busy while sending, aria-disabled once sealed",
    "The retry countdown is announced once, not every second",
    "Seal drop, shake and glint are off with reduced motion",
  ],
  support: "Works in all modern browsers. crypto.randomUUID is used where available with a fallback. No extra packages.",
};

export const PLAYGROUND: Playground = {
  initial: { accent: "#FF6B57", size: "md", glyph: "✓", maxRetries: 3 },
  controls: [
    {
      key: "accent",
      label: "Wax colour",
      type: "color",
      options: [
        { value: "#FF6B57", label: "Coral" },
        { value: "#9E1B32", label: "Burgundy" },
        { value: "#D4A017", label: "Gold" },
        { value: "#2B4C7E", label: "Navy" },
        { value: "#2F6B3F", label: "Forest" },
        { value: "#C6FF3D", label: "Lime" },
      ],
    },
    { key: "size", label: "Size", type: "segment", options: [{ value: "sm", label: "S" }, { value: "md", label: "M" }, { value: "lg", label: "L" }] },
    { key: "glyph", label: "Seal mark", type: "segment", options: [{ value: "✓", label: "✓" }, { value: "M", label: "M" }, { value: "★", label: "★" }, { value: "$", label: "$" }] },
    { key: "maxRetries", label: "Retries", type: "slider", min: 0, max: 5, step: 1 },
  ],
};

export const CARD_STATE = "stamp";

export const TICKER: [string, string, "acc" | "warn" | "mute"] = ["wax-seal-button", "seal set · $48.00 paid once, 4 extra clicks ignored", "acc"];
