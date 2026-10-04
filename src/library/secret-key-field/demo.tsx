"use client";

import { useState } from "react";
import { SecretKeyField } from "./SecretKeyField";

// Fake keys, assembled at runtime so no key-shaped string sits in the source.
const fake = (prefix: string, body: string) => prefix + body;
const PUB_TEST = fake("pk_" + "test_", "51DEMOx9ExampleOnlyNotARealKey0a9F2");
const SEC_LIVE = fake("sk_" + "live_", "51DEMOx9ExampleOnlyNotARealKey7Qe1");
const SEC_TEST = fake("sk_" + "test_", "51DEMOx9ExampleOnlyNotARealKey3Bd8");

/** Live preview: a payments settings panel with a publishable and a secret key. */
export default function SecretKeyFieldDemo() {
  const [pub, setPub] = useState(PUB_TEST);
  const [sec, setSec] = useState(SEC_TEST);

  const paste = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard can be blocked in some previews; the message below still explains what to do.
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="w-full max-w-md space-y-5 border-2 border-[#1A1A17] bg-white p-5 shadow-[5px_5px_0_#1A1A17]">
        <p className="text-xs font-bold uppercase tracking-wider text-[#5E5A50]">Settings · Payments</p>
        <SecretKeyField label="Publishable key (sent to the browser)" expects="publishable" value={pub} onChange={setPub} />
        <SecretKeyField label="Secret key (server only)" expects="secret" value={sec} onChange={setSec} />
      </div>
      <div role="group" aria-label="Try a mistake" className="flex flex-wrap justify-center gap-2">
        {[
          ["Live secret in the public box", () => setPub(SEC_LIVE)],
          ["Publishable in the secret box", () => setSec(PUB_TEST)],
          ["Copy a key with stray spaces", () => paste(`  "${SEC_TEST}"\n`)],
          ["Reset", () => { setPub(PUB_TEST); setSec(SEC_TEST); }],
        ].map(([label, run]) => (
          <button
            key={label as string}
            type="button"
            onClick={run as () => void}
            className="border-2 border-[#1A1A17] bg-white px-3 py-0.5 text-sm font-bold shadow-[2px_2px_0_#1A1A17] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_#1A1A17] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#D7263D]"
          >
            {label as string}
          </button>
        ))}
      </div>
      <p className="max-w-sm text-center text-xs text-[#5E5A50]">“Copy a key with stray spaces” puts a messy key on your clipboard — paste it into either field and watch it get cleaned.</p>
    </div>
  );
}
