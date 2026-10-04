"use client";

import { IdempotentRunButton } from "@/library/idempotent-run-button/IdempotentRunButton";

// Build the key from what makes this action unique: same campaign + same day = same key.
// Send it to your server as well, so a webhook retry or a second tab is ignored there too.
async function sendCampaign(runKey: string, campaignId: string) {
  const res = await fetch(`/api/campaigns/${campaignId}/send`, {
    method: "POST",
    headers: { "Idempotency-Key": runKey },
  });
  if (!res.ok) throw new Error("The send failed before anything went out.");
  const { sent } = (await res.json()) as { sent: number };
  return `Sent to ${sent} contacts`;
}

export function SendCampaignButton({ campaignId, sendDate }: { campaignId: string; sendDate: string }) {
  return (
    <IdempotentRunButton
      runKey={`${campaignId}-${sendDate}`}
      onRun={(key) => sendCampaign(key, campaignId)}
      windowMs={10 * 60_000}
      storage="session"
      labels={{ run: "Send campaign", running: "Sending…", blocked: "Already sent" }}
      onBlocked={({ runKey }) => console.info("Stopped a double send", runKey)}
    />
  );
}
