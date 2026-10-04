"use client";

import { RetryAfterError, RetryCountdownLoader } from "@/library/retry-countdown-loader/RetryCountdownLoader";

// Throw on failure. If the server says how long to wait (429 + Retry-After), throw a
// RetryAfterError so the loader waits exactly that long instead of guessing.
async function sendReminder(attempt: number) {
  const res = await fetch("/api/sms/reminder", { method: "POST", headers: { "X-Attempt": String(attempt) } });
  if (res.status === 429) {
    const seconds = Number(res.headers.get("Retry-After") ?? 5);
    throw new RetryAfterError("The SMS provider is busy", seconds * 1000);
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export function SendReminder({ onSent }: { onSent: () => void }) {
  return <RetryCountdownLoader task={sendReminder} label="Sending the reminder text" maxAttempts={5} onSuccess={onSent} />;
}
