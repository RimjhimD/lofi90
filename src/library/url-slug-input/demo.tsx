"use client";

import { useEffect, useRef, useState } from "react";
import type { ControlValues } from "@/site/Controls";
import { say } from "@/site/log";
import { UrlSlugInput, type SlugDraft, type SlugStatus, type SlugValue, type UrlSlugInputProps } from "./UrlSlugInput";

const TITLE = "Café & Crème: 10 Best Recipes!";
const PREFIX = "mysite.com/blog/";
/** Addresses the pretend blog already uses. */
const TAKEN = new Set(["cafe-and-creme-10-best-recipes", "cafe-creme-10-best-recipes", "about", "contact", "recipes"]);
const EMPTY: SlugDraft = { title: "", slug: "", locked: true, redirect: true };

/** A pretend server: answers after a short, uneven delay and stops when the check is aborted. */
function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const t = window.setTimeout(resolve, ms);
    signal.addEventListener("abort", () => (clearTimeout(t), reject(new DOMException("Aborted", "AbortError"))), { once: true });
  });
}

/** Live preview: a blog post editor. It types a title once on its own, then it's yours. */
export default function UrlSlugInputDemo({ controls = {} }: { controls?: ControlValues }) {
  const look: Partial<UrlSlugInputProps> = {
    accent: (controls.accent as string) ?? "#C6FF3D",
    size: (controls.size as UrlSlugInputProps["size"]) ?? "md",
    maxLength: (controls.maxLength as number) ?? 60,
    removeStopWords: controls.removeStopWords === "on",
  };
  const [v, setV] = useState<SlugDraft>(EMPTY);
  const [published, setPublished] = useState(false);
  const [original, setOriginal] = useState("");
  const [allTaken, setAllTaken] = useState(false);
  const [run, setRun] = useState(0);
  const allTakenRef = useRef(false);
  const lastSlug = useRef("");
  const picked = useRef(false);
  const auto = useRef<number[]>([]);
  const box = useRef<HTMLDivElement>(null);

  const stopAuto = () => {
    auto.current.forEach(clearTimeout);
    auto.current = [];
  };

  // Play the story once: type the title, see it taken, pick a free suggestion. Any touch hands control to the visitor.
  useEffect(() => {
    const step = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 65;
    const at = (ms: number, fn: () => void) => auto.current.push(window.setTimeout(fn, ms));
    at(500, () => say("Typing a page title. Watch the web address build itself underneath.", "info"));
    for (let k = 1; k <= TITLE.length; k++) at(600 + k * step, () => setV((x) => ({ ...x, title: TITLE.slice(0, k) })));
    at(600 + TITLE.length * step + 2800, () => box.current?.querySelector<HTMLElement>("[data-suggestion]")?.click());
    at(600 + TITLE.length * step + 3000, () => say("Your turn. Type your own title, or press the lock to edit the address by hand.", "info"));
    return stopAuto;
  }, [run]);

  const check = async (slug: string, signal: AbortSignal) => {
    await wait(300 + Math.random() * 400, signal);
    return !allTakenRef.current && !TAKEN.has(slug);
  };

  const onStatus = (status: SlugStatus, slug: string) => {
    lastSlug.current = slug;
    if (status === "available") say(`“${PREFIX}${slug}” is free.`, "good");
    if (status === "taken") say(`“${slug}” is already taken. Checking a few free versions to suggest…`, "bad");
    if (status === "error") say("The check failed. Press Retry.", "bad");
  };

  const onChange = (next: SlugValue) => {
    if (v.locked !== next.locked && !picked.current)
      say(next.locked ? "Re-synced. The address follows the title again." : "Unlocked. The address is yours now; changing the title won't overwrite it.", "info");
    if ((v.redirect ?? true) !== (next.redirect ?? true)) say(next.redirect ? "Redirect on: old links will land on the new address." : "Redirect off: old links will break.", next.redirect ? "good" : "wait");
    picked.current = false;
    setV(next);
  };

  function togglePublished() {
    stopAuto();
    if (published) {
      setPublished(false);
      say("Back to a draft. Change the address freely.");
      return;
    }
    const live = lastSlug.current || "cafe-creme-recipes";
    setPublished(true);
    setOriginal(live);
    setV((x) => ({ ...x, slug: live, locked: false, redirect: true }));
    say(`Published at ${PREFIX}${live}. The address now stays put when the title changes. Edit it to see the warning.`, "wait");
  }

  function toggleAllTaken() {
    stopAuto();
    allTakenRef.current = !allTaken;
    setAllTaken(!allTaken);
    say(!allTaken ? "Every address is taken now. Checking again…" : "Back to normal: only a few addresses are taken.", "wait");
  }

  function reset() {
    stopAuto();
    setV(EMPTY);
    setPublished(false);
    setOriginal("");
    allTakenRef.current = false;
    setAllTaken(false);
    setRun((r) => r + 1);
    say("Reset. Playing it again.");
  }

  const pill =
    "rounded-full border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] px-3 py-1 text-xs font-semibold text-[var(--k-text,#E9EDE8)] transition-colors hover:border-[var(--k-acc-text,#C6FF3D)] aria-pressed:border-[var(--k-acc-text,#C6FF3D)] aria-pressed:text-[var(--k-acc-text,#C6FF3D)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)]";

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div
        ref={box}
        onPointerDownCapture={stopAuto}
        onKeyDownCapture={stopAuto}
        className="w-full max-w-md rounded-xl border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] p-4 shadow-[0_10px_30px_-14px_var(--k-shadow,rgba(0,0,0,.9))] sm:p-5"
      >
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--k-mute,#8A938D)]">New post{published ? " · published" : " · draft"}</p>
        <UrlSlugInput
          key={`${run}-${allTaken}`}
          {...look}
          prefix={PREFIX}
          value={v}
          onChange={onChange}
          checkAvailability={check}
          published={published}
          originalSlug={original}
          onStatusChange={onStatus}
          onPick={(s) => {
            picked.current = true;
            say(`Picked “${s}”. The address no longer follows the title; “Re-sync with title” brings it back.`, "good");
          }}
        />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" aria-pressed={published} onClick={togglePublished} className={pill}>
          Published page
        </button>
        <button type="button" aria-pressed={allTaken} onClick={toggleAllTaken} className={pill}>
          Make every slug taken
        </button>
        <button type="button" onClick={reset} className={pill}>
          Reset
        </button>
      </div>
    </div>
  );
}
