import { PermissionPrimer } from "./PermissionPrimer";

const base = {
  permission: "camera" as const,
  open: true,
  onOpenChange: () => {},
  reason: "Your stylist wants to see your hair before the appointment. We only use the camera during this call.",
  benefits: ["Camera is only on while you're in the call", "Nothing is recorded"],
};

/** Every state, rendered inline with previewState (no browser prompts). */
export const PERMISSION_PRIMER_STATES = [
  { id: "prompt", label: "Explain first", note: "Shown before the browser asks. Says why, and what's in it for the user.", node: <PermissionPrimer {...base} previewState="prompt" /> },
  { id: "asking", label: "Browser is asking", note: "Points to where the real popup appears, so people don't miss it.", node: <PermissionPrimer {...base} previewState="asking" /> },
  { id: "granted", label: "Allowed", note: "Confirms, calls onGranted, closes by itself.", node: <PermissionPrimer {...base} previewState="granted" /> },
  { id: "denied", label: "Blocked", note: "Browsers never ask twice, so it shows the exact steps to turn it back on.", node: <PermissionPrimer {...base} previewState="denied" /> },
  { id: "unsupported", label: "Not available", note: "Old browser or not https: explains and lets the user continue.", node: <PermissionPrimer {...base} previewState="unsupported" /> },
];
