import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { isApiError } from "../../../shared/api/apiError";
import { useAdminOrders } from "../api/orderingQueries";
import type { OrderStatus } from "../api/orderingTypes";

const pageSize = 20;
const statusOptions: Array<OrderStatus | ""> = [
  "",
  "PENDING_PAYMENT",
  "PAID",
  "PACKING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
];

export function AdminOrderListPage() {
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [page, setPage] = useState(0);

  const params = useMemo(
    () => ({
      status,
      createdFrom: toIsoInstant(createdFrom),
      createdTo: toIsoInstant(createdTo),
      page,
      size: pageSize,
    }),
    [createdFrom, createdTo, page, status],
  );

  const ordersQuery = useAdminOrders(params);
  const orders = ordersQuery.data?.content ?? [];

  function handleStatusChange(nextStatus: OrderStatus | "") {
    setStatus(nextStatus);
    setPage(0);
  }

  function handleCreatedFromChange(nextValue: string) {
    setCreatedFrom(nextValue);
    setPage(0);
  }

  function handleCreatedToChange(nextValue: string) {
    setCreatedTo(nextValue);
    setPage(0);
  }

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Admin orders</h1>
        <p className="mt-1 text-sm text-slate-600">
          Track paid orders, fulfillment status, and order ownership.
        </p>
      </div>

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
        <label className="block text-sm font-medium text-slate-700">
          Status
          <select
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            value={status}
            onChange={(event) => handleStatusChange(event.target.value as OrderStatus | "")}
          >
            {statusOptions.map((option) => (
              <option key={option || "ALL"} value={option}>
                {option || "All statuses"}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Created from
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            type="datetime-local"
            value={createdFrom}
            onChange={(event) => handleCreatedFromChange(event.target.value)}
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Created to
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            type="datetime-local"
            value={createdTo}
            onChange={(event) => handleCreatedToChange(event.target.value)}
          />
        </label>
      </div>

      {ordersQuery.error && (
        <ErrorAlert
          error={ordersQuery.error}
          fallback="Could not load admin orders."
        />
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {ordersQuery.isLoading ? (
          <div className="p-6 text-sm text-slate-600">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-6 text-sm text-slate-600">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-950">{shortId(order.id)}</p>
                      <p className="text-xs text-slate-500">{order.id}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{shortId(order.userId)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-700">{order.itemCount}</td>
                    <td className="px-4 py-3 font-medium text-slate-950">
                      {formatVnd(order.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Link
                          className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50"
                          to={`/admin/orders/${order.id}`}
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {ordersQuery.data && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            Page {ordersQuery.data.page + 1} of {Math.max(ordersQuery.data.totalPages, 1)}
          </span>
          <div className="flex gap-2">
            <button
              className="rounded-md border border-slate-300 px-3 py-1.5 disabled:text-slate-300"
              type="button"
              disabled={page === 0}
              onClick={() => setPage((current) => Math.max(current - 1, 0))}
            >
              Previous
            </button>
            <button
              className="rounded-md border border-slate-300 px-3 py-1.5 disabled:text-slate-300"
              type="button"
              disabled={!ordersQuery.data.hasNext}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function ErrorAlert({ error, fallback }: { error: unknown; fallback: string }) {
  if (isApiError(error)) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        <p>{error.userMessage}</p>
        {error.requestId && (
          <p className="mt-1 text-xs text-red-600">Request ID: {error.requestId}</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      {fallback}
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const className = statusBadgeClass(status);

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
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

function toIsoInstant(value: string): string | undefined {
  if (!value) {
    return undefined;
  }

  return new Date(value).toISOString();
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
