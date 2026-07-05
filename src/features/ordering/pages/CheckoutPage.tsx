import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isApiError } from "../../../shared/api/apiError";
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
        <Link className="mt-5 inline-flex text-sm font-medium text-teal-700" to="/products">
          Browse products
        </Link>
      </Panel>
    );
  }

  return (
    <section className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-950">Checkout</h1>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {isApiError(error) ? error.userMessage : "Checkout failed."}
        </div>
      )}

      {!placedOrder && cart && (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-slate-600">
            Backend will create an order from your current cart and validate stock again.
          </p>
          <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-700">
            Items in cart:{" "}
            <span className="font-semibold">
              {cart.items.reduce((total, item) => total + item.quantity, 0)}
            </span>
          </div>
          <button
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:bg-slate-300"
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
            Order created. Status: {placedOrder.status}
          </div>

          <div className="rounded-md bg-slate-50 p-4 text-sm">
            <p>Order ID: {placedOrder.id}</p>
            <p>Total: {formatVnd(placedOrder.totalAmount)}</p>
          </div>

          <button
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:bg-slate-300"
            type="button"
            disabled={payMock.isPending}
            onClick={handlePay}
          >
            {payMock.isPending ? "Processing payment..." : "Pay with mock payment"}
          </button>
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

function formatVnd(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}