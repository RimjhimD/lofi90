"use client";

import { TextUsWidget } from "@/library/text-us-widget/TextUsWidget";

// In GoHighLevel: Automation > Workflows > new workflow > trigger "Inbound Webhook". Copy its URL into
// NEXT_PUBLIC_GHL_TEXT_US_WEBHOOK, send one test message, then press "Fetch sample request" so the trigger learns the fields.
// Next action "Create/Update Contact": map first name <- name, phone <- phone (already E.164), and keep message,
// consentText, page and timestamp in custom fields. Then "Send SMS" to {{contact.phone}} so the reply goes to their phone.
const WEBHOOK = process.env.NEXT_PUBLIC_GHL_TEXT_US_WEBHOOK ?? "https://services.leadconnectorhq.com/hooks/<location-id>/webhook-trigger/<trigger-id>";

export function SalonTextUs() {
  return (
    <TextUsWidget
      businessName="Bella Salon"
      businessNumber="(415) 555-0199"
      replyTime="We usually reply in 5 minutes"
      defaultCountry="US"
      consentMode="checkbox"
      openOnLoad={8000}
      onSend={async (payload) => {
        const res = await fetch(WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, source: "website text-us widget", tags: ["website-text-us"] }),
        });
        if (!res.ok) throw new Error(`Webhook answered ${res.status}`); // shows "Try again", nothing typed is lost
      }}
    />
  );
}

