export type ConditionOp =
  | "exists"
  | "notExists"
  | "equals"
  | "notEquals"
  | "includes"
  | "gt"
  | "lt";

export interface Condition {
  /** Dot path into the record, e.g. "phone" or "address.city". */
  field: string;
  op: ConditionOp;
  /** Value to compare against. Not used by exists / notExists. */
  value?: string | number | boolean;
  /** Plain-English label shown on the card. Generated when omitted. */
  label?: string;
}

export type FilterMode = "all" | "any";

export interface ConditionResult {
  condition: Condition;
  passed: boolean;
  /** The value found in the record at `condition.field`. */
  actual: unknown;
  /** True when the field is null, undefined or an empty string. */
  missing: boolean;
  /** True when the check would pass if letter case were ignored. */
  caseOnly: boolean;
}

export interface Verdict {
  passed: boolean;
  results: ConditionResult[];
  /** Index of the condition that decided the verdict, or -1. */
  decidedAt: number;
}

export function readPath(record: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc === null || acc === undefined || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, record);
}

function isMissing(v: unknown): boolean {
  return v === null || v === undefined || v === "";
}

function sameIgnoringCase(a: unknown, b: unknown): boolean {
  return typeof a === "string" && typeof b === "string" && a.toLowerCase() === b.toLowerCase();
}

export function evaluateCondition(
  record: Record<string, unknown>,
  condition: Condition,
): ConditionResult {
  const actual = readPath(record, condition.field);
  const missing = isMissing(actual);
  const { op, value } = condition;
  let passed = false;
  let caseOnly = false;

  switch (op) {
    case "exists":
      passed = !missing;
      break;
    case "notExists":
      passed = missing;
      break;
    case "equals":
      passed = actual === value;
      caseOnly = !passed && sameIgnoringCase(actual, value);
      break;
    case "notEquals":
      passed = actual !== value;
      break;
    case "includes":
      if (Array.isArray(actual)) {
        passed = actual.includes(value);
        caseOnly = !passed && actual.some((item) => sameIgnoringCase(item, value));
      } else if (typeof actual === "string" && typeof value === "string") {
        passed = actual.includes(value);
        caseOnly = !passed && actual.toLowerCase().includes(value.toLowerCase());
      }
      break;
    case "gt":
      passed = !missing && Number(actual) > Number(value);
      break;
    case "lt":
      passed = !missing && Number(actual) < Number(value);
      break;
  }

  return { condition, passed, actual, missing, caseOnly };
}

/**
 * Evaluates conditions in order, the way automation tools do.
 * "all": the first failure blocks. "any": the first pass lets it through.
 * Conditions after the deciding one are not evaluated and are left out of `results`.
 */
export function evaluateFilter(
  record: Record<string, unknown>,
  conditions: Condition[],
  mode: FilterMode = "all",
): Verdict {
  const results: ConditionResult[] = [];
  for (let i = 0; i < conditions.length; i++) {
    const result = evaluateCondition(record, conditions[i]);
    results.push(result);
    if (mode === "all" && !result.passed) return { passed: false, results, decidedAt: i };
    if (mode === "any" && result.passed) return { passed: true, results, decidedAt: i };
  }
  return {
    passed: mode === "all",
    results,
    decidedAt: conditions.length ? conditions.length - 1 : -1,
  };
}

const OP_WORDS: Record<ConditionOp, string> = {
  exists: "is set",
  notExists: "is empty",
  equals: "is",
  notEquals: "is not",
  includes: "includes",
  gt: "is more than",
  lt: "is less than",
};

export function describeCondition(c: Condition): string {
  if (c.label) return c.label;
  const v = c.value === undefined ? "" : ` ${JSON.stringify(c.value)}`;
  return `${c.field} ${OP_WORDS[c.op]}${v}`;
}
