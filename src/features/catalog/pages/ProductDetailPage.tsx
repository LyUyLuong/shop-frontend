import { Link, useNavigate, useParams } from "react-router-dom";
import { isApiError } from "../../../shared/api/apiError";
import { useAuth } from "../../../shared/auth/authStore";
import { formatVnd } from "../../../shared/utils/format";
import { useAddCartItem } from "../../cart/api/cartQueries";
import { useProduct } from "../api/catalogQueries";
import { productImageSrc } from "../utils/productImage";

export function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const productQuery = useProduct(productId);
  const addCartItem = useAddCartItem();

  if (productQuery.isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Loading product...
      </div>
    );
  }

  if (productQuery.error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
        {isApiError(productQuery.error)
          ? productQuery.error.userMessage
          : "Could not load product."}
        {isApiError(productQuery.error) && productQuery.error.requestId && (
          <p className="mt-2 text-xs text-red-600">
            Request ID: {productQuery.error.requestId}
          </p>
        )}
      </div>
    );
  }

  if (!productQuery.data) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Product was not found.
      </div>
    );
  }

  const product = productQuery.data;
  const imageSrc = productImageSrc(product);
  const isOutOfStock = product.stockQuantity <= 0;
  const lowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;

  async function handleAddToCart() {
    if (!isAuthenticated) {
      navigate("/login", {
        state: { returnTo: `/products/${product.id}` },
      });
      return;
    }

    try {
      await addCartItem.mutateAsync({
        productId: product.id,
        quantity: 1,
      });

      navigate("/cart");
    } catch {
      // Mutation error is rendered below.
    }
  }

  return (
    <section className="space-y-6">
      <Link className="text-sm font-medium text-teal-700" to="/products">
        Back to products
      </Link>

      <div className="grid gap-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)]">
        <div className="aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
          {imageSrc ? (
            <img
              alt={product.name}
              className="h-full w-full object-cover"
              src={imageSrc}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              No image
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">
              {product.sku}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">
              {product.name}
            </h1>
            <p className="mt-3 text-3xl font-bold text-slate-950">
              {formatVnd(product.price)}
            </p>
          </div>

          <div className="rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            {product.description || "No description has been added yet."}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span
              className={`rounded-full px-3 py-1 font-semibold ${
                isOutOfStock
                  ? "bg-red-50 text-red-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {isOutOfStock ? "Sold out" : "Available"}
            </span>
            <span
              className={`font-medium ${
                lowStock ? "text-amber-700" : "text-slate-600"
              }`}
            >
              {isOutOfStock
                ? "No stock remaining"
                : lowStock
                  ? `Only ${product.stockQuantity} left`
                  : `${product.stockQuantity} items in stock`}
            </span>
          </div>

          {addCartItem.error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {isApiError(addCartItem.error)
                ? addCartItem.error.userMessage
                : "Could not add product to cart."}
            </div>
          )}

          <div className="space-y-3">
            <button
              className="w-full rounded-md bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
              type="button"
              disabled={isOutOfStock || addCartItem.isPending}
              onClick={handleAddToCart}
            >
              {isOutOfStock
                ? "Out of stock"
                : addCartItem.isPending
                  ? "Adding..."
                  : isAuthenticated
                    ? "Add to cart"
                    : "Login to buy"}
            </button>

            {!isAuthenticated && (
              <p className="text-sm text-slate-500">
                You can browse freely. Login is required only when adding items
                to cart or placing an order.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}