import type { Entry } from "@/lib/registry";
import type { Playground } from "@/lib/playgrounds";

export const ENTRY: Entry = {
  slug: "url-slug-input",
  ext: "07",
  name: "Live URL Slug Input",
  type: "input",
  week: 4,
  icon: "🔗",
  summary: "Type a title and the web address builds itself underneath, checks if it's taken and offers free ones.",
  why: "Page addresses get made by hand or by a quick rule that leaves accents, “&” and emoji as junk, and you only find out the address is taken when you press Save. This field builds a clean address from the title while you type, shows the full link, checks it with the server after you pause, and if it's taken offers free versions you can click. The address follows the title until you unlock it and edit it yourself, and changing the address of a live page warns that old links will break.",
  files: [
    { label: "UrlSlugInput.tsx", path: "src/library/url-slug-input/UrlSlugInput.tsx" },
    { label: "slug.ts", path: "src/library/url-slug-input/slug.ts" },
  ],
  usagePath: "src/library/url-slug-input/usage.tsx",
  promptPath: "src/library/url-slug-input/prompt.md",
  props: [
    { name: "value", type: "{ title; slug; locked; redirect? }", default: "—", description: "Controlled value. Leave it out and the field keeps its own state (use defaultValue)." },
    { name: "defaultValue", type: "Partial<SlugDraft>", default: "—", description: "Starting title and slug when uncontrolled. locked defaults to true, or false for a published page." },
    { name: "onChange", type: "(value: SlugValue) => void", default: "—", description: "Every edit, plus each availability answer. Gets title, slug, locked, redirect and available (true, false or null while unknown)." },
    { name: "prefix", type: "string", default: '"mysite.com/blog/"', description: "Printed before the slug in the address preview." },
    { name: "checkAvailability", type: "(slug, signal: AbortSignal) => Promise<boolean>", default: "—", description: "Is this slug free? Runs after a pause in typing. Older checks are aborted and their answers ignored. Throw to show the error state." },
    { name: "debounceMs", type: "number", default: "400", description: "Pause after the last change before checking." },
    { name: "suggest", type: "(slug, { title, year }) => string[]", default: "built in", description: "Your own ideas for a taken slug. Each one is still cleaned and checked before it shows." },
    { name: "maxSuggestions", type: "number", default: "3", description: "How many free versions to show at most." },
    { name: "maxLength", type: "number", default: "60", description: "Longest slug. Longer ones are cut at a word break, never mid-word." },
    { name: "removeStopWords", type: "boolean", default: "false", description: "Drop small words such as the, and, of." },
    { name: "stopWords", type: "string[]", default: "English list", description: "Which small words removeStopWords drops." },
    { name: "published", type: "boolean", default: "false", description: "The page is live. Changing its slug shows the “Old links will break” warning." },
    { name: "originalSlug", type: "string", default: "—", description: "The live slug of a published page." },
    { name: "names", type: "{ title?; slug?; redirect? }", default: "—", description: "Form field names. The slug is sent in a hidden input." },
    { name: "onStatusChange", type: "(status, slug) => void", default: "—", description: "empty, idle, checking, available, taken or error, each time it changes." },
    { name: "onPick", type: "(slug: string) => void", default: "—", description: "A suggestion was clicked." },
    { name: "labels", type: "Partial<UrlSlugLabels>", default: "English defaults", description: "Every string: field label, placeholders, the word for “&”, status words, lock and re-sync, suggestions, the warning ({old}), the redirect box and the announcements ({url}, {n})." },
    { name: "accent", type: "string", default: '"#C6FF3D"', description: "Highlight colour of the slug." },
    { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Text and padding size." },
    { name: "disabled", type: "boolean", default: "false", description: "Dims the field and stops checks." },
    { name: "previewState", type: '"empty" | "typing" | "checking" | "available" | "taken" | "manual" | "published" | "error" | "disabled"', default: "—", description: "Draw one state still with sample text. Nothing runs and nothing is focusable." },
    { name: "className", type: "string", default: '""', description: "Extra classes for the wrapper." },
  ],
  tryIt: [
    "Watch it type a title with accents and “&”: the address underneath stays clean.",
    "It's taken, so free versions appear. Click one, or type your own title.",
    "Press the lock to edit the address by hand, or turn on “Published page” and change it to see the warning.",
  ],
  flow: [
    { icon: "⌨️", title: "Type a title", text: "Accents become plain letters, “&” becomes “and”, symbols and emoji drop out, all lower-case with single dashes." },
    {
      icon: "🔗",
      title: "The address builds live",
      text: "The full link shows under the field, with the slug highlighted.",
      branches: [{ label: "Too long", text: "Cut at a word break, never mid-word.", tone: "neutral" }],
    },
    {
      icon: "⏳",
      title: "Pause, then check",
      text: "One check for the newest address. Older ones are cancelled.",
      branches: [
        { label: "Free", text: "A green tick.", tone: "good" },
        { label: "Server down", text: "Couldn't check, with Retry.", tone: "bad" },
      ],
    },
    {
      icon: "💡",
      title: "Taken",
      text: "Free versions are built and checked: add the year, a shorter one, -2. Click one to use it.",
      branches: [{ label: "None free", text: "It says so; edit by hand.", tone: "bad" }],
    },
    {
      icon: "🔓",
      title: "Make it yours",
      text: "Unlock to edit the address by hand. The title no longer changes it until you re-sync.",
      branches: [{ label: "Published page", text: "“Old links will break”, with a redirect checkbox.", tone: "neutral" }],
    },
  ],
  useWhen: ["Blog posts, product pages and docs where the title becomes the link", "Shop, event or profile names that must be unique", "Editing live pages, where a changed link needs a warning"],
  avoidWhen: ["IDs nobody reads, like order numbers; generate them on the server", "Free text that is never part of a link"],
  accessibility: [
    "A real labelled title input; the address bar is linked to it with aria-describedby",
    "Free, taken and error are announced once in a polite role=\"status\" region, never on every keystroke",
    "The lock, Retry, re-sync and every suggestion are real buttons with names; the redirect is a real checkbox",
    "The spinner and caret only move when motion is allowed",
  ],
  support: "Works in all modern browsers, with mouse, touch and keyboard. No extra packages.",
};

export const PLAYGROUND: Playground = {
  initial: { accent: "#C6FF3D", size: "md", maxLength: 60, removeStopWords: "off" },
  controls: [
    {
      key: "accent",
      label: "Highlight",
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
    { key: "maxLength", label: "Max length", type: "slider", min: 15, max: 80, step: 5, unit: " chars" },
    { key: "removeStopWords", label: "Small words", type: "segment", options: [{ value: "off", label: "Keep" }, { value: "on", label: "Drop" }] },
  ],
};

export const CARD_STATE = "taken";

export const TICKER: [string, string, "acc" | "warn" | "mute"] = ["url-slug-input", "café & crème → cafe-and-creme · taken · -2026 free", "acc"];
