import { Link } from "react-router-dom";
import { isApiError } from "../../../shared/api/apiError";
import {
  formatDateTime,
  formatVnd,
  humanizeOrderStatus,
  shortId,
} from "../../../shared/utils/format";
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
        <p className="mt-2 text-sm text-slate-600">
          You have no orders yet. Start shopping and your orders will appear
          here.
        </p>
        <Link
          className="mt-5 inline-flex rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
          to="/products"
        >
          Browse products
        </Link>
      </Panel>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">My orders</h1>
        <p className="mt-1 text-sm text-slate-600">
          Track recent purchases and continue payment when an order is still
          pending.
        </p>
      </div>

      <div className="space-y-3">
        {orders.map((order) => (
          <Link
            className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200 hover:shadow-md"
            key={order.id}
            to={`/orders/${order.id}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-950">
                    Order #{shortId(order.id)}
                  </p>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {humanizeOrderStatus(order.status)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Placed {formatDateTime(order.createdAt)}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-xs font-medium uppercase text-slate-500">
                  Total
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-950">
                  {formatVnd(order.totalAmount)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
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