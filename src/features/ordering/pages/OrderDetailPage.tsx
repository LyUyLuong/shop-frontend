import { Link, useNavigate, useParams } from "react-router-dom";
import { isApiError } from "../../../shared/api/apiError";
import {
  formatDateTime,
  formatVnd,
  humanizeOrderStatus,
  shortId,
} from "../../../shared/utils/format";
import { usePayMockPayment } from "../../payment/api/paymentQueries";
import { useOrder } from "../api/orderingQueries";
import { OrderItemImage } from "../components/OrderItemImage";

export function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const orderQuery = useOrder(orderId);
  const payMock = usePayMockPayment();

  async function handlePay() {
    if (!orderQuery.data) {
      return;
    }

    try {
      const payment = await payMock.mutateAsync(orderQuery.data.id);
      navigate(`/payments/${payment.id}`);
    } catch {
      return;
    }
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
            <p className="text-sm font-medium uppercase text-teal-700">
              Order #{shortId(order.id)}
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">
              {humanizeOrderStatus(order.status)}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Placed {formatDateTime(order.createdAt)}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs font-medium uppercase text-slate-500">Total</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">
              {formatVnd(order.totalAmount)}
            </p>
            {order.subtotalAmount !== undefined && (
              <p className="mt-2 text-xs text-slate-500">
                Subtotal {formatVnd(order.subtotalAmount)}
                {order.shippingFee !== undefined &&
                  ` + shipping ${formatVnd(order.shippingFee)}`}
              </p>
            )}
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

      {order.fulfillment && (
        <div className="grid gap-5 border-y border-slate-200 bg-white px-6 py-5 sm:grid-cols-2">
          <div>
            <h2 className="font-semibold text-slate-950">Delivery</h2>
            <p className="mt-3 text-sm font-medium text-slate-800">
              {order.fulfillment.recipientName}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {order.fulfillment.recipientPhone}
            </p>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-600">
              {order.fulfillment.shippingAddress}
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-slate-950">Order method</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <DetailRow
                label="Shipping"
                value={humanizeValue(order.fulfillment.shippingMethod)}
              />
              {order.paymentMode && (
                <DetailRow
                  label="Payment"
                  value={humanizeValue(order.paymentMode)}
                />
              )}
            </dl>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="font-semibold text-slate-950">Items</h2>
        </div>

        {order.items.map((item) => (
          <div
            className="grid gap-3 border-b border-slate-100 p-4 last:border-b-0 sm:grid-cols-[72px_minmax(0,1fr)_auto]"
            key={item.id}
          >
            <OrderItemImage imageUrl={item.imageUrl} alt={item.productName} />
            <div>
              <p className="font-semibold text-slate-950">{item.productName}</p>
              <p className="mt-1 text-xs font-medium uppercase text-slate-500">
                {item.productSku}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {formatVnd(item.unitPrice)} x {item.quantity}
              </p>
            </div>
            <p className="font-semibold text-slate-950">
              {formatVnd(item.lineTotal)}
            </p>
          </div>
        ))}
      </div>

      <details className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
        <summary className="cursor-pointer font-medium text-slate-700">
          Technical reference
        </summary>
        <p className="mt-3 break-all">Order ID: {order.id}</p>
      </details>
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function humanizeValue(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}
