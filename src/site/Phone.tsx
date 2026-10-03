"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ENTRIES, TYPES, type ComponentType, type Entry, typeOf } from "@/lib/registry";

type View = "menu" | "list" | "detail" | "search" | "calling";
type Key = "back" | "up" | "ok" | "home" | "down" | "new";

const KEYS: { k: Key; icon: string; hint: string; cls: string }[] = [
  { k: "back", icon: "◀", hint: "back", cls: "bg-p3" },
  { k: "up", icon: "▲", hint: "up", cls: "bg-p2" },
  { k: "ok", icon: "OK", hint: "open", cls: "bg-p1 text-white" },
  { k: "home", icon: "⌂", hint: "home", cls: "bg-p5" },
  { k: "down", icon: "▼", hint: "down", cls: "bg-p2" },
  { k: "new", icon: "★", hint: "new", cls: "bg-p4 text-white" },
];

const latestWeek = Math.max(...ENTRIES.map((e) => e.week));

function Clock() {
  const [now, setNow] = useState("");
  useEffect(() => {
    const tick = () => setNow(new Date().toTimeString().slice(0, 5));
    tick();
    const t = window.setInterval(tick, 10_000);
    return () => clearInterval(t);
  }, []);
  return <span suppressHydrationWarning>{now || "--:--"}</span>;
}

/** The home-page phone. Arrow keys, Enter and Esc drive it; typing searches by name. */
export function Phone() {
  const router = useRouter();
  const [view, setView] = useState<View>("menu");
  const [typeSel, setTypeSel] = useState(0);
  const [list, setList] = useState<Entry[]>([]);
  const [listTitle, setListTitle] = useState({ label: "", color: "#FFB800" });
  const [itemSel, setItemSel] = useState(0);
  const [query, setQuery] = useState("");
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [pressed, setPressed] = useState<Key | null>(null);
  const [calling, setCalling] = useState<Entry | null>(null);
  const screenRef = useRef<HTMLDivElement>(null);

  const typesWithCounts = TYPES.map((t) => ({ ...t, count: ENTRIES.filter((e) => e.type === t.id).length }));
  const searchHits = query
    ? ENTRIES.filter((e) => `${e.name} ${e.type} ${e.ext}`.toLowerCase().includes(query.toLowerCase()))
    : [];

  function openList(entries: Entry[], label: string, color: string) {
    setList(entries);
    setListTitle({ label, color });
    setItemSel(0);
    setView("list");
  }

  function call(entry: Entry) {
    setCalling(entry);
    setView("calling");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => router.push(`/components/${entry.slug}`), reduce ? 0 : 850);
  }

  function press(k: Key) {
    setPressed(k);
    window.setTimeout(() => setPressed(null), 120);
    setDir(k === "back" || k === "home" ? "back" : "fwd");

    if (k === "home") {
      setQuery("");
      setView("menu");
      return;
    }
    if (k === "new") {
      setQuery("");
      openList(ENTRIES.filter((e) => e.week === latestWeek), "New arrivals", "#9B5DE5");
      return;
    }
    if (view === "menu") {
      if (k === "up") setTypeSel((i) => (i + TYPES.length - 1) % TYPES.length);
      if (k === "down") setTypeSel((i) => (i + 1) % TYPES.length);
      if (k === "ok") {
        const t = typesWithCounts[typeSel];
        openList(ENTRIES.filter((e) => e.type === t.id), t.label, t.color);
      }
    } else if (view === "list" || view === "search") {
      const items = view === "search" ? searchHits : list;
      if (k === "up") setItemSel((i) => Math.max(0, i - 1));
      if (k === "down") setItemSel((i) => Math.min(Math.max(items.length - 1, 0), i + 1));
      if (k === "ok" && items[itemSel]) {
        if (view === "search") call(items[itemSel]);
        else setView("detail");
      }
      if (k === "back") {
        if (view === "search" && query.length > 1) setQuery((q) => q.slice(0, -1));
        else {
          setQuery("");
          setView("menu");
        }
      }
    } else if (view === "detail") {
      if (k === "ok") call(list[itemSel]);
      if (k === "back") setView("list");
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const map: Record<string, Key> = { ArrowUp: "up", ArrowDown: "down", Enter: "ok", Escape: "home", Backspace: "back" };
    if (map[e.key]) {
      e.preventDefault();
      press(map[e.key]);
      return;
    }
    if (/^[a-z0-9 ]$/i.test(e.key) && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      setQuery((q) => (q + e.key).slice(0, 18));
      setItemSel(0);
      setDir("fwd");
      setView("search");
    }
  }

  const visibleTypes = (() => {
    const start = Math.max(0, Math.min(typeSel - 3, TYPES.length - 7));
    return typesWithCounts.slice(start, start + 7).map((t, j) => ({ ...t, index: start + j }));
  })();

  const slide = `anim-slide ${dir === "back" ? "[--dir:-24px]" : ""}`;

  return (
    <div className="anim-phone w-[340px] max-w-full rounded-[56px_56px_72px_72px] border-[6px] border-ink bg-board px-[22px] pb-[26px] pt-7 shadow-[10px_10px_0_#20201C]">
      <div aria-hidden="true" className="mx-auto mb-4 h-2.5 w-[70px] rounded-[9px] border-[3px] border-ink bg-[repeating-linear-gradient(90deg,#20201C_0_4px,transparent_4px_8px)]" />
      <div
        ref={screenRef}
        role="application"
        aria-label="Component phone. Use arrow keys, Enter to open, Escape for home, or type to search."
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="relative h-[270px] overflow-hidden rounded-[18px] border-4 border-ink bg-paper px-2.5 pb-8 pt-2 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-p2"
      >
        <div className="mb-1.5 flex items-center justify-between text-xs font-extrabold">
          <span aria-hidden="true" className="flex h-3 items-end gap-0.5">
            {[4, 7, 10, 12].map((h) => (
              <i key={h} className="block w-1 rounded-[1px] bg-ink" style={{ height: h }} />
            ))}
          </span>
          <Clock />
          <span aria-hidden="true" className="relative h-[11px] w-[22px] rounded-[3px] border-2 border-ink after:absolute after:inset-y-px after:left-px after:right-[5px] after:bg-p5" />
        </div>

        <div key={`${view}-${listTitle.label}`} aria-live="polite">
          {view === "menu" && (
            <>
              <ScreenTitle color="#FFB800" className={slide}>Menu · or just type</ScreenTitle>
              <ul role="listbox" aria-label="Choices">
                {visibleTypes.map((t) => (
                  <Row key={t.id} selected={t.index === typeSel} color={t.color} right={`${t.count}`} className={slide}>
                    {t.label}
                  </Row>
                ))}
              </ul>
            </>
          )}

          {(view === "list" || view === "search") && (
            <>
              <ScreenTitle color={view === "search" ? "#3BB2F6" : listTitle.color} className={slide}>
                {view === "search" ? (
                  <>
                    🔎 {query}
                    <span className="anim-blink ml-0.5 inline-block h-4 w-0.5 bg-ink align-middle" />
                  </>
                ) : (
                  listTitle.label
                )}
              </ScreenTitle>
              <ul role="listbox" aria-label="Choices">
                {(view === "search" ? searchHits : list).map((e, i) => (
                  <Row key={e.slug} selected={i === itemSel} color={typeOf(e.type).color} right={e.ext} className={slide}>
                    {e.name}
                  </Row>
                ))}
                {(view === "search" ? searchHits : list).length === 0 && (
                  <li className="px-2 py-1 text-sm font-bold text-[#6b665a]">
                    {view === "search" ? "No match. Keep typing or press Esc." : "Nothing here yet. More components are on the way!"}
                  </li>
                )}
              </ul>
            </>
          )}

          {view === "detail" && list[itemSel] && <Detail entry={list[itemSel]} className={slide} />}

          {view === "calling" && calling && (
            <div className="mt-8 text-center font-title text-xl">
              <span className="anim-ring text-[2.6rem]">📞</span>
              <div>Calling {calling.ext}…</div>
              <div className="font-body text-base font-extrabold">{calling.name}</div>
            </div>
          )}
        </div>

        <div className="absolute inset-x-2.5 bottom-1.5 flex justify-between text-xs font-extrabold">
          <span>◀ Back</span>
          <span>{view === "detail" ? "OK Open page" : "OK Select"}</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2.5">
        {KEYS.map(({ k, icon, hint, cls }) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              press(k);
              screenRef.current?.focus({ preventScroll: true });
            }}
            data-down={pressed === k}
            aria-label={hint}
            className={`rounded-[18px] border-4 border-ink py-2 font-extrabold leading-none shadow-[0_5px_0_#20201C] transition-[transform,box-shadow] duration-75 hover:-translate-y-0.5 hover:shadow-[0_7px_0_#20201C] active:translate-y-1 active:shadow-[0_1px_0_#20201C] data-[down=true]:translate-y-1 data-[down=true]:shadow-[0_1px_0_#20201C] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-p2 ${cls}`}
          >
            {icon}
            <small className="block text-[0.6rem] font-bold opacity-70">{hint}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function ScreenTitle({ children, color, className }: { children: React.ReactNode; color: string; className: string }) {
  return (
    <div className={`mb-1.5 flex items-center gap-2 font-title text-lg leading-none ${className}`}>
      <i className="block h-3.5 w-3.5 rounded border-[3px] border-ink" style={{ background: color }} />
      {children}
    </div>
  );
}

function Row({
  children,
  selected,
  color,
  right,
  className,
}: {
  children: React.ReactNode;
  selected: boolean;
  color: string;
  right: string;
  className: string;
}) {
  return (
    <li
      role="option"
      aria-selected={selected}
      className={`flex items-center gap-2 rounded-[10px] px-2 py-[3px] text-[0.95rem] font-bold leading-tight ${selected ? "bg-ink text-board" : ""} ${selected ? "" : className}`}
    >
      <span
        className={`h-3 w-3 shrink-0 rounded-full border-[2.5px] border-ink ${selected ? "animate-pulse" : ""}`}
        style={{ background: color, borderColor: selected ? "#FFF6E0" : "#20201C" }}
      />
      <span className="truncate">{children}</span>
      <span className={`ml-auto text-xs font-extrabold ${selected ? "text-p2" : "opacity-60"}`}>{right}</span>
    </li>
  );
}

function Detail({ entry, className }: { entry: Entry; className: string }) {
  const t = typeOf(entry.type as ComponentType);
  return (
    <div className={`text-[0.92rem] font-bold leading-snug ${className}`}>
      <span className="mr-1 inline-block rounded-full border-[3px] border-ink px-2 text-xs font-extrabold" style={{ background: t.color }}>
        {entry.type}
      </span>
      <span className="inline-block rounded-full border-[3px] border-ink bg-paper px-2 text-xs font-extrabold">ext {entry.ext}</span>
      <div className="my-1.5 font-title text-[1.35rem] leading-tight">
        {entry.icon} {entry.name}
      </div>
      {entry.summary}
    </div>
  );
}
