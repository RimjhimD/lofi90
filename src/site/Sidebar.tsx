"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { ENTRIES, TYPES, pad } from "@/lib/registry";

const KEY = "lofi90-side";
const listeners = new Set<() => void>();
const readOpen = () => document.documentElement.dataset.side !== "closed";
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
function setOpen(open: boolean) {
  document.documentElement.dataset.side = open ? "open" : "closed";
  try {
    localStorage.setItem(KEY, open ? "open" : "closed");
  } catch {}
  listeners.forEach((l) => l());
}

/**
 * Every component type as a console channel: LED lit when it has components, built components listed under it.
 * On wide screens an arrow folds it into a slim rail of lights (the choice is remembered).
 */
export function Sidebar() {
  const path = usePathname();
  const open = useSyncExternalStore(subscribe, readOpen, () => true);
  return (
    <aside aria-label="Component types" className="border-b border-line lg:sticky lg:top-[88px] lg:h-[calc(100vh-88px)] lg:overflow-y-auto lg:overflow-x-hidden lg:border-b-0 lg:border-r">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        title={open ? "Collapse sidebar" : "Expand sidebar"}
        className="absolute right-2 top-4 z-10 hidden h-7 w-7 place-items-center rounded-full border border-line bg-panel text-mute transition-colors hover:border-acc hover:text-acc focus-visible:outline-2 focus-visible:outline-acc lg:grid side-closed:left-1/2 side-closed:right-auto side-closed:-translate-x-1/2"
      >
        <span aria-hidden="true" className="transition-transform duration-500 side-closed:rotate-180">‹</span>
      </button>
      {/* folded: one light per type */}
      <ul className="hidden flex-col items-center gap-3 pt-16 side-closed:lg:flex">
        {TYPES.map((t, i) => {
          const on = ENTRIES.some((e) => e.type === t.id);
          return (
            <li key={t.id}>
              {on ? (
                <Link href={`/components#type-${t.id}`} title={t.id} className="mono flex flex-col items-center gap-1 text-[0.56rem] text-mute hover:text-acc focus-visible:outline-2 focus-visible:outline-acc">
                  <i className="led" data-on="true" />
                  {pad(i + 1)}
                </Link>
              ) : (
                <span title={`${t.id} · none yet`} className="mono flex flex-col items-center gap-1 text-[0.56rem] text-mute/50">
                  <i className="led" />
                  {pad(i + 1)}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <details className="group/side lg:hidden">
        <summary className="mono flex cursor-pointer list-none items-center justify-between px-5 py-3 text-mute">
          Component types <span className="transition-transform group-open/side:rotate-180">▾</span>
        </summary>
        <Channels path={path} />
      </details>
      <div className="hidden lg:block side-closed:lg:hidden">
        <Channels path={path} />
      </div>
    </aside>
  );
}

function Channels({ path }: { path: string }) {
  const row =
    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors hover:bg-panel focus-visible:outline-2 focus-visible:outline-acc aria-[current=page]:bg-panel aria-[current=page]:text-text";
  return (
    <div className="px-3 pb-10 pt-5 lg:pt-14">
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
