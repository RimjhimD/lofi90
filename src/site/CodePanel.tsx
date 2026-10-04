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
      className={`mono rounded-md border px-2.5 py-1 text-[0.64rem] transition-colors focus-visible:outline-2 focus-visible:outline-acc ${copied ? "border-acc text-acc" : "border-line-2 text-mute hover:text-text"}`}
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
    <div className="panel flex h-full min-w-0 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 border-b border-line px-3 py-2">
        {title && <span className="mono mr-1 text-[0.64rem] text-acc">{title}</span>}
        <div role="group" aria-label="Files" className="flex gap-1">
          {files.map((f, i) => (
            <button
              key={f.label}
              type="button"
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
              className="rounded-md px-2.5 py-1 font-mono text-[0.72rem] text-mute aria-pressed:bg-panel-2 aria-pressed:text-text focus-visible:outline-2 focus-visible:outline-acc"
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="mono ml-auto px-2 text-[0.62rem] text-mute">{file.code.split("\n").length} lines</span>
        <CopyButton text={file.code} />
      </div>
      <div className="code-block min-h-0 flex-1 overflow-auto bg-[#0E1110]" style={{ maxHeight }} dangerouslySetInnerHTML={{ __html: file.html }} />
    </div>
  );
}
