"use client";

import { BoardingPassCard, type BoardingPass } from "@/library/boarding-pass-card/BoardingPassCard";

// Check in on tear. Keep `torn` in your own state so a reload shows the stamped pass, not a fresh stub.
export function CheckInCard({ booking, checkedIn, onCheckedIn }: { booking: { id: string; pass: BoardingPass }; checkedIn: boolean; onCheckedIn: () => void }) {
  return (
    <BoardingPassCard
      pass={booking.pass}
      airline="Monsoon Air"
      torn={checkedIn}
      tearDistance={110}
      onTear={async () => {
        onCheckedIn();
        await fetch(`/api/bookings/${booking.id}/check-in`, { method: "POST" });
      }}
    />
  );
}
