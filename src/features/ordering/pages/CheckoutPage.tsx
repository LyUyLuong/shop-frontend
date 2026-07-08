import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isApiError } from "../../../shared/api/apiError";
import { formatVnd, shortId } from "../../../shared/utils/format";
import { useCart } from "../../cart/api/cartQueries";
import { usePayMockPayment } from "../../payment/api/paymentQueries";
import { usePlaceOrder } from "../api/orderingQueries";
import type { OrderResponse } from "../api/orderingTypes";

export function CheckoutPage() {
  const navigate = useNavigate();
  const cartQuery = useCart();
  const placeOrder = usePlaceOrder();
  const payMock = usePayMockPayment();

  const [placedOrder, setPlacedOrder] = useState<OrderResponse | null>(null);

  const cart = cartQuery.data;
  const error = placeOrder.error ?? payMock.error;

  async function handlePlaceOrder() {
    const order = await placeOrder.mutateAsync();
    setPlacedOrder(order);
  }

  async function handlePay() {
    if (!placedOrder) {
      return;
    }

    const payment = await payMock.mutateAsync(placedOrder.id);
    navigate(`/payments/${payment.id}`);
  }

  if (cartQuery.isLoading) {
    return <Panel>Loading checkout...</Panel>;
  }

  if (!placedOrder && (!cart || cart.items.length === 0)) {
    return (
      <Panel>
        <h1 className="text-2xl font-semibold text-slate-950">Checkout</h1>
        <p className="mt-2 text-sm text-slate-600">Your cart is empty.</p>
        <Link
          className="mt-5 inline-flex rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
          to="/products"
        >
          Browse products
        </Link>
      </Panel>
    );
  }

  const itemCount = cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;

  return (
    <section className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-950">Checkout</h1>
      <p className="mt-2 text-sm text-slate-600">
        The backend creates the order from your current cart and validates stock
        again before saving it.
      </p>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {isApiError(error) ? error.userMessage : "Checkout failed."}
        </div>
      )}

      {!placedOrder && cart && (
        <div className="mt-6 space-y-4">
          <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-700">
            <div className="flex justify-between">
              <span>Items in cart</span>
              <span className="font-semibold">{itemCount}</span>
            </div>
          </div>
          <button
            className="w-full rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:bg-slate-300 sm:w-auto"
            type="button"
            disabled={placeOrder.isPending}
            onClick={handlePlaceOrder}
          >
            {placeOrder.isPending ? "Placing order..." : "Place order"}
          </button>
        </div>
      )}

      {placedOrder && (
        <div className="mt-6 space-y-4">
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            Order #{shortId(placedOrder.id)} has been created and is waiting for
            payment.
          </div>

          <div className="rounded-md bg-slate-50 p-4 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-slate-600">Total</span>
              <span className="font-semibold text-slate-950">
                {formatVnd(placedOrder.totalAmount)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:bg-slate-300"
              type="button"
              disabled={payMock.isPending}
              onClick={handlePay}
            >
              {payMock.isPending ? "Processing payment..." : "Pay with mock payment"}
            </button>

            <Link
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              to={`/orders/${placedOrder.id}`}
            >
              View order
            </Link>
          </div>
        </div>
      )}
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