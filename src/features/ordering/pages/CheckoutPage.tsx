import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isApiError } from "../../../shared/api/apiError";
import { useAuth } from "../../../shared/auth/authStore";
import { formatVnd, shortId } from "../../../shared/utils/format";
import { useCart } from "../../cart/api/cartQueries";
import { usePayMockPayment } from "../../payment/api/paymentQueries";
import { usePlaceOrder } from "../api/orderingQueries";
import type { OrderResponse } from "../api/orderingTypes";

export function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const cartQuery = useCart();
  const placeOrder = usePlaceOrder();
  const payMock = usePayMockPayment();

  const [placedOrder, setPlacedOrder] = useState<OrderResponse | null>(null);
  const [recipientName, setRecipientName] = useState(user?.name ?? "");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

  const cart = cartQuery.data;
  const error = placeOrder.error ?? payMock.error;

  async function handlePlaceOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!cart) {
      return;
    }

    try {
      const order = await placeOrder.mutateAsync({
        cartId: cart.id,
        cartVersion: cart.version,
        recipientName,
        recipientPhone,
        shippingAddress,
        shippingMethod: "STANDARD",
        paymentMode: "MOCK",
      });
      setPlacedOrder(order);
    } catch {
      return;
    }
  }

  async function handlePay() {
    if (!placedOrder) {
      return;
    }

    try {
      const payment = await payMock.mutateAsync(placedOrder.id);
      navigate(`/payments/${payment.id}`);
    } catch {
      return;
    }
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
        Confirm the delivery details for this order.
      </p>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {isApiError(error) ? error.userMessage : "Checkout failed."}
        </div>
      )}

      {!placedOrder && cart && (
        <form className="mt-6 space-y-5" onSubmit={handlePlaceOrder}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Recipient name
              <input
                autoComplete="name"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                maxLength={100}
                minLength={2}
                required
                value={recipientName}
                onChange={(event) => setRecipientName(event.target.value)}
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Phone number
              <input
                autoComplete="tel"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                maxLength={30}
                pattern="\+?(?:[0-9][\s().-]*){8,15}"
                required
                type="tel"
                value={recipientPhone}
                onChange={(event) => setRecipientPhone(event.target.value)}
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Shipping address
            <textarea
              autoComplete="street-address"
              className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              maxLength={500}
              minLength={10}
              required
              value={shippingAddress}
              onChange={(event) => setShippingAddress(event.target.value)}
            />
          </label>

          <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-700">
            <div className="flex justify-between">
              <span>Items in cart</span>
              <span className="font-semibold">{itemCount}</span>
            </div>
            <div className="mt-2 flex justify-between">
              <span>Shipping</span>
              <span className="font-semibold">Standard</span>
            </div>
            <div className="mt-2 flex justify-between">
              <span>Payment</span>
              <span className="font-semibold">Mock payment</span>
            </div>
          </div>

          <button
            className="w-full rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:bg-slate-300 sm:w-auto"
            type="submit"
            disabled={placeOrder.isPending}
          >
            {placeOrder.isPending ? "Placing order..." : "Place order"}
          </button>
        </form>
      )}

      {placedOrder && (
        <div className="mt-6 space-y-4">
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            Order #{shortId(placedOrder.id)} has been created and is waiting for
            payment.
          </div>

          <div className="rounded-md bg-slate-50 p-4 text-sm">
            {placedOrder.subtotalAmount !== undefined && (
              <div className="flex justify-between gap-4">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium text-slate-950">
                  {formatVnd(placedOrder.subtotalAmount)}
                </span>
              </div>
            )}
            {placedOrder.shippingFee !== undefined && (
              <div className="mt-2 flex justify-between gap-4">
                <span className="text-slate-600">Shipping</span>
                <span className="font-medium text-slate-950">
                  {formatVnd(placedOrder.shippingFee)}
                </span>
              </div>
            )}
            <div
              className={`flex justify-between gap-4 ${
                placedOrder.subtotalAmount !== undefined ||
                placedOrder.shippingFee !== undefined
                  ? "mt-3 border-t border-slate-200 pt-3"
                  : ""
              }`}
            >
              <span className="text-slate-600">Total</span>
              <span className="font-semibold text-slate-950">
                {formatVnd(placedOrder.totalAmount)}
              </span>
            </div>
          </div>

          {placedOrder.fulfillment && (
            <div className="text-sm text-slate-700">
              <p className="font-semibold text-slate-950">
                {placedOrder.fulfillment.recipientName}
              </p>
              <p className="mt-1">{placedOrder.fulfillment.recipientPhone}</p>
              <p className="mt-1 whitespace-pre-line">
                {placedOrder.fulfillment.shippingAddress}
              </p>
            </div>
          )}

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
