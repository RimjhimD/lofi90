"use client";

import { useState } from "react";
import type { ControlValues } from "@/site/Controls";
import { say } from "@/site/log";
import { PolaroidCard, type PolaroidCardProps } from "./PolaroidCard";

const PHOTOS = [
  { id: "beach", src: "https://picsum.photos/id/1011/600/450", alt: "A woman in a red kayak on a calm green lake", caption: "Lake day, finally", date: "Aug 2026" },
  { id: "camp", src: "https://picsum.photos/id/1036/600/450", alt: "Yellow tents pitched in the snow below mountain peaks", caption: "The campsite", date: "Aug 2026" },
  // No alt on purpose, so the missing-alt sticky note shows.
  { id: "noalt", src: "https://picsum.photos/id/1025/600/450", alt: undefined, caption: "Pug in a blanket", date: "Sep 2026" },
] as const;

/** Throttle: the same photo at 5000×3750 (several MB), stamped so the browser can't serve it from cache. */
const heavy = (src: string, stamp: number) => `${src.replace("/600/450", "/5000/3750")}?t=${stamp}`;

/** Live preview: an album page with three prints. Slow the network, reload, pick favourites. */
export default function PolaroidCardDemo({ controls = {} }: { controls?: ControlValues }) {
  const look = controls as Pick<PolaroidCardProps, "accent" | "size" | "tilt" | "slowAfterMs">;
  const [throttle, setThrottle] = useState(false);
  const [round, setRound] = useState(0);
  // When set, the cards load the heavy, uncached version of each photo.
  const [stamp, setStamp] = useState<number | null>(null);
  const [picked, setPicked] = useState<string[]>([]);

  function reload(slow = throttle) {
    setRound((r) => r + 1);
    if (slow) {
      setStamp(Date.now());
      say("Reloading with heavy 5000×3750 photos and no cache. Space is already reserved, so nothing jumps; after 0.8s the caption admits it's slow.", "wait");
    } else {
      setStamp(null);
      say("Reloading the photos. Each print develops as it arrives.", "info");
    }
  }

  const btn =
    "rounded-lg border border-[var(--k-line,#3A433F)] bg-[var(--k-panel,#121614)] px-3 py-1.5 text-xs font-semibold text-[var(--k-text,#E9EDE8)] transition-colors hover:border-[var(--k-acc-text,#C6FF3D)] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-acc-text,#C6FF3D)] aria-pressed:border-[var(--k-acc-text,#C6FF3D)] aria-pressed:text-[var(--k-acc-text,#C6FF3D)]";

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="flex flex-wrap items-start justify-center gap-6 pt-3">
        {PHOTOS.map((p) => (
          <PolaroidCard
            key={`${p.id}-${round}`}
            {...look}
            size={look.size ?? "sm"}
            src={stamp ? heavy(p.src, stamp) : p.src}
            loading={stamp ? "eager" : "lazy"}
            slowAfterMs={stamp ? 800 : look.slowAfterMs}
            alt={p.alt}
            width={600}
            height={450}
            caption={p.caption}
            date={p.date}
            altGuard="always"
            selected={picked.includes(p.id)}
            onSelect={(on) => {
              setPicked((xs) => (on ? [...xs, p.id] : xs.filter((x) => x !== p.id)));
              say(on ? `“${p.caption}” pinned to favourites.` : `“${p.caption}” unpinned.`, on ? "good" : "info");
            }}
            onLoad={(img) => say(`“${p.caption}” developed: ${img.naturalWidth}×${img.naturalHeight}, loaded and decoded. No layout shift.`, "good")}
            onError={({ attempt }) =>
              say(attempt === 0 ? `“${p.caption}” failed to load. The print is overexposed and offers Retry.` : `Retry ${attempt} for “${p.caption}” failed too.`, "bad")
            }
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          aria-pressed={throttle}
          className={btn}
          onClick={() => {
            const next = !throttle;
            setThrottle(next);
            say(next ? "Throttle on. Press Reload photos to see a slow load." : "Throttle off. Photos load at normal speed.", "info");
          }}
        >
          🐢 Throttle (fake slow load)
        </button>
        <button type="button" className={btn} onClick={() => reload()}>
          ↻ Reload photos
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => {
            setThrottle(false);
            setPicked([]);
            reload(false);
          }}
        >
          Reset
        </button>
      </div>
      <p className="max-w-md text-center text-xs text-[var(--k-mute,#8A938D)]">
        The right photo has no alt text on purpose, so you can see the warning. Click a print to pin it.
      </p>
    </div>
  );
}
