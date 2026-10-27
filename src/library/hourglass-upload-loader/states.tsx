"use client";

import { useEffect, useRef, useState } from "react";
import { useLoop } from "@/lib/loop";
import { HourglassUploadLoader, type UploadStatus } from "./HourglassUploadLoader";

const noop = () => {};
const FILE = "holiday-video.mp4";
const TOTAL = 12_000_000;

/** A pretend upload that runs on its own: uneven bursts until it finishes. */
function Sim({ rate, unknown = false }: { rate: number; unknown?: boolean }) {
  const [loaded, setLoaded] = useState(0);
  const [status, setStatus] = useState<UploadStatus>("uploading");
  const bytes = useRef(0);
  useEffect(() => {
    if (status !== "uploading") return;
    const id = window.setInterval(() => {
      const got = bytes.current + rate * 0.2 * (0.5 + Math.random());
      const next = unknown ? got : Math.min(TOTAL, got);
      bytes.current = next;
      setLoaded(next);
      if (!unknown && next >= TOTAL) setStatus("done");
    }, 200);
    return () => clearInterval(id);
  }, [status, rate, unknown]);
  return <HourglassUploadLoader size="sm" fileName={FILE} loaded={loaded} total={unknown ? 0 : TOTAL} status={status} onPause={noop} onCancel={noop} />;
}

/** Restarts the pretend upload on a loop, and only while it's on screen. */
function Scene({ period, rate, unknown }: { period: number; rate: number; unknown?: boolean }) {
  const { ref, run, stop } = useLoop(period, []);
  return (
    <div ref={ref} onClick={stop}>
      <Sim key={run} rate={rate} unknown={unknown} />
    </div>
  );
}

const still = (status: UploadStatus, progress: number | null, extra: Partial<Parameters<typeof HourglassUploadLoader>[0]> = {}) => (
  <HourglassUploadLoader size="sm" fileName={FILE} loaded={0} total={0} status={status} previewState={{ status, progress }} {...extra} />
);

/** Every state. Uploading, Uploaded and Unknown size play live; the rest hold still. */
export const HOURGLASS_UPLOAD_LOADER_STATES = [
  { id: "idle", label: "Ready", note: "Full top bulb, nothing sent yet.", node: still("idle", 0) },
  {
    id: "uploading",
    label: "Uploading",
    note: "Sand falls as bytes arrive. Time left says “working it out…” until the speed is measured.",
    node: <Scene period={12000} rate={1_400_000} />,
  },
  { id: "paused", label: "Paused", note: "Paused by the user: it tilts, the stream stops, no time left is shown.", node: still("paused", 0.45, { onResume: noop, onCancel: noop }) },
  { id: "offline", label: "Offline", note: "Connection lost: it lies on its side and says it will carry on by itself.", node: still("offline", 0.6, { onCancel: noop }) },
  { id: "done", label: "Uploaded", note: "The last grain lands, it turns over and a check pops on.", node: <Scene period={7000} rate={5_000_000} /> },
  { id: "error", label: "Failed", note: "Cracked glass, a plain message and a Retry button.", node: still("error", 0.3, { onRetry: noop, onCancel: noop }) },
  { id: "indeterminate", label: "Unknown size", note: "No total from the server: the sand trickles in a loop and only bytes sent are shown.", node: <Scene period={12000} rate={900_000} unknown /> },
  { id: "disabled", label: "Disabled", note: "Buttons switched off while the app is busy.", node: still("paused", 0.45, { onResume: noop, onCancel: noop, disabled: true }) },
];
