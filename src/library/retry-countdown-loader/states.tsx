import { RetryCountdownLoader } from "./RetryCountdownLoader";

const task = async () => {};

/** Every state, rendered with previewState (nothing actually runs). */
export const RETRY_COUNTDOWN_LOADER_STATES = [
  { id: "running", label: "Trying", note: "First try in flight; the lamp pulses.", node: <RetryCountdownLoader task={task} label="Sending the reminder text" previewState="running" /> },
  { id: "waiting", label: "Waiting to retry", note: "The gap fills as the countdown runs; each gap is drawn to scale.", node: <RetryCountdownLoader task={task} label="Sending the reminder text" previewState="waiting" /> },
  { id: "server-wait", label: "Server said wait", note: "Uses the server's Retry-After instead of its own guess, shown in amber.", node: <RetryCountdownLoader task={task} label="Sending the reminder text" previewState="server-wait" /> },
  { id: "offline", label: "Offline", note: "Countdown frozen until the connection comes back.", node: <RetryCountdownLoader task={task} label="Sending the reminder text" previewState="offline" /> },
  { id: "success", label: "Done", note: "Says which try worked.", node: <RetryCountdownLoader task={task} label="Sending the reminder text" previewState="success" /> },
  { id: "failed", label: "Gave up", note: "Every try marked, the last error shown, Start over offered.", node: <RetryCountdownLoader task={task} label="Sending the reminder text" previewState="failed" /> },
];
