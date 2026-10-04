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

const SET = { a: ["sam", "maya"], b: ["sam"], c: ["maya"] };

/** The same card with other coins, accents and coin motions. Press replay to watch the coins arrive. */
export const SPLIT_BILL_CARD_VARIANTS = [
  { group: "Colour", label: "Gold coins", node: <SplitBillCard items={ITEMS} people={PEOPLE} initialAssignments={SET} coin="#FFC94A" /> },
  { group: "Colour", label: "Silver coins, cyan accent", node: <SplitBillCard items={ITEMS} people={PEOPLE} initialAssignments={SET} coin="#D9DDE3" accent="#3DD9FF" /> },
  { group: "Colour", label: "Copper coins, coral accent", node: <SplitBillCard items={ITEMS} people={PEOPLE} initialAssignments={SET} coin="#E0965A" accent="#FF6B57" /> },
  { group: "Motion", label: "Coins drop", node: <SplitBillCard items={ITEMS} people={PEOPLE} initialAssignments={SET} coinMotion="drop" /> },
  { group: "Motion", label: "Coins pop", node: <SplitBillCard items={ITEMS} people={PEOPLE} initialAssignments={SET} coinMotion="pop" /> },
  { group: "Motion", label: "No motion", node: <SplitBillCard items={ITEMS} people={PEOPLE} initialAssignments={SET} coinMotion="none" /> },
];
