import type { ComponentType as ReactComponent } from "react";
import PasskeyButtonDemo from "@/library/passkey-button/demo";
import FilterVerdictCardDemo from "@/library/filter-verdict-card/demo";

export const DEMOS: Record<string, ReactComponent> = {
  "passkey-button": PasskeyButtonDemo,
  "filter-verdict-card": FilterVerdictCardDemo,
};
