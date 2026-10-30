"use client";

import { useEffect, useRef, useState } from "react";
import type { ControlValues } from "@/site/Controls";
import { say } from "@/site/log";
import { TextUsWidget, type TextUsState, type TextUsWidgetProps } from "./TextUsWidget";

const BUSINESS = "Bella Salon";
const FROM = "(415) 555-0199";
const DRAFT = "lofi90-text-us-demo";

const NOTES: Partial<Record<TextUsState, [string, "info" | "good" | "bad" | "wait"]>> = {
  open: ["The panel opened from the corner. Name, mobile number and message, nothing else.", "info"],
  offline: ["Opened out of hours: the header says when the salon will text back. Sending still works.", "info"],
  invalid: ["Send was blocked. The field that needs fixing says why, and it has focus.", "bad"],
  sending: ["onSend is posting the message to the salon's webhook…", "wait"],
  error: ["The webhook failed. Everything typed is still there and the button now says Try again.", "bad"],
  closed: ["Closed. The draft is kept for this tab, so reopening brings it back.", "info"],
};

type Bubble = { id: number; me: boolean; text: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Type into a real React input the way a person would, one character at a time. */
async function typeInto(el: HTMLInputElement | HTMLTextAreaElement, text: string, alive: () => boolean) {
  const set = Object.getOwnPropertyDescriptor(el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, "value")?.set;
  for (const ch of text) {
    if (!alive()) return;
    set?.call(el, el.value + ch);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep(55);
  }
}

const btn =
  "rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] px-2.5 py-1 text-xs font-bold text-[var(--k-text,#E9EDE8)] transition-colors hover:border-[var(--k-acc-text,#C6FF3D)] aria-pressed:border-[var(--k-acc-text,#C6FF3D)] aria-pressed:text-[var(--k-acc-text,#C6FF3D)] focus-visible:outline-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)]";

/** Live preview: a salon website with the Text-us bubble, next to the visitor's phone where the reply lands. */
export default function TextUsWidgetDemo({ controls = {} }: { controls?: ControlValues }) {
  const look = controls as Pick<TextUsWidgetProps, "accent" | "size" | "consentMode" | "position">;
  const site = useRef<HTMLDivElement>(null);
  const failRef = useRef(false);
  const [fail, setFail] = useState(false);
  const [closed, setClosed] = useState(false);
  const [run, setRun] = useState(0);
  const [thread, setThread] = useState<Bubble[]>([]);
  const [typing, setTyping] = useState(false);
  const timers = useRef<number[]>([]);
  const opened = useRef(false);

  useEffect(() => {
    failRef.current = fail;
  }, [fail]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Plays the whole thing once on load (and after Reset). Any real click or key press hands control to the visitor.
  useEffect(() => {
    const root = site.current;
    if (!root) return;
    let alive = true;
    const stop = (e: Event) => e.isTrusted && (alive = false);
    root.addEventListener("pointerdown", stop, true);
    root.addEventListener("keydown", stop, true);
    const q = <T extends Element>(s: string) => root.querySelector<T>(s);
    (async () => {
      try {
        sessionStorage.removeItem(DRAFT);
      } catch {}
      await sleep(900);
      if (!alive) return;
      q<HTMLButtonElement>("button[aria-expanded]")?.click();
      await sleep(600);
      const [name, phone, msg] = [q<HTMLInputElement>("input[autocomplete=name]"), q<HTMLInputElement>("input[type=tel]"), q<HTMLTextAreaElement>("textarea")];
      if (!name || !phone || !msg) return;
      await typeInto(name, "Mia", () => alive);
      await typeInto(phone, "4155550134", () => alive);
      await typeInto(msg, "Hi! Can I book a cut this Saturday?", () => alive);
      if (!alive) return;
      const box = q<HTMLInputElement>("input[type=checkbox]");
      if (box && !box.checked) box.click();
      await sleep(500);
      if (alive) q<HTMLButtonElement>("button[type=submit]")?.click();
    })();
    return () => {
      alive = false;
      root.removeEventListener("pointerdown", stop, true);
      root.removeEventListener("keydown", stop, true);
    };
  }, [run]);

  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  function reset() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setThread([]);
    setTyping(false);
    opened.current = false;
    setRun((r) => r + 1);
    say("Reset. The demo plays once more, then it's yours.");
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="flex w-full flex-col items-center justify-center gap-5 md:flex-row md:items-start">
        <div ref={site} className="relative h-[600px] w-full max-w-md overflow-hidden rounded-xl border border-[var(--k-line,#3A433F)] bg-[var(--k-bg,#0E1110)] text-[var(--k-text,#E9EDE8)]">
          <div className="flex items-center justify-between border-b border-[var(--k-line,#3A433F)] px-4 py-3 text-xs">
            <b className="text-sm tracking-tight">Bella Salon</b>
            <span className="text-[var(--k-mute,#8A938D)]">Services · Prices · Visit</span>
          </div>
          <div className="space-y-3 px-5 py-6">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--k-mute,#8A938D)]">bellasalon.example</p>
            <h3 className="text-2xl font-bold leading-tight">Cuts, colour and care on Valencia Street.</h3>
            <p className="text-sm text-[var(--k-mute,#8A938D)]">Walk-ins welcome Tuesday to Sunday. Questions? Text us, we answer from the chair.</p>
            <ul className="space-y-2 pt-2 text-sm">
              {[["Cut & finish", "$65"], ["Full colour", "$140"], ["Blow-dry", "$45"]].map(([s, p]) => (
                <li key={s} className="flex justify-between rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] px-3 py-2"><span>{s}</span><b>{p}</b></li>
              ))}
            </ul>
          </div>
          <TextUsWidget
            key={run}
            {...look}
            container="parent"
            draftKey={DRAFT}
            businessName={BUSINESS}
            businessNumber={FROM}
            replyTime="We usually reply in 5 minutes"
            closedHint={closed ? "We're closed now. We'll text you at 9 AM." : undefined}
            team={[{ name: "Bella" }, { name: "Rosa" }, { name: "Jo" }]}
            onStateChange={(s) => {
                if (s === "closed" && !opened.current) return;
                opened.current = true;
              const note = NOTES[s];
              if (note) say(...note);
            }}
            onSend={async (p) => {
              await sleep(1100);
              if (failRef.current) throw new Error("Webhook answered 502");
              say(`Webhook received: ${p.name}, ${p.phone} (E.164), consent ${p.consent}, from ${new URL(p.page).pathname}.`, "good");
            }}
            onSent={(p) => {
              say(`Sent. The visitor sees "we'll text you at" their number. Now watch the phone.`, "good");
              later(700, () => setThread((t) => [...t, { id: Date.now(), me: true, text: p.message }]));
              later(1600, () => setTyping(true));
              later(closed ? 3200 : 3600, () => {
                setTyping(false);
                const first = p.name.split(" ")[0];
                const reply = closed
                  ? `Hi ${first}, thanks for your text! We're closed right now. We'll reply first thing at 9 AM. – Bella Salon`
                  : `Hi ${first}! Yes, we have 11 AM or 2:30 PM free on Saturday. Which works for you? – Bella Salon`;
                setThread((t) => [...t, { id: Date.now() + 1, me: false, text: reply }]);
                say("The salon replied by text. The visitor already closed the tab, and the lead still isn't lost.", "good");
              });
            }}
            onError={(e) => say(`onError: ${(e as Error).message}.`, "bad")}
          />
        </div>

        <figure className="flex flex-col items-center gap-2">
          <div className="flex h-[440px] w-[230px] flex-col overflow-hidden rounded-[30px] border-2 border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] shadow-[0_20px_50px_-24px_var(--k-shadow,rgba(0,0,0,.9))]">
            <div className="mx-auto mt-2 h-4 w-20 rounded-full bg-[var(--k-bg,#0E1110)]" />
            <div className="border-b border-[var(--k-line,#3A433F)] px-3 pb-2 pt-2 text-center">
              <p className="text-xs font-bold">{BUSINESS}</p>
              <p className="text-[10px] text-[var(--k-mute,#8A938D)]">{FROM}</p>
            </div>
            <ol aria-label="Text messages on the visitor's phone" aria-live="polite" className="flex flex-1 flex-col gap-2 overflow-y-auto px-2.5 py-3 text-[12px] leading-snug">
              {thread.length === 0 && <li className="m-auto text-center text-[11px] text-[var(--k-mute,#8A938D)]">No texts yet</li>}
              {thread.map((b) => (
                <li
                  key={b.id}
                  ref={(el) => {
                    if (el && !el.dataset.in && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) el.animate([{ opacity: 0, transform: "translateY(10px) scale(.96)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: "ease-out" });
                    if (el) el.dataset.in = "1";
                  }}
                  className={`max-w-[85%] rounded-2xl px-3 py-1.5 ${b.me ? "self-end rounded-br-md bg-[#2563EB] text-white" : "self-start rounded-bl-md bg-[var(--k-panel-2,#181D1B)] text-[var(--k-text,#E9EDE8)]"}`}
                >
                  <span className="sr-only">{b.me ? "You: " : `${BUSINESS}: `}</span>
                  {b.text}
                </li>
              ))}
              {typing && (
                <li aria-label={`${BUSINESS} is typing`} className="flex gap-1 self-start rounded-2xl rounded-bl-md bg-[var(--k-panel-2,#181D1B)] px-3 py-2.5">
                  {[0, 150, 300].map((d) => <span key={d} className="size-1.5 rounded-full bg-[var(--k-mute,#8A938D)] motion-safe:animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                </li>
              )}
            </ol>
            <div className="m-2 rounded-full border border-[var(--k-line,#3A433F)] px-3 py-1.5 text-[11px] text-[var(--k-mute,#8A938D)]">Text Message</div>
          </div>
          <figcaption className="text-xs text-[var(--k-mute,#8A938D)]">The visitor&apos;s phone</figcaption>
        </figure>
      </div>

      <div role="group" aria-label="Demo controls" className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" className={btn} aria-pressed={fail} onClick={() => { setFail(!fail); say(fail ? "Webhook is back up. Sends will work." : "Make sending fail is on. The next send will fail.", fail ? "good" : "bad"); }}>
          Make sending fail
        </button>
        <button type="button" className={btn} aria-pressed={closed} onClick={() => { setClosed(!closed); say(closed ? "Open hours again." : "Out of hours: the panel now says when the salon will text back.", "info"); }}>
          Out of hours
        </button>
        <button type="button" className={btn} onClick={reset}>Reset</button>
      </div>
    </div>
  );
}
