"use client";

import { useState } from "react";
import type { ControlValues } from "@/site/Controls";
import { SecretKeyField, type SecretKeyFieldProps } from "./SecretKeyField";

// Fake keys, assembled at runtime so no key-shaped string sits in the source.
const fake = (prefix: string, body: string) => prefix + body;
const PUB_TEST = fake("pk_" + "test_", "51DEMOx9ExampleOnlyNotARealKey0a9F2");
const SEC_LIVE = fake("sk_" + "live_", "51DEMOx9ExampleOnlyNotARealKey7Qe1");
const SEC_TEST = fake("sk_" + "test_", "51DEMOx9ExampleOnlyNotARealKey3Bd8");

/** Live preview: a payments settings panel with a publishable and a secret key. */
export default function SecretKeyFieldDemo({ controls = {} }: { controls?: ControlValues }) {
  const look = controls as Pick<SecretKeyFieldProps, "accent" | "drain" | "size" | "peekMs" | "visibleChars">;
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
      <div className="w-full max-w-md space-y-5 rounded-lg border border-[#3A433F] bg-[#121614] p-5 shadow-[0_10px_30px_-14px_rgba(0,0,0,.9)]">
        <p className="text-xs font-bold uppercase tracking-wider text-[#8A938D]">Settings · Payments</p>
        <SecretKeyField {...look} label="Publishable key (sent to the browser)" expects="publishable" value={pub} onChange={setPub} />
        <SecretKeyField {...look} label="Secret key (server only)" expects="secret" value={sec} onChange={setSec} />
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
            className="rounded-lg border border-[#3A433F] bg-[#121614] px-3 py-0.5 text-sm font-bold shadow-[0_10px_30px_-14px_rgba(0,0,0,.9)] active:translate-x-px active:translate-y-px active:shadow-[0_10px_30px_-14px_rgba(0,0,0,.9)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#C6FF3D]"
          >
            {label as string}
          </button>
        ))}
      </div>
      <p className="max-w-sm text-center text-xs text-[#8A938D]">“Copy a key with stray spaces” puts a messy key on your clipboard — paste it into either field and watch it get cleaned.</p>
    </div>
  );
}
