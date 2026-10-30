"use client";

import { OfflineAwareNavbar, QueueStatusBadge, createOfflineQueue, useOfflineQueue } from "@/library/offline-aware-navbar/OfflineAwareNavbar";

type NewOrder = { tempId: string; customer: string; total: number };

async function postOrder(order: NewOrder) {
  const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(order) });
  if (!res.ok) throw new Error(`Server said ${res.status}`); // a refusal is "failed"; a dropped connection stays "waiting"
}

// Functions can't be stored, so each saved item keeps a key + plain JSON payload and is rebuilt by key after a reload.
export const orders = createOfflineQueue({
  storageKey: "orders-queue",
  replay: { "order:create": (payload) => postOrder(payload as NewOrder) },
});

export function AppHeader({ path }: { path: string }) {
  return (
    <OfflineAwareNavbar
      brand="Acme Orders"
      links={[
        { label: "Orders", href: "/orders", active: path.startsWith("/orders") },
        { label: "Customers", href: "/customers", active: path.startsWith("/customers") },
      ]}
      queue={orders}
      ping="/api/health" // catches "connected to Wi-Fi but no internet"
    />
  );
}

export function NewOrderRow({ order, queueId }: { order: NewOrder; queueId?: string }) {
  const q = useOfflineQueue(orders);
  return (
    <li>
      {order.customer} · ${order.total.toFixed(2)} <QueueStatusBadge status={q.statusOf(queueId)} onRetry={() => q.retry(queueId)} />
    </li>
  );
}

export function addOrder(order: NewOrder) {
  return orders.add(() => postOrder(order), `Order for ${order.customer}`, { key: "order:create", payload: order });
}
