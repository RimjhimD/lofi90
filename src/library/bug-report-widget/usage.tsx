"use client";

import { BugReportWidget, reportToMarkdown } from "@/library/bug-report-widget/BugReportWidget";

// Mount once in your staging layout. Each report becomes a ready-to-read issue in your tracker,
// with the page, a unique selector, browser, screen, console errors and failed requests already in it.
export function StagingBugReporter() {
  if (process.env.NEXT_PUBLIC_STAGE !== "staging") return null;
  return (
    <BugReportWidget
      collect={{ console: true, network: true, breadcrumbs: true }}
      onSubmit={async (report) => {
        const res = await fetch("/api/bug-reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: report.description.split("\n")[0].slice(0, 80), body: reportToMarkdown(report), labels: ["bug", report.severity], report }),
        });
        if (!res.ok) throw new Error(`Tracker answered ${res.status}`);
        const { number } = (await res.json()) as { number: number };
        return `#${number}`; // shown to the reporter as their reference
      }}
    />
  );
}
