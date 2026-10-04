import type { ComponentType as ReactComponent, ReactNode } from "react";
import PasskeyButtonDemo from "@/library/passkey-button/demo";
import PermissionPrimerDemo from "@/library/permission-primer/demo";
import { PASSKEY_BUTTON_STATES } from "@/library/passkey-button/states";
import { PERMISSION_PRIMER_STATES } from "@/library/permission-primer/states";

export const DEMOS: Record<string, ReactComponent> = {
  "passkey-button": PasskeyButtonDemo,
  "permission-primer": PermissionPrimerDemo,
};

export interface StateSample {
  id: string;
  label: string;
  note: string;
  node: ReactNode;
}

export const STATES: Record<string, StateSample[]> = {
  "passkey-button": PASSKEY_BUTTON_STATES,
  "permission-primer": PERMISSION_PRIMER_STATES,
};
