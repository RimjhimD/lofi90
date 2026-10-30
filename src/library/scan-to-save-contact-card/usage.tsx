"use client";

import { useEffect, useState } from "react";
import { ScanToSaveContactCard, type Contact } from "@/library/scan-to-save-contact-card/ScanToSaveContactCard";

// A team page card: load the person from your API, and count saves for the team dashboard.
export function TeamMemberCard({ memberId }: { memberId: string }) {
  const [member, setMember] = useState<Contact | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/team/${memberId}`)
      .then((r) => r.json() as Promise<Contact>)
      .then((c) => alive && setMember(c));
    return () => {
      alive = false;
    };
  }, [memberId]);

  return (
    <ScanToSaveContactCard
      contact={member ?? { firstName: "" }}
      loading={!member}
      layout="vertical"
      showQr="desktop-only"
      onSave={() => {
        navigator.sendBeacon?.("/api/analytics", JSON.stringify({ event: "contact_saved", memberId }));
      }}
    />
  );
}
