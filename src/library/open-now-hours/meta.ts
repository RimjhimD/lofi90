import type { Entry } from "@/lib/registry";
import type { Playground } from "@/lib/playgrounds";

export const ENTRY: Entry = {
  slug: "open-now-hours",
  ext: "12",
  name: "Open-Now Hours",
  type: "section",
  week: 6,
  icon: "🕘",
  summary: "Business hours that answer \"can I go now?\" at a glance: open, closing soon or closed, and when that changes, in the shop's own time zone.",
  why: "Most sites show a flat list of hours. The visitor then has to work out what day it is, what time it is where the shop is, whether today is a holiday and whether there is a lunch break. Many get it wrong and turn up to a closed door, or call after hours. This block does that work for them. It says \"Open now · closes in 45 min\" or \"Closed · opens tomorrow at 9:00 AM\", turns amber near closing time, shows today as a bar with a now marker, and adds the visitor's own time when they are in another zone.",
  files: [
    { label: "OpenNowHours.tsx", path: "src/library/open-now-hours/OpenNowHours.tsx" },
    { label: "hours.ts", path: "src/library/open-now-hours/hours.ts" },
  ],
  usagePath: "src/library/open-now-hours/usage.tsx",
  promptPath: "src/library/open-now-hours/prompt.md",
  props: [
    { name: "hours", type: "WeeklyHours", default: "required", description: "mon…sun → \"closed\", \"24h\" or ranges like [[\"10:00\",\"13:30\"],[\"14:30\",\"20:00\"]]. A close before the open runs past midnight. Missing days are closed." },
    { name: "timeZone", type: "string", default: "required", description: "The business's IANA zone, e.g. \"Asia/Dhaka\". All open and closed math happens on this clock." },
    { name: "exceptions", type: "HoursException[]", default: "[]", description: "Holidays and special hours: { date: \"YYYY-MM-DD\", hours, label? }. Replaces that date's normal hours." },
    { name: "now", type: "Date | number", default: "real clock", description: "Fixed time for tests and demos. Without it the block ticks every minute and sleeps while the tab is hidden." },
    { name: "soonMinutes", type: "number", default: "30", description: "Minutes before closing that count as closing soon (amber)." },
    { name: "lastBookingMinutes", type: "number", default: "15", description: "Last bookings this many minutes before closing, shown while closing soon." },
    { name: "showVisitorTime", type: "boolean", default: "true", description: "Add the visitor's own time when their zone differs." },
    { name: "visitorTimeZone", type: "string", default: "browser zone", description: "Override the visitor's zone." },
    { name: "ctaWhenOpen / ctaWhenClosed", type: "ReactNode", default: "—", description: "Slots shown while open (e.g. Call now) or closed (e.g. Book online)." },
    { name: "name", type: "string", default: "labels.title", description: "Heading, e.g. the shop name." },
    { name: "locale", type: "string", default: "browser", description: "Locale for times and day names (Intl)." },
    { name: "labels", type: "Partial<OpenNowLabels>", default: "English defaults", description: "Every visible and announced string, with {in}, {time}, {when}, {last}, {place}, {local}, {date} and {label} placeholders." },
    { name: "onStatusChange", type: "(status: OpenStatus) => void", default: "—", description: "Called when the state or its next change time moves, not every minute." },
    { name: "lookaheadDays", type: "number", default: "14", description: "How far ahead an upcoming holiday is shown." },
    { name: "defaultExpanded", type: "boolean", default: "false", description: "Start with the week table open." },
    { name: "previewState", type: '"open" | "closing-soon" | "overnight" | "open-24h" | "closed-opens-later-today" | "closed-opens-tomorrow" | "closed-opens-later" | "holiday" | "loading"', default: "—", description: "Draw one state still, with no clock or listeners. It finds a real moment in the given hours." },
    { name: "accent", type: "string", default: '"#C6FF3D"', description: "Now marker and today's row." },
    { name: "openColor / soonColor / closedColor", type: "string", default: '"#5BE38A" / "#FFB547" / "#FF6B57"', description: "Status dot and bar colours. Text never depends on them." },
    { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Width and type size." },
    { name: "className", type: "string", default: '""', description: "Extra classes for the section." },
  ],
  tryIt: [
    "Watch it run once on load: the clock passes 8 PM and the card goes green, then amber, then red.",
    "Drag \"Try another time\" through the week: the lunch break, the late Saturday, and the Puja holiday two days from now.",
    "Switch \"You are in\" between London, Dhaka and New York to see the salon's times in your own time.",
  ],
  flow: [
    { icon: "🕘", title: "Read the shop's clock", text: "The current time is read in the shop's time zone, not the visitor's.", branches: [{ label: "On the server", text: "A calm skeleton and the plain week. Nothing is guessed.", tone: "neutral" }] },
    {
      icon: "📅",
      title: "Build the open ranges",
      text: "Yesterday through next week, with holidays and special dates replacing the normal hours. Touching ranges join up.",
      branches: [{ label: "Range past midnight", text: "6 PM – 1 AM stays open into the next day.", tone: "neutral" }],
    },
    {
      icon: "🟢",
      title: "Open",
      text: "It shows how long until closing, and the closing time.",
      branches: [{ label: "Under soonMinutes left", text: "Amber, with the last booking time.", tone: "bad" }],
    },
    {
      icon: "🔴",
      title: "Closed",
      text: "It says when it opens: later today, tomorrow, or on a named day.",
      branches: [{ label: "Holiday today", text: "Shows the reason, e.g. Closed for Puja holiday.", tone: "bad" }],
    },
    { icon: "🌍", title: "Visitor elsewhere", text: "\"8:00 PM in Dhaka = 2:00 PM your time\". It updates every minute and pauses while the tab is hidden.", branches: [{ label: "Same zone", text: "No extra line.", tone: "good" }] },
  ],
  useWhen: ["Salons, clinics, restaurants and shops with opening hours", "Businesses with lunch breaks, late nights or holiday closures", "Sites visited from other time zones (tourists, expats, remote clients)"],
  avoidWhen: ["Booking by appointment slots: show a booking calendar instead", "Online-only services that are always available"],
  accessibility: [
    "A role=\"status\" line announces the state and its target time only when it changes, not every minute",
    "The today bar has a text label listing today's hours and the current time; colour is never the only signal",
    "The week toggle is a real button with aria-expanded; the week is a table with row headers and today marked aria-current=\"date\"",
    "Visible focus ring on light and dark; marker and chevron motion is off with reduced motion",
  ],
  support: "React 18+ and any modern browser with Intl time zones. No extra packages.",
};

export const PLAYGROUND: Playground = {
  initial: { accent: "#C6FF3D", size: "md", soonMinutes: 30 },
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
    { key: "soonMinutes", label: "Closing soon at", type: "slider", min: 10, max: 120, step: 5, unit: " min" },
  ],
};

export const CARD_STATE = "closing-soon";

export const TICKER: [string, string, "acc" | "warn" | "mute"] = ["open-now-hours", "closing soon · last bookings 7:45 PM, Dhaka", "warn"];
