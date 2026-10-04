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
      className="sb-btn py-1"
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
    <div className="flex h-full min-w-0 flex-col border-2 border-ink bg-white">
      <div className="flex flex-wrap items-stretch border-b-2 border-ink">
        {title && <span className="mono flex items-center bg-ink px-3 text-bone">{title}</span>}
        <div role="group" aria-label="Files" className="flex">
          {files.map((f, i) => (
            <button
              key={f.label}
              type="button"
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
              className="mono border-r border-ink px-3 py-2 normal-case tracking-normal aria-pressed:bg-bone-2 aria-pressed:shadow-[inset_0_-3px_0_#D7263D] focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-signal"
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="mono ml-auto flex items-center px-3 text-muted">{file.code.split("\n").length} lines</span>
        <span className="flex items-center pr-2">
          <CopyButton text={file.code} />
        </span>
      </div>
      <div className="code-block min-h-0 flex-1 overflow-auto" style={{ maxHeight }} dangerouslySetInnerHTML={{ __html: file.html }} />
    </div>
  );
}
