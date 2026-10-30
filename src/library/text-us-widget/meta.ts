import type { Entry } from "@/lib/registry";
import type { Playground } from "@/lib/playgrounds";

export const ENTRY: Entry = {
  slug: "text-us-widget",
  ext: "09",
  name: "Text-Us Widget",
  type: "form",
  week: 5,
  icon: "💬",
  summary: "A \"Text us\" bubble for business websites. The visitor leaves a number and a message, and the reply arrives on their phone by text.",
  why: "Most website visitors leave before anyone answers a chat, and the lead is gone with the tab. This bubble asks for a name, a mobile number and a message, sends it to the business (a GoHighLevel webhook or any endpoint) and tells the visitor the reply will come by text. The number is formatted and checked as it's typed, the SMS consent line is built in, and the visitor sees exactly which number will be texted, with a link to fix it.",
  files: [
    { label: "TextUsWidget.tsx", path: "src/library/text-us-widget/TextUsWidget.tsx" },
    { label: "phone.ts", path: "src/library/text-us-widget/phone.ts" },
  ],
  usagePath: "src/library/text-us-widget/usage.tsx",
  promptPath: "src/library/text-us-widget/prompt.md",
  props: [
    { name: "onSend", type: "(payload: TextUsPayload) => Promise<void | { id?: string }>", default: "required", description: "Send the message to your CRM or webhook. Payload: name, phone (E.164), country, message, consent, consentText, page, timestamp. Throw or reject to show Try again." },
    { name: "onSent", type: "(payload, result?) => void", default: "—", description: "Runs after onSend succeeds." },
    { name: "onError", type: "(error: unknown) => void", default: "—", description: "Runs when onSend fails." },
    { name: "onStateChange", type: "(state: TextUsState) => void", default: "—", description: "Called on every state change, e.g. for analytics." },
    { name: "onOpenChange", type: "(open: boolean) => void", default: "—", description: "Called when the panel opens or closes." },
    { name: "businessName", type: "string", default: '"our team"', description: "Shown in the header, the consent line and the confirmation." },
    { name: "businessNumber", type: "string", default: "—", description: "The number replies come from, shown as \"from …\" after sending." },
    { name: "replyTime", type: "string", default: '"We usually reply in a few minutes"', description: "The line under the business name." },
    { name: "closedHint", type: "string", default: "—", description: "Out of hours: shown instead of the reply time, e.g. \"We'll text you at 9 AM\". Sending still works." },
    { name: "defaultCountry", type: "string", default: '"US"', description: "ISO code picked first in the country list." },
    { name: "countries", type: "Country[]", default: "10 built in", description: "Your own list: dial code, grouping, trunk prefix, mobile pattern and an example number." },
    { name: "consentText", type: "string", default: "SMS consent line", description: "Your consent wording; {business} is filled in. It is also sent in the payload for your opt-in records." },
    { name: "consentMode", type: '"checkbox" | "implied"', default: '"checkbox"', description: "A required tick box, or a line under the button saying that sending agrees." },
    { name: "position", type: '"bottom-right" | "bottom-left"', default: '"bottom-right"', description: "Corner for the bubble and panel." },
    { name: "container", type: '"window" | "parent"', default: '"window"', description: "Pin to the screen, or stay inside a positioned parent." },
    { name: "openOnLoad", type: "boolean | number", default: "false", description: "Open once by itself (after this many ms). Not again in that tab once the visitor closes it." },
    { name: "defaultValues", type: "{ name?, phone?, message? }", default: "—", description: "Start filled in, e.g. for a signed-in customer." },
    { name: "team", type: "{ name: string; src?: string }[]", default: "—", description: "Up to three faces in the header; initials when there's no photo." },
    { name: "draftKey", type: "string | false", default: '"text-us-draft"', description: "sessionStorage key for the draft. false turns drafts off." },
    { name: "maxLength", type: "number", default: "320", description: "Longest message allowed; a counter shows it." },
    { name: "labels", type: "Partial<TextUsLabels>", default: "English defaults", description: "Every visible and announced string, including errors and the confirmation." },
    { name: "accent", type: "string", default: '"#C6FF3D"', description: "Bubble, Send button and sent message colour. Text on it is picked for contrast." },
    { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Bubble and panel size." },
    { name: "disabled", type: "boolean", default: "false", description: "Greys out the bubble so it can't be opened." },
    { name: "previewState", type: '"closed" | "open" | "filling" | "invalid" | "sending" | "sent" | "error" | "disabled" | "offline"', default: "—", description: "Draw one state still with sample data. Nothing runs." },
    { name: "className", type: "string", default: '""', description: "Extra classes for the wrapper." },
  ],
  tryIt: [
    "Watch it play once: the visitor fills in the bubble, sends, and the salon's reply lands on the phone.",
    "Now try it yourself. Type a short number and leave the field, or paste one starting with +44.",
    "Turn on \"Make sending fail\" and send: your text stays and the button says Try again.",
  ],
  flow: [
    { icon: "💬", title: "Visitor opens the bubble", text: "The panel grows out of the corner. A saved draft from this tab comes back." },
    {
      icon: "📱",
      title: "Name, number, message",
      text: "The number formats itself for the chosen country. Pasting +44 or +880 switches the country.",
      branches: [
        { label: "Number too short", text: "Checked on leaving the field, with a real example.", tone: "bad" },
        { label: "No consent tick", text: "Send is blocked and the box says why.", tone: "bad" },
      ],
    },
    {
      icon: "📤",
      title: "Send",
      text: "onSend gets the payload with the number in E.164, the consent text, page and time.",
      branches: [{ label: "Webhook fails", text: "Nothing typed is lost. The button says Try again.", tone: "bad" }],
    },
    {
      icon: "✅",
      title: "Sent to your phone",
      text: "The message lifts out of the panel: \"We'll text you at +1 415 555 0134 from (415) 555-0199\".",
      branches: [
        { label: "Wrong number", text: "Edit goes back with the message kept.", tone: "neutral" },
        { label: "Out of hours", text: "Says when the reply will come.", tone: "neutral" },
      ],
    },
    { icon: "💌", title: "Reply by text", text: "The business answers from its CRM. The visitor gets it as an SMS, even with the tab closed." },
  ],
  useWhen: ["Local business sites: salons, clinics, trades, restaurants", "GoHighLevel agencies sending website leads into a workflow", "Any site where people browse on their phone and leave before a chat is answered"],
  avoidWhen: ["Support that needs files, screenshots or long back-and-forth", "Businesses that can't send SMS yet (no registered number or A2P approval)"],
  accessibility: [
    "Real form with labels, a native country select and a tel input with autocomplete; Ctrl/Cmd+Enter sends from the message",
    "Errors use aria-invalid with linked messages, and focus moves to the first one",
    "Opening, sending, sent and errors are announced in a role=\"status\" region; focus moves to the confirmation after sending",
    "Esc closes and focus returns to the bubble; all motion is off with reduced motion",
  ],
  support: "Works in all modern browsers, with mouse, touch and keyboard. No extra packages.",
};

export const PLAYGROUND: Playground = {
  initial: { accent: "#C6FF3D", size: "md", consentMode: "checkbox", position: "bottom-right" },
  controls: [
    {
      key: "accent",
      label: "Accent",
      type: "color",
      options: [
        { value: "#C6FF3D", label: "Lime" },
        { value: "#3DD9FF", label: "Cyan" },
        { value: "#FFB547", label: "Amber" },
        { value: "#FF6B57", label: "Coral" },
        { value: "#B79CFF", label: "Lilac" },
      ],
    },
    { key: "size", label: "Size", type: "segment", options: [{ value: "sm", label: "S" }, { value: "md", label: "M" }, { value: "lg", label: "L" }] },
    { key: "consentMode", label: "Consent", type: "segment", options: [{ value: "checkbox", label: "Tick box" }, { value: "implied", label: "Implied" }] },
    { key: "position", label: "Corner", type: "segment", options: [{ value: "bottom-right", label: "Right" }, { value: "bottom-left", label: "Left" }] },
  ],
};

export const CARD_STATE = "sent";

export const TICKER: [string, string, "acc" | "warn" | "mute"] = ["text-us-widget", "website chat → SMS · we'll text you at +1 415 555 0134", "acc"];
