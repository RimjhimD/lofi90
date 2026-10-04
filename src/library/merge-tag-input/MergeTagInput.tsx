"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export interface MergeField {
  /** What goes inside the braces, e.g. "contact.first_name". */
  key: string;
  /** Plain name shown in the suggestion list, e.g. "First name". */
  label: string;
  /** What to say when this field is empty, e.g. "there" for a first name. Overrides suggestedFallback. */
  fallback?: string;
}

export interface SampleContact {
  /** Who this preview is for, e.g. "Sam (has a first name)". */
  label: string;
  values: Record<string, string | undefined>;
}

export interface MergeTagInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Fields the message is allowed to use. Anything else is flagged as unknown. */
  fields: MergeField[];
  /** Real or sample contacts to preview the message for. Two or three is ideal. */
  samples: SampleContact[];
  label?: string;
  /** Offered when a tag would be blank for someone, e.g. "there" → "Hi there". */
  suggestedFallback?: string;
  disabled?: boolean;
  className?: string;
}

const TAG = /\{\{\s*([\w.]+)\s*(?:\|\s*([^}]*?)\s*)?\}\}/g;

interface Found {
  start: number;
  end: number;
  key: string;
  fallback?: string;
}

function findTags(text: string): Found[] {
  return Array.from(text.matchAll(TAG), (m) => ({ start: m.index, end: m.index + m[0].length, key: m[1], fallback: m[2] || undefined }));
}

/** Edit distance, to suggest the field someone probably meant ("frist_name" → "first_name"). */
function distance(a: string, b: string): number {
  const d = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0];
    d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return d[b.length];
}

type Problem =
  | { kind: "unknown"; tag: Found; suggestion?: string }
  | { kind: "blank"; tag: Found; who: string[]; fallback: string }
  | { kind: "unclosed"; at: number };

export function MergeTagInput({ value, onChange, fields, samples, label = "Message", suggestedFallback = "there", disabled = false, className = "" }: MergeTagInputProps) {
  const id = useId();
  const area = useRef<HTMLTextAreaElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<{ from: number; query: string } | null>(null);
  const [active, setActive] = useState(0);
  // After a fix or an insert, put the caret right after the new text.
  const [caretTo, setCaretTo] = useState<{ pos: number } | null>(null);

  useEffect(() => {
    if (!caretTo) return;
    area.current?.focus();
    area.current?.setSelectionRange(caretTo.pos, caretTo.pos);
  }, [caretTo]);

  const known = useMemo(() => new Set(fields.map((f) => f.key)), [fields]);
  const tags = useMemo(() => findTags(value), [value]);

  const problems: Problem[] = [];
  for (const tag of tags) {
    if (!known.has(tag.key)) {
      const best = fields.map((f) => ({ key: f.key, d: distance(tag.key, f.key) })).sort((a, b) => a.d - b.d)[0];
      problems.push({ kind: "unknown", tag, suggestion: best && best.d <= 3 ? best.key : undefined });
    } else if (!tag.fallback) {
      const who = samples.filter((s) => !s.values[tag.key]?.trim()).map((s) => s.label);
      if (who.length) problems.push({ kind: "blank", tag, who, fallback: fields.find((f) => f.key === tag.key)?.fallback ?? suggestedFallback });
    }
  }
  const lastOpen = value.lastIndexOf("{{");
  if (lastOpen !== -1 && value.indexOf("}}", lastOpen) === -1 && !menu) problems.push({ kind: "unclosed", at: lastOpen });

  const options = menu ? fields.filter((f) => `${f.key} ${f.label}`.toLowerCase().includes(menu.query.toLowerCase())) : [];

  function replace(start: number, end: number, text: string) {
    onChange(value.slice(0, start) + text + value.slice(end));
    setCaretTo({ pos: start + text.length });
  }

  function insert(field: MergeField) {
    if (!menu) return;
    replace(menu.from, menu.from + 2 + menu.query.length, `{{${field.key}}}`);
    setMenu(null);
  }

  function onInput(next: string, caret: number) {
    onChange(next);
    const open = next.lastIndexOf("{{", caret);
    const typed = open === -1 ? "" : next.slice(open + 2, caret);
    setMenu(open !== -1 && !typed.includes("}") && /^[\w.]*$/.test(typed) ? { from: open, query: typed } : null);
    setActive(0);
  }

  function render(sample: SampleContact) {
    const parts: React.ReactNode[] = [];
    let last = 0;
    tags.forEach((t, i) => {
      parts.push(value.slice(last, t.start));
      const v = sample.values[t.key]?.trim();
      if (!known.has(t.key)) parts.push(<mark key={i} className="bg-[#FBE4E6] text-[#B42318] line-through decoration-1">{value.slice(t.start, t.end)}</mark>);
      else if (v) parts.push(<b key={i} className="font-bold">{v}</b>);
      else if (t.fallback) parts.push(<mark key={i} className="bg-[#FFF1D6] text-[#7A4D00]">{t.fallback}</mark>);
      else parts.push(<mark key={i} className="bg-[#FBE4E6] px-1 text-[#B42318]">⟨blank⟩</mark>);
      last = t.end;
    });
    parts.push(value.slice(last));
    return parts;
  }

  // The same text behind the textarea, with every tag painted by its status.
  const painted: React.ReactNode[] = [];
  let at = 0;
  tags.forEach((t, i) => {
    painted.push(value.slice(at, t.start));
    const bad = problems.some((p) => p.kind !== "unclosed" && p.tag === t && p.kind === "unknown");
    const warn = problems.some((p) => p.kind === "blank" && p.tag === t);
    painted.push(<mark key={i} className={`rounded-sm text-transparent ${bad ? "bg-[#F6C6CC]" : warn ? "bg-[#FCE3B0]" : "bg-[#CFE5DA]"}`}>{value.slice(t.start, t.end)}</mark>);
    at = t.end;
  });
  painted.push(value.slice(at) + "\n");

  const shared = "col-start-1 row-start-1 w-full whitespace-pre-wrap break-words px-3 py-2.5 font-mono text-[0.92rem] leading-relaxed";

  return (
    <div className={`w-full max-w-xl text-[#1A1A17] ${className}`}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold">{label}</label>
      <div className={`relative grid border-2 border-[#1A1A17] bg-white focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-[#D7263D] ${disabled ? "opacity-60" : ""}`}>
        <div ref={backdrop} aria-hidden="true" className={`${shared} pointer-events-none overflow-hidden text-transparent`}>{painted}</div>
        <textarea
          id={id}
          ref={area}
          value={value}
          disabled={disabled}
          rows={3}
          spellCheck={false}
          aria-describedby={`${id}-status`}
          aria-autocomplete="list"
          aria-controls={`${id}-menu`}
          onChange={(e) => onInput(e.target.value, e.target.selectionStart)}
          onScroll={(e) => backdrop.current && (backdrop.current.scrollTop = e.currentTarget.scrollTop)}
          onKeyDown={(e) => {
            if (!menu || !options.length) return;
            if (e.key === "ArrowDown") setActive((a) => (a + 1) % options.length);
            else if (e.key === "ArrowUp") setActive((a) => (a - 1 + options.length) % options.length);
            else if (e.key === "Enter" || e.key === "Tab") insert(options[active]);
            else if (e.key === "Escape") setMenu(null);
            else return;
            e.preventDefault();
          }}
          className={`${shared} resize-none bg-transparent caret-[#1A1A17] outline-none disabled:cursor-not-allowed`}
        />
        {menu && options.length > 0 && (
          <ul id={`${id}-menu`} role="listbox" aria-label="Merge fields" className="absolute left-2 top-full z-10 mt-1 w-64 border-2 border-[#1A1A17] bg-white shadow-[4px_4px_0_#1A1A17]">
            {options.map((f, i) => (
              <li
                key={f.key}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  insert(f);
                }}
                className="flex cursor-pointer justify-between gap-3 px-3 py-1.5 text-sm aria-selected:bg-[#1A1A17] aria-selected:text-white"
              >
                <span>{f.label}</span>
                <code className="font-mono text-xs opacity-70">{f.key}</code>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-1 text-xs text-[#5E5A50]">Type <code className="font-mono">{"{{"}</code> to insert a field.</p>

      <div id={`${id}-status`} role="status" aria-live="polite" className="mt-3 space-y-1.5">
        {problems.length === 0 ? (
          <p className="text-sm font-bold text-[#0E3B2E]">✓ Every message below reads right.</p>
        ) : (
          problems.map((p, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 border-l-4 border-[#D7263D] bg-[#FBE4E6]/60 px-2.5 py-1.5 text-sm">
              {p.kind === "unknown" && (
                <>
                  <span><code className="font-mono">{p.tag.key}</code> isn&apos;t a field — it would be sent as raw text.</span>
                  {p.suggestion && (
                    <button type="button" onClick={() => replace(p.tag.start, p.tag.end, `{{${p.suggestion}}}`)} className="border border-[#1A1A17] bg-white px-2 text-xs font-bold hover:bg-[#1A1A17] hover:text-white">
                      Use {p.suggestion}
                    </button>
                  )}
                </>
              )}
              {p.kind === "blank" && (
                <>
                  <span><code className="font-mono">{p.tag.key}</code> is empty for {p.who.join(", ")}.</span>
                  <button type="button" onClick={() => replace(p.tag.start, p.tag.end, `{{${p.tag.key} | ${p.fallback}}}`)} className="border border-[#1A1A17] bg-white px-2 text-xs font-bold hover:bg-[#1A1A17] hover:text-white">
                    Add fallback “{p.fallback}”
                  </button>
                </>
              )}
              {p.kind === "unclosed" && <span>A tag opened with <code className="font-mono">{"{{"}</code> is never closed.</span>}
            </div>
          ))
        )}
      </div>

      <ul aria-label="What each contact receives" className="mt-4 grid gap-2.5">
        {samples.map((s) => (
          <li key={s.label}>
            <span className="text-[0.7rem] font-bold uppercase tracking-wider text-[#5E5A50]">{s.label}</span>
            <p className="mt-0.5 w-fit max-w-full whitespace-pre-wrap break-words rounded-2xl rounded-bl-sm bg-[#E8E2D2] px-3.5 py-2 text-sm leading-snug">{render(s)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
