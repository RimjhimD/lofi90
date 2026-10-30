import type { ComponentType as ReactComponent, ReactNode } from "react";
import type { ControlValues } from "@/site/Controls";
import UndoFuseButtonDemo from "@/library/undo-fuse-button/demo";
import TapeMeasureInputDemo from "@/library/tape-measure-input/demo";
import StringNavDemo from "@/library/string-nav/demo";
import VinylCrateCarouselDemo from "@/library/vinyl-crate-carousel/demo";
import IslandNotificationDemo from "@/library/island-notification/demo";
import BoardingPassCardDemo from "@/library/boarding-pass-card/demo";
import { UNDO_FUSE_BUTTON_STATES } from "@/library/undo-fuse-button/states";
import { TAPE_MEASURE_INPUT_STATES } from "@/library/tape-measure-input/states";
import { STRING_NAV_STATES } from "@/library/string-nav/states";
import { VINYL_CRATE_CAROUSEL_STATES } from "@/library/vinyl-crate-carousel/states";
import { ISLAND_NOTIFICATION_STATES } from "@/library/island-notification/states";
import { BOARDING_PASS_CARD_STATES } from "@/library/boarding-pass-card/states";
import UrlSlugInputDemo from "@/library/url-slug-input/demo";
import BugReportWidgetDemo from "@/library/bug-report-widget/demo";
import TextUsWidgetDemo from "@/library/text-us-widget/demo";
import TabProgressLoaderDemo from "@/library/tab-progress-loader/demo";
import ScanToSaveContactCardDemo from "@/library/scan-to-save-contact-card/demo";
import OpenNowHoursDemo from "@/library/open-now-hours/demo";
import PolaroidCardDemo from "@/library/polaroid-card/demo";
import OfflineAwareNavbarDemo from "@/library/offline-aware-navbar/demo";
import { URL_SLUG_INPUT_STATES } from "@/library/url-slug-input/states";
import { BUG_REPORT_WIDGET_STATES } from "@/library/bug-report-widget/states";
import { TEXT_US_WIDGET_STATES } from "@/library/text-us-widget/states";
import { TAB_PROGRESS_LOADER_STATES } from "@/library/tab-progress-loader/states";
import { SCAN_TO_SAVE_CONTACT_CARD_STATES } from "@/library/scan-to-save-contact-card/states";
import { OPEN_NOW_HOURS_STATES } from "@/library/open-now-hours/states";
import { POLAROID_CARD_STATES } from "@/library/polaroid-card/states";
import { OFFLINE_AWARE_NAVBAR_STATES } from "@/library/offline-aware-navbar/states";
import { CARD_STATE as URL_SLUG_INPUT_CARD } from "@/library/url-slug-input/meta";
import { CARD_STATE as BUG_REPORT_WIDGET_CARD } from "@/library/bug-report-widget/meta";
import { CARD_STATE as TEXT_US_WIDGET_CARD } from "@/library/text-us-widget/meta";
import { CARD_STATE as TAB_PROGRESS_LOADER_CARD } from "@/library/tab-progress-loader/meta";
import { CARD_STATE as SCAN_TO_SAVE_CONTACT_CARD_CARD } from "@/library/scan-to-save-contact-card/meta";
import { CARD_STATE as OPEN_NOW_HOURS_CARD } from "@/library/open-now-hours/meta";
import { CARD_STATE as POLAROID_CARD_CARD } from "@/library/polaroid-card/meta";
import { CARD_STATE as OFFLINE_AWARE_NAVBAR_CARD } from "@/library/offline-aware-navbar/meta";

export const DEMOS: Record<string, ReactComponent<{ controls?: ControlValues }>> = {
  "undo-fuse-button": UndoFuseButtonDemo,
  "tape-measure-input": TapeMeasureInputDemo,
  "string-nav": StringNavDemo,
  "vinyl-crate-carousel": VinylCrateCarouselDemo,
  "island-notification": IslandNotificationDemo,
  "boarding-pass-card": BoardingPassCardDemo,
  "url-slug-input": UrlSlugInputDemo,
  "bug-report-widget": BugReportWidgetDemo,
  "text-us-widget": TextUsWidgetDemo,
  "tab-progress-loader": TabProgressLoaderDemo,
  "scan-to-save-contact-card": ScanToSaveContactCardDemo,
  "open-now-hours": OpenNowHoursDemo,
  "polaroid-card": PolaroidCardDemo,
  "offline-aware-navbar": OfflineAwareNavbarDemo,
};

export interface StateSample {
  id: string;
  label: string;
  note: string;
  node: ReactNode;
}

export const STATES: Record<string, StateSample[]> = {
  "undo-fuse-button": UNDO_FUSE_BUTTON_STATES,
  "tape-measure-input": TAPE_MEASURE_INPUT_STATES,
  "string-nav": STRING_NAV_STATES,
  "vinyl-crate-carousel": VINYL_CRATE_CAROUSEL_STATES,
  "island-notification": ISLAND_NOTIFICATION_STATES,
  "boarding-pass-card": BOARDING_PASS_CARD_STATES,
  "url-slug-input": URL_SLUG_INPUT_STATES,
  "bug-report-widget": BUG_REPORT_WIDGET_STATES,
  "text-us-widget": TEXT_US_WIDGET_STATES,
  "tab-progress-loader": TAB_PROGRESS_LOADER_STATES,
  "scan-to-save-contact-card": SCAN_TO_SAVE_CONTACT_CARD_STATES,
  "open-now-hours": OPEN_NOW_HOURS_STATES,
  "polaroid-card": POLAROID_CARD_STATES,
  "offline-aware-navbar": OFFLINE_AWARE_NAVBAR_STATES,
};

/** Which state each gallery card shows as its preview. */
export const CARD_STATE: Record<string, string> = {
  "undo-fuse-button": "burning",
  "tape-measure-input": "pulling",
  "string-nav": "plucked",
  "vinyl-crate-carousel": "playing",
  "island-notification": "open",
  "boarding-pass-card": "torn",
  "url-slug-input": URL_SLUG_INPUT_CARD,
  "bug-report-widget": BUG_REPORT_WIDGET_CARD,
  "text-us-widget": TEXT_US_WIDGET_CARD,
  "tab-progress-loader": TAB_PROGRESS_LOADER_CARD,
  "scan-to-save-contact-card": SCAN_TO_SAVE_CONTACT_CARD_CARD,
  "open-now-hours": OPEN_NOW_HOURS_CARD,
  "polaroid-card": POLAROID_CARD_CARD,
  "offline-aware-navbar": OFFLINE_AWARE_NAVBAR_CARD,
};
