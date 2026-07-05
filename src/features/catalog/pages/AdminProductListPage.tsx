import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { isApiError } from "../../../shared/api/apiError";
import {
  useAdminProducts,
  useDeactivateProduct,
} from "../api/catalogQueries";
import type { ProductStatus } from "../api/catalogTypes";
import { productImageSrc } from "../utils/productImage";

const pageSize = 20;

export function AdminProductListPage() {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<ProductStatus | "">("");
  const [page, setPage] = useState(0);

  const params = useMemo(
    () => ({
      keyword: keyword.trim() || undefined,
      status,
      page,
      size: pageSize,
    }),
    [keyword, page, status],
  );

  const productsQuery = useAdminProducts(params);
  const deactivateProduct = useDeactivateProduct();

  const products = productsQuery.data?.content ?? [];

  function handleStatusChange(nextStatus: ProductStatus | "") {
    setStatus(nextStatus);
    setPage(0);
  }

  function handleKeywordChange(nextKeyword: string) {
    setKeyword(nextKeyword);
    setPage(0);
  }

  async function handleDeactivate(productId: string) {
    const confirmed = window.confirm("Deactivate this product?");

    if (!confirmed) {
      return;
    }

    await deactivateProduct.mutateAsync(productId);
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Admin products</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage product records, stock, status, and product images.
          </p>
        </div>

        <Link
          className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
          to="/admin/products/new"
        >
          Create product
        </Link>
      </div>

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_180px]">
        <label className="block text-sm font-medium text-slate-700">
          Search
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            value={keyword}
            onChange={(event) => handleKeywordChange(event.target.value)}
            placeholder="SKU or name"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Status
          <select
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            value={status}
            onChange={(event) => handleStatusChange(event.target.value as ProductStatus | "")}
          >
            <option value="">All</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </label>
      </div>

      {productsQuery.error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {isApiError(productsQuery.error)
            ? productsQuery.error.userMessage
            : "Could not load admin products."}
        </div>
      )}

      {deactivateProduct.error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {isApiError(deactivateProduct.error)
            ? deactivateProduct.error.userMessage
            : "Could not deactivate product."}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {productsQuery.isLoading ? (
          <div className="p-6 text-sm text-slate-600">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="p-6 text-sm text-slate-600">No products found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => {
                  const imageSrc = productImageSrc(product);

                  return (
                    <tr key={product.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-md bg-slate-100">
                          {imageSrc ? (
                            <img
                              alt={product.name}
                              className="h-full w-full object-cover"
                              src={imageSrc}
                            />
                          ) : null}
                        </div>
                        <div>
                          <p className="font-medium text-slate-950">{product.name}</p>
                          <p className="text-xs text-slate-500">{product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{product.sku}</td>
                    <td className="px-4 py-3 font-medium text-slate-950">
                      {formatVnd(product.price)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{product.stockQuantity}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={product.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50"
                          to={`/admin/products/${product.id}`}
                        >
                          Edit
                        </Link>
                        {product.status === "ACTIVE" && (
                          <button
                            className="rounded-md border border-red-200 px-3 py-1.5 font-medium text-red-600 transition hover:bg-red-50 disabled:text-slate-300"
                            type="button"
                            disabled={deactivateProduct.isPending}
                            onClick={() => handleDeactivate(product.id)}
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {productsQuery.data && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            Page {productsQuery.data.page + 1} of {Math.max(productsQuery.data.totalPages, 1)}
          </span>
          <div className="flex gap-2">
            <button
              className="rounded-md border border-slate-300 px-3 py-1.5 disabled:text-slate-300"
              type="button"
              disabled={page === 0}
              onClick={() => setPage((current) => Math.max(current - 1, 0))}
            >
              Previous
            </button>
            <button
              className="rounded-md border border-slate-300 px-3 py-1.5 disabled:text-slate-300"
              type="button"
              disabled={!productsQuery.data.hasNext}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: ProductStatus }) {
  const className =
    status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-slate-100 text-slate-600";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      {status}
    </span>
  );
}

function formatVnd(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}