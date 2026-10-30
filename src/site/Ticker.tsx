import { ENTRIES, TYPES } from "@/lib/registry";
import { TICKER as URL_SLUG_INPUT_TICKER } from "@/library/url-slug-input/meta";
import { TICKER as BUG_REPORT_WIDGET_TICKER } from "@/library/bug-report-widget/meta";
import { TICKER as TEXT_US_WIDGET_TICKER } from "@/library/text-us-widget/meta";
import { TICKER as TAB_PROGRESS_LOADER_TICKER } from "@/library/tab-progress-loader/meta";
import { TICKER as SCAN_TO_SAVE_CONTACT_CARD_TICKER } from "@/library/scan-to-save-contact-card/meta";
import { TICKER as OPEN_NOW_HOURS_TICKER } from "@/library/open-now-hours/meta";
import { TICKER as POLAROID_CARD_TICKER } from "@/library/polaroid-card/meta";
import { TICKER as OFFLINE_AWARE_NAVBAR_TICKER } from "@/library/offline-aware-navbar/meta";

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
        URL_SLUG_INPUT_TICKER,
        BUG_REPORT_WIDGET_TICKER,
        TEXT_US_WIDGET_TICKER,
        TAB_PROGRESS_LOADER_TICKER,
        SCAN_TO_SAVE_CONTACT_CARD_TICKER,
        OPEN_NOW_HOURS_TICKER,
        POLAROID_CARD_TICKER,
        OFFLINE_AWARE_NAVBAR_TICKER,
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
