import { IslandNotification, type IslandItem } from "./IslandNotification";

const noop = () => {};
const msg: IslandItem = { id: "a", title: "New message from Sam", body: "Running 10 minutes late, sorry!", icon: "💬", action: { label: "Reply", onClick: noop } };
const fail: IslandItem = { id: "b", title: "Payment failed", body: "Your card was declined.", icon: "!", tone: "error" };
const ok: IslandItem = { id: "c", title: "Booking confirmed", body: "Friday 7:00 pm", icon: "✓", tone: "success" };
const up: IslandItem = { id: "d", title: "Uploading photos", progress: 0.6 };

const frame = (node: React.ReactNode) => <div className="relative h-[150px] w-[400px]">{node}</div>;

/** Every state, frozen with the preview prop (no timers). */
export const ISLAND_NOTIFICATION_STATES = [
  { id: "idle", label: "Quiet", note: "A small pill with a glowing dot.", node: frame(<IslandNotification position="absolute" items={[]} onDismiss={noop} />) },
  { id: "open", label: "Notification", note: "The pill morphs into a card with an action.", node: frame(<IslandNotification position="absolute" items={[msg]} onDismiss={noop} preview="open" />) },
  { id: "error", label: "Error", note: "Coral glow and button for things that need fixing.", node: frame(<IslandNotification position="absolute" items={[fail]} onDismiss={noop} preview="open" />) },
  { id: "queued", label: "Queued", note: "+2 shows how many are waiting their turn.", node: frame(<IslandNotification position="absolute" items={[ok, msg, fail]} onDismiss={noop} preview="open" />) },
  { id: "live", label: "Live activity", note: "An upload lives in the pill as a progress ring.", node: frame(<IslandNotification position="absolute" items={[up]} onDismiss={noop} />) },
  { id: "held", label: "Waiting for you", note: "Amber dot: held while you type, delivered when you pause.", node: frame(<IslandNotification position="absolute" items={[msg]} onDismiss={noop} preview="held" />) },
];
