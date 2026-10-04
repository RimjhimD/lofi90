"use client";

import { useEffect, useState } from "react";

/** Sticky jump links under the header. The lamp of the section you are reading lights up. */
export function SectionNav({ sections }: { sections: readonly (readonly [string, string])[] }) {
  const [active, setActive] = useState("");

  useEffect(() => {
    const els = sections.map(([id]) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (items) => {
        const visible = items.filter((i) => i.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-25% 0px -65% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  return (
    <nav aria-label="On this page" className="sticky top-[60px] z-30 -mx-6 lg:-mx-10 lg:px-10 mt-12 overflow-x-auto border-y-2 border-ink bg-bone px-6">
      <ul className="flex gap-1 py-1.5">
        {sections.map(([id, label]) => (
          <li key={id}>
            <a
              href={`#${id}`}
              aria-current={active === id ? "location" : undefined}
              className="mono flex shrink-0 items-center gap-1.5 whitespace-nowrap border border-transparent px-2.5 py-1.5 hover:border-ink aria-[current]:border-ink aria-[current]:bg-white focus-visible:outline-3 focus-visible:outline-signal"
            >
              <i className="lamp" data-on={active === id} style={{ width: 8, height: 8 }} />
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
