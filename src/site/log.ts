export type LogTone = "info" | "good" | "bad" | "wait";

export interface LogLine {
  id: number;
  at: number;
  text: string;
  tone: LogTone;
}

const EVENT = "lofi90:log";

/** A live preview tells the page what it just did; the "What just happened" panel under the stage prints it. */
export function say(text: string, tone: LogTone = "info") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { text, tone } }));
}

export function listen(cb: (text: string, tone: LogTone) => void) {
  const on = (e: Event) => {
    const { text, tone } = (e as CustomEvent<{ text: string; tone: LogTone }>).detail;
    cb(text, tone);
  };
  window.addEventListener(EVENT, on);
  return () => window.removeEventListener(EVENT, on);
}
