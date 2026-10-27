"use client";

import { useState } from "react";
import { click, useLoop } from "@/lib/loop";
import { DepartureBoardTable, type BoardColumn, type BoardState } from "./DepartureBoardTable";

interface Row {
  id: string;
  status: string;
  eta: string;
}

const noop = () => {};
const ROWS: Row[] = [
  { id: "1042", status: "Ready", eta: "-" },
  { id: "1043", status: "Baking", eta: "4 MIN" },
  { id: "1044", status: "Baking", eta: "9 MIN" },
];
const COLUMNS: BoardColumn<Row>[] = [
  { key: "id", header: "Order", value: (r) => `#${r.id}`, width: 5 },
  { key: "status", header: "Status", value: (r) => r.status, width: 6, tone: (r) => (r.status === "Ready" ? "ok" : "warn") },
  { key: "eta", header: "ETA", value: (r) => r.eta, width: 5, align: "right" },
];
const base = { getRowId: (r: Row) => r.id, columns: COLUMNS, caption: "Pickup counter", size: "sm" as const };
const still = (state: BoardState, rows: Row[] = ROWS) => <DepartureBoardTable {...base} rows={rows} previewState={state} onRetry={noop} />;

/** The real board on a loop: an order comes out of the oven and its cells flip. */
function Flipping() {
  const [rows, setRows] = useState(ROWS);
  const { ref, stop } = useLoop(4200, [
    [0, () => setRows(ROWS)],
    [900, click("[data-bump]")],
  ]);
  return (
    <div ref={ref} onClick={stop}>
      <button type="button" hidden data-bump onClick={() => setRows((xs) => xs.map((r) => (r.id === "1043" ? { ...r, status: "Ready", eta: "-" } : r)))} />
      <DepartureBoardTable {...base} rows={rows} holdOnHover={false} flipMs={70} />
    </div>
  );
}

/** Every state of the board. Flipping plays live; the rest hold still. */
export const DEPARTURE_BOARD_TABLE_STATES = [
  { id: "live", label: "Live", note: "Rows read like a split-flap board; a changed cell keeps a fading amber marker.", node: still("live") },
  { id: "flipping", label: "Flipping", note: "A status changes: its letters flip through the drum, left to right, to the new word.", node: <Flipping /> },
  { id: "held", label: "Held", note: "Your pointer is on the board, so updates wait. The pill says how many and can show them now.", node: still("held") },
  { id: "loading", label: "Loading", note: "Every tile spins to random letters; the table is marked busy.", node: still("loading") },
  { id: "empty", label: "Empty", note: "Nothing to show yet. New rows will flip in.", node: still("empty", []) },
  { id: "error", label: "Feed down", note: "SERVICE INTERRUPTED with a Retry button. Old rows aren't passed off as current.", node: still("error") },
  { id: "stale", label: "Stale", note: "The data is old: the board dims and says when it last updated.", node: still("stale") },
];
