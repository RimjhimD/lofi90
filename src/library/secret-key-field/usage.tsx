"use client";

import { useState } from "react";
import { SecretKeyField } from "@/library/secret-key-field/SecretKeyField";

// "expects" says where the value ends up. A publishable field is shipped to the browser,
// so pasting a secret key there is flagged as an error before anyone saves it.
export function PaymentKeys({ onSave }: { onSave: (keys: { publishable: string; secret: string }) => void }) {
  const [publishable, setPublishable] = useState("");
  const [secret, setSecret] = useState("");

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ publishable, secret }); }} className="space-y-4">
      <SecretKeyField label="Publishable key" expects="publishable" value={publishable} onChange={setPublishable} />
      <SecretKeyField label="Secret key" expects="secret" value={secret} onChange={setSecret} clearClipboardMs={30_000} />
      <button type="submit">Save keys</button>
    </form>
  );
}
