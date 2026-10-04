import { ENTRIES, TYPES } from "@/lib/registry";

/** A slow live feed under the header, built from the real components so it never lies. */
export function Ticker() {
  const events = [
    ...ENTRIES.map((e) => [`${e.slug}`, "online", "acc"] as const),
    ["undo-fuse-button", "undo window closed · nothing deleted", "mute"] as const,
    ["secret-key-field", "secret key blocked in a public field", "warn"] as const,
    ["rolodex-carousel", "spun A → M in 7 flips", "mute"] as const,
    ["split-bill-card", "split $71.82 to the cent", "acc"] as const,
    ["library", `${ENTRIES.length} of 30 components · ${new Set(ENTRIES.map((e) => e.type)).size} of ${TYPES.length} types`, "mute"] as const,
  ];
  const tone = { acc: "text-acc", warn: "text-warn", mute: "text-mute" };
  const row = (
    <>
      {events.map(([who, what, t], i) => (
        <span key={i} className="flex shrink-0 items-center gap-2">
          <span className="text-text/80">{who}</span>
          <span className="text-line-2">·</span>
          <span className={tone[t]}>{what}</span>
        </span>
      ))}
    </>
  );
  return (
    <div aria-hidden="true" className="overflow-hidden border-t border-line/70 py-1.5 [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
      <div className="mono flex w-max animate-[ticker_60s_linear_infinite] gap-12 text-[0.64rem] normal-case tracking-normal">
        <div className="flex gap-12">{row}</div>
        <div className="flex gap-12">{row}</div>
      </div>
    </div>
  );
}
