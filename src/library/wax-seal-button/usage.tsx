"use client";

import { WaxSealButton, type SealError } from "@/library/wax-seal-button/WaxSealButton";

// The button makes one key per attempt and reuses it on every retry.
// Send it as Idempotency-Key and have the server return the first result for a key it has already seen.
export function PayButton({ orderId, total, onPaid }: { orderId: string; total: string; onPaid: (receiptId: string) => void }) {
  return (
    <WaxSealButton
      glyph="$"
      labels={{ idle: `Pay ${total}`, sealing: "Paying…", sent: "Paid" }}
      onSubmit={async (key) => {
        const res = await fetch(`/api/orders/${orderId}/pay`, { method: "POST", headers: { "Idempotency-Key": key } });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const retryAfter = Number(res.headers.get("Retry-After"));
          throw Object.assign(new Error(body.message ?? "payment failed"), {
            status: res.status,
            retryAfterMs: retryAfter > 0 ? retryAfter * 1000 : undefined,
          }) as SealError;
        }
        return res.json();
      }}
      onSuccess={(receipt) => onPaid((receipt as { id: string }).id)}
    />
  );
}
