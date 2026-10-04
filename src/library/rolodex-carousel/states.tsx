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

/** The same rolodex with other wheel colours, leans and stack depths. */
export const ROLODEX_CAROUSEL_VARIANTS = [
  { group: "Colour", label: "Lime", node: <RolodexCarousel label="Contacts" cards={MANY} initialIndex={2} accent="#C6FF3D" /> },
  { group: "Colour", label: "Coral", node: <RolodexCarousel label="Contacts" cards={MANY} initialIndex={2} accent="#FF6B57" /> },
  { group: "Colour", label: "Cyan", node: <RolodexCarousel label="Contacts" cards={MANY} initialIndex={2} accent="#3DD9FF" /> },
  { group: "Motion", label: "Flat stack (no lean)", node: <RolodexCarousel label="Contacts" cards={MANY} initialIndex={2} tilt={0} /> },
  { group: "Motion", label: "Steep lean", node: <RolodexCarousel label="Contacts" cards={MANY} initialIndex={2} tilt={15} /> },
  { group: "Motion", label: "Slow, heavy flip", node: <RolodexCarousel label="Contacts" cards={MANY} initialIndex={2} flipMs={1100} /> },
  { group: "Depth", label: "2 behind", node: <RolodexCarousel label="Contacts" cards={MANY} initialIndex={2} behind={2} /> },
  { group: "Depth", label: "6 behind", node: <RolodexCarousel label="Contacts" cards={MANY} initialIndex={0} behind={6} /> },
];
