"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ENTRIES, TYPES, pad } from "@/lib/registry";

/** Every component type as a line on the board: lamp lit when it has components, built components listed under it. */
export function Sidebar() {
  const path = usePathname();
  const item =
    "mono flex w-full items-center gap-2.5 border border-transparent px-2.5 py-1.5 hover:border-ink focus-visible:border-ink focus-visible:outline-none aria-[current=page]:border-ink aria-[current=page]:bg-white";

  return (
    <aside aria-label="Component types" className="border-b-2 border-ink lg:sticky lg:top-[60px] lg:h-[calc(100vh-60px)] lg:overflow-y-auto lg:border-b-0 lg:border-r-2">
      <details className="group/side lg:hidden">
        <summary className="mono flex cursor-pointer list-none items-center justify-between px-5 py-3">
          Component types <span className="transition-transform group-open/side:rotate-180">▾</span>
        </summary>
        <Lines path={path} item={item} />
      </details>
      <div className="hidden lg:block">
        <Lines path={path} item={item} />
      </div>
    </aside>
  );
}

function Lines({ path, item }: { path: string; item: string }) {
  return (
    <div className="px-3 pb-10 pt-5">
      <Link href="/components" aria-current={path === "/components" ? "page" : undefined} className={item}>
        <i className="lamp" data-on="true" style={{ width: 9, height: 9 }} />
        All components
        <span className="ml-auto text-muted">{pad(ENTRIES.length)}</span>
      </Link>
      <p className="mono mt-5 mb-1.5 px-2.5 text-[0.62rem] text-muted">Exchanges</p>
      <ul>
        {TYPES.map((t, i) => {
          const entries = ENTRIES.filter((e) => e.type === t.id);
          return (
            <li key={t.id}>
              {entries.length ? (
                <Link href={`/components#ex-${t.id}`} data-lamp={t.id} className={item}>
                  <i className="lamp" data-on="true" style={{ width: 9, height: 9 }} />
                  <span className="text-muted">{pad(i + 1)}</span> {t.id}
                  <span className="ml-auto text-muted">{entries.length}</span>
                </Link>
              ) : (
                <span data-lamp={t.id} className="mono flex items-center gap-2.5 px-2.5 py-1.5 text-muted/70" title="No components on this line yet">
                  <i className="lamp" style={{ width: 9, height: 9 }} />
                  <span>{pad(i + 1)}</span> {t.id}
                  <span className="ml-auto">0</span>
                </span>
              )}
              {entries.length > 0 && (
                <ul className="mb-1 ml-[18px] border-l border-dashed border-rule pl-2">
                  {entries.map((e) => (
                    <li key={e.slug}>
                      <Link
                        href={`/components/${e.slug}`}
                        aria-current={path === `/components/${e.slug}` ? "page" : undefined}
                        className="flex items-center gap-2 border border-transparent px-2 py-1 text-[0.92rem] hover:border-ink focus-visible:border-ink focus-visible:outline-none aria-[current=page]:border-ink aria-[current=page]:bg-white"
                      >
                        <i aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-signal" />
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
