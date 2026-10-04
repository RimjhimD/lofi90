"use client";

import type { ControlValues } from "@/site/Controls";
import { say } from "@/site/log";
import { RolodexCarousel, type RolodexCard, type RolodexCarouselProps } from "./RolodexCarousel";

const PEOPLE: [string, string, string][] = [
  ["Ana Alvarez", "Florist", "Wed & Sat mornings"],
  ["Ben Okafor", "Plumber", "Emergency line 24/7"],
  ["Chloe Martin", "Accountant", "Tax season: book early"],
  ["Dev Patel", "Landlord", "Rent due on the 1st"],
  ["Emma Nakamura", "Dentist", "Check-up every 6 months"],
  ["Farah Haddad", "Piano teacher", "Thursdays 5 pm"],
  ["Gus Lindqvist", "Mechanic", "Winter tyres in November"],
  ["Ines Duarte", "Vet", "Milo's jabs due in May"],
  ["Jon Bell", "Locksmith", "Spare key: under the pot"],
  ["Maya Chen", "Hair stylist", "Cut + colour, 2 hrs"],
  ["Noor Rahman", "Yoga", "Mats provided"],
  ["Omar Said", "Electrician", "Fixed the fuse box"],
  ["Priya Iyer", "Doctor", "Fridays only"],
  ["Sam Osei", "Tailor", "Hem the blue trousers"],
  ["Tara Quinn", "Babysitter", "Knows the bedtime routine"],
  ["Yusuf Kaya", "Baker", "Order cakes 3 days ahead"],
];

const CARDS: RolodexCard[] = PEOPLE.map(([name, role, note], i) => ({
  id: String(i),
  title: name,
  subtitle: role,
  body: (
    <div className="flex items-end justify-between gap-2">
      <span className="font-mono text-xs">+1 555 01{String(i).padStart(2, "0")}</span>
      <span className="text-right text-xs text-[#8A938D]">{note}</span>
    </div>
  ),
}));

/** Live preview: a contact rolodex. Try typing M or Y. */
export default function RolodexCarouselDemo({ controls = {} }: { controls?: ControlValues }) {
  const look = controls as Pick<RolodexCarouselProps, "accent" | "flipMs" | "behind" | "tilt">;
  return (
    <RolodexCarousel
      {...look}
      cards={CARDS}
      label="Contacts"
      initialIndex={3}
      onChange={(i) => say(`Flipped to ${PEOPLE[i][0]} (${PEOPLE[i][1]}) · card ${i + 1} of ${PEOPLE.length}.`)}
    />
  );
}
