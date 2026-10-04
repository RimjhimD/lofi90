"use client";

import { useEffect, useRef, useState } from "react";
import type { ControlValues } from "@/site/Controls";
import { say } from "@/site/log";
import { IslandNotification, type IslandItem } from "./IslandNotification";

let n = 0;
const make = (item: Omit<IslandItem, "id">): IslandItem => ({ id: `n${++n}`, ...item });

/** Live preview: a little app with the island at the top. Fire notifications, start an upload, or type to see them wait. */
export default function IslandNotificationDemo({ controls = {} }: { controls?: ControlValues }) {
  const [items, setItems] = useState<IslandItem[]>([]);
  const [log, setLog] = useState("");
  const upload = useRef(0);

  const push = (...more: Omit<IslandItem, "id">[]) => {
    setItems((xs) => [...xs, ...more.map(make)]);
    say(
      more.length > 1
        ? `${more.length} notifications at once. The island shows one and counts the rest (+${more.length - 1}) instead of stacking them.`
        : `“${more[0].title}” sent. The pill grows into a card at the top.`,
      more[0].tone === "error" ? "bad" : "info",
    );
  };
  const dismiss = (id: string) => {
    setItems((xs) => xs.filter((x) => x.id !== id));
    say("Notification closed. The card shrinks back into the pill.");
  };

  function startUpload() {
    const id = `up${Date.now()}`;
    setItems((xs) => [...xs, { id, title: "Uploading photos", progress: 0 }]);
    say("Upload started. The island becomes a live progress bar.", "wait");
    clearInterval(upload.current);
    upload.current = window.setInterval(() => {
      setItems((xs) =>
        xs.map((x) => {
          if (x.id !== id) return x;
          const p = Math.min(1, (x.progress ?? 0) + 0.12);
          return p >= 1 ? { ...x, progress: 1, title: "Upload finished", body: "12 photos are in the album.", tone: "success", icon: "✓" } : { ...x, progress: p };
        }),
      );
    }, 450);
  }
  useEffect(() => () => clearInterval(upload.current), []);

  const fire = "rounded-lg border border-[#3A433F] bg-[#121614] px-3 py-1.5 text-xs font-semibold text-[#E9EDE8] transition-colors hover:border-[#C6FF3D] focus-visible:outline-2 focus-visible:outline-[#C6FF3D]";

  return (
    <div className="w-full max-w-md">
      <div className="relative h-[360px] overflow-hidden rounded-[28px] border border-[#3A433F] bg-[#0E1110] px-5 pb-5 pt-16">
        <IslandNotification
          position="absolute"
          items={items}
          onDismiss={dismiss}
          accent={(controls.accent as string) ?? "#3DD9FF"}
          morphMs={(controls.morphMs as number) ?? 520}
          duration={(controls.duration as number) ?? 4000}
          holdWhileTyping={(controls.hold ?? "on") === "on"}
        />
        <p className="text-xs font-semibold uppercase tracking-wider text-[#8A938D]">Messages · Maya</p>
        <div className="mt-3 space-y-2 text-sm">
          <p className="w-fit rounded-2xl rounded-bl-sm bg-[#181D1B] px-3 py-2 text-[#E9EDE8]">Are we still on for Friday?</p>
          <p className="ml-auto w-fit rounded-2xl rounded-br-sm bg-[#C6FF3D] px-3 py-2 text-[#0B0D0C]">Yes! 7pm 🙌</p>
        </div>
        <label className="absolute inset-x-5 bottom-5 block">
          <span className="sr-only">Type a message</span>
          <input
            onFocus={() => say("You're typing. New notifications wait so they never cover what you're writing.", "wait")}
            onBlur={() => say("Stopped typing. Anything waiting can show now.")}
            placeholder="Type here — notifications wait until you pause" className="w-full rounded-full border border-[#3A433F] bg-[#121614] px-4 py-2.5 text-sm text-[#E9EDE8] placeholder:text-[#8A938D] focus:border-[#C6FF3D] focus:outline-none" />
        </label>
      </div>
      <div role="group" aria-label="Send a notification" className="mt-4 flex flex-wrap justify-center gap-2">
        <button type="button" className={fire} onClick={() => push({ title: "New message from Sam", body: "Running 10 minutes late, sorry!", icon: "💬", action: { label: "Reply", onClick: () => setLog("Opened the reply box.") } })}>
          New message
        </button>
        <button type="button" className={fire} onClick={() => push({ title: "Payment failed", body: "Your card was declined. Update it to keep your plan.", icon: "!", tone: "error", action: { label: "Update card", onClick: () => setLog("Went to billing.") } })}>
          Payment failed
        </button>
        <button type="button" className={fire} onClick={startUpload}>
          Start upload
        </button>
        <button
          type="button"
          className={fire}
          onClick={() =>
            push(
              { title: "Booking confirmed", body: "Friday 7:00 pm · table for 2", icon: "✓", tone: "success" },
              { title: "Storage almost full", body: "92% used", icon: "!", tone: "warning" },
              { title: "Maya liked your photo", icon: "♥" },
            )
          }
        >
          Burst of 3
        </button>
      </div>
      <p className="mt-2 min-h-4 text-center text-xs text-[#8A938D]" aria-live="polite">{log}</p>
    </div>
  );
}
