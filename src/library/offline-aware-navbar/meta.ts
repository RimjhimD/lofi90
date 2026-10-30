import type { Entry } from "@/lib/registry";
import type { Playground } from "@/lib/playgrounds";

export const ENTRY: Entry = {
  slug: "offline-aware-navbar",
  ext: "14",
  name: "Offline-Aware Navbar",
  type: "navbar",
  week: 7,
  icon: "📶",
  summary: "When the internet drops, a calm strip slides down under the navbar: \"You're offline · 2 changes waiting\". Back online, it saves them and says so.",
  why: "When the connection drops, most apps fail silently. Buttons seem to work, then the work is gone, and people only find out later. This navbar notices the moment you go offline, says so in a quiet strip, and keeps every change you make with a Waiting badge. When the connection comes back it sends them in the order you made them, shows \"syncing 2 changes…\" and then \"All changes saved ✓\". If the server refuses one, it stays in the list with a Retry button instead of disappearing.",
  files: [
    { label: "OfflineAwareNavbar.tsx", path: "src/library/offline-aware-navbar/OfflineAwareNavbar.tsx" },
    { label: "offline.ts", path: "src/library/offline-aware-navbar/offline.ts" },
  ],
  usagePath: "src/library/offline-aware-navbar/usage.tsx",
  promptPath: "src/library/offline-aware-navbar/prompt.md",
  props: [
    { name: "brand", type: "ReactNode", default: "required", description: "App name on the left. A string also gets a small initial mark in the accent colour." },
    { name: "links", type: "{ label: string; href: string; active?: boolean; disabled?: boolean }[]", default: "[]", description: "Main links. The active one gets aria-current=\"page\" and an accent underline. On narrow screens they fold into a menu." },
    { name: "onNavigate", type: "(link, event) => void", default: "—", description: "Runs on link click. Call event.preventDefault() to route on the client." },
    { name: "right", type: "ReactNode", default: "—", description: "Right-hand slot, e.g. an avatar. Moves into the mobile menu on very small screens." },
    { name: "queue", type: "OfflineQueue", default: "shared offlineQueue", description: "The queue to count and replay. queueAction() and useOfflineQueue() use the shared one by default." },
    { name: "ping", type: "string | () => Promise<boolean | void>", default: "—", description: "Heartbeat that catches \"connected to Wi-Fi but no internet\". A URL gets a HEAD request; a function returns false or throws when unreachable. Failed checks back off from 2s." },
    { name: "pingInterval", type: "number", default: "30000", description: "Time between heartbeats while healthy, and the longest backoff." },
    { name: "savedMs", type: "number", default: "2500", description: "How long \"All changes saved\" stays before the strip slides away." },
    { name: "forceStatus", type: '"online" | "offline" | "slow"', default: "—", description: "Override detection, for demos and tests. Leave it unset in real use." },
    { name: "onStatusChange", type: "(status) => void", default: "—", description: "Runs when the connection status changes." },
    { name: "stripPosition", type: '"below" | "top"', default: '"below"', description: "Strip slides down under the bar, or sits above it." },
    { name: "labels", type: "Partial<NavbarLabels>", default: "English defaults", description: "Every string: offline, offlineEmpty, waitingOne/Many, syncingOne/Many ({n}), saved, savedMark, backOnline, failedOne/Many, retry, slow, the status names, lastSynced ({t}), justNow, minutesAgo, hoursAgo, checkNow, menu, closeMenu, nav." },
    { name: "accent", type: "string", default: '"#C6FF3D"', description: "Active link, brand mark, online dot and saved strip. Text on it is picked for contrast." },
    { name: "warnColor", type: "string", default: '"#FFB547"', description: "Offline and slow colour." },
    { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Bar height and text size." },
    { name: "previewState", type: '"online" | "offline" | "offline-waiting" | "syncing" | "saved" | "failed" | "slow" | "menu-open"', default: "—", description: "Draw one state still with sample counts. Nothing is listened to and nothing is focusable." },
    { name: "className", type: "string", default: '""', description: "Extra classes for the header." },
  ],
  tryIt: [
    "Watch it play once: the connection drops, two orders are added, then it comes back and saves them.",
    "Press Go offline, add an order, then Come back online. Or switch off your Wi-Fi for real.",
    "Turn on Make sync fail once and add an order: it stays with a Retry button.",
  ],
  flow: [
    { icon: "📶", title: "Online", text: "A normal navbar. The connection icon shows the status and when you last saved." },
    {
      icon: "⚠",
      title: "Connection drops",
      text: "The strip slides down: \"You're offline\". The icon changes. Nothing steals focus.",
      branches: [
        { label: "Wi-Fi but no internet", text: "The optional ping heartbeat notices and treats it as offline.", tone: "neutral" },
        { label: "Slow connection", text: "Where the browser reports it, a quiet hint appears instead.", tone: "neutral" },
      ],
    },
    { icon: "⏳", title: "Work keeps going", text: "Every change is held in the queue with a Waiting badge, and the strip counts them." },
    {
      icon: "↻",
      title: "Back online",
      text: "\"Syncing 2 changes…\": they are sent one by one, in the order they were made.",
      branches: [{ label: "Server refuses one", text: "It stays, marked Not saved, with Retry. The others still save.", tone: "bad" }],
    },
    { icon: "✓", title: "All changes saved", text: "The strip says so, then slides away.", branches: [{ label: "Nothing was waiting", text: "It just says Back online.", tone: "good" }] },
  ],
  useWhen: ["Apps people use on the move: orders, field work, notes, check-ins", "Forms and editors where losing work is the worst outcome", "Any app where requests can fail quietly on a bad connection"],
  avoidWhen: ["Marketing sites with nothing to save", "Actions that must never run late, like payments; block them while offline instead of queueing"],
  accessibility: [
    "Strip messages go through a role=\"status\" polite live region and never move focus",
    "Real <nav> with aria-current=\"page\"; the mobile menu button has aria-expanded, focus moves into the menu, Esc closes it and returns focus",
    "The connection icon is a button whose name reads the status and last save time; it checks the connection when pressed",
    "Slide and spinners are off with reduced motion; status is never told by colour alone",
  ],
  support: "Works in all modern browsers. The slow-connection hint needs navigator.connection (Chromium); elsewhere it is simply not shown. No extra packages.",
};

export const PLAYGROUND: Playground = {
  initial: { accent: "#C6FF3D", size: "md", stripPosition: "below", savedMs: 2500 },
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
    { key: "stripPosition", label: "Strip", type: "segment", options: [{ value: "below", label: "Below" }, { value: "top", label: "Top" }] },
    { key: "savedMs", label: "\"Saved\" stays", type: "slider", min: 1000, max: 6000, step: 500, unit: "s", scale: 0.001 },
  ],
};

export const CARD_STATE = "offline-waiting";

export const TICKER: [string, string, "acc" | "warn" | "mute"] = ["offline-aware-navbar", "back online · 2 orders synced · all changes saved ✓", "acc"];
