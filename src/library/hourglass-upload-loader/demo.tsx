"use client";

import { useEffect, useRef, useState } from "react";
import type { ControlValues } from "@/site/Controls";
import { say } from "@/site/log";
import { HourglassUploadLoader, type HourglassUploadLoaderProps, type UploadStatus } from "./HourglassUploadLoader";

const FILE = "holiday-video.mp4";
const TOTAL = 12_000_000;
/** Bytes per second, before the random wobble. */
const SPEEDS = { fast: 1_500_000, slow: 120_000 };
/** The pretend server keeps whole 1 MB chunks, so a retry carries on from the last one. */
const CHUNK = 1_000_000;

type Phase = "idle" | "running" | "paused" | "done" | "error";

/** Live preview: a pretend upload with a network you can unplug, a slow line, and a button that breaks it. */
export default function HourglassUploadLoaderDemo({ controls = {} }: { controls?: ControlValues }) {
  const look = controls as Pick<HourglassUploadLoaderProps, "accent" | "size" | "etaStyle">;
  const [phase, setPhase] = useState<Phase>("idle");
  const [online, setOnline] = useState(true);
  const [speed, setSpeed] = useState<keyof typeof SPEEDS>("fast");
  const [loaded, setLoaded] = useState(0);
  const bytes = useRef(0);
  const status: UploadStatus = phase === "running" ? (online ? "uploading" : "offline") : phase;

  // The pretend network: bytes arrive in uneven bursts, with the odd hiccup where nothing moves.
  useEffect(() => {
    if (status !== "uploading") return;
    let last = performance.now();
    let hiccup = 0;
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      if (hiccup > 0) hiccup -= dt;
      else if (Math.random() < 0.015) hiccup = 1 + Math.random();
      const got = hiccup > 0 ? 0 : SPEEDS[speed] * dt * (0.45 + Math.random() * 1.1);
      const next = Math.min(TOTAL, bytes.current + got);
      bytes.current = next;
      setLoaded(next);
      if (next >= TOTAL) {
        setPhase("done");
        say(`${FILE} finished. The hourglass turns over: every byte is in the bottom bulb.`, "good");
      }
    }, 200);
    return () => clearInterval(id);
  }, [status, speed]);

  const start = () => {
    bytes.current = 0;
    setLoaded(0);
    setPhase("running");
    say(online ? `Uploading ${FILE} (12 MB). The time left says "working it out…" until it has measured the speed.` : "Started while offline. The hourglass lies on its side until the network comes back.", "wait");
  };
  const toggleNetwork = () => {
    const next = !online;
    setOnline(next);
    if (phase === "running") say(next ? "Back online. It stands up and carries on from the same byte." : "Connection dropped. The hourglass tips over and says so, instead of freezing at a number.", next ? "good" : "bad");
    else say(next ? "Network is back." : "Network is off.");
  };
  const toggleSpeed = () => {
    const next = speed === "fast" ? "slow" : "fast";
    setSpeed(next);
    say(next === "slow" ? "Line slowed to 3G. Watch the time left rise gently, not jump." : "Line is fast again. The time left drops as the speed is re-measured.");
  };
  const fail = () => {
    if (phase !== "running" && phase !== "paused") return say("Start an upload first, then make it fail.");
    setPhase("error");
    say("The server dropped the upload. The glass cracks and Retry appears.", "bad");
  };
  const reset = () => {
    bytes.current = 0;
    setLoaded(0);
    setPhase("idle");
    setOnline(true);
    say("Reset.");
  };

  const chip =
    "rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] px-3 py-1.5 text-xs font-semibold text-[var(--k-text,#E9EDE8)] transition-colors hover:border-[var(--k-acc-text,#C6FF3D)] aria-pressed:border-[var(--k-acc-text,#C6FF3D)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)] disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <HourglassUploadLoader
        {...look}
        loaded={loaded}
        total={TOTAL}
        status={status}
        fileName={FILE}
        onPause={() => {
          setPhase("paused");
          say("Paused by you. It tilts and the sand stops; paused time never counts as slow.", "info");
        }}
        onResume={() => {
          setPhase("running");
          say("Resumed. It stands back up and carries on.", "wait");
        }}
        onRetry={() => {
          const from = Math.floor(bytes.current / CHUNK) * CHUNK;
          bytes.current = from;
          setLoaded(from);
          setPhase("running");
          say(`Retrying from the last saved chunk (${(from / 1e6).toFixed(0)} MB), not from zero.`, "wait");
        }}
        onCancel={() => {
          bytes.current = 0;
          setLoaded(0);
          setPhase("idle");
          say("Upload cancelled. Nothing more is sent.", "bad");
        }}
      />
      <div className="flex flex-wrap items-center justify-center gap-2" aria-label="Pretend network">
        <button type="button" className={chip} onClick={start} disabled={phase === "running" || phase === "paused"}>
          {phase === "done" ? "Upload again" : "Start upload"}
        </button>
        <button type="button" className={chip} aria-pressed={!online} onClick={toggleNetwork}>
          Network: {online ? "online" : "offline"}
        </button>
        <button type="button" className={chip} aria-pressed={speed === "slow"} onClick={toggleSpeed}>
          Speed: {speed === "fast" ? "fast" : "slow 3G"}
        </button>
        <button type="button" className={chip} onClick={fail}>
          Fail it
        </button>
        <button type="button" className={chip} onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  );
}
