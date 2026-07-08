import { Link, useSearchParams } from "react-router-dom";
import { isApiError } from "../../../shared/api/apiError";
import { formatVnd } from "../../../shared/utils/format";
import { useProducts } from "../api/catalogQueries";
import type { ProductResponse } from "../api/catalogTypes";
import { productImageSrc } from "../utils/productImage";

const defaultPageSize = 12;

export function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const keyword = searchParams.get("keyword") ?? "";
  const page = Number(searchParams.get("page") ?? "0");

  const productsQuery = useProducts({
    keyword: keyword || undefined,
    page,
    size: defaultPageSize,
  });

  function updateKeyword(nextKeyword: string) {
    const nextParams = new URLSearchParams(searchParams);

    if (nextKeyword.trim()) {
      nextParams.set("keyword", nextKeyword.trim());
    } else {
      nextParams.delete("keyword");
    }

    nextParams.set("page", "0");
    setSearchParams(nextParams);
  }

  function updatePage(nextPage: number) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("page", String(nextPage));
    setSearchParams(nextParams);
  }

  const error = productsQuery.error;

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase text-teal-700">
              Shop catalog
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">
              Products
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              View available products first. Sign in only when you add items to
              cart or place an order.
            </p>
          </div>

          <label className="flex w-full flex-col gap-2 md:w-80">
            <span className="text-sm font-medium text-slate-700">Search</span>
            <input
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              defaultValue={keyword}
              placeholder="Search name or SKU"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  updateKeyword(event.currentTarget.value);
                }
              }}
            />
          </label>
        </div>
      </div>

      {productsQuery.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
              key={index}
            >
              <div className="aspect-[4/3] animate-pulse bg-slate-100" />
              <div className="space-y-3 p-4">
                <div className="h-3 w-20 rounded bg-slate-100" />
                <div className="h-4 w-4/5 rounded bg-slate-100" />
                <div className="h-4 w-28 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {isApiError(error) ? error.userMessage : "Could not load products."}
          {isApiError(error) && error.requestId && (
            <p className="mt-2 text-xs text-red-600">
              Request ID: {error.requestId}
            </p>
          )}
        </div>
      )}

      {productsQuery.data && productsQuery.data.content.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">
            No matching products
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Try another keyword or clear the search box.
          </p>
        </div>
      )}

      {productsQuery.data && productsQuery.data.content.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {productsQuery.data.content.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
            <button
              className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              disabled={productsQuery.data.page <= 0}
              onClick={() => updatePage(productsQuery.data.page - 1)}
            >
              Previous
            </button>

            <span className="text-slate-600">
              Page {productsQuery.data.page + 1} of{" "}
              {Math.max(productsQuery.data.totalPages, 1)}
            </span>

            <button
              className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              disabled={!productsQuery.data.hasNext}
              onClick={() => updatePage(productsQuery.data.page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function ProductCard({ product }: { product: ProductResponse }) {
  const imageSrc = productImageSrc(product);
  const lowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;

  return (
    <Link
      className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      to={`/products/${product.id}`}
    >
      <div className="relative aspect-[4/3] bg-slate-100">
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

        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
          {product.stockQuantity > 0 ? "Available" : "Sold out"}
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">
            {product.sku}
          </p>
          <h2 className="mt-1 line-clamp-2 text-base font-semibold text-slate-950 group-hover:text-teal-700">
            {product.name}
          </h2>
        </div>

        <div className="flex items-end justify-between gap-3">
          <p className="text-base font-bold text-slate-950">
            {formatVnd(product.price)}
          </p>
          <p
            className={`text-xs font-medium ${
              lowStock ? "text-amber-700" : "text-slate-500"
            }`}
          >
            {lowStock ? "Low stock" : `${product.stockQuantity} left`}
          </p>
        </div>
      </div>
    </Link>
  );
}