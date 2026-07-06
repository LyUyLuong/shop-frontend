import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../../../shared/components/PageState";
import {
  useAdminOrder,
  useAdminOrderStatusHistory,
  useChangeAdminOrderStatus,
} from "../api/orderingQueries";
import type { OrderStatus } from "../api/orderingTypes";

export function AdminOrderDetailPage() {
  const { orderId } = useParams();
  const orderQuery = useAdminOrder(orderId);
  const historyQuery = useAdminOrderStatusHistory(orderId);
  const changeStatus = useChangeAdminOrderStatus();
  const [reason, setReason] = useState("");

  async function handleChangeStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!orderQuery.data || !orderId) {
      return;
    }

    const nextStatus = nextFulfillmentStatus(orderQuery.data.status);

    if (!nextStatus) {
      return;
    }

    await changeStatus.mutateAsync({
      orderId,
      request: {
        status: nextStatus,
        reason: reason.trim(),
      },
    });

    setReason("");
  }

  if (orderQuery.isLoading) {
    return <LoadingState message="Loading order..." />;
  }

  if (orderQuery.error) {
    return (
      <ErrorState
        error={orderQuery.error}
        fallback="Could not load admin order."
        title="Could not load order"
      />
    );
  }

  if (!orderQuery.data) {
    return <EmptyState title="Order was not found" />;
  }

  const order = orderQuery.data;
  const nextStatus = nextFulfillmentStatus(order.status);
  const history = historyQuery.data ?? [];

  return (
    <section className="space-y-5">
      <Link className="text-sm font-medium text-teal-700" to="/admin/orders">
        Back to admin orders
      </Link>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">
              Order #{shortId(order.id)}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Customer account {shortId(order.userId)}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Order time: {formatDateTime(order.createdAt)}
            </p>
          </div>

          <div className="text-right">
            <StatusBadge status={order.status} />
            <p className="mt-3 text-xl font-semibold text-slate-950">
              {formatVnd(order.totalAmount)}
            </p>
          </div>
        </div>

        <details className="mt-5 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
          <summary className="cursor-pointer font-medium text-slate-700">
            Technical details
          </summary>
          <dl className="mt-3 space-y-2 break-all">
            <DetailRow label="Order ID" value={order.id} />
            <DetailRow label="Customer user ID" value={order.userId} />
            <DetailRow label="Updated at" value={formatDateTime(order.updatedAt)} />
          </dl>
        </details>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-950">Order items</h2>
            </div>

            {order.items.map((item) => (
              <div
                className="grid gap-3 border-b border-slate-100 p-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto]"
                key={item.id}
              >
                <div>
                  <p className="font-semibold text-slate-950">{item.productName}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.productSku}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatVnd(item.unitPrice)} x {item.quantity}
                  </p>
                </div>
                <p className="font-semibold text-slate-950">
                  {formatVnd(item.lineTotal)}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Status history</h2>

            {historyQuery.error && (
              <div className="mt-4">
                <ErrorState
                  error={historyQuery.error}
                  fallback="Could not load status history."
                  title="Could not load status history"
                />
              </div>
            )}

            {historyQuery.isLoading ? (
              <div className="mt-4">
                <LoadingState message="Loading status history..." />
              </div>
            ) : history.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">No status changes yet.</p>
            ) : (
              <ol className="mt-4 space-y-4">
                {history.map((entry) => (
                  <li className="border-l-2 border-teal-700 pl-4" key={entry.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={entry.fromStatus} />
                      <span className="text-sm text-slate-500">to</span>
                      <StatusBadge status={entry.toStatus} />
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{entry.reason}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {entry.actorType} at {formatDateTime(entry.createdAt)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Fulfillment action</h2>

          {changeStatus.error && (
            <div className="mt-4">
              <ErrorState
                error={changeStatus.error}
                fallback="Could not change order status."
                title="Could not change status"
              />
            </div>
          )}

          {nextStatus ? (
            <form className="mt-4 space-y-4" onSubmit={handleChangeStatus}>
              <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                Move order from <strong>{order.status}</strong> to <strong>{nextStatus}</strong>.
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Reason
                <textarea
                  className="mt-1 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Example: Start packing the paid order"
                />
              </label>

              <button
                className="w-full rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:bg-slate-300"
                type="submit"
                disabled={changeStatus.isPending || reason.trim().length === 0}
              >
                {changeStatus.isPending ? "Changing status..." : `Move to ${nextStatus}`}
              </button>
            </form>
          ) : (
            <p className="mt-4 text-sm text-slate-600">
              No fulfillment action is available for status {order.status}.
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}

function nextFulfillmentStatus(status: OrderStatus): OrderStatus | undefined {
  switch (status) {
    case "PAID":
      return "PACKING";
    case "PACKING":
      return "SHIPPED";
    case "SHIPPED":
      return "COMPLETED";
    default:
      return undefined;
  }
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-slate-700">{value}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const className = statusBadgeClass(status);

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      {status}
    </span>
  );
}

function statusBadgeClass(status: OrderStatus): string {
  switch (status) {
    case "PAID":
      return "bg-sky-50 text-sky-700";
    case "PACKING":
      return "bg-amber-50 text-amber-700";
    case "SHIPPED":
      return "bg-indigo-50 text-indigo-700";
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700";
    case "CANCELLED":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function shortId(value: string): string {
  return value.slice(0, 8);
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

function formatVnd(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}
