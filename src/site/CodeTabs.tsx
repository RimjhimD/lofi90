"use client";

import { useId, useState } from "react";
import type { PropDoc } from "@/lib/registry";

export interface CodeFile {
  label: string;
  code: string;
  /** Highlighted HTML from shiki (trusted, generated at build time from repo files). */
  html?: string;
  /** Plain text shown as-is (the prompt). */
  text?: string;
}

export type CodeTab =
  | { id: string; label: string; files: CodeFile[]; props?: undefined }
  | { id: string; label: string; props: PropDoc[]; files?: undefined };

function CopyButton({ text }: { text: string }) {
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
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}

export function CodeTabs({ tabs }: { tabs: CodeTab[] }) {
  const [active, setActive] = useState(tabs[0].id);
  const [fileIndex, setFileIndex] = useState(0);
  const base = useId();
  const tab = tabs.find((t) => t.id === active)!;
  const file = tab.files?.[Math.min(fileIndex, tab.files.length - 1)];

  return (
    <section aria-label="Code" className="rounded-[24px] border-[5px] border-ink bg-board p-3.5 shadow-[8px_8px_0_#20201C]">
      <div role="tablist" aria-label="Code views" className="mb-3 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            id={`${base}-${t.id}`}
            role="tab"
            type="button"
            aria-selected={active === t.id}
            aria-controls={`${base}-panel`}
            onClick={() => {
              setActive(t.id);
              setFileIndex(0);
            }}
            className="chunk px-4 py-1"
          >
            {t.label}
          </button>
        ))}
      </div>

      <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-${active}`} key={active} className="anim-rise overflow-hidden rounded-[18px] border-4 border-ink bg-white">
        {tab.props ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead className="bg-paper">
                <tr className="[&>th]:border-b-4 [&>th]:border-ink [&>th]:px-3 [&>th]:py-2 [&>th]:font-extrabold">
                  <th>Prop</th><th>Type</th><th>Default</th><th>What it does</th>
                </tr>
              </thead>
              <tbody>
                {tab.props.map((p) => (
                  <tr key={p.name} className="[&>td]:border-b-[3px] [&>td]:border-dashed [&>td]:border-[#efe5cb] [&>td]:px-3 [&>td]:py-2 [&>td]:align-top">
                    <td className="font-extrabold">{p.name}</td>
                    <td><code className="rounded-md border-2 border-ink bg-board px-1.5 text-xs">{p.type}</code></td>
                    <td className="font-semibold">{p.default}</td>
                    <td className="font-semibold">{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          file && (
            <>
              <div className="flex flex-wrap items-center gap-2 border-b-4 border-ink bg-paper px-3 py-2">
                {tab.files!.map((f, i) => (
                  <button
                    key={f.label}
                    type="button"
                    aria-pressed={i === fileIndex}
                    onClick={() => setFileIndex(i)}
                    className="rounded-full border-[3px] border-ink bg-white px-2.5 text-sm font-extrabold aria-pressed:bg-p3"
                  >
                    {f.label}
                  </button>
                ))}
                <span className="ml-auto text-xs font-bold text-[#6b665a]">{file.code.split("\n").length} lines</span>
                <CopyButton text={file.code} />
              </div>
              {file.html ? (
                <div className="code-block" dangerouslySetInnerHTML={{ __html: file.html }} />
              ) : (
                <p className="whitespace-pre-wrap p-4 text-[0.95rem] font-semibold leading-relaxed">{file.text}</p>
              )}
            </>
          )
        )}
      </div>
    </section>
  );
}
