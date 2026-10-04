"use client";

import { useState } from "react";
import { UndoFuseButton } from "./UndoFuseButton";

const START = ["Holiday photos 2025", "Old invoices", "Draft — birthday speech"];

/** Live preview: deleting folders, with an undo window you can see burning. */
export default function UndoFuseButtonDemo() {
  const [items, setItems] = useState(START);
  const [selected, setSelected] = useState(START[0]);
  const [log, setLog] = useState("");

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="w-full max-w-sm border-2 border-[#1A1A17] bg-white p-4 shadow-[5px_5px_0_#1A1A17]">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#5E5A50]">My files</p>
        <ul className="mb-4 space-y-1" aria-label="Folders">
          {items.length === 0 && <li className="text-sm text-[#5E5A50]">No folders left.</li>}
          {items.map((it) => (
            <li key={it}>
              <button
                type="button"
                aria-pressed={selected === it}
                onClick={() => setSelected(it)}
                className="flex w-full items-center gap-2 border border-transparent px-2 py-1 text-left text-sm hover:border-[#1A1A17] aria-pressed:border-[#1A1A17] aria-pressed:bg-[#E8E2D2] focus-visible:outline-2 focus-visible:outline-[#D7263D]"
              >
                📁 {it}
              </button>
            </li>
          ))}
        </ul>
        <div className="flex justify-center">
          <UndoFuseButton
            key={selected}
            delayMs={5000}
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
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-[#5E5A50]">
        <span aria-live="polite">{log || "Press Delete, then move your mouse away and watch the fuse."}</span>
        <button type="button" onClick={() => { setItems(START); setSelected(START[0]); setLog(""); }} className="border-2 border-[#1A1A17] bg-white px-2 py-0.5 font-bold text-[#1A1A17] shadow-[2px_2px_0_#1A1A17] focus-visible:outline-3 focus-visible:outline-[#D7263D]">
          Reset
        </button>
      </div>
    </div>
  );
}
