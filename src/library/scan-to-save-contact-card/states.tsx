"use client";

import { ScanToSaveContactCard, type Contact } from "./ScanToSaveContactCard";

const MAYA: Contact = {
  firstName: "Maya",
  lastName: "Ortiz",
  title: "Account Manager",
  org: "Brightline Studio",
  phones: [{ number: "+1 415 555 0142", type: "cell" }],
  emails: [{ address: "maya@brightline.example", type: "work" }],
  website: "https://brightline.example",
};

const card = (state: Parameters<typeof ScanToSaveContactCard>[0]["previewState"], size: "sm" | "md" = "sm") => (
  <ScanToSaveContactCard contact={MAYA} size={size} qrSize={104} previewState={state} />
);

/** Every state, drawn still: no downloads, clipboard or dialogs run in the grid. */
export const SCAN_TO_SAVE_CONTACT_CARD_STATES = [
  { id: "default", label: "Ready to scan", note: "A real QR code with the person's vCard. Point a phone camera at it to save them.", node: card("default") },
  { id: "qr-zoomed", label: "QR enlarged", note: "Click the code and it opens large, so it scans from further away.", node: card("qr-zoomed") },
  { id: "saved", label: "Saved", note: "Save contact downloaded the .vcf file; the button and status line confirm it.", node: card("saved") },
  { id: "mobile", label: "On a phone", note: "You can't scan your own screen, so the QR hides and one tap opens the add-contact screen.", node: card("mobile") },
  { id: "vertical", label: "Vertical", note: "Stacked layout for team grids and narrow sidebars.", node: card("vertical") },
  { id: "minimal", label: "Minimal", note: "No photo or initials and no copy buttons: just the name, the code and the button.", node: card("minimal") },
  { id: "disabled", label: "Disabled", note: "Saving and copying are off; the QR code is dimmed and can't be enlarged.", node: card("disabled") },
  { id: "loading", label: "Loading", note: "Contact details still loading: a skeleton holds the space and the button waits.", node: card("loading") },
];
