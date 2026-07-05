import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { isApiError } from "../../../shared/api/apiError";
import {
  getProduct,
} from "../../catalog/api/catalogApi";
import {
  catalogQueryKeys,
} from "../../catalog/api/catalogQueries";
import type { ProductResponse } from "../../catalog/api/catalogTypes";
import {
  useCart,
  useRemoveCartItem,
  useUpdateCartItem,
} from "../api/cartQueries";

export function CartPage() {
  const cartQuery = useCart();
  const updateCartItem = useUpdateCartItem();
  const removeCartItem = useRemoveCartItem();

  const cart = cartQuery.data;
  const productIds = useMemo(
    () => cart?.items.map((item) => item.productId) ?? [],
    [cart],
  );

  const productQueries = useQueries({
    queries: productIds.map((productId) => ({
      queryKey: catalogQueryKeys.product(productId),
      queryFn: () => getProduct(productId),
      enabled: Boolean(cart),
    })),
  });

  const productsById = useMemo(() => {
    const products = new Map<string, ProductResponse>();

    productQueries.forEach((query, index) => {
      if (query.data) {
        products.set(productIds[index], query.data);
      }
    });

    return products;
  }, [productIds, productQueries]);

  const isProductLoading = productQueries.some((query) => query.isLoading);
  const hasProductError = productQueries.some((query) => query.isError);

  const totalAmount =
    cart?.items.reduce((total, item) => {
      const product = productsById.get(item.productId);

      if (!product) {
        return total;
      }

      return total + product.price * item.quantity;
    }, 0) ?? 0;

  const mutationError = updateCartItem.error ?? removeCartItem.error;
  const isChanging = updateCartItem.isPending || removeCartItem.isPending;

  if (cartQuery.isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Loading cart...
      </div>
    );
  }

  if (cartQuery.error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {isApiError(cartQuery.error)
          ? cartQuery.error.userMessage
          : "Could not load cart."}
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">Your cart is empty</h1>
        <p className="mt-2 text-sm text-slate-600">
          Browse products and add something to your cart.
        </p>
        <Link
          className="mt-5 inline-flex rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
          to="/products"
        >
          Browse products
        </Link>
      </section>
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Cart</h1>
          <p className="mt-1 text-sm text-slate-600">
            Review quantities before checkout.
          </p>
        </div>

        {mutationError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {isApiError(mutationError)
              ? mutationError.userMessage
              : "Could not update cart."}
          </div>
        )}

        {cart.items.map((item) => {
          const product = productsById.get(item.productId);
          const lineTotal = product ? product.price * item.quantity : undefined;

          return (
            <article
              className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[96px_minmax(0,1fr)_auto]"
              key={item.id}
            >
              <div className="aspect-square overflow-hidden rounded-md bg-slate-100">
                {product?.imageUrl ? (
                  <img
                    alt={product.name}
                    className="h-full w-full object-cover"
                    src={product.imageUrl}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-500">
                    No image
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <h2 className="font-semibold text-slate-950">
                  {product?.name ?? "Loading product..."}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Product ID: {item.productId}
                </p>
                {product && (
                  <p className="mt-2 text-sm text-slate-700">
                    {formatVnd(product.price)} each
                  </p>
                )}
                {lineTotal !== undefined && (
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    Line total: {formatVnd(lineTotal)}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                <div className="flex items-center rounded-md border border-slate-300">
                  <button
                    className="px-3 py-2 text-sm font-semibold text-slate-700 disabled:text-slate-300"
                    type="button"
                    disabled={isChanging || item.quantity <= 1}
                    onClick={() =>
                      updateCartItem.mutate({
                        itemId: item.id,
                        quantity: item.quantity - 1,
                      })
                    }
                  >
                    -
                  </button>
                  <span className="min-w-10 border-x border-slate-300 px-3 py-2 text-center text-sm">
                    {item.quantity}
                  </span>
                  <button
                    className="px-3 py-2 text-sm font-semibold text-slate-700 disabled:text-slate-300"
                    type="button"
                    disabled={isChanging}
                    onClick={() =>
                      updateCartItem.mutate({
                        itemId: item.id,
                        quantity: item.quantity + 1,
                      })
                    }
                  >
                    +
                  </button>
                </div>

                <button
                  className="text-sm font-medium text-red-600 hover:text-red-700 disabled:text-slate-300"
                  type="button"
                  disabled={isChanging}
                  onClick={() => removeCartItem.mutate(item.id)}
                >
                  Remove
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Summary</h2>

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Items</span>
            <span className="font-medium text-slate-950">
              {cart.items.reduce((total, item) => total + item.quantity, 0)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-600">Subtotal</span>
            <span className="font-semibold text-slate-950">
              {isProductLoading ? "Loading..." : formatVnd(totalAmount)}
            </span>
          </div>
        </div>

        {hasProductError && (
          <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            Some cart products could not be loaded. Checkout is disabled until
            the cart is fixed.
          </p>
        )}

        <Link
          className={`mt-5 flex w-full justify-center rounded-md px-4 py-2 text-sm font-semibold ${
            hasProductError || isProductLoading
              ? "pointer-events-none bg-slate-300 text-white"
              : "bg-teal-700 text-white transition hover:bg-teal-800"
          }`}
          to="/checkout"
        >
          Checkout
        </Link>
      </aside>
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