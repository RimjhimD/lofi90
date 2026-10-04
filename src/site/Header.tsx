"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home", match: (p: string) => p === "/" },
  { href: "/components", label: "Components", match: (p: string) => p.startsWith("/components") },
];

/** Logo and site links in the left corner. Each link has a lamp that lights for the page you are on. */
export function Header() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-bone">
      <div className="flex h-[60px] items-center gap-2 px-5">
        <Link href="/" aria-label="lofi90 home" className="mr-5 flex items-center gap-2.5 font-display text-[1.8rem] font-black leading-none tracking-wide">
          <span aria-hidden="true" className="h-3.5 w-3.5 rounded-full bg-signal shadow-[0_0_10px_#ff5a6e]" />
          LOFI90
        </Link>
        <nav aria-label="Site" className="ml-auto flex items-center gap-0.5">
          {LINKS.map((l) => {
            const on = l.match(path);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={on ? "page" : undefined}
                className="mono group flex items-center gap-2 border border-transparent px-2.5 py-1.5 hover:border-ink focus-visible:border-ink focus-visible:outline-none aria-[current=page]:border-ink aria-[current=page]:bg-white"
              >
                <i className="lamp" data-on={on} style={{ width: 8, height: 8 }} />
                {l.label}
              </Link>
            );
          })}
          <span aria-disabled="true" title="Agent logs are on the way" className="mono hidden cursor-not-allowed items-center gap-2 px-2.5 py-1.5 text-muted sm:flex">
            <i className="lamp" style={{ width: 8, height: 8 }} />
            Agent logs
            <span className="bg-ink px-1 py-px text-[0.58rem] text-bone">Soon</span>
          </span>
          <a href="https://github.com/RimjhimD/lofi90" className="mono group flex items-center gap-2 border border-transparent px-2.5 py-1.5 hover:border-ink focus-visible:border-ink focus-visible:outline-none">
            <i className="lamp" style={{ width: 8, height: 8 }} />
            GitHub ↗
          </a>
        </nav>
      </div>
    </header>
  );
}
