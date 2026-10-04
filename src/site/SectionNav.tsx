"use client";

import { useEffect, useState } from "react";

/** Sticky jump links under the header. The LED of the section you are reading lights up. */
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
    <nav aria-label="On this page" className="sticky top-[88px] z-30 -mx-6 mt-12 overflow-x-auto border-y border-line bg-bg/85 px-6 backdrop-blur-md lg:-mx-10 lg:px-10">
      <ul className="flex gap-1 py-1.5">
        {sections.map(([id, label]) => (
          <li key={id}>
            <a
              href={`#${id}`}
              aria-current={active === id ? "location" : undefined}
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm text-mute transition-colors hover:text-text aria-[current]:bg-panel aria-[current]:text-text focus-visible:outline-2 focus-visible:outline-acc"
            >
              <i className="led" data-on={active === id} style={{ width: 6, height: 6 }} />
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
