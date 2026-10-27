"use client";

import { PostcardForm } from "@/library/postcard-form/PostcardForm";

// A real contact form. onSend must throw on failure so the card bounces back with the words kept.
// The draft lives in localStorage under draftKey until a send succeeds.
export function ContactPostcard() {
  return (
    <PostcardForm
      draftKey="contact-page"
      topics={["Booking", "Billing", "Something else"]}
      minMessageLength={20}
      maxLength={1500}
      labels={{ title: "Write to us", to: "To: Support" }}
      onSend={async (values) => {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (!res.ok) throw new Error(`Contact form failed: ${res.status}`);
      }}
      onError={(err) => console.error(err)}
    />
  );
}
