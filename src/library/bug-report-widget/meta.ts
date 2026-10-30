import type { Entry } from "@/lib/registry";
import type { Playground } from "@/lib/playgrounds";

export const ENTRY: Entry = {
  slug: "bug-report-widget",
  ext: "08",
  name: "Bug Report Widget",
  type: "modal",
  week: 4,
  icon: "🐞",
  summary: "Point at the broken thing, write one line. The report already has the page, selector, browser, console errors and failed requests.",
  why: "Clients write \"the button is broken\" with no page, no browser, no screen size and no steps, and developers lose hours trying to reproduce it. With this widget the reporter clicks the broken element itself and writes one sentence. The report already carries a selector that finds exactly that element, the page, browser and screen, the recent console errors, the requests that failed and the clicks that led there. The reporter sees all of it and can untick anything before sending, and typed values are never read.",
  files: [
    { label: "BugReportWidget.tsx", path: "src/library/bug-report-widget/BugReportWidget.tsx" },
    { label: "context.ts", path: "src/library/bug-report-widget/context.ts" },
  ],
  usagePath: "src/library/bug-report-widget/usage.tsx",
  promptPath: "src/library/bug-report-widget/prompt.md",
  props: [
    { name: "onSubmit", type: "(report: BugReport) => Promise<string | { id?: string } | void>", default: "required", description: "Send the report to your tracker or API. Return a reference id to show it; throw or reject to show Try again." },
    { name: "shortcut", type: "string", default: '"Alt+Shift+B"', description: "Keyboard shortcut that starts a report. An empty string turns it off." },
    { name: "open", type: "boolean", default: "—", description: "Start a report from your own button or menu: going from false to true starts pick mode." },
    { name: "onOpenChange", type: "(open: boolean) => void", default: "—", description: "Called when a report starts or is closed." },
    { name: "onStateChange", type: "(state: BugReportState) => void", default: "—", description: "Called on every state change, e.g. for analytics." },
    { name: "collect", type: "{ console?: boolean; network?: boolean; breadcrumbs?: boolean }", default: "{ console: true, network: false, breadcrumbs: true }", description: "What is recorded in the background while mounted. Failed requests need a fetch wrapper, so they are opt-in." },
    { name: "fullUrl", type: "boolean", default: "false", description: "Keep query-string values in the page URL. Off by default: values are shown as … because URLs often carry tokens or emails." },
    { name: "contained", type: "RefObject<HTMLElement | null>", default: "—", description: "Only pick inside this element, and keep every overlay inside it. The element must be positioned and contain the widget." },
    { name: "labels", type: "Partial<BugReportLabels>", default: "English defaults", description: "Every visible and announced string, including severity names and the attached item names." },
    { name: "accent", type: "string", default: '"#C6FF3D"', description: "Button, highlight and send colour. Text on it is picked for contrast." },
    { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Button and dialog size." },
    { name: "position", type: '"bottom-right" | "bottom-left"', default: '"bottom-right"', description: "Corner for the floating button." },
    { name: "dim", type: "number", default: "45", description: "How dark the page gets while picking, 0 to 80 percent." },
    { name: "showTrigger", type: "boolean", default: "true", description: "Hide the floating button if you only open it with open or the shortcut." },
    { name: "disabled", type: "boolean", default: "false", description: "Turns the button and shortcut off." },
    { name: "previewState", type: '"idle" | "picking" | "picked" | "filling" | "invalid" | "submitting" | "sent" | "failed" | "disabled"', default: "—", description: "Draw one state still with sample data. Nothing on the page is read or patched." },
    { name: "className", type: "string", default: '""', description: "Extra classes for the wrapper." },
  ],
  tryIt: [
    "Click Apply coupon once. It looks like nothing happens, but it logged an error and a request failed.",
    "Press Report a problem, then hover the checkout and click the Apply coupon button.",
    "Write one line and send. Open \"Attached for the developer\" first to see (and untick) what goes with it.",
  ],
  flow: [
    { icon: "🐞", title: "Start a report", text: "The corner button or Alt+Shift+B. Meanwhile the widget has been quietly keeping the last console errors, failed requests and clicks." },
    {
      icon: "🎯",
      title: "Point at the problem",
      text: "The page dims and each part lights up with a readable name. Click picks it; the page's own click never runs.",
      branches: [
        { label: "Keyboard", text: "Tab moves between controls, Enter picks.", tone: "neutral" },
        { label: "Not about one element", text: "S or Skip goes straight to the form.", tone: "neutral" },
        { label: "Esc", text: "Cancels. Nothing is sent.", tone: "neutral" },
      ],
    },
    {
      icon: "📝",
      title: "Say what happened",
      text: "One required line, plus expectation, severity and email if they like. The context is read now and shown in full.",
      branches: [
        { label: "Empty description", text: "Send is blocked and the field says why.", tone: "bad" },
        { label: "Private", text: "Untick any item; it is left out of everything.", tone: "neutral" },
      ],
    },
    {
      icon: "📮",
      title: "Send",
      text: "onSubmit gets the full report. Your id comes back as the reporter's reference.",
      branches: [
        { label: "Server fails", text: "Text is kept; the button becomes Try again.", tone: "bad" },
        { label: "Sent", text: "Copy as Markdown or download the JSON too.", tone: "good" },
      ],
    },
  ],
  useWhen: ["Staging and preview links you send to clients for review", "Internal tools and admin panels where users report bugs", "Beta launches where you want reproducible reports without a paid service"],
  avoidWhen: ["Public production sites that need consent for console and network logging; turn collect off or ask first", "Native apps or pages inside cross-origin iframes the widget can't reach"],
  accessibility: [
    "Picking works without a mouse: Tab and Shift+Tab move, Enter picks, S skips, Esc cancels, and each step is announced",
    "The dialog is a real modal: role=\"dialog\", aria-modal, focus trap, Esc closes and focus returns to the button",
    "Errors use aria-invalid with a linked message; sending, sent and failed are announced in a role=\"status\" region",
    "Severity is a native radio group; highlight and spinner motion are off with reduced motion",
  ],
  support: "Works in all modern browsers, with mouse, touch and keyboard. No extra packages.",
};

export const PLAYGROUND: Playground = {
  initial: { accent: "#C6FF3D", size: "md", dim: 45, position: "bottom-right" },
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
    { key: "dim", label: "Dim while picking", type: "slider", min: 0, max: 80, step: 5, unit: "%" },
    { key: "position", label: "Button corner", type: "segment", options: [{ value: "bottom-right", label: "Right" }, { value: "bottom-left", label: "Left" }] },
  ],
};

export const CARD_STATE = "picked";

export const TICKER: [string, string, "acc" | "warn" | "mute"] = ["bug-report-widget", "BR-K3F9QZ · button \"Apply coupon\" · 1 error, POST 500", "acc"];
