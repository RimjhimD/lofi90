"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DepartureBoardTable, type BoardColumn } from "@/library/departure-board-table/DepartureBoardTable";

interface Ticket {
  id: string;
  subject: string;
  assignee: string;
  status: "Open" | "Waiting" | "Solved";
}

const COLUMNS: BoardColumn<Ticket>[] = [
  { key: "id", header: "Ticket", value: (t) => t.id, width: 6 },
  { key: "subject", header: "Subject", value: (t) => t.subject, width: 18 },
  { key: "assignee", header: "Agent", value: (t) => t.assignee, width: 8 },
  { key: "status", header: "Status", value: (t) => t.status, width: 7, tone: (t) => (t.status === "Solved" ? "ok" : t.status === "Waiting" ? "warn" : "neutral") },
];

// Poll the support queue. The board diffs by ticket id, flips only what changed,
// holds updates while an agent is reading it, and tells screen readers in short batches.
export function SupportQueueBoard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number>();

  const seq = useRef(0);

  // Each load gets a number; a slow answer that comes back after a newer one is ignored,
  // so the board never rolls back to older data.
  const load = useCallback(async () => {
    const mine = ++seq.current;
    try {
      const res = await fetch("/api/tickets?status=active");
      if (!res.ok) throw new Error(String(res.status));
      const data: Ticket[] = await res.json();
      if (mine !== seq.current) return;
      setTickets(data);
      setUpdatedAt(Date.now());
      setError(false);
    } catch {
      if (mine === seq.current) setError(true);
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, []);

  // Poll by chaining: the next request starts 5 s after the last one finished, so they never overlap.
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      await load();
      if (alive) timer = setTimeout(tick, 5000);
    };
    timer = setTimeout(tick, 0);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [load]);

  return (
    <DepartureBoardTable
      caption="Support queue"
      rows={tickets}
      getRowId={(t) => t.id}
      rowLabel={(t) => `Ticket ${t.id}`}
      columns={COLUMNS}
      loading={loading}
      error={error}
      onRetry={() => {
        setLoading(true);
        load();
      }}
      updatedAt={updatedAt}
      staleAfterMs={30000}
      sortBy={{ key: "status", dir: "asc" }}
      labels={{ empty: "QUEUE CLEAR", emptyHint: "No open tickets right now." }}
    />
  );
}
