import type { Entry } from "@/lib/registry";
import type { Playground } from "@/lib/playgrounds";

export const ENTRY: Entry = {
  slug: "scan-to-save-contact-card",
  ext: "11",
  name: "Scan-to-Save Contact Card",
  type: "card",
  week: 6,
  icon: "📇",
  summary: "A team card with a live QR code. Point a phone camera at the screen and the person is saved to contacts.",
  why: "People see a team member's card on a website or event screen and then have to type the name, number and email into their phone by hand, with typos. This card carries a real QR code of the person's contact card. Point any phone camera at it, tap the banner, and the phone's own New Contact screen opens already filled in. On a phone, where you can't scan your own screen, the code hides and the Save contact button downloads the same file, which opens the add-contact screen in one tap.",
  files: [
    { label: "ScanToSaveContactCard.tsx", path: "src/library/scan-to-save-contact-card/ScanToSaveContactCard.tsx" },
    { label: "qr.ts", path: "src/library/scan-to-save-contact-card/qr.ts" },
    { label: "vcard.ts", path: "src/library/scan-to-save-contact-card/vcard.ts" },
  ],
  usagePath: "src/library/scan-to-save-contact-card/usage.tsx",
  promptPath: "src/library/scan-to-save-contact-card/prompt.md",
  props: [
    { name: "contact", type: "Contact", default: "required", description: "The person: firstName, lastName, title, org, phones, emails, website, address, note and photoUrl. The card, QR code and .vcf file all come from this." },
    { name: "qrSize", type: "number", default: "128", description: "Width of the QR code on the card, in pixels." },
    { name: "showQr", type: '"always" | "desktop-only"', default: '"desktop-only"', description: "Hide the QR code on phones, where nobody can scan their own screen." },
    { name: "device", type: '"auto" | "desktop" | "mobile"', default: '"auto"', description: "Auto detects a touch-only phone screen. Force one to test." },
    { name: "layout", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Side by side, or stacked for team grids." },
    { name: "ecLevel", type: '"L" | "M" | "Q"', default: '"M"', description: "QR error correction. Higher survives glare and smudges but makes the code denser." },
    { name: "accent", type: "string", default: '"#C6FF3D"', description: "Button and avatar colour. Text on it is picked for contrast." },
    { name: "qrColor", type: "string", default: '"#0B0D0C"', description: "Colour of the QR squares. Keep it dark; the code always sits on white." },
    { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Card size." },
    { name: "showAvatar", type: "boolean", default: "true", description: "Show the photo or initials circle." },
    { name: "fileName", type: "string", default: "first-last.vcf", description: "Name of the downloaded file." },
    { name: "labels", type: "Partial<ContactCardLabels>", default: "English defaults", description: "Every piece of text: button, saved line, QR hint, mobile hint, dialog title and hint, copy buttons and their messages, loading and the detail tags." },
    { name: "onSave", type: "(vcard: string, contact: Contact) => void", default: "—", description: "Runs after the .vcf is downloaded, with the exact file text." },
    { name: "onCopy", type: '(kind: "email" | "phone", value: string) => void', default: "—", description: "Runs after an email or phone number is copied." },
    { name: "onZoom", type: "(open: boolean) => void", default: "—", description: "Runs when the large QR view opens or closes." },
    { name: "disabled", type: "boolean", default: "false", description: "Turns off saving, copying and zoom." },
    { name: "loading", type: "boolean", default: "false", description: "Shows a skeleton while the contact loads." },
    { name: "previewState", type: '"default" | "qr-zoomed" | "saved" | "mobile" | "vertical" | "minimal" | "disabled" | "loading"', default: "—", description: "Draw one state still. Nothing downloads, copies or opens." },
    { name: "className", type: "string", default: '""', description: "Extra classes for the card." },
  ],
  tryIt: [
    "Watch the phone scan Maya's card and save her as a new contact.",
    "Point your own phone camera at the QR code. Click it first to make it bigger.",
    "Press Save contact to download the real .vcf file, or turn on Phone view to see the one-tap version.",
  ],
  flow: [
    { icon: "📇", title: "Card shows a QR code", text: "The person's details are turned into a vCard and drawn as a QR code right on the card." },
    {
      icon: "📷",
      title: "Phone camera reads it",
      text: "Any phone camera offers \"Add to Contacts\". No app and no link to open.",
      branches: [
        { label: "Hard to scan", text: "Click the code: it opens large in a dialog.", tone: "neutral" },
        { label: "Too many details", text: "The card says so and the button still works.", tone: "bad" },
      ],
    },
    {
      icon: "👆",
      title: "Or press Save contact",
      text: "Downloads the same card as a .vcf file. On a phone it opens the add-contact screen.",
      branches: [
        { label: "Viewed on a phone", text: "The QR hides; the button goes full width.", tone: "neutral" },
        { label: "Only need one detail", text: "Copy the email or phone number.", tone: "neutral" },
      ],
    },
    { icon: "✓", title: "Saved", text: "The phone's own New Contact screen opens filled in. The card confirms the download.", branches: [{ label: "onSave", text: "Gets the exact file text, e.g. for analytics.", tone: "good" }] },
  ],
  useWhen: ["Agency and company team pages", "Event screens, booths and speaker pages", "Profile pages and digital business cards"],
  avoidWhen: ["Private staff details that shouldn't be public", "Pages printed small, where a dense code won't scan; use a short link instead"],
  accessibility: [
    "Real buttons with clear names, e.g. \"Copy email maya@…\" and \"Show a larger QR code for Maya Ortiz\"",
    "The large QR view is a native modal dialog: focus moves in, Esc closes it and focus returns",
    "Saved, copied and loading are announced in a role=\"status\" region",
    "Hover zoom, the dialog entrance and the loading pulse are off with reduced motion",
  ],
  support: "Works in all modern browsers. The QR code scans with the built-in camera on iPhone and Android. No extra packages.",
};

export const PLAYGROUND: Playground = {
  initial: { accent: "#C6FF3D", size: "md", layout: "horizontal", qrSize: 128, ecLevel: "M" },
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
    { key: "layout", label: "Layout", type: "segment", options: [{ value: "horizontal", label: "Side by side" }, { value: "vertical", label: "Stacked" }] },
    { key: "qrSize", label: "QR size", type: "slider", min: 96, max: 200, step: 8, unit: "px" },
    { key: "ecLevel", label: "Error correction", type: "segment", options: [{ value: "L", label: "L" }, { value: "M", label: "M" }, { value: "Q", label: "Q" }] },
  ],
};

export const CARD_STATE = "default";

export const TICKER: [string, string, "acc" | "warn" | "mute"] = ["scan-to-save-contact-card", "maya-ortiz.vcf · scanned, added to contacts", "acc"];
