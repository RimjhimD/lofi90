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
import WaxSealButtonDemo from "@/library/wax-seal-button/demo";
import HourglassUploadLoaderDemo from "@/library/hourglass-upload-loader/demo";
import PostcardFormDemo from "@/library/postcard-form/demo";
import DepartureBoardTableDemo from "@/library/departure-board-table/demo";
import { WAX_SEAL_BUTTON_STATES } from "@/library/wax-seal-button/states";
import { HOURGLASS_UPLOAD_LOADER_STATES } from "@/library/hourglass-upload-loader/states";
import { POSTCARD_FORM_STATES } from "@/library/postcard-form/states";
import { DEPARTURE_BOARD_TABLE_STATES } from "@/library/departure-board-table/states";
import { CARD_STATE as WAX_SEAL_BUTTON_CARD } from "@/library/wax-seal-button/meta";
import { CARD_STATE as HOURGLASS_UPLOAD_LOADER_CARD } from "@/library/hourglass-upload-loader/meta";
import { CARD_STATE as POSTCARD_FORM_CARD } from "@/library/postcard-form/meta";
import { CARD_STATE as DEPARTURE_BOARD_TABLE_CARD } from "@/library/departure-board-table/meta";

export const DEMOS: Record<string, ReactComponent<{ controls?: ControlValues }>> = {
  "undo-fuse-button": UndoFuseButtonDemo,
  "tape-measure-input": TapeMeasureInputDemo,
  "string-nav": StringNavDemo,
  "vinyl-crate-carousel": VinylCrateCarouselDemo,
  "island-notification": IslandNotificationDemo,
  "boarding-pass-card": BoardingPassCardDemo,
  "wax-seal-button": WaxSealButtonDemo,
  "hourglass-upload-loader": HourglassUploadLoaderDemo,
  "postcard-form": PostcardFormDemo,
  "departure-board-table": DepartureBoardTableDemo,
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
  "wax-seal-button": WAX_SEAL_BUTTON_STATES,
  "hourglass-upload-loader": HOURGLASS_UPLOAD_LOADER_STATES,
  "postcard-form": POSTCARD_FORM_STATES,
  "departure-board-table": DEPARTURE_BOARD_TABLE_STATES,
};

/** Which state each gallery card shows as its preview. */
export const CARD_STATE: Record<string, string> = {
  "undo-fuse-button": "burning",
  "tape-measure-input": "pulling",
  "string-nav": "plucked",
  "vinyl-crate-carousel": "playing",
  "island-notification": "open",
  "boarding-pass-card": "torn",
  "wax-seal-button": WAX_SEAL_BUTTON_CARD,
  "hourglass-upload-loader": HOURGLASS_UPLOAD_LOADER_CARD,
  "postcard-form": POSTCARD_FORM_CARD,
  "departure-board-table": DEPARTURE_BOARD_TABLE_CARD,
};
