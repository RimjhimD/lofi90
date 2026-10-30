"use client";

import { useEffect, useState } from "react";
import { OpenNowHours, type HoursException, type WeeklyHours } from "@/library/open-now-hours/OpenNowHours";

interface ShopHours {
  timeZone: string;
  weekly: WeeklyHours;
  exceptions: HoursException[];
  phone: string;
}

// Hours live in your CMS or database; the block works out open/closed in the shop's own time zone.
export function ShopHours({ shopId }: { shopId: string }) {
  const [shop, setShop] = useState<ShopHours | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/shops/${shopId}/hours`)
      .then((r) => r.json() as Promise<ShopHours>)
      .then((data) => alive && setShop(data));
    return () => {
      alive = false;
    };
  }, [shopId]);

  if (!shop) return null;
  return (
    <OpenNowHours
      name="Bella Salon · Dhanmondi"
      hours={shop.weekly}
      timeZone={shop.timeZone}
      exceptions={shop.exceptions}
      soonMinutes={30}
      lastBookingMinutes={15}
      ctaWhenOpen={<a href={`tel:${shop.phone}`}>Call now</a>}
      ctaWhenClosed={<a href={`/shops/${shopId}/book`}>Book online</a>}
      onStatusChange={(s) => console.info("Shop is now", s.kind)}
    />
  );
}

// Example data from /api/shops/:id/hours
export const EXAMPLE: ShopHours = {
  timeZone: "Asia/Dhaka",
  phone: "+8801700000000",
  weekly: {
    mon: [["10:00", "13:30"], ["14:30", "20:00"]],
    tue: [["10:00", "20:00"]],
    fri: [["15:00", "21:00"]],
    sat: [["18:00", "01:00"]],
    sun: "closed",
  },
  exceptions: [{ date: "2026-10-31", hours: "closed", label: "Closed for Puja holiday" }],
};
