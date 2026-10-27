"use client";

import { PostcardForm } from "./PostcardForm";

const send = async () => {};
const TOPICS = ["Weekend classes", "Commissions", "Press"];
const card = (state: "empty" | "filled" | "invalid" | "sending" | "mailbox" | "sent" | "error") => (
  <PostcardForm onSend={send} topics={TOPICS} size="sm" previewState={state} labels={{ title: "Write to the studio", to: "To: Fern & Kiln Studio" }} />
);

/** Every state, drawn still. The stamp, postmark and letterbox slide play in the live preview. */
export const POSTCARD_FORM_STATES = [
  { id: "empty", label: "Blank card", note: "Message on the left, your details on the right, an empty stamp box in the corner.", node: card("empty") },
  { id: "filled", label: "Written", note: "Ready to go. The draft is already saved on this device.", node: card("filled") },
  { id: "invalid", label: "Needs a fix", note: "Each problem shows under its own field. On send, focus jumps to the first one and the stamp shakes.", node: card("invalid") },
  { id: "sending", label: "Posting", note: "The stamp is stuck on and the postmark inks over it while onSend runs.", node: card("sending") },
  { id: "mailbox", label: "In the mailbox", note: "Sent while offline: it waits and goes by itself when the network is back.", node: card("mailbox") },
  { id: "error", label: "Bounced", note: "The server said no. Every word is still there, with Try again.", node: card("error") },
  { id: "sent", label: "Posted", note: "Slid into the letterbox with today's postmark. The draft is cleared.", node: card("sent") },
  {
    id: "disabled",
    label: "Disabled",
    note: "Switched off, e.g. while the page is still loading who to send it to.",
    node: <PostcardForm onSend={send} size="sm" disabled previewState="empty" labels={{ title: "Write to the studio", to: "To: Fern & Kiln Studio" }} />,
  },
];
