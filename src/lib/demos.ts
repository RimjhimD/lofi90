import type { ComponentType as ReactComponent, ReactNode } from "react";
import IdempotentRunButtonDemo from "@/library/idempotent-run-button/demo";
import PermissionPrimerDemo from "@/library/permission-primer/demo";
import { IDEMPOTENT_RUN_BUTTON_STATES } from "@/library/idempotent-run-button/states";
import { PERMISSION_PRIMER_STATES } from "@/library/permission-primer/states";

export const DEMOS: Record<string, ReactComponent> = {
  "idempotent-run-button": IdempotentRunButtonDemo,
  "permission-primer": PermissionPrimerDemo,
};

export interface StateSample {
  id: string;
  label: string;
  note: string;
  node: ReactNode;
}

export const STATES: Record<string, StateSample[]> = {
  "idempotent-run-button": IDEMPOTENT_RUN_BUTTON_STATES,
  "permission-primer": PERMISSION_PRIMER_STATES,
};
