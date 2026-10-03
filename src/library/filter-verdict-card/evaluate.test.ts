import { describe, expect, it } from "vitest";
import { evaluateCondition, evaluateFilter, readPath, type Condition } from "./evaluate";

const contact = {
  phone: "+1 555 010 2030",
  email: "",
  tags: ["VIP", "booked"],
  dnd: false,
  spend: 420,
  address: { city: "Austin" },
};

describe("readPath", () => {
  it("reads nested values", () => {
    expect(readPath(contact, "address.city")).toBe("Austin");
    expect(readPath(contact, "address.zip")).toBeUndefined();
    expect(readPath(contact, "phone.number")).toBeUndefined();
  });
});

describe("evaluateCondition", () => {
  it("treats empty strings as missing", () => {
    const r = evaluateCondition(contact, { field: "email", op: "exists" });
    expect(r.passed).toBe(false);
    expect(r.missing).toBe(true);
  });

  it("flags tag checks that only fail on letter case", () => {
    const r = evaluateCondition(contact, { field: "tags", op: "includes", value: "vip" });
    expect(r.passed).toBe(false);
    expect(r.caseOnly).toBe(true);
  });

  it("does not let a missing number pass gt or lt", () => {
    expect(evaluateCondition({}, { field: "spend", op: "gt", value: 0 }).passed).toBe(false);
    expect(evaluateCondition({}, { field: "spend", op: "lt", value: 10 }).passed).toBe(false);
  });

  it("compares false strictly", () => {
    expect(evaluateCondition(contact, { field: "dnd", op: "equals", value: false }).passed).toBe(true);
    expect(evaluateCondition({ dnd: 0 }, { field: "dnd", op: "equals", value: false }).passed).toBe(false);
  });
});

describe("evaluateFilter", () => {
  const conditions: Condition[] = [
    { field: "phone", op: "exists" },
    { field: "tags", op: "includes", value: "vip" },
    { field: "spend", op: "gt", value: 300 },
  ];

  it("all-mode stops at the first failure", () => {
    const v = evaluateFilter(contact, conditions, "all");
    expect(v.passed).toBe(false);
    expect(v.decidedAt).toBe(1);
    expect(v.results).toHaveLength(2);
  });

  it("any-mode stops at the first pass", () => {
    const v = evaluateFilter(contact, conditions, "any");
    expect(v.passed).toBe(true);
    expect(v.decidedAt).toBe(0);
  });

  it("passes when every condition holds", () => {
    const v = evaluateFilter({ ...contact, tags: ["vip"] }, conditions, "all");
    expect(v.passed).toBe(true);
    expect(v.results.every((r) => r.passed)).toBe(true);
  });
});
