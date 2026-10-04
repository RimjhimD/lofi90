import { SplitBillCard, type BillItem, type BillPerson } from "./SplitBillCard";

const ITEMS: BillItem[] = [
  { id: "a", name: "Pizza", cents: 1400 },
  { id: "b", name: "Fries", cents: 800 },
  { id: "c", name: "Salad", cents: 1100 },
];
const PEOPLE: BillPerson[] = [
  { id: "sam", name: "Sam", color: "#FF6B57" },
  { id: "maya", name: "Maya", color: "#3DD9FF" },
];

/** Every state, as a real instance. */
export const SPLIT_BILL_CARD_STATES = [
  { id: "empty", label: "Nothing claimed", note: "Every line says unclaimed; nobody owes anything yet.", node: <SplitBillCard items={ITEMS} people={PEOPLE} /> },
  { id: "partial", label: "Some unclaimed", note: "Shows what's left over and offers to share it between everyone.", node: <SplitBillCard items={ITEMS} people={PEOPLE} initialAssignments={{ a: ["sam", "maya"] }} /> },
  { id: "shared", label: "Shared item", note: "The pizza is split in half; tax and tip follow what each person ate.", node: <SplitBillCard items={ITEMS} people={PEOPLE} initialAssignments={{ a: ["sam", "maya"], b: ["sam"], c: ["maya"] }} /> },
  { id: "settled", label: "All settled", note: "Everything claimed, and the shares add up to the exact cent.", node: <SplitBillCard items={ITEMS} people={PEOPLE} initialAssignments={{ a: ["sam"], b: ["sam", "maya"], c: ["maya"] }} /> },
];
