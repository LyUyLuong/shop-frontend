import { Link, useNavigate, useParams } from "react-router-dom";
import { isApiError } from "../../../shared/api/apiError";
import { usePayMockPayment } from "../../payment/api/paymentQueries";
import { useOrder } from "../api/orderingQueries";

export function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const orderQuery = useOrder(orderId);
  const payMock = usePayMockPayment();

  async function handlePay() {
    if (!orderQuery.data) {
      return;
    }

    const payment = await payMock.mutateAsync(orderQuery.data.id);
    navigate(`/payments/${payment.id}`);
  }

  if (orderQuery.isLoading) {
    return <Panel>Loading order...</Panel>;
  }

  if (orderQuery.error) {
    return (
      <Panel>
        <p className="text-sm text-red-700">
          {isApiError(orderQuery.error)
            ? orderQuery.error.userMessage
            : "Could not load order."}
        </p>
      </Panel>
    );
  }

  if (!orderQuery.data) {
    return <Panel>Order was not found.</Panel>;
  }

  const order = orderQuery.data;

  return (
    <section className="space-y-5">
      <Link className="text-sm font-medium text-teal-700" to="/orders">
        Back to orders
      </Link>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">Order detail</h1>
            <p className="mt-1 text-sm text-slate-500">{order.id}</p>
          </div>

          <div className="text-right">
            <p className="text-sm font-medium text-slate-700">{order.status}</p>
            <p className="mt-1 text-xl font-semibold text-slate-950">
              {formatVnd(order.totalAmount)}
            </p>
          </div>
        </div>

        {payMock.error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {isApiError(payMock.error)
              ? payMock.error.userMessage
              : "Payment failed."}
          </div>
        )}

        {order.status === "PENDING_PAYMENT" && (
          <button
            className="mt-5 rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:bg-slate-300"
            type="button"
            disabled={payMock.isPending}
            onClick={handlePay}
          >
            {payMock.isPending ? "Processing payment..." : "Pay now"}
          </button>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
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