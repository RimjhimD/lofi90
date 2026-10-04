/** The game pieces scattered on the felt, and how each one looks. Positions are % of the viewport. */

export type PieceKind = "die" | "pawn" | "chip" | "card";

export interface PieceSpec {
  kind: PieceKind;
  color: string;
  /** Left / top as % of the viewport. */
  x: number;
  y: number;
  /** How fast it drifts when you scroll: 0 = pinned, 0.4 = quick. */
  depth: number;
  /** Starting tilt in degrees. */
  tilt: number;
  /** Hide on small screens, where the felt edges are thin. */
  wide?: boolean;
}

export const PIECES: PieceSpec[] = [
  { kind: "die", color: "#FFFDF6", x: 4, y: 22, depth: 0.18, tilt: -12 },
  { kind: "pawn", color: "#3BB2F6", x: 1.5, y: 47, depth: 0.32, tilt: 0 },
  { kind: "chip", color: "#FF5D5D", x: 95, y: 58, depth: 0.24, tilt: 0 },
  { kind: "chip", color: "#FFB800", x: 2, y: 80, depth: 0.12, tilt: 0 },
  { kind: "pawn", color: "#9B5DE5", x: 93, y: 88, depth: 0.28, tilt: 0 },
  { kind: "die", color: "#FFFDF6", x: 96, y: 30, depth: 0.1, tilt: 20 },
  { kind: "card", color: "#FF5D5D", x: 88, y: 8, depth: 0.2, tilt: 14, wide: true },
  { kind: "chip", color: "#00C49A", x: 30, y: 94, depth: 0.36, tilt: 0, wide: true },
  { kind: "pawn", color: "#FFB800", x: 58, y: 3, depth: 0.3, tilt: 0, wide: true },
  { kind: "die", color: "#FFFDF6", x: 47, y: 70, depth: 0.42, tilt: 8, wide: true },
  { kind: "card", color: "#3BB2F6", x: 8, y: 64, depth: 0.26, tilt: -10, wide: true },
  { kind: "chip", color: "#9B5DE5", x: 72, y: 46, depth: 0.38, tilt: 0, wide: true },
  { kind: "pawn", color: "#00C49A", x: 20, y: 6, depth: 0.16, tilt: 0, wide: true },
];

/** Which of the 9 pip slots are filled for each face. */
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const OUTLINE = "border-4 border-ink shadow-[3px_3px_0_#20201C]";

export function PieceBody({ spec, face }: { spec: PieceSpec; face: number }) {
  if (spec.kind === "die") {
    return (
      <div className={`grid h-11 w-11 grid-cols-3 rounded-[10px] bg-paper p-[5px] ${OUTLINE}`}>
        {Array.from({ length: 9 }, (_, i) => (
          <i key={i} className="m-auto h-[7px] w-[7px] rounded-full bg-ink" style={{ visibility: PIPS[face].includes(i) ? "visible" : "hidden" }} />
        ))}
      </div>
    );
  }
  if (spec.kind === "pawn") {
    return <div className={`h-[42px] w-[30px] rounded-[50%_50%_8px_8px/40%_40%_8px_8px] ${OUTLINE}`} style={{ background: spec.color }} />;
  }
  if (spec.kind === "chip") {
    return (
      <div
        className="h-9 w-9 rounded-full border-4 border-ink shadow-[3px_3px_0_#20201C,inset_0_0_0_4px_rgba(255,255,255,.5)]"
        style={{ background: spec.color }}
      />
    );
  }
  return (
    <div className={`grid h-14 w-10 place-items-center rounded-lg bg-paper ${OUTLINE}`}>
      <span className="h-4 w-4 rotate-45 rounded-[3px] border-[3px] border-ink" style={{ background: spec.color }} />
    </div>
  );
}

export const PAWN_COLORS = ["#FF5D5D", "#FFB800", "#3BB2F6", "#9B5DE5", "#00C49A"];
