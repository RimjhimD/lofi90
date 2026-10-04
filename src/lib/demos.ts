import type { ComponentType as ReactComponent, ReactNode } from "react";
import type { ControlValues } from "@/site/Controls";
import UndoFuseButtonDemo from "@/library/undo-fuse-button/demo";
import SecretKeyFieldDemo from "@/library/secret-key-field/demo";
import RolodexCarouselDemo from "@/library/rolodex-carousel/demo";
import SplitBillCardDemo from "@/library/split-bill-card/demo";
import { UNDO_FUSE_BUTTON_STATES, UNDO_FUSE_BUTTON_VARIANTS } from "@/library/undo-fuse-button/states";
import { SECRET_KEY_FIELD_STATES, SECRET_KEY_FIELD_VARIANTS } from "@/library/secret-key-field/states";
import { ROLODEX_CAROUSEL_STATES, ROLODEX_CAROUSEL_VARIANTS } from "@/library/rolodex-carousel/states";
import { SPLIT_BILL_CARD_STATES, SPLIT_BILL_CARD_VARIANTS } from "@/library/split-bill-card/states";

export const DEMOS: Record<string, ReactComponent<{ controls?: ControlValues }>> = {
  "undo-fuse-button": UndoFuseButtonDemo,
  "secret-key-field": SecretKeyFieldDemo,
  "rolodex-carousel": RolodexCarouselDemo,
  "split-bill-card": SplitBillCardDemo,
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
};

export interface VariantSample {
  group: string;
  label: string;
  node: ReactNode;
}

export const VARIANTS: Record<string, VariantSample[]> = {
  "undo-fuse-button": UNDO_FUSE_BUTTON_VARIANTS,
  "secret-key-field": SECRET_KEY_FIELD_VARIANTS,
  "rolodex-carousel": ROLODEX_CAROUSEL_VARIANTS,
  "split-bill-card": SPLIT_BILL_CARD_VARIANTS,
};

/** Which state each home-page card shows as its mini preview. */
export const CARD_STATE: Record<string, string> = {
  "undo-fuse-button": "burning",
  "secret-key-field": "wrong-box",
  "rolodex-carousel": "middle",
  "split-bill-card": "shared",
};
