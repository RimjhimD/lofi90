"use client";

import { useEffect, useRef, useState } from "react";
import {
  describeCondition,
  evaluateFilter,
  readPath,
  type Condition,
  type ConditionResult,
  type FilterMode,
  type Verdict,
} from "./evaluate";

export interface FilterVerdictCardProps {
  /** The record being checked, e.g. a CRM contact. */
  record: Record<string, unknown>;
  /** Conditions checked in order, like an automation filter step. */
  conditions: Condition[];
  /** Big title, e.g. the contact's name. */
  title: string;
  /** Small line under the title, e.g. "Workflow: VIP follow-up". */
  subtitle?: string;
  /** "all" blocks on the first failure, "any" passes on the first match. */
  mode?: FilterMode;
  /** Step through the rows one by one. Turned off for reduced-motion users. */
  animate?: boolean;
  /** Delay per row when animating, in ms. */
  stepMs?: number;
  /** Change this number to run the check again. */
  runKey?: number;
  /** Called once the verdict is shown. */
  onVerdict?: (verdict: Verdict) => void;
  className?: string;
}

type RowState = "idle" | "checking" | "pass" | "fail" | "skipped";

function formatValue(v: unknown): string {
  if (Array.isArray(v)) return v.map(String).join(", ");
  if (typeof v === "string") return `"${v}"`;
  return String(v);
}

function explain(result: ConditionResult, mode: FilterMode): string {
  const label = describeCondition(result.condition);
  if (mode === "any") return `None of the conditions matched, so the workflow skipped this record.`;
  if (result.missing && result.condition.op !== "notExists")
    return `Blocked by ${label}: the record has no ${result.condition.field} saved.`;
  if (result.caseOnly)
    return `Blocked by ${label}: the value only differs in letter case (${formatValue(result.actual)}). Filters match exactly, so keep values like tags lowercase.`;
  return `Blocked by ${label}: the record has ${formatValue(result.actual)}.`;
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function FilterVerdictCard({
  record,
  conditions,
  title,
  subtitle,
  mode = "all",
  animate = true,
  stepMs = 450,
  runKey = 0,
  onVerdict,
  className = "",
}: FilterVerdictCardProps) {
  const [rows, setRows] = useState<RowState[]>(() => conditions.map(() => "idle"));
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [running, setRunning] = useState(false);
  const stampRef = useRef<HTMLSpanElement>(null);
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);
  const onVerdictRef = useRef(onVerdict);
  useEffect(() => {
    onVerdictRef.current = onVerdict;
  }, [onVerdict]);

  useEffect(() => {
    const result = evaluateFilter(record, conditions, mode);
    const timers: number[] = [];
    const stagger = animate && !prefersReducedMotion();
    const step = stagger ? stepMs : 0;

    const stateFor = (i: number): RowState => {
      if (i > result.decidedAt) return "skipped";
      return result.results[i].passed ? "pass" : "fail";
    };

    // Reset in a timer (not synchronously) so a re-run starts from a clean card.
    timers.push(
      window.setTimeout(() => {
        setVerdict(null);
        setRunning(true);
        setRows(conditions.map(() => "idle"));
      }, 0),
    );

    conditions.forEach((_, i) => {
      timers.push(
        window.setTimeout(() => {
          setRows((prev) => prev.map((s, j) => (j === i ? (i > result.decidedAt ? "skipped" : "checking") : s)));
        }, i * step + 1),
      );
      timers.push(
        window.setTimeout(() => {
          const next = stateFor(i);
          setRows((prev) => prev.map((s, j) => (j === i ? next : s)));
          if (next === "fail" && stagger) {
            rowRefs.current[i]?.animate(
              [{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(5px)" }, { transform: "translateX(0)" }],
              { duration: 320 },
            );
          }
        }, i * step + step * 0.7),
      );
    });

    timers.push(
      window.setTimeout(() => {
        setVerdict(result);
        setRunning(false);
        onVerdictRef.current?.(result);
        if (stagger) {
          stampRef.current?.animate(
            [{ transform: "scale(2) rotate(-12deg)", opacity: 0 }, { transform: "scale(1) rotate(0)", opacity: 1 }],
            { duration: 320, easing: "cubic-bezier(.3,1.8,.5,1)" },
          );
        }
      }, conditions.length * step + 40),
    );

    return () => timers.forEach(clearTimeout);
    // runKey is how the parent asks for a re-run.
  }, [record, conditions, mode, animate, stepMs, runKey]);

  const decided = verdict ? verdict.results[verdict.decidedAt] : undefined;
  const badge = !verdict
    ? running
      ? { text: "CHECKING…", cls: "bg-[#FFB800] text-[#20201C]" }
      : { text: "READY", cls: "bg-[#FFFDF6] text-[#20201C]" }
    : verdict.passed
      ? { text: "PASS", cls: "bg-[#00C49A] text-[#20201C]" }
      : { text: "BLOCKED", cls: "bg-[#E5484D] text-white" };

  return (
    <section
      aria-label={`Filter check for ${title}`}
      className={`w-full max-w-md overflow-hidden rounded-[22px] border-4 border-[#20201C] bg-white text-[#20201C] shadow-[6px_6px_0_#20201C] ${className}`}
    >
      <header className="flex items-center gap-3 border-b-4 border-[#20201C] bg-[#FFF6E0] px-4 py-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-extrabold leading-tight">{title}</h3>
          {subtitle && <p className="truncate text-sm font-semibold text-[#5c5849]">{subtitle}</p>}
        </div>
        <span
          ref={stampRef}
          className={`ml-auto shrink-0 rounded-full border-[3px] border-[#20201C] px-3 py-0.5 text-sm font-black tracking-wide transition-colors ${badge.cls}`}
        >
          {badge.text}
        </span>
      </header>

      <ol className="px-3 py-2">
        {conditions.map((c, i) => {
          const state = rows[i];
          const result = verdict?.results[i];
          const actual = result?.actual ?? readPath(record, c.field);
          const missing = actual === null || actual === undefined || actual === "";
          return (
            <li
              key={`${c.field}-${i}`}
              ref={(el) => {
                rowRefs.current[i] = el;
              }}
              className={`grid grid-cols-[28px_1fr_auto] items-center gap-2 border-b-[3px] border-dashed border-[#efe5cb] px-1.5 py-2 text-sm last:border-b-0 transition-[opacity,background-color] duration-200 ${
                state === "idle" ? "opacity-40" : state === "skipped" ? "opacity-45" : "opacity-100"
              } ${state === "checking" ? "bg-[#FFF8E2]" : state === "fail" ? "bg-[#FFECEC]" : ""}`}
            >
              <span
                aria-hidden="true"
                className={`grid h-6 w-6 place-items-center rounded-full border-[3px] border-[#20201C] text-xs font-black ${
                  state === "pass"
                    ? "bg-[#00C49A]"
                    : state === "fail"
                      ? "bg-[#E5484D] text-white"
                      : state === "checking"
                        ? "animate-spin border-t-transparent bg-[#FFFDF6]"
                        : "bg-[#FFFDF6]"
                }`}
              >
                {state === "pass" ? "✓" : state === "fail" ? "✕" : ""}
              </span>
              <span className="font-bold">
                {describeCondition(c)}
                <span className="sr-only">
                  {state === "pass" ? ", passed" : state === "fail" ? ", failed" : state === "skipped" ? ", not checked" : ""}
                </span>
              </span>
              <span className="max-w-[9rem] truncate text-right text-xs font-semibold">
                {state === "skipped" ? (
                  <em className="text-[#7a7464]">not checked</em>
                ) : missing ? (
                  <span className="rounded-md border-2 border-dashed border-[#b9a98a] px-1.5 italic text-[#8a7b60]">missing</span>
                ) : (
                  <code className="rounded-md border-2 border-[#20201C] bg-[#FFF6E0] px-1.5">{formatValue(actual)}</code>
                )}
              </span>
            </li>
          );
        })}
      </ol>

      <footer aria-live="polite" className="min-h-12 border-t-4 border-[#20201C] bg-[#FFF6E0] px-4 py-2.5 text-sm font-semibold">
        {!verdict
          ? running
            ? "Checking conditions in order…"
            : "Waiting to check."
          : verdict.passed
            ? `${title} meets the filter, so the workflow runs.`
            : decided && explain(decided, mode)}
      </footer>
    </section>
  );
}

