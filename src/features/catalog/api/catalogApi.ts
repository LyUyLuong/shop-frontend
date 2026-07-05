import { apiClient } from "../../../shared/api/apiClient";
import type { PageResponse } from "../../../shared/api/apiTypes";
import type { ProductResponse, ProductSearchParams } from "./catalogTypes";

export function searchProducts(
  params: ProductSearchParams,
): Promise<PageResponse<ProductResponse>> {
  return apiClient.get<PageResponse<ProductResponse>>("/products", {
    query: params,
  });
}

export function getProduct(productId: string): Promise<ProductResponse> {
  return apiClient.get<ProductResponse>(`/products/${productId}`);
}