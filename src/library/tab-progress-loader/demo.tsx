"use client";

import { useEffect, useRef, useState } from "react";
import type { ControlValues } from "@/site/Controls";
import { say } from "@/site/log";
import { askTabNotifications, TabProgressLoader, type TabProgressLoaderProps, type TabProgressStatus } from "./TabProgressLoader";

const LABEL = "Exporting sales report";

/** Live preview: export a report, switch tabs, and watch this tab's own title and icon keep counting. */
export default function TabProgressLoaderDemo({ controls = {} }: { controls?: ControlValues }) {
  const look = controls as Pick<TabProgressLoaderProps, "accent" | "size" | "variant" | "tabMode">;
  const [status, setStatus] = useState<TabProgressStatus>("idle");
  const [progress, setProgress] = useState<number | null>(0);
  const [fail, setFail] = useState(false);
  const [unknown, setUnknown] = useState(false);
  const [notify, setNotify] = useState(false);
  const job = useRef(0);
  const lastMark = useRef(0);

  useEffect(() => () => clearInterval(job.current), []);

  // Tell the visitor what the real tab is doing when they leave and come back.
  const live = useRef({ status, progress });
  useEffect(() => {
    live.current = { status, progress };
  });
  useEffect(() => {
    const on = () => {
      const { status: s, progress: p } = live.current;
      if (document.hidden && s === "running") say(p == null ? "You left the tab. Its icon is now a spinning ring." : `You left the tab. Its title now reads “${Math.floor(p)}% · ${LABEL}”.`, "wait");
      else if (!document.hidden && (s === "done" || s === "error")) say("Welcome back. The tab's own title and icon are restored.", "good");
    };
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);

  function finish(ok: boolean) {
    clearInterval(job.current);
    if (ok) {
      setProgress(100);
      setStatus("done");
      say("Export finished. The tab icon turns into a green ✓ and the title says Ready.", "good");
    } else {
      setStatus("error");
      say("Export failed. The tab icon turns into a red ! so you notice from any tab.", "bad");
    }
  }

  function start() {
    clearInterval(job.current);
    const failing = fail;
    const blind = unknown;
    lastMark.current = 0;
    setStatus("running");
    setProgress(blind ? null : 0);
    say(blind ? "Export started with no known length. The tab icon will spin." : "Export started. Now switch to another tab and watch this tab's title and icon.", "wait");
    let p = 0;
    let ticks = 0;
    job.current = window.setInterval(() => {
      ticks++;
      if (blind) {
        if (ticks >= 30) finish(!failing);
        return;
      }
      p = Math.min(100, p + 1 + Math.random() * 3);
      if (failing && p >= 62) return finish(false);
      if (p >= 100) return finish(true);
      setProgress(p);
      const mark = Math.floor(p / 20) * 20;
      if (mark > lastMark.current) {
        lastMark.current = mark;
        say(`Tab icon now ${mark}%.`);
      }
    }, 300);
  }

  function cancel() {
    clearInterval(job.current);
    setStatus("cancelled");
    say("Cancelled. The tab's own title and icon are back.", "info");
  }

  async function toggleNotify() {
    if (notify) {
      setNotify(false);
      return say("Notification off. The tab still shows ✓ when it's done.");
    }
    setNotify(true);
    const p = await askTabNotifications();
    say(
      p === "granted" ? "Notification on. You'll get one when the export ends while you're on another tab." : p === "denied" ? "Notifications are blocked in this browser. The tab icon still shows ✓." : p === "unsupported" ? "This browser has no notifications. The tab icon still shows ✓." : "Permission not given yet.",
      p === "granted" ? "good" : "info",
    );
  }

  const running = status === "running";
  const chip = "rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] px-2.5 py-1 text-xs font-semibold text-[var(--k-text,#E9EDE8)] transition-colors hover:border-[var(--k-acc-text,#C6FF3D)] aria-pressed:border-[var(--k-acc-text,#C6FF3D)] aria-pressed:text-[var(--k-acc-text,#C6FF3D)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)] disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <TabProgressLoader
        {...look}
        progress={progress}
        status={status}
        label={LABEL}
        notify={notify}
        tabPreview
        onCancel={cancel}
        onRetry={start}
        labels={{ pageTitle: "Sales · Dashboard" }}
        className="mx-auto"
      />
      <button
        type="button"
        onClick={start}
        disabled={running}
        className="rounded-lg px-4 py-2 text-sm font-bold text-[#0B0D0C] shadow-[0_10px_30px_-14px_var(--k-shadow,rgba(0,0,0,.9))] transition-[filter,transform] hover:brightness-110 active:translate-y-px focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--k-acc-text,#C6FF3D)] disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: look.accent ?? "#C6FF3D" }}
      >
        {status === "idle" ? "Export sales report" : running ? "Exporting…" : "Export again"}
      </button>
      <p className="max-w-sm text-center text-xs text-[var(--k-mute,#8A938D)]">Press it, then switch to another browser tab and watch this tab&apos;s title and icon.</p>
      <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Try other cases">
        <button type="button" aria-pressed={fail} disabled={running} onClick={() => { setFail(!fail); say(!fail ? "Next export will fail part-way." : "Next export will succeed."); }} className={chip}>
          Make it fail
        </button>
        <button type="button" aria-pressed={unknown} disabled={running} onClick={() => { setUnknown(!unknown); say(!unknown ? "Next export has no known length: the tab icon spins." : "Next export reports a percent again."); }} className={chip}>
          Unknown length
        </button>
        <button type="button" aria-pressed={notify} onClick={toggleNotify} className={chip}>
          🔔 Notify me
        </button>
      </div>
    </div>
  );
}
