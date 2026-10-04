"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ENTRIES, TYPES, pad } from "@/lib/registry";

/** Every component type as a console channel: LED lit when it has components, built components listed under it. */
export function Sidebar() {
  const path = usePathname();
  return (
    <aside aria-label="Component types" className="border-b border-line lg:sticky lg:top-[88px] lg:h-[calc(100vh-88px)] lg:overflow-y-auto lg:border-b-0 lg:border-r">
      <details className="group/side lg:hidden">
        <summary className="mono flex cursor-pointer list-none items-center justify-between px-5 py-3 text-mute">
          Component types <span className="transition-transform group-open/side:rotate-180">▾</span>
        </summary>
        <Channels path={path} />
      </details>
      <div className="hidden lg:block">
        <Channels path={path} />
      </div>
    </aside>
  );
}

function Channels({ path }: { path: string }) {
  const row =
    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors hover:bg-panel focus-visible:outline-2 focus-visible:outline-acc aria-[current=page]:bg-panel aria-[current=page]:text-text";
  return (
    <div className="px-3 pb-10 pt-5">
      <Link href="/components" aria-current={path === "/components" ? "page" : undefined} className={`${row} font-medium text-text`}>
        <i className="led" data-on="true" />
        All components
        <span className="mono ml-auto text-mute">{pad(ENTRIES.length)}</span>
      </Link>
      <p className="mono mb-1.5 mt-5 px-2.5 text-[0.62rem] text-mute">Types</p>
      <ul className="space-y-0.5">
        {TYPES.map((t, i) => {
          const entries = ENTRIES.filter((e) => e.type === t.id);
          return (
            <li key={t.id}>
              {entries.length ? (
                <Link href={`/components#type-${t.id}`} className={`${row} text-text`}>
                  <i className="led" data-on="true" />
                  <span className="mono text-mute">{pad(i + 1)}</span>
                  <span className="capitalize">{t.id}</span>
                  <span className="mono ml-auto text-mute">{entries.length}</span>
                </Link>
              ) : (
                <span className="flex items-center gap-2.5 px-2.5 py-1.5 text-sm text-mute/60" title="No components here yet">
                  <i className="led" />
                  <span className="mono">{pad(i + 1)}</span>
                  <span className="capitalize">{t.id}</span>
                  <span className="mono ml-auto">0</span>
                </span>
              )}
              {entries.length > 0 && (
                <ul className="mb-1 ml-[15px] border-l border-line pl-2.5">
                  {entries.map((e) => (
                    <li key={e.slug}>
                      <Link
                        href={`/components/${e.slug}`}
                        aria-current={path === `/components/${e.slug}` ? "page" : undefined}
                        className="block rounded-md px-2 py-1 text-[0.86rem] text-mute transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-acc aria-[current=page]:bg-acc/10 aria-[current=page]:text-acc"
                      >
                        {e.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
