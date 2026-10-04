import { PasskeyButton } from "./PasskeyButton";

const noop = async () => {};

/** Every state, rendered with previewState / supportOverride (no real prompts). */
export const PASSKEY_BUTTON_STATES = [
  { id: "idle", label: "Ready", note: "Returning user. Hover tilts the fingerprint.", node: <PasskeyButton onSignIn={noop} supportOverride="supported" previewState="idle" /> },
  { id: "register", label: "New user", note: "No passkey yet: offers to create one.", node: <PasskeyButton intent="register" onSignIn={noop} onRegister={noop} supportOverride="supported" previewState="idle" /> },
  { id: "working", label: "Waiting for device", note: "Fingerprint redraws while the phone or laptop checks you.", node: <PasskeyButton onSignIn={noop} supportOverride="supported" previewState="working" /> },
  { id: "success", label: "Signed in", note: "Turns green with a check and a small pop.", node: <PasskeyButton onSignIn={noop} supportOverride="supported" previewState="success" /> },
  { id: "error", label: "Cancelled / failed", note: "Shakes, explains in plain words, offers Try again.", node: <PasskeyButton onSignIn={noop} supportOverride="supported" previewState="error" /> },
  { id: "unsupported", label: "Old browser", note: "Says passkeys aren't supported and keeps the fallback.", node: <PasskeyButton onSignIn={noop} onFallback={() => {}} supportOverride="unsupported" /> },
  { id: "disabled", label: "Disabled", note: "Not clickable, no hover lift.", node: <PasskeyButton onSignIn={noop} supportOverride="supported" disabled /> },
];
