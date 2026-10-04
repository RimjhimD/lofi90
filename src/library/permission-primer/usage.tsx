"use client";

import { useState } from "react";
import { PermissionPrimer } from "@/library/permission-primer/PermissionPrimer";

export function JoinCallButton({ startCall }: { startCall: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Join video call</button>

      <PermissionPrimer
        permission="camera"
        open={open}
        onOpenChange={setOpen}
        reason="Your stylist wants to see your hair before the appointment. We only use the camera during this call."
        benefits={["Camera is only on while you're in the call", "Nothing is recorded"]}
        // If the camera was already allowed, this fires straight away and the primer never shows.
        onGranted={startCall}
        onDenied={() => console.log("Continue with audio only")}
      />
    </>
  );
}
