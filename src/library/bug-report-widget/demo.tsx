"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { ControlValues } from "@/site/Controls";
import { say } from "@/site/log";
import { BugReportWidget, reportToMarkdown, type BugReportState, type BugReportWidgetProps } from "./BugReportWidget";

const NOTES: Partial<Record<BugReportState, [string, "info" | "good" | "bad" | "wait"]>> = {
  picking: ["Pick mode is on. Hover the checkout: each part lights up with a readable name. Click the broken one (Esc cancels, Tab + Enter works too).", "wait"],
  picked: ["Element picked. Its selector is worked out and checked to match only that one element.", "info"],
  filling: ["The report dialog is open. Everything a developer needs is already attached; untick anything private.", "info"],
  invalid: ["Send was blocked: the reporter has to say what happened first.", "bad"],
  submitting: ["Sending the report…", "wait"],
  failed: ["The server refused the report. The text is kept, so Try again just resends it.", "bad"],
};

const btn =
  "rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] px-2.5 py-1 text-xs font-bold text-[var(--k-text,#E9EDE8)] transition-colors hover:border-[var(--k-acc-text,#C6FF3D)] aria-pressed:border-[var(--k-acc-text,#C6FF3D)] aria-pressed:text-[var(--k-acc-text,#C6FF3D)] focus-visible:outline-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)]";

/** Live preview: a staging checkout with a broken "Apply coupon" button and the report widget kept inside it. */
export default function BugReportWidgetDemo({ controls = {} }: { controls?: ControlValues }) {
  const look = controls as Pick<BugReportWidgetProps, "accent" | "size" | "dim" | "position">;
  const stage = useRef<HTMLDivElement>(null);
  const [failSend, setFailSend] = useState(false);
  const [run, setRun] = useState(0);
  const [markdown, setMarkdown] = useState("");
  const [coupon, setCoupon] = useState("SAVE10");

  // A pretend coupon API that always answers 500, installed before the widget wraps fetch so it sees the failure.
  useLayoutEffect(() => {
    const real = window.fetch;
    const fake: typeof fetch = (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (!url.includes("/api/coupons/")) return real.call(window, input, init);
      return new Promise((done) => window.setTimeout(() => done(new Response('{"error":"coupon service unavailable"}', { status: 500, statusText: "Internal Server Error" })), 250));
    };
    window.fetch = fake;
    return () => {
      window.fetch = real;
    };
  }, []);

  async function applyCoupon() {
    say(`Apply coupon pressed with "${coupon}". Nothing visible happens: that's the bug the client will report.`, "bad");
    try {
      const res = await fetch(`/api/coupons/apply?code=${encodeURIComponent(coupon)}`, { method: "POST" });
      const data = await res.json();
      // The bug: the code assumes success and reads a field that isn't there.
      return data.coupon.discount as number;
    } catch (err) {
      console.error("[checkout] applyCoupon failed:", err);
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div ref={stage} className="relative h-[480px] w-full max-w-lg overflow-hidden rounded-xl border border-[var(--k-line,#3A433F)] bg-[var(--k-bg,#0E1110)] p-5 text-sm text-[var(--k-text,#E9EDE8)]">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--k-mute,#8A938D)]">staging.shop.example · Checkout</p>
        <ul className="mt-3 space-y-2" aria-label="Basket">
          <li className="flex justify-between rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] px-3 py-2"><span>Linen shirt · M</span><b>$48.00</b></li>
          <li className="flex justify-between rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] px-3 py-2"><span>Canvas tote</span><b>$22.00</b></li>
        </ul>
        <div className="mt-4 flex gap-2">
          <label className="flex-1">
            <span className="sr-only">Coupon code</span>
            <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Coupon code" className="w-full rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] px-3 py-2 focus-visible:outline-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)]" />
          </label>
          <button type="button" data-testid="apply-coupon" onClick={applyCoupon} className="rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-panel-2,#181D1B)] px-3 py-2 font-bold hover:border-[var(--k-mute,#8A938D)] focus-visible:outline-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)]">
            Apply coupon
          </button>
        </div>
        <dl className="mt-4 space-y-1 border-t border-[var(--k-line,#3A433F)] pt-3">
          <div className="flex justify-between text-[var(--k-mute,#8A938D)]"><dt>Subtotal</dt><dd>$70.00</dd></div>
          <div className="flex justify-between font-bold"><dt>Total</dt><dd>$70.00</dd></div>
        </dl>
        <button type="button" className="mt-4 w-full rounded-lg bg-[var(--k-text,#E9EDE8)] py-2.5 font-bold text-[var(--k-bg,#0E1110)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)]" onClick={() => say("Pay pressed. (This one works; try the coupon button.)")}>
          Pay $70.00
        </button>

        <BugReportWidget
          key={run}
          {...look}
          contained={stage}
          collect={{ console: true, network: true, breadcrumbs: true }}
          onStateChange={(s) => {
            const note = NOTES[s];
            if (note) say(...note);
          }}
          onSubmit={async (report) => {
            await new Promise((r) => setTimeout(r, 900));
            if (failSend) throw new Error("503 from the tracker");
            setMarkdown(reportToMarkdown(report));
            const n = Object.keys(report.context).length;
            say(`Report ${report.id} received with ${n} context item${n === 1 ? "" : "s"}: ${report.context.console?.length ?? 0} console errors, ${report.context.network?.length ?? 0} failed requests. Markdown below.`, "good");
            return report.id;
          }}
        />
      </div>

      <div role="group" aria-label="Demo controls" className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" className={btn} aria-pressed={failSend} onClick={() => { setFailSend((f) => !f); say(failSend ? "Tracker is back up. Sends will work." : "Tracker is down. The next send will fail.", failSend ? "good" : "bad"); }}>
          {failSend ? "Tracker: down" : "Tracker: up"}
        </button>
        <button type="button" className={btn} onClick={() => { setRun((r) => r + 1); setMarkdown(""); say("Reset. The widget was remounted and its capture buffers are empty."); }}>
          Reset
        </button>
        <span className="text-xs text-[var(--k-mute,#8A938D)]">Shortcut: Alt+Shift+B</span>
      </div>

      {markdown && (
        <figure className="w-full max-w-lg">
          <figcaption className="mb-1 text-xs font-bold uppercase tracking-wider text-[var(--k-mute,#8A938D)]">The issue it made</figcaption>
          <pre tabIndex={0} className="max-h-64 overflow-auto rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] p-3 text-[11px] leading-relaxed whitespace-pre-wrap text-[var(--k-text,#E9EDE8)] focus-visible:outline-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)]">{markdown}</pre>
        </figure>
      )}
    </div>
  );
}
