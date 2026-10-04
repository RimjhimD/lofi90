import type { ComponentType as ReactComponent, ReactNode } from "react";
import type { ControlValues } from "@/site/Controls";
import UndoFuseButtonDemo from "@/library/undo-fuse-button/demo";
import SecretKeyFieldDemo from "@/library/secret-key-field/demo";
import RolodexCarouselDemo from "@/library/rolodex-carousel/demo";
import SplitBillCardDemo from "@/library/split-bill-card/demo";
import IslandNotificationDemo from "@/library/island-notification/demo";
import { UNDO_FUSE_BUTTON_STATES } from "@/library/undo-fuse-button/states";
import { SECRET_KEY_FIELD_STATES } from "@/library/secret-key-field/states";
import { ROLODEX_CAROUSEL_STATES } from "@/library/rolodex-carousel/states";
import { SPLIT_BILL_CARD_STATES } from "@/library/split-bill-card/states";
import { ISLAND_NOTIFICATION_STATES } from "@/library/island-notification/states";

export const DEMOS: Record<string, ReactComponent<{ controls?: ControlValues }>> = {
  "undo-fuse-button": UndoFuseButtonDemo,
  "secret-key-field": SecretKeyFieldDemo,
  "rolodex-carousel": RolodexCarouselDemo,
  "split-bill-card": SplitBillCardDemo,
  "island-notification": IslandNotificationDemo,
};

export interface StateSample {
  id: string;
  label: string;
  note: string;
  node: ReactNode;
}

export const STATES: Record<string, StateSample[]> = {
  "undo-fuse-button": UNDO_FUSE_BUTTON_STATES,
  "secret-key-field": SECRET_KEY_FIELD_STATES,
  "rolodex-carousel": ROLODEX_CAROUSEL_STATES,
  "split-bill-card": SPLIT_BILL_CARD_STATES,
  "island-notification": ISLAND_NOTIFICATION_STATES,
};

/** Which state each home-page card shows as its mini preview. */
export const CARD_STATE: Record<string, string> = {
  "undo-fuse-button": "burning",
  "secret-key-field": "wrong-box",
  "rolodex-carousel": "middle",
  "split-bill-card": "shared",
  "island-notification": "open",
};
