import { Link } from "react-router-dom";
import { isApiError } from "../../../shared/api/apiError";
import { useOrders } from "../api/orderingQueries";

export function OrdersPage() {
  const ordersQuery = useOrders();

  if (ordersQuery.isLoading) {
    return <Panel>Loading orders...</Panel>;
  }

  if (ordersQuery.error) {
    return (
      <Panel>
        <p className="text-sm text-red-700">
          {isApiError(ordersQuery.error)
            ? ordersQuery.error.userMessage
            : "Could not load orders."}
        </p>
      </Panel>
    );
  }

  const orders = ordersQuery.data ?? [];

  if (orders.length === 0) {
    return (
      <Panel>
        <h1 className="text-2xl font-semibold text-slate-950">My orders</h1>
        <p className="mt-2 text-sm text-slate-600">You have no orders yet.</p>
      </Panel>
    );
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-950">My orders</h1>

      {orders.map((order) => (
        <Link
          className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200"
          key={order.id}
          to={`/orders/${order.id}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-950">Order {order.id}</p>
              <p className="mt-1 text-sm text-slate-500">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-700">{order.status}</p>
              <p className="mt-1 font-semibold text-slate-950">
                {formatVnd(order.totalAmount)}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </section>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      {children}
    </section>
  );
}

function formatVnd(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}