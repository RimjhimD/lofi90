"use client";

import { useState } from "react";

export interface CodeFile {
  label: string;
  code: string;
  /** Highlighted HTML from shiki, generated at build time from files in this repo. */
  html: string;
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      }}
      className="chunk px-3 text-sm"
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}

/** A code window with file tabs and a copy button. */
export function CodePanel({ files, title, maxHeight = "34rem" }: { files: CodeFile[]; title?: string; maxHeight?: string }) {
  const [index, setIndex] = useState(0);
  const file = files[index];
  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-[22px] border-[5px] border-ink bg-white shadow-[8px_8px_0_#20201C]">
      <div className="flex flex-wrap items-center gap-2 border-b-4 border-ink bg-board px-3 py-2">
        <span aria-hidden="true" className="flex gap-1.5">
          <i className="block h-3 w-3 rounded-full border-2 border-ink bg-p1" />
          <i className="block h-3 w-3 rounded-full border-2 border-ink bg-p2" />
          <i className="block h-3 w-3 rounded-full border-2 border-ink bg-p5" />
        </span>
        {title && <span className="font-title text-base">{title}</span>}
        <div role="group" aria-label="Files" className="flex flex-wrap gap-1.5">
          {files.map((f, i) => (
            <button
              key={f.label}
              type="button"
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
              className="rounded-full border-[3px] border-ink bg-white px-2.5 text-sm font-extrabold aria-pressed:bg-p3 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-p2"
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs font-bold text-[#6b665a]">{file.code.split("\n").length} lines</span>
        <CopyButton text={file.code} />
      </div>
      <div className="code-block min-h-0 flex-1 overflow-auto" style={{ maxHeight }} dangerouslySetInnerHTML={{ __html: file.html }} />
    </div>
  );
}
