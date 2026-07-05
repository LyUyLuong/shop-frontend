import { Link, useNavigate, useParams } from "react-router-dom";
import { isApiError } from "../../../shared/api/apiError";
import { useAuth } from "../../../shared/auth/authStore";
import { useProduct } from "../api/catalogQueries";

export function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const productQuery = useProduct(productId);

  if (productQuery.isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Loading product...
      </div>
    );
  }

  if (productQuery.error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
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
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Product was not found.
      </div>
    );
  }

  const product = productQuery.data;

  function handleAddToCart() {
    if (!isAuthenticated) {
      navigate("/login", {
        state: { returnTo: `/products/${product.id}` },
      });
      return;
    }

    navigate("/cart");
  }

  return (
    <section className="space-y-6">
      <Link className="text-sm font-medium text-teal-700" to="/products">
        Back to products
      </Link>

      <div className="grid gap-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
        <div className="aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
          {product.imageUrl ? (
            <img
              alt={product.name}
              className="h-full w-full object-cover"
              src={product.imageUrl}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              No image
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {product.sku}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">
              {product.name}
            </h1>
            <p className="mt-3 text-2xl font-bold text-slate-950">
              {formatVnd(product.price)}
            </p>
          </div>

          <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">
            {product.description || "No description."}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
              {product.status}
            </span>
            <span className="text-slate-600">
              Stock: {product.stockQuantity}
            </span>
          </div>

          <button
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            type="button"
            disabled={product.stockQuantity <= 0}
            onClick={handleAddToCart}
          >
            {product.stockQuantity > 0 ? "Add to cart" : "Out of stock"}
          </button>

          {!isAuthenticated && (
            <p className="text-sm text-slate-500">
              You can browse products without signing in. Login is required when
              adding items to cart.
            </p>
          )}
        </div>
      </div>
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