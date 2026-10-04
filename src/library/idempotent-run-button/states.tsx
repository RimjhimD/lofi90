import { IdempotentRunButton } from "./IdempotentRunButton";

const noop = async () => {};
const key = "promo-oct-04";

/** Every state, rendered with previewState (nothing actually runs). */
export const IDEMPOTENT_RUN_BUTTON_STATES = [
  { id: "idle", label: "Ready", note: "Shows the key it will use. Hover grows the play icon.", node: <IdempotentRunButton runKey={key} onRun={noop} previewState="idle" /> },
  { id: "running", label: "Running", note: "Light sweeps across; a second press is ignored.", node: <IdempotentRunButton runKey={key} onRun={noop} previewState="running" /> },
  { id: "done", label: "Done", note: "Turns green with the result and how long the key stays locked.", node: <IdempotentRunButton runKey={key} onRun={noop} previewState="done" /> },
  { id: "blocked", label: "Repeat blocked", note: "Shield slams down, button bounces off it, says when it already ran.", node: <IdempotentRunButton runKey={key} onRun={noop} previewState="blocked" /> },
  { id: "error", label: "Failed", note: "Shakes, nothing is saved, so Try again is safe.", node: <IdempotentRunButton runKey={key} onRun={noop} previewState="error" /> },
  { id: "disabled", label: "Disabled", note: "Not clickable, no hover lift.", node: <IdempotentRunButton runKey={key} onRun={noop} disabled /> },
];
