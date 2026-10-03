"use client";

import { useState } from "react";
import { PasskeyButton, type PasskeyIntent } from "./PasskeyButton";

type Scenario = "returning" | "new" | "cancel" | "unsupported" | "disabled";

const SCENARIOS: { id: Scenario; label: string }[] = [
  { id: "returning", label: "Returning user" },
  { id: "new", label: "New user" },
  { id: "cancel", label: "User cancels" },
  { id: "unsupported", label: "Old browser" },
  { id: "disabled", label: "Disabled" },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Live preview: a real sign-in screen. The browser's passkey prompt is simulated with a delay. */
export default function PasskeyButtonDemo() {
  const [scenario, setScenario] = useState<Scenario>("returning");
  const [note, setNote] = useState("");
  const intent: PasskeyIntent = scenario === "new" ? "register" : "signin";

  const ceremony = async () => {
    await wait(1600);
    if (scenario === "cancel") throw new DOMException("The operation was cancelled.", "NotAllowedError");
  };

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="w-full max-w-sm rounded-[24px] border-4 border-[#20201C] bg-[#FFFDF6] p-5 shadow-[6px_6px_0_#20201C]">
        <p className="text-sm font-bold text-[#5c5849]">Glow Studio</p>
        <h4 className="mb-1 text-2xl font-black leading-tight">{intent === "register" ? "Make sign-in faster" : "Welcome back"}</h4>
        <p className="mb-4 text-sm font-semibold text-[#5c5849]">
          {intent === "register" ? "Save a passkey on this device. Next time it's just your fingerprint or face." : "sam@glowstudio.co"}
        </p>
        <PasskeyButton
          key={scenario}
          intent={intent}
          onSignIn={ceremony}
          onRegister={ceremony}
          onUseOtherDevice={async () => {
            setNote("A QR code would appear here for your phone to scan.");
            await ceremony();
          }}
          onFallback={() => setNote("This is where your normal password form would open.")}
          supportOverride={scenario === "unsupported" ? "unsupported" : "supported"}
          disabled={scenario === "disabled"}
        />
        {note && <p className="mt-3 rounded-xl border-[3px] border-dashed border-[#20201C] px-3 py-2 text-sm font-semibold">{note}</p>}
      </div>

      <div role="group" aria-label="Demo scenario" className="flex flex-wrap justify-center gap-2">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={scenario === s.id}
            onClick={() => {
              setScenario(s.id);
              setNote("");
            }}
            className="rounded-full border-[3px] border-[#20201C] bg-white px-3 py-0.5 text-sm font-extrabold shadow-[0_3px_0_#20201C] active:translate-y-0.5 active:shadow-[0_1px_0_#20201C] aria-pressed:bg-[#FFB800] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#3BB2F6]"
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
