"use client";

import { BugReportWidget } from "./BugReportWidget";

const noop = () => {};
const still = (state: Parameters<typeof BugReportWidget>[0]["previewState"]) => <BugReportWidget onSubmit={noop} previewState={state} size="sm" />;

/** Every state, drawn still with sample data (nothing on the real page is read or patched). */
export const BUG_REPORT_WIDGET_STATES = [
  { id: "idle", label: "Ready", note: "A small floating button, also opened with Alt+Shift+B.", node: still("idle") },
  { id: "picking", label: "Picking", note: "The page dims and whatever is under the pointer lights up with a readable name.", node: still("picking") },
  { id: "picked", label: "Element picked", note: "The choice is held so the reporter can confirm it or pick again.", node: still("picked") },
  { id: "filling", label: "Writing the report", note: "One required line, an optional expectation, severity and email. The context is already attached.", node: still("filling") },
  { id: "invalid", label: "Missing description", note: "Send is blocked until the reporter says what happened; the field says why.", node: still("invalid") },
  { id: "submitting", label: "Sending", note: "onSubmit is running. Fields lock and the button shows it's busy.", node: still("submitting") },
  { id: "sent", label: "Sent", note: "The reference id from your server, plus Markdown and JSON copies.", node: still("sent") },
  { id: "failed", label: "Send failed", note: "Nothing typed is lost. The button becomes Try again.", node: still("failed") },
  { id: "disabled", label: "Disabled", note: "Turned off, e.g. on production. The shortcut does nothing either.", node: <BugReportWidget onSubmit={noop} previewState="disabled" disabled size="sm" /> },
];
