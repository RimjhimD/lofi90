"use client";

import { useRouter } from "next/navigation";
import { PasskeyButton } from "@/library/passkey-button/PasskeyButton";

// Your server creates the WebAuthn options and verifies the result.
// Libraries like @simplewebauthn/server handle that part.
async function signInWithPasskey() {
  const options = await fetch("/api/passkey/login-options").then((r) => r.json());
  const credential = await navigator.credentials.get({ publicKey: options });
  const res = await fetch("/api/passkey/login-verify", { method: "POST", body: JSON.stringify(credential) });
  if (!res.ok) throw new Error("We couldn't verify that passkey.");
}

async function createPasskey() {
  const options = await fetch("/api/passkey/register-options").then((r) => r.json());
  const credential = await navigator.credentials.create({ publicKey: options });
  await fetch("/api/passkey/register-verify", { method: "POST", body: JSON.stringify(credential) });
}

export function LoginScreen({ hasPasskey }: { hasPasskey: boolean }) {
  const router = useRouter();
  return (
    <PasskeyButton
      intent={hasPasskey ? "signin" : "register"}
      onSignIn={signInWithPasskey}
      onRegister={createPasskey}
      onFallback={() => router.push("/login/password")}
    />
  );
}
