import { SecretKeyField } from "./SecretKeyField";

const noop = () => {};
const fake = (prefix: string, body: string) => prefix + body;
const PUB = fake("pk_" + "test_", "51DEMOx9ExampleOnlyNotARealKey0a9F2");
const LIVE = fake("sk_" + "live_", "51DEMOx9ExampleOnlyNotARealKey7Qe1");

/** Every state, as a real instance with a fixed value. */
export const SECRET_KEY_FIELD_STATES = [
  { id: "empty", label: "Empty", note: "Explains hold-to-peek and silent copy.", node: <SecretKeyField label="Secret key" value="" onChange={noop} /> },
  { id: "hidden", label: "Hidden", note: "Masked, with only the last 4 shown and the key type named.", node: <SecretKeyField label="Publishable key" expects="publishable" value={PUB} onChange={noop} /> },
  { id: "peek", label: "Peeking", note: "Shown while held; the ring drains and it hides itself.", node: <SecretKeyField label="Publishable key" value={PUB} onChange={noop} previewRevealed /> },
  { id: "wrong-box", label: "Secret in a public field", note: "Red: this would ship a secret key to every visitor.", node: <SecretKeyField label="Publishable key" expects="publishable" value={LIVE} onChange={noop} /> },
  { id: "live", label: "Live key", note: "Amber reminder that it touches real money.", node: <SecretKeyField label="Secret key" expects="secret" value={LIVE} onChange={noop} /> },
  { id: "disabled", label: "Disabled", note: "Locked while saving.", node: <SecretKeyField label="Secret key" value={PUB} onChange={noop} disabled /> },
];

/** The same field in other accents, countdown styles and sizes. */
export const SECRET_KEY_FIELD_VARIANTS = [
  { group: "Colour", label: "Lime", node: <SecretKeyField label="Key" value={PUB} onChange={noop} previewRevealed accent="#C6FF3D" /> },
  { group: "Colour", label: "Cyan", node: <SecretKeyField label="Key" value={PUB} onChange={noop} previewRevealed accent="#3DD9FF" /> },
  { group: "Colour", label: "Amber", node: <SecretKeyField label="Key" value={PUB} onChange={noop} previewRevealed accent="#FFB547" /> },
  { group: "Motion", label: "Ring countdown", node: <SecretKeyField label="Key" value={PUB} onChange={noop} previewRevealed drain="ring" /> },
  { group: "Motion", label: "Bar countdown", node: <SecretKeyField label="Key" value={PUB} onChange={noop} previewRevealed drain="bar" /> },
  { group: "Motion", label: "No countdown", node: <SecretKeyField label="Key" value={PUB} onChange={noop} previewRevealed drain="none" /> },
  { group: "Size", label: "Small", node: <SecretKeyField label="Key" value={PUB} onChange={noop} size="sm" /> },
  { group: "Size", label: "Medium", node: <SecretKeyField label="Key" value={PUB} onChange={noop} size="md" /> },
  { group: "Size", label: "Large", node: <SecretKeyField label="Key" value={PUB} onChange={noop} size="lg" /> },
];
