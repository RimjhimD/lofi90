"use client";

import { useState } from "react";
import { PermissionPrimer, type PermissionKind } from "./PermissionPrimer";

const APPS: Record<PermissionKind, { app: string; action: string; reason: string; benefits: string[]; emoji: string }> = {
  camera: {
    app: "Glow Studio · Video consult",
    action: "Join video call",
    emoji: "🎥",
    reason: "Your stylist wants to see your hair before the appointment. We only use the camera during this call.",
    benefits: ["Camera is only on while you're in the call", "Nothing is recorded", "You can turn it off any time"],
  },
  microphone: {
    app: "Notes · Voice memo",
    action: "Record a voice note",
    emoji: "🎙",
    reason: "Talk instead of typing. We need the microphone to record your note.",
    benefits: ["Recording only while you hold the button", "Saved to your notes only"],
  },
  geolocation: {
    app: "Store finder",
    action: "Find stores near me",
    emoji: "📍",
    reason: "We'll use your location once to sort stores by distance. We don't keep it.",
    benefits: ["Used once, not tracked", "Shows the closest store first"],
  },
  notifications: {
    app: "Bookings",
    action: "Remind me before my appointment",
    emoji: "🔔",
    reason: "We'll send one reminder the day before and one an hour before. No marketing.",
    benefits: ["Only appointment reminders", "Turn them off any time"],
  },
};

type Outcome = "allow" | "block" | "real";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Live preview: a real app button that opens the primer. The browser popup is simulated unless "Real browser" is picked. */
export default function PermissionPrimerDemo() {
  const [kind, setKind] = useState<PermissionKind>("camera");
  const [outcome, setOutcome] = useState<Outcome>("allow");
  const [open, setOpen] = useState(false);
  const [log, setLog] = useState("");
  const app = APPS[kind];

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="w-full max-w-sm rounded-md border-2 border-[#1A1A17] bg-[#FFFFFF] p-5 text-center shadow-[5px_5px_0_#1A1A17]">
        <p className="text-sm font-bold text-[#5E5A50]">{app.app}</p>
        <div className="my-3 text-5xl" aria-hidden="true">{app.emoji}</div>
        <button
          type="button"
          onClick={() => {
            setLog("");
            setOpen(true);
          }}
          className="w-full rounded-[4px] border-2 border-[#1A1A17] bg-[#D7263D] px-5 py-3 font-black text-white shadow-[3px_3px_0_#1A1A17] transition-transform hover:-translate-y-0.5 active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_#1A1A17] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#0E3B2E]"
        >
          {app.action}
        </button>
        <p aria-live="polite" className="mt-3 min-h-5 text-sm font-bold">{log}</p>
      </div>

      <PermissionPrimer
        key={`${kind}-${outcome}`}
        permission={kind}
        open={open}
        onOpenChange={setOpen}
        reason={app.reason}
        benefits={app.benefits}
        onGranted={() => setLog("✅ Access granted, the feature starts now.")}
        onDenied={() => setLog("🚫 Blocked. The app keeps working without it.")}
        request={outcome === "real" ? undefined : async () => (await wait(1800), outcome === "allow" ? "granted" : "denied")}
      />

      <div role="group" aria-label="Permission" className="flex flex-wrap justify-center gap-2">
        {(Object.keys(APPS) as PermissionKind[]).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={kind === k}
            onClick={() => setKind(k)}
            className="rounded-[4px] border-2 border-[#1A1A17] bg-white px-3 py-0.5 text-sm font-extrabold capitalize shadow-[2px_2px_0_#1A1A17] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_#1A1A17] aria-pressed:bg-[#1A1A17] aria-pressed:text-[#F2EEE3] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#D7263D]"
          >
            {k === "geolocation" ? "location" : k}
          </button>
        ))}
      </div>
      <div role="group" aria-label="What the user does in the browser popup" className="flex flex-wrap items-center justify-center gap-2 text-sm font-bold">
        <span>Popup answer:</span>
        {(["allow", "block", "real"] as Outcome[]).map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={outcome === o}
            onClick={() => setOutcome(o)}
            className="rounded-[4px] border-2 border-[#1A1A17] bg-white px-3 py-0.5 font-extrabold shadow-[2px_2px_0_#1A1A17] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_#1A1A17] aria-pressed:bg-[#0E3B2E] aria-pressed:text-[#F2EEE3] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#D7263D]"
          >
            {o === "allow" ? "Allow" : o === "block" ? "Block" : "Real browser"}
          </button>
        ))}
      </div>
    </div>
  );
}
