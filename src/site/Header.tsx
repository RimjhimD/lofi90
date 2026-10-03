import Link from "next/link";

export function Header() {
  return (
    <header className="relative z-20 mx-auto flex max-w-[1240px] items-center gap-4 px-6 py-4">
      <Link href="/" className="flex items-center gap-3 font-title text-3xl text-board title-shadow" aria-label="lofi90 home">
        <span aria-hidden="true" className="flex h-4 items-end gap-0.5">
          {[5, 8, 11, 14].map((h) => (
            <i key={h} className="block w-1 rounded-sm bg-board shadow-[2px_2px_0_#20201C]" style={{ height: h }} />
          ))}
        </span>
        lofi90
      </Link>
      <nav aria-label="Site" className="ml-auto hidden gap-2 sm:flex">
        <Link href="/" className="chunk px-4 py-1 text-[0.95rem]">Home</Link>
        <Link href="/#inbox" className="chunk px-4 py-1 text-[0.95rem]">Components</Link>
        <a href="https://github.com/RimjhimD/lofi90" className="chunk px-4 py-1 text-[0.95rem]">GitHub</a>
      </nav>
    </header>
  );
}
