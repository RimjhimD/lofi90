const DIE_FACES: Record<number, number[]> = { 5: [0, 2, 4, 6, 8], 3: [2, 4, 6] };

function Die({ face, style }: { face: 5 | 3; style: React.CSSProperties }) {
  return (
    <div
      className="absolute grid h-11 w-11 grid-cols-3 rounded-[10px] border-4 border-ink bg-paper p-[5px] shadow-[3px_3px_0_#20201C]"
      style={{ animation: "floaty var(--d) ease-in-out infinite", ...style }}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <i key={i} className="m-auto h-[7px] w-[7px] rounded-full bg-ink" style={{ visibility: DIE_FACES[face].includes(i) ? "visible" : "hidden" }} />
      ))}
    </div>
  );
}

/** Game pieces drifting on the felt. Decorative only. */
export function FloatingPieces() {
  const float = (d: string, dl = "0s", extra: React.CSSProperties = {}) =>
    ({ ["--d" as string]: d, animation: `floaty ${d} ease-in-out ${dl} infinite`, ...extra }) as React.CSSProperties;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <Die face={5} style={{ left: "4%", top: "24%", ["--d" as string]: "8s", ["--r0" as string]: "-12deg", ["--r1" as string]: "10deg" }} />
      <div className="absolute h-[42px] w-[30px] rounded-[50%_50%_8px_8px/40%_40%_8px_8px] border-4 border-ink bg-p3 shadow-[3px_3px_0_#20201C]" style={float("10s", "-2s", { left: "1.5%", top: "46%" })} />
      <div className="absolute h-9 w-9 rounded-full border-4 border-ink bg-p1 shadow-[3px_3px_0_#20201C,inset_0_0_0_4px_rgba(255,255,255,.5)]" style={float("7s", "-1s", { right: "3%", top: "58%" })} />
      <div className="absolute h-9 w-9 rounded-full border-4 border-ink bg-p2 shadow-[3px_3px_0_#20201C,inset_0_0_0_4px_rgba(255,255,255,.5)]" style={float("9s", "-3s", { left: "2%", top: "80%" })} />
      <div className="absolute h-[42px] w-[30px] rounded-[50%_50%_8px_8px/40%_40%_8px_8px] border-4 border-ink bg-p4 shadow-[3px_3px_0_#20201C]" style={float("11s", "0s", { right: "6%", top: "88%" })} />
      <Die face={3} style={{ right: "1.5%", top: "30%", ["--d" as string]: "12s", animationDelay: "-5s", ["--r0" as string]: "20deg", ["--r1" as string]: "-8deg" }} />
    </div>
  );
}
