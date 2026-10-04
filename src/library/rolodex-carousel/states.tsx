import { RolodexCarousel, type RolodexCard } from "./RolodexCarousel";

const make = (names: string[]): RolodexCard[] => names.map((n, i) => ({ id: String(i), title: n, subtitle: "Contact" }));
const MANY = make(["Ana Alvarez", "Ben Okafor", "Chloe Martin", "Dev Patel", "Emma Nakamura", "Maya Chen", "Sam Osei"]);

/** Every state, as a real instance. */
export const ROLODEX_CAROUSEL_STATES = [
  { id: "first", label: "First card", note: "Previous is disabled; cards stack behind on the rod.", node: <RolodexCarousel label="Contacts" cards={MANY} /> },
  { id: "middle", label: "Middle", note: "The card just flipped hangs down out of sight.", node: <RolodexCarousel label="Contacts" cards={MANY} initialIndex={3} /> },
  { id: "last", label: "Last card", note: "Next is disabled; the stack behind is empty.", node: <RolodexCarousel label="Contacts" cards={MANY} initialIndex={MANY.length - 1} /> },
  { id: "single", label: "One card", note: "Still a rolodex; nothing to flip to.", node: <RolodexCarousel label="Contacts" cards={make(["Maya Chen"])} /> },
];
