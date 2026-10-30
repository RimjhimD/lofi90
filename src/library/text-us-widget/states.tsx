"use client";

import { click, useLoop } from "@/lib/loop";
import { TextUsWidget, type TextUsState } from "./TextUsWidget";

const noop = () => {};
const still = (state: TextUsState, extra: Partial<Parameters<typeof TextUsWidget>[0]> = {}) => (
  <TextUsWidget onSend={noop} previewState={state} businessName="Bella Salon" businessNumber="(415) 555-0199" replyTime="We usually reply in 5 minutes" size="sm" {...extra} />
);

/** The real widget, filled in and sent on a loop, so the message can be seen lifting out of the panel. */
function SendingScene() {
  const { ref, run, stop } = useLoop(6500, [
    [600, click("button[aria-expanded]")],
    [1700, click("button[type=submit]")],
  ]);
  return (
    <div ref={ref} onClick={stop} className="relative h-[560px] w-[340px]">
      <TextUsWidget
        key={run}
        container="parent"
        draftKey={false}
        size="sm"
        consentMode="implied"
        businessName="Bella Salon"
        businessNumber="(415) 555-0199"
        replyTime="We usually reply in 5 minutes"
        defaultValues={{ name: "Mia", phone: "4155550134", message: "Hi! Can I book a cut this Saturday?" }}
        onSend={() => new Promise((r) => setTimeout(r, 1200))}
      />
    </div>
  );
}

/** Every state. Most are drawn still with sample data; Sending plays live. */
export const TEXT_US_WIDGET_STATES = [
  { id: "closed", label: "Closed", note: "A calm \"Text us\" pill in the corner of the page.", node: still("closed") },
  { id: "open", label: "Open, empty", note: "Grows out of the corner. Name, mobile number and message, with the SMS consent line.", node: still("open") },
  { id: "filling", label: "Filling in", note: "The number formats itself as it's typed and the country code is picked from a short list.", node: still("filling") },
  { id: "invalid", label: "Number incomplete", note: "Checked when the visitor leaves the field. The message gives a real example for that country.", node: still("invalid") },
  { id: "sending", label: "Sending, then sent", note: "onSend runs with the fields locked. On success the message lifts out of the panel and the confirmation slides in.", node: <SendingScene /> },
  { id: "sent", label: "Sent", note: "\"We'll text you at\" their number, from the business number, with a link to fix a wrong number.", node: still("sent") },
  { id: "error", label: "Send failed", note: "Nothing typed is lost. The button becomes Try again.", node: still("error") },
  { id: "offline", label: "Out of hours", note: "Still takes messages, and says when the reply will come.", node: still("offline", { closedHint: "We're closed now. We'll text you at 9 AM." }) },
  { id: "disabled", label: "Disabled", note: "Texting switched off. The pill is greyed and can't be pressed.", node: <TextUsWidget onSend={noop} previewState="disabled" disabled size="sm" /> },
];
