import { useQuery } from "@tanstack/react-query";
import { getProduct, searchProducts } from "./catalogApi";
import type { ProductSearchParams } from "./catalogTypes";

export const catalogQueryKeys = {
  all: ["catalog"] as const,
  products: (params: ProductSearchParams) =>
    [...catalogQueryKeys.all, "products", params] as const,
  product: (productId: string) =>
    [...catalogQueryKeys.all, "product", productId] as const,
};

export function useProducts(params: ProductSearchParams) {
  return useQuery({
    queryKey: catalogQueryKeys.products(params),
    queryFn: () => searchProducts(params),
  });
}

export function useProduct(productId: string | undefined) {
  return useQuery({
    queryKey: catalogQueryKeys.product(productId ?? ""),
    queryFn: () => getProduct(productId as string),
    enabled: Boolean(productId),
  });
}