import { apiClient } from "../../../shared/api/apiClient";
import type { PageResponse } from "../../../shared/api/apiTypes";
import type {
  AdminProductSearchParams,
  ProductResponse,
  ProductSearchParams,
  UpsertProductRequest,
} from "./catalogTypes";

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

export function searchAdminProducts(
  accessToken: string,
  params: AdminProductSearchParams,
): Promise<PageResponse<ProductResponse>> {
  return apiClient.get<PageResponse<ProductResponse>>("/admin/products", {
    accessToken,
    query: params,
  });
}

export function getAdminProduct(
  accessToken: string,
  productId: string,
): Promise<ProductResponse> {
  return apiClient.get<ProductResponse>(`/admin/products/${productId}`, {
    accessToken,
  });
}

export function createProduct(
  accessToken: string,
  request: UpsertProductRequest,
): Promise<ProductResponse> {
  return apiClient.post<ProductResponse>("/admin/products", request, {
    accessToken,
  });
}

export function updateProduct(
  accessToken: string,
  productId: string,
  request: UpsertProductRequest,
): Promise<ProductResponse> {
  return apiClient.put<ProductResponse>(`/admin/products/${productId}`, request, {
    accessToken,
  });
}

export function deactivateProduct(
  accessToken: string,
  productId: string,
): Promise<void> {
  return apiClient.delete<void>(`/admin/products/${productId}`, {
    accessToken,
  });
}

export function uploadProductImage(
  accessToken: string,
  productId: string,
  file: File,
): Promise<ProductResponse> {
  const formData = new FormData();
  formData.set("file", file);

  return apiClient.post<ProductResponse>(
    `/admin/products/${productId}/image`,
    formData,
    { accessToken },
  );
}