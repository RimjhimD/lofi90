"use client";

import { RolodexCarousel } from "@/library/rolodex-carousel/RolodexCarousel";

// Cards are sorted however you pass them; the A–Z tabs come from each title's first letter
// (or set `tab` yourself). Keep them sorted alphabetically so letter jumps land where expected.
export function ContactRolodex({ contacts }: { contacts: { id: string; name: string; company: string; phone: string }[] }) {
  const cards = [...contacts]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({ id: c.id, title: c.name, subtitle: c.company, body: <a href={`tel:${c.phone}`}>{c.phone}</a> }));

  return <RolodexCarousel label="Contacts" cards={cards} onChange={(i) => console.info("Showing", cards[i].title)} />;
}
