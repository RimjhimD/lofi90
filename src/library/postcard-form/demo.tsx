"use client";

import { useRef, useState } from "react";
import type { ControlValues } from "@/site/Controls";
import { say } from "@/site/log";
import { PostcardForm, type PostcardFormProps } from "./PostcardForm";

const KEY = "lofi90-studio-postcard";
const TOPICS = ["Weekend classes", "Commissions", "Press", "Something else"];

/** Live preview: a "Write to the studio" postcard. Flip the network off, make the server fail, or refresh to see the draft come back. */
export default function PostcardFormDemo({ controls = {} }: { controls?: ControlValues }) {
  const look = controls as Pick<PostcardFormProps, "accent" | "size" | "minMessageLength" | "maxLength">;
  const [run, setRun] = useState(0);
  const [online, setOnline] = useState(true);
  const [fails, setFails] = useState(false);
  const failsRef = useRef(false);

  const toggle = "rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] px-2.5 py-1 text-xs font-semibold text-[var(--k-text,#E9EDE8)] transition-colors hover:border-[var(--k-acc-text,#C6FF3D)] aria-pressed:border-[var(--k-acc-text,#C6FF3D)] aria-pressed:text-[var(--k-acc-text,#C6FF3D)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)]";

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <PostcardForm
        key={run}
        {...look}
        draftKey={KEY}
        topics={TOPICS}
        online={online}
        labels={{ title: "Write to the studio", to: "To: Fern & Kiln Studio", messagePlaceholder: "Dear studio,", sentNote: "It's on its way. Fern replies within two days." }}
        onDraftSave={() => say("Draft saved on this device. Refresh or close the tab and it comes back.")}
        onDraftRestore={(v, at) => say(`Draft restored from ${Math.max(0, Math.round((Date.now() - at) / 1000))}s ago: ${v.message.length} characters back where you left them.`, "good")}
        onInvalid={(fields) => say(`Not sent. ${fields.length} field${fields.length > 1 ? "s need" : " needs"} a fix: ${fields.join(", ")}. Focus jumped to the first one.`, "bad")}
        onQueue={() => say("You're offline, so the card waits in the mailbox. Turn the network back on and it sends by itself.", "wait")}
        onError={() => say("The server said no. The card bounced back with every word kept. Press Try again.", "bad")}
        onSend={(v) => {
          say(`Posting to the studio${v.topic ? ` about “${v.topic}”` : ""}…`, "wait");
          return new Promise((resolve, reject) =>
            window.setTimeout(() => {
              if (failsRef.current) return reject(new Error("500"));
              say(`Delivered. Draft cleared. ${v.name} gets a reply at ${v.email}.`, "good");
              resolve();
            }, 1400),
          );
        }}
      />
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          aria-pressed={!online}
          onClick={() => {
            setOnline(!online);
            say(online ? "Network off. Sending now puts the card in the mailbox." : "Network back on. Anything in the mailbox goes now.", online ? "wait" : "info");
          }}
          className={toggle}
        >
          Network: {online ? "online" : "offline"}
        </button>
        <button
          type="button"
          aria-pressed={fails}
          onClick={() => {
            failsRef.current = !fails;
            setFails(!fails);
            say(fails ? "Server fixed. Sends will go through." : "Server will fail the next send.", fails ? "info" : "bad");
          }}
          className={toggle}
        >
          Server: {fails ? "fails" : "ok"}
        </button>
        <button
          type="button"
          onClick={() => {
            setRun((r) => r + 1);
            say("Simulated a refresh: the form starts fresh and reads the saved draft.", "info");
          }}
          className={toggle}
        >
          Refresh the page
        </button>
        <button
          type="button"
          onClick={() => {
            window.localStorage.removeItem(KEY);
            setOnline(true);
            setFails(false);
            failsRef.current = false;
            setRun((r) => r + 1);
            say("Reset: draft deleted, network and server back to normal.");
          }}
          className={toggle}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
