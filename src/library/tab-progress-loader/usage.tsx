"use client";

import { useRef, useState } from "react";
import { askTabNotifications, TabProgressLoader, type TabProgressStatus } from "@/library/tab-progress-loader/TabProgressLoader";

// Start a server export, poll its progress, and let the browser tab report it while the user works elsewhere.
export function ExportReport({ reportId }: { reportId: string }) {
  const [status, setStatus] = useState<TabProgressStatus>("idle");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const abort = useRef<AbortController | null>(null);

  async function start() {
    void askTabNotifications(); // inside the click, so the browser allows the prompt
    const ctrl = new AbortController();
    abort.current = ctrl;
    setStatus("running");
    setProgress(null);
    try {
      const { jobId } = await fetch(`/api/reports/${reportId}/export`, { method: "POST", signal: ctrl.signal }).then((r) => r.json());
      for (;;) {
        await new Promise((r) => setTimeout(r, 1000));
        const job = await fetch(`/api/jobs/${jobId}`, { signal: ctrl.signal }).then((r) => r.json());
        if (job.state === "failed") throw new Error(job.message);
        setProgress(job.percent); // null while the server can't tell
        if (job.state === "done") return setStatus("done");
      }
    } catch (e) {
      if (ctrl.signal.aborted) return;
      setError(e instanceof Error ? e.message : "");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-3">
      {status !== "running" && <button type="button" onClick={start}>Export report</button>}
      <TabProgressLoader
        status={status}
        progress={progress}
        label="Exporting report"
        notify
        errorMessage={error}
        onRetry={start}
        onCancel={() => {
          abort.current?.abort();
          setStatus("cancelled");
        }}
      />
    </div>
  );
}
