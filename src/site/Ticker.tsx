import { ENTRIES, TYPES } from "@/lib/registry";
import { TICKER as WAX_SEAL_BUTTON_TICKER } from "@/library/wax-seal-button/meta";
import { TICKER as HOURGLASS_UPLOAD_LOADER_TICKER } from "@/library/hourglass-upload-loader/meta";
import { TICKER as POSTCARD_FORM_TICKER } from "@/library/postcard-form/meta";
import { TICKER as DEPARTURE_BOARD_TABLE_TICKER } from "@/library/departure-board-table/meta";

/** A slow live feed under the header, built from the real components so it never lies. */
export function Ticker() {
  const events = [
    ...ENTRIES.map((e) => [`${e.slug}`, "online", "acc"] as const),
    ...(
      [
        ["undo-fuse-button", "undo window closed · nothing deleted", "mute"],
        ["tape-measure-input", "pulled out to 120 cm · snapped", "acc"],
        ["string-nav", "plucked “work” · bead rode over", "mute"],
        ["vinyl-crate-carousel", "pulled out a record · spinning at 33 rpm", "acc"],
        ["island-notification", "3 arrived · 1 showing, 2 waiting", "warn"],
        ["boarding-pass-card", "stub torn · checked in, seat 14A", "acc"],
        WAX_SEAL_BUTTON_TICKER,
        HOURGLASS_UPLOAD_LOADER_TICKER,
        POSTCARD_FORM_TICKER,
        DEPARTURE_BOARD_TABLE_TICKER,
      ] as const
    ).filter(([slug]) => ENTRIES.some((e) => e.slug === slug)),
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
