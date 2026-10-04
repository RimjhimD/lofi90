"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ENTRIES } from "@/lib/registry";
import { Ticker } from "@/site/Ticker";
import { ThemeToggle } from "@/site/ThemeToggle";
import { playIntro } from "@/site/Intro";

const LINKS = [
  { href: "/", label: "Home", match: (p: string) => p === "/" },
  { href: "/components", label: "Components", match: (p: string) => p.startsWith("/components") },
  { href: "/agent-logs", label: "Agent logs", match: (p: string) => p.startsWith("/agent-logs") },
];

/** Logo on the left; site links on the right, the current page marked by a lit LED. A live ticker runs underneath. */
export function Header() {
  const path = usePathname();
  const link =
    "group flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 sm:gap-2 sm:px-3 text-sm font-medium text-mute transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-acc aria-[current=page]:text-text";
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="flex h-[58px] items-center gap-2 px-4 sm:px-5">
        <Link href="/" onClick={playIntro} title="Home, with the opening animation" aria-label="lofi90 home" className="flex items-center gap-2.5 font-display text-[1.25rem] font-bold tracking-tight">
          <i className="led" data-on="true" data-pulse="true" />
          lofi90
        </Link>
        <nav aria-label="Site" className="ml-auto flex items-center gap-0.5">
          {LINKS.map((l) => {
            const on = l.match(path);
            return (
              <Link key={l.href} href={l.href} aria-current={on ? "page" : undefined} className={`${link} ${l.href === "/" ? "hidden sm:flex" : ""}`}>
                <span className="hidden sm:inline-flex">
                  <i className="led" data-on={on} style={{ width: 6, height: 6 }} />
                </span>
                {l.label === "Agent logs" ? (
                  <>
                    <span className="hidden sm:inline">Agent logs</span>
                    <span className="sm:hidden">Logs</span>
                  </>
                ) : (
                  l.label
                )}
              </Link>
            );
          })}
          <a href="https://github.com/RimjhimD/lofi90" className={`${link} hidden sm:flex`}>
            GitHub ↗
          </a>
          <span className="mono ml-2 hidden items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[0.62rem] text-mute xl:flex">
            <i className="led" data-on="true" style={{ width: 6, height: 6 }} /> {ENTRIES.length} live
          </span>
          <span className="ml-1 sm:ml-2">
            <ThemeToggle />
          </span>
        </nav>
      </div>
      <Ticker />
    </header>
  );
}
