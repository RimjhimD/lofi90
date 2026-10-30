"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ControlValues } from "@/site/Controls";
import { say } from "@/site/log";
import { ScanToSaveContactCard, type Contact, type ScanToSaveContactCardProps } from "./ScanToSaveContactCard";
import { encodeQr, qrPath } from "./qr";
import { buildVCard, fullName, initials } from "./vcard";

const TEAM: Contact[] = [
  {
    firstName: "Maya",
    lastName: "Ortiz",
    title: "Account Manager",
    org: "Brightline Studio",
    phones: [{ number: "+1 415 555 0142", type: "cell" }],
    emails: [{ address: "maya@brightline.example", type: "work" }],
    website: "https://brightline.example",
    address: { city: "San Francisco", region: "CA", country: "USA" },
  },
  {
    firstName: "Jonah",
    lastName: "Pratt",
    title: "Design Lead",
    org: "Brightline Studio",
    phones: [{ number: "+1 415 555 0178", type: "work" }],
    emails: [{ address: "jonah@brightline.example", type: "work" }],
    website: "https://brightline.example",
  },
  {
    firstName: "Priya",
    lastName: "Nair",
    title: "Developer",
    org: "Brightline Studio",
    phones: [{ number: "+44 20 7946 0321", type: "cell" }],
    emails: [{ address: "priya@brightline.example", type: "work" }],
    note: "Ask me about the client portal.",
  },
];

type Phase = "idle" | "aim" | "banner" | "form" | "saved";
const STEPS: [Phase, number][] = [["aim", 500], ["banner", 1900], ["form", 3100], ["saved", 4700]];

/** Live preview: a team card with a real QR code, and a phone that scans it once on load. */
export default function ScanToSaveContactCardDemo({ controls = {} }: { controls?: ControlValues }) {
  const look = controls as Pick<ScanToSaveContactCardProps, "accent" | "size" | "layout" | "qrSize" | "ecLevel">;
  const [who, setWho] = useState(0);
  const [phone, setPhone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<number[]>([]);
  const person = TEAM[who];
  const name = fullName(person);

  const mini = useMemo(() => {
    const code = encodeQr(buildVCard(person, { includePhoto: false }), { ecc: look.ecLevel ?? "M" });
    return { path: qrPath(code), box: code.size + 8 };
  }, [person, look.ecLevel]);

  function play(c: Contact) {
    timers.current.forEach(clearTimeout);
    const n = fullName(c);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lines: Record<Phase, [string, "info" | "good" | "wait"]> = {
      idle: ["", "info"],
      aim: [`A phone camera points at ${n}'s card. The QR code holds a vCard with name, title, phone and email.`, "wait"],
      banner: ["The camera reads the code and offers \"Add to Contacts\". No app needed.", "info"],
      form: ["Tapped: the phone's own New Contact screen opens, already filled in.", "info"],
      saved: [`${n} is saved in the phone's contacts.`, "good"],
    };
    const steps: [Phase, number][] = reduce ? [["saved", 0]] : STEPS;
    timers.current = steps.map(([ph, ms]) =>
      window.setTimeout(() => {
        setPhase(ph);
        say(...lines[ph]);
      }, ms),
    );
  }

  useEffect(() => {
    const first = window.setTimeout(() => play(TEAM[0]), 400);
    return () => {
      clearTimeout(first);
      timers.current.forEach(clearTimeout);
    };
  }, []);

  const chip =
    "rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] px-3 py-1.5 text-xs font-semibold text-[var(--k-text,#E9EDE8)] transition-colors hover:border-[var(--k-acc-text,#C6FF3D)] aria-pressed:border-[var(--k-acc-text,#C6FF3D)] aria-pressed:text-[var(--k-acc-text,#C6FF3D)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)]";

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div role="group" aria-label="Team member" className="flex flex-wrap justify-center gap-1.5">
        {TEAM.map((c, i) => (
          <button
            key={c.firstName}
            type="button"
            aria-pressed={who === i}
            className={chip}
            onClick={() => {
              setWho(i);
              setPhase("idle");
              timers.current.forEach(clearTimeout);
              say(`Showing ${fullName(c)}. The QR code was re-encoded from the new details.`);
            }}
          >
            {c.firstName}
          </button>
        ))}
      </div>

      <div className="flex w-full flex-wrap items-center justify-center gap-6">
        <ScanToSaveContactCard
          key={who}
          contact={person}
          {...look}
          device={phone ? "mobile" : "desktop"}
          loading={loading}
          onSave={(vcard) => say(`Downloaded a real .vcf for ${name} (${vcard.split("\r\n").length - 1} lines). On a phone it opens the add-contact screen.`, "good")}
          onCopy={(kind, value) => say(`Copied ${kind === "email" ? "the email" : "the phone number"}: ${value}`, "info")}
          onZoom={(open) => say(open ? "QR code enlarged for easier scanning. Esc or Close shrinks it back." : "Large QR view closed.")}
        />

        {!phone && (
          <div
            aria-hidden="true"
            className="relative flex h-[280px] w-[150px] shrink-0 flex-col overflow-hidden rounded-[26px] border-2 border-[var(--k-line,#3A433F)] bg-[#0B0D0C] text-[#E9EDE8] shadow-[0_14px_40px_-18px_var(--k-shadow,rgba(0,0,0,.9))]"
          >
            <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-[#2A322E]" />
            {(phase === "idle" || phase === "aim" || phase === "banner") && (
              <div className="relative m-3 flex flex-1 items-center justify-center rounded-xl bg-[#151917]">
                <span className="absolute left-2 top-2 text-[9px] font-semibold uppercase tracking-wider text-[#8A938D]">Camera</span>
                <div className={`relative transition-transform duration-500 ${phase === "idle" ? "scale-75 opacity-40" : "scale-100"}`}>
                  <svg viewBox={`0 0 ${mini.box} ${mini.box}`} className="size-[86px] rounded" shapeRendering="crispEdges">
                    <rect width={mini.box} height={mini.box} fill="#fff" />
                    <path d={mini.path} fill="#0B0D0C" />
                  </svg>
                  {phase !== "idle" && (
                    <>
                      {["left-[-6px] top-[-6px] border-l-2 border-t-2", "right-[-6px] top-[-6px] border-r-2 border-t-2", "left-[-6px] bottom-[-6px] border-l-2 border-b-2", "right-[-6px] bottom-[-6px] border-r-2 border-b-2"].map((c) => (
                        <span key={c} className={`absolute size-4 rounded-sm border-[#FFD60A] ${c}`} />
                      ))}
                    </>
                  )}
                </div>
                {phase === "banner" && (
                  <div className="absolute inset-x-2 top-2 rounded-xl bg-[#2A322E] px-2 py-1.5 text-[9px] shadow-lg motion-safe:animate-[pulse_1.2s_ease-in-out_1]">
                    <p className="font-bold">Contacts</p>
                    <p>Add {name} to contacts</p>
                  </div>
                )}
              </div>
            )}
            {(phase === "form" || phase === "saved") && (
              <div className="flex flex-1 flex-col gap-1.5 px-3 pb-3 pt-2 text-[10px]">
                <div className="flex justify-between text-[9px]">
                  <span className="text-[#8A938D]">Cancel</span>
                  <span className="font-bold">New contact</span>
                  <span className={phase === "saved" ? "text-[#8A938D]" : "font-bold text-[#C6FF3D]"}>Add</span>
                </div>
                <div className="mx-auto mt-1 grid size-9 place-items-center rounded-full bg-[#2A322E] text-[11px] font-extrabold">{initials(person)}</div>
                <p className="text-center text-[11px] font-bold">{name}</p>
                <p className="text-center text-[9px] text-[#8A938D]">{[person.title, person.org].filter(Boolean).join(" · ")}</p>
                <div className="mt-1 space-y-1 rounded-lg bg-[#151917] p-1.5 text-[9px]">
                  <p className="truncate"><span className="text-[#8A938D]">{person.phones?.[0]?.type === "work" ? "work" : "mobile"}</span> {person.phones?.[0]?.number}</p>
                  <p className="truncate"><span className="text-[#8A938D]">work</span> {person.emails?.[0]?.address}</p>
                </div>
                {phase === "saved" && <p className="mt-auto rounded-lg bg-[#1F2A12] py-1.5 text-center font-bold text-[#C6FF3D]">Saved ✓</p>}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {!phone && (
          <button type="button" className={chip} onClick={() => { setPhase("idle"); play(person); }}>
            Replay scan
          </button>
        )}
        <button
          type="button"
          aria-pressed={phone}
          className={chip}
          onClick={() => {
            setPhone((v) => !v);
            say(phone ? "Back to a desktop screen: the QR code is shown for phones to scan." : "Viewed on a phone: the QR code is hidden (you can't scan your own screen). Save contact opens the add-contact screen in one tap.");
          }}
        >
          Phone view
        </button>
        <button
          type="button"
          aria-pressed={loading}
          className={chip}
          onClick={() => {
            setLoading((v) => !v);
            say(loading ? "Contact loaded." : "Contact still loading: the card shows a skeleton and the button waits.", loading ? "info" : "wait");
          }}
        >
          Loading
        </button>
      </div>
    </div>
  );
}
