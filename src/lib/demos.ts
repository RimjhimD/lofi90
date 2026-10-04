import type { ComponentType as ReactComponent, ReactNode } from "react";
import MergeTagInputDemo from "@/library/merge-tag-input/demo";
import RetryCountdownLoaderDemo from "@/library/retry-countdown-loader/demo";
import { MERGE_TAG_INPUT_STATES } from "@/library/merge-tag-input/states";
import { RETRY_COUNTDOWN_LOADER_STATES } from "@/library/retry-countdown-loader/states";

export const DEMOS: Record<string, ReactComponent> = {
  "merge-tag-input": MergeTagInputDemo,
  "retry-countdown-loader": RetryCountdownLoaderDemo,
};

export interface StateSample {
  id: string;
  label: string;
  note: string;
  node: ReactNode;
}

export const STATES: Record<string, StateSample[]> = {
  "merge-tag-input": MERGE_TAG_INPUT_STATES,
  "retry-countdown-loader": RETRY_COUNTDOWN_LOADER_STATES,
};

/** Which state each home-page card shows as its mini preview. */
export const CARD_STATE: Record<string, string> = {
  "merge-tag-input": "blank",
  "retry-countdown-loader": "waiting",
};
