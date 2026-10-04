import type { ComponentType as ReactComponent, ReactNode } from "react";
import UndoFuseButtonDemo from "@/library/undo-fuse-button/demo";
import SecretKeyFieldDemo from "@/library/secret-key-field/demo";
import { UNDO_FUSE_BUTTON_STATES } from "@/library/undo-fuse-button/states";
import { SECRET_KEY_FIELD_STATES } from "@/library/secret-key-field/states";

export const DEMOS: Record<string, ReactComponent> = {
  "undo-fuse-button": UndoFuseButtonDemo,
  "secret-key-field": SecretKeyFieldDemo,
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
};

/** Which state each home-page card shows as its mini preview. */
export const CARD_STATE: Record<string, string> = {
  "undo-fuse-button": "burning",
  "secret-key-field": "wrong-box",
};
