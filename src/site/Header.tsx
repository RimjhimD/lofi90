import Link from "next/link";
import { ENTRIES, TYPES } from "@/lib/registry";

/** Logo lamp plus a row of type lamps. A type's lamp is lit when it has components. */
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-bone">
      <div className="mx-auto flex max-w-[1240px] items-center gap-6 px-6 py-3">
        <Link href="/" aria-label="lofi90 home" className="flex items-center gap-2.5 font-display text-[1.9rem] font-black leading-none tracking-wide">
          <span aria-hidden="true" className="h-3.5 w-3.5 rounded-full bg-signal shadow-[0_0_10px_#ff5a6e]" />
          LOFI90
        </Link>
        <nav aria-label="Component types" className="ml-auto hidden gap-0.5 xl:flex">
          {TYPES.map((t) => {
            const count = ENTRIES.filter((e) => e.type === t.id).length;
            return count > 0 ? (
              <Link
                key={t.id}
                href={`/#ex-${t.id}`}
                data-lamp={t.id}
                className="mono flex items-center gap-1.5 border border-transparent px-2 py-1.5 hover:border-ink focus-visible:border-ink focus-visible:outline-none"
              >
                <i className="lamp" data-on="true" style={{ width: 8, height: 8 }} />
                {t.id}
              </Link>
            ) : (
              <span key={t.id} data-lamp={t.id} className="mono flex items-center gap-1.5 px-2 py-1.5 text-muted" title="No components on this line yet">
                <i className="lamp" style={{ width: 8, height: 8 }} />
                {t.id}
              </span>
            );
          })}
        </nav>
        <a href="https://github.com/RimjhimD/lofi90" className="sb-btn ml-auto xl:ml-2">
          GitHub
        </a>
      </div>
    </header>
  );
}
