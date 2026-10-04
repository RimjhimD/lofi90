"use client";

import { useState } from "react";
import { pointer, useLoop } from "@/lib/loop";
import { SecretKeyField, type SecretKeyFieldProps } from "./SecretKeyField";

const noop = () => {};
const fake = (prefix: string, body: string) => prefix + body;
const PUB = fake("pk_" + "test_", "51DEMOx9ExampleOnlyNotARealKey0a9F2");
const LIVE = fake("sk_" + "live_", "51DEMOx9ExampleOnlyNotARealKey7Qe1");

type Field = Omit<SecretKeyFieldProps, "value" | "onChange">;

/** A key being typed in, one character at a time, then cleared. */
function Typing(props: Field) {
  const [v, setV] = useState("");
  const steps = [[0, () => setV("")] as const, ...Array.from(PUB, (_, i) => [500 + i * 45, () => setV(PUB.slice(0, i + 1))] as const)];
  const { ref } = useLoop(500 + PUB.length * 45 + 2600, steps.map(([ms, fn]) => [ms, () => fn()]));
  return (
    <div ref={ref}>
      <SecretKeyField {...props} value={v} onChange={noop} />
    </div>
  );
}

/** Hold the eye button: the key shows, the ring drains, it hides itself. */
function Peek(props: Field & { value: string }) {
  const { ref, run } = useLoop(5200, [
    [600, pointer('button[aria-label="Hold to show the key"]', "pointerdown")],
    [4200, pointer("button[aria-label]", "pointerup")],
  ]);
  return (
    <div ref={ref}>
      <SecretKeyField key={run} {...props} onChange={noop} />
    </div>
  );
}

/** The wrong key lands in the field, it turns red, then the right one goes back. */
function Swap(props: Field & { from: string; to: string }) {
  const { from, to, ...rest } = props;
  const [v, setV] = useState(from);
  const { ref } = useLoop(4400, [
    [0, () => setV(from)],
    [1000, () => setV(to)],
  ]);
  return (
    <div ref={ref}>
      <SecretKeyField {...rest} value={v} onChange={noop} />
    </div>
  );
}

/** Every state, playing live on a loop (Live key and Disabled hold still). */
export const SECRET_KEY_FIELD_STATES = [
  { id: "empty", label: "Empty", note: "Explains hold-to-peek and silent copy, then a key is typed in.", node: <Typing label="Secret key" /> },
  { id: "hidden", label: "Hidden", note: "Masked, with only the last 4 shown and the key type named.", node: <Swap label="Publishable key" expects="publishable" from="" to={PUB} /> },
  { id: "peek", label: "Peeking", note: "Shown while held; the ring drains and it hides itself.", node: <Peek label="Publishable key" value={PUB} /> },
  { id: "wrong-box", label: "Secret in a public field", note: "Red: this would ship a secret key to every visitor.", node: <Swap label="Publishable key" expects="publishable" from={PUB} to={LIVE} /> },
  { id: "live", label: "Live key", note: "Amber reminder that it touches real money.", node: <SecretKeyField label="Secret key" expects="secret" value={LIVE} onChange={noop} /> },
  { id: "disabled", label: "Disabled", note: "Locked while saving.", node: <SecretKeyField label="Secret key" value={PUB} onChange={noop} disabled /> },
];
