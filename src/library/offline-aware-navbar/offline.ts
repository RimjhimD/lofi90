"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

export type ConnectionStatus = "online" | "offline" | "slow";
/** A URL (HEAD request, any answer counts) or a function returning false / throwing when unreachable. */
export type Ping = string | (() => Promise<boolean | void> | boolean | void);

export type QueueItemStatus = "waiting" | "syncing" | "failed";

export interface QueueItem {
  id: string;
  /** Shown to people, e.g. "Order #1044 · Chloe". */
  label: string;
  status: QueueItemStatus;
  /** How many times it has been tried. */
  attempts: number;
  createdAt: number;
  /** Replay key: with `replay[key]` registered, the item survives a reload (see createOfflineQueue). */
  key?: string;
  /** Plain JSON data handed to the replay handler after a reload. */
  payload?: unknown;
  /** Message of the last error, when status is "failed". */
  error?: string;
}

export interface QueueSnapshot {
  items: readonly QueueItem[];
  /** When the last action finished saving, or null. */
  lastSyncedAt: number | null;
}

export interface FlushResult {
  saved: number;
  failed: number;
}

export interface QueueOptions {
  /** Save labels, keys and payloads to localStorage under this key. Functions are never stored. */
  storageKey?: string;
  /** How to rebuild an action after a reload: `replay[item.key](item.payload)`. Items without a handler are dropped on load. */
  replay?: Record<string, (payload: unknown) => Promise<unknown> | unknown>;
}

export interface AddOptions {
  key?: string;
  payload?: unknown;
}

const EMPTY: QueueSnapshot = { items: [], lastSyncedAt: null };
let seq = 0;

/**
 * Holds actions that could not be sent. While online, a new action runs straight away; while offline (or if the
 * request fails because the connection dropped) it waits, and the whole list replays in order on reconnect.
 * An action that fails while online is marked "failed" and stays until it is retried or removed.
 */
export class OfflineQueue {
  private snap: QueueSnapshot = EMPTY;
  private runs = new Map<string, () => Promise<unknown> | unknown>();
  private subs = new Set<() => void>();
  private online = true;
  private flushing: Promise<FlushResult> | null = null;
  private hydrated = false;

  constructor(private options: QueueOptions = {}) {}

  subscribe = (cb: () => void) => {
    this.subs.add(cb);
    return () => {
      this.subs.delete(cb);
    };
  };
  getSnapshot = () => this.snap;
  getServerSnapshot = () => EMPTY;

  /** Number of actions not yet saved (waiting, syncing or failed). */
  get count() {
    return this.snap.items.length;
  }

  isOnline() {
    return this.online;
  }

  /** Queue an action. Runs now when online; otherwise waits for reconnect. Returns the item id. */
  add(run: () => Promise<unknown> | unknown, label: string, opts: AddOptions = {}): string {
    const id = `q${Date.now().toString(36)}${(++seq).toString(36)}`;
    this.runs.set(id, run);
    this.set([...this.snap.items, { id, label, status: "waiting", attempts: 0, createdAt: Date.now(), key: opts.key, payload: opts.payload }]);
    if (this.online && !this.flushing) void this.flush();
    return id;
  }

  /** Tell the queue whether the app is online. Going from offline to online replays everything, in order. */
  setOnline(online: boolean): Promise<FlushResult> | null {
    const wasOffline = !this.online;
    this.online = online;
    if (!online) {
      // Anything mid-flight that fails now goes back to waiting (see run()).
      return null;
    }
    return wasOffline ? this.flush() : null;
  }

  /** Run every waiting action in order. Failed items are left alone (use retry). */
  flush(): Promise<FlushResult> {
    if (this.flushing) return this.flushing;
    this.flushing = (async () => {
      const result: FlushResult = { saved: 0, failed: 0 };
      for (;;) {
        if (!this.online) break;
        const next = this.snap.items.find((i) => i.status === "waiting");
        if (!next) break;
        const ok = await this.run(next.id);
        if (ok === true) result.saved++;
        else if (ok === false) result.failed++;
        else break; // connection dropped: stop and keep the rest waiting
      }
      return result;
    })().finally(() => {
      this.flushing = null;
    });
    return this.flushing;
  }

  /** Try one failed item again (or all failed items when no id is given). */
  retry(id?: string): Promise<FlushResult> {
    this.set(this.snap.items.map((i) => (i.status === "failed" && (!id || i.id === id) ? { ...i, status: "waiting", error: undefined } : i)));
    return this.online ? this.flush() : Promise.resolve({ saved: 0, failed: 0 });
  }

  /** Drop an item without running it. */
  remove(id: string) {
    this.runs.delete(id);
    this.set(this.snap.items.filter((i) => i.id !== id));
  }

  /** Load saved items from localStorage. Call once on the client (useOfflineQueue does it). */
  hydrate() {
    const { storageKey, replay } = this.options;
    if (this.hydrated || !storageKey || typeof window === "undefined") return;
    this.hydrated = true;
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]") as QueueItem[];
      const restored = saved
        .filter((i) => i.key && replay?.[i.key])
        .map((i): QueueItem => {
          this.runs.set(i.id, () => replay![i.key!](i.payload));
          return { ...i, status: i.status === "failed" ? "failed" : "waiting" };
        });
      if (restored.length) this.set([...restored, ...this.snap.items]);
      if (this.online && restored.length) void this.flush();
    } catch {
      /* unreadable storage: start empty */
    }
  }

  /** true = saved, false = failed, null = connection dropped (back to waiting). */
  private async run(id: string): Promise<boolean | null> {
    const fn = this.runs.get(id);
    this.patch(id, (i) => ({ ...i, status: "syncing", attempts: i.attempts + 1 }));
    try {
      if (!fn) throw new Error("Nothing to replay for this item.");
      await fn();
      this.runs.delete(id);
      this.snap = { ...this.snap, lastSyncedAt: Date.now() };
      this.set(this.snap.items.filter((i) => i.id !== id));
      return true;
    } catch (err) {
      const dropped = !this.online || (typeof navigator !== "undefined" && navigator.onLine === false);
      this.patch(id, (i) => (dropped ? { ...i, status: "waiting" } : { ...i, status: "failed", error: err instanceof Error ? err.message : String(err) }));
      return dropped ? null : false;
    }
  }

  private patch(id: string, fn: (i: QueueItem) => QueueItem) {
    this.set(this.snap.items.map((i) => (i.id === id ? fn(i) : i)));
  }

  private set(items: QueueItem[]) {
    this.snap = { ...this.snap, items };
    const { storageKey } = this.options;
    if (storageKey && typeof window !== "undefined") {
      try {
        const keep = items.filter((i) => i.key).map(({ id, label, status, attempts, createdAt, key, payload }) => ({ id, label, status, attempts, createdAt, key, payload }));
        window.localStorage.setItem(storageKey, JSON.stringify(keep));
      } catch {
        /* storage full or blocked: the in-memory queue still works */
      }
    }
    this.subs.forEach((cb) => cb());
  }
}

export function createOfflineQueue(options?: QueueOptions) {
  return new OfflineQueue(options);
}

/** The app-wide queue used when you don't pass one. */
export const offlineQueue = createOfflineQueue();

/** Queue an action on the shared queue. Runs now when online, otherwise waits and replays on reconnect. */
export function queueAction(fn: () => Promise<unknown> | unknown, label: string, opts?: AddOptions) {
  return offlineQueue.add(fn, label, opts);
}

/** Live view of a queue for React: items, count and per-item status, plus the actions. */
export function useOfflineQueue(queue: OfflineQueue = offlineQueue) {
  const snap = useSyncExternalStore(queue.subscribe, queue.getSnapshot, queue.getServerSnapshot);
  useEffect(() => queue.hydrate(), [queue]);
  return {
    items: snap.items,
    count: snap.items.length,
    lastSyncedAt: snap.lastSyncedAt,
    statusOf: (id: string | undefined): QueueItemStatus | "saved" => snap.items.find((i) => i.id === id)?.status ?? "saved",
    add: (fn: () => Promise<unknown> | unknown, label: string, opts?: AddOptions) => queue.add(fn, label, opts),
    retry: (id?: string) => queue.retry(id),
    remove: (id: string) => queue.remove(id),
    flush: () => queue.flush(),
  };
}

// ---- connection detection ----

const noopSub = () => () => {};

type NetInfo = { effectiveType?: string; rtt?: number; saveData?: boolean; addEventListener?: (t: string, f: () => void) => void; removeEventListener?: (t: string, f: () => void) => void };
const netInfo = () => (typeof navigator !== "undefined" ? (navigator as Navigator & { connection?: NetInfo }).connection : undefined);

const subOnline = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};
const subSlow = (cb: () => void) => {
  const c = netInfo();
  c?.addEventListener?.("change", cb);
  return () => c?.removeEventListener?.("change", cb);
};
const isSlow = () => {
  const c = netInfo();
  return !!c && (c.effectiveType === "slow-2g" || c.effectiveType === "2g" || (c.rtt ?? 0) >= 1500);
};

async function check(ping: Ping): Promise<boolean> {
  try {
    if (typeof ping === "function") return (await ping()) !== false;
    const ctrl = new AbortController();
    const t = window.setTimeout(() => ctrl.abort(), 5000);
    try {
      // Any answer, even an error page, proves the internet is there; only a network failure throws.
      await fetch(ping, { method: "HEAD", cache: "no-store", signal: ctrl.signal });
      return true;
    } finally {
      clearTimeout(t);
    }
  } catch {
    return false;
  }
}

/** Live connection status: browser events, optional heartbeat with backoff, and a "slow" hint where the browser offers one. */
export function useConnection(enabled: boolean, ping: Ping | undefined, pingInterval: number, nudge: number): ConnectionStatus {
  const browserOnline = useSyncExternalStore(enabled ? subOnline : noopSub, () => navigator.onLine, () => true);
  const slow = useSyncExternalStore(enabled ? subSlow : noopSub, isSlow, () => false);
  const [reachable, setReachable] = useState(true);
  const latestPing = useRef(ping);
  useEffect(() => {
    latestPing.current = ping;
  });
  const hasPing = !!ping;

  useEffect(() => {
    if (!enabled || !hasPing || !browserOnline) return;
    let fails = 0;
    let timer = 0;
    let alive = true;
    const beat = async () => {
      const p = latestPing.current;
      const ok = p ? await check(p) : true;
      if (!alive) return;
      setReachable(ok);
      fails = ok ? 0 : fails + 1;
      timer = window.setTimeout(beat, ok ? pingInterval : Math.min(pingInterval, 2000 * 2 ** (fails - 1)));
    };
    timer = window.setTimeout(beat, 0);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [enabled, hasPing, browserOnline, pingInterval, nudge]);

  if (!browserOnline || (hasPing && !reachable)) return "offline";
  return slow ? "slow" : "online";
}

