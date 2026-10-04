"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { StringNav } from "@/library/string-nav/StringNav";

const LINKS = [
  { id: "/", label: "Home", href: "/" },
  { id: "/work", label: "Work", href: "/work" },
  { id: "/studio", label: "Studio", href: "/studio" },
  { id: "/contact", label: "Contact", href: "/contact" },
];

// The active item comes from the URL, so back/forward moves the bead too. A plain click plucks the string
// and calls onChange; route there yourself. Cmd/Ctrl-click still opens the link in a new tab.
export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const active = LINKS.find((l) => l.id !== "/" && pathname.startsWith(l.id))?.id ?? "/";

  return (
    <header className="mx-auto flex max-w-5xl items-center gap-8 px-6 py-4">
      <Link href="/" className="font-bold">Fret</Link>
      <StringNav items={LINKS} value={active} onChange={(href) => router.push(href)} className="ml-auto max-w-md" />
    </header>
  );
}
