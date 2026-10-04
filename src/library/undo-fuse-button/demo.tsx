"use client";

import { useState } from "react";
import type { ControlValues } from "@/site/Controls";
import { UndoFuseButton, type UndoFuseButtonProps } from "./UndoFuseButton";

const START = ["Holiday photos 2025", "Old invoices", "Draft — birthday speech"];

/** Live preview: deleting folders, with an undo window you can see burning. */
export default function UndoFuseButtonDemo({ controls = {} }: { controls?: ControlValues }) {
  const look = controls as Pick<UndoFuseButtonProps, "color" | "fuseColor" | "spark" | "size" | "delayMs">;
  const [items, setItems] = useState(START);
  const [selected, setSelected] = useState(START[0]);
  const [log, setLog] = useState("");

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="w-full max-w-sm rounded-lg border border-[#3A433F] bg-[#121614] p-4 shadow-[0_10px_30px_-14px_rgba(0,0,0,.9)]">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#8A938D]">My files</p>
        <ul className="mb-4 space-y-1" aria-label="Folders">
          {items.length === 0 && <li className="text-sm text-[#8A938D]">No folders left.</li>}
          {items.map((it) => (
            <li key={it}>
              <button
                type="button"
                aria-pressed={selected === it}
                onClick={() => setSelected(it)}
                className="flex w-full items-center gap-2 border border-transparent px-2 py-1 text-left text-sm hover:border-[#3A433F] aria-pressed:border-[#3A433F] aria-pressed:bg-[#181D1B] focus-visible:outline-2 focus-visible:outline-[#C6FF3D]"
              >
                📁 {it}
              </button>
            </li>
          ))}
        </ul>
        <div className="flex justify-center">
          <UndoFuseButton
            key={`${selected}-${look.delayMs}`}
            {...look}
            delayMs={look.delayMs ?? 5000}
            disabled={!items.includes(selected)}
            labels={{ idle: `Delete “${selected.length > 16 ? selected.slice(0, 16) + "…" : selected}”` }}
            onCommit={() => {
              setItems((xs) => xs.filter((x) => x !== selected));
              setLog(`“${selected}” deleted.`);
            }}
            onUndo={() => setLog(`“${selected}” kept — nothing was deleted.`)}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-[#8A938D]">
        <span aria-live="polite">{log || "Press Delete, then move your mouse away and watch the fuse."}</span>
        <button type="button" onClick={() => { setItems(START); setSelected(START[0]); setLog(""); }} className="rounded-lg border border-[#3A433F] bg-[#121614] px-2 py-0.5 font-bold text-[#E9EDE8] shadow-[0_10px_30px_-14px_rgba(0,0,0,.9)] focus-visible:outline-3 focus-visible:outline-[#C6FF3D]">
          Reset
        </button>
      </div>
    </div>
  );
}
