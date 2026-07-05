import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../shared/auth/authStore";
import {
  createProduct,
  deactivateProduct,
  getAdminProduct,
  getProduct,
  searchAdminProducts,
  searchProducts,
  updateProduct,
  uploadProductImage,
} from "./catalogApi";
import type {
  AdminProductSearchParams,
  ProductSearchParams,
  UpsertProductRequest,
} from "./catalogTypes";

export const catalogQueryKeys = {
  all: ["catalog"] as const,
  products: (params: ProductSearchParams) =>
    [...catalogQueryKeys.all, "products", params] as const,
  product: (productId: string) =>
    [...catalogQueryKeys.all, "product", productId] as const,
  adminProducts: (params: AdminProductSearchParams) =>
    [...catalogQueryKeys.all, "admin-products", params] as const,
  adminProduct: (productId: string) =>
    [...catalogQueryKeys.all, "admin-product", productId] as const,
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

export function useAdminProducts(params: AdminProductSearchParams) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: catalogQueryKeys.adminProducts(params),
    queryFn: () => searchAdminProducts(requireAccessToken(accessToken), params),
    enabled: Boolean(accessToken),
  });
}

export function useAdminProduct(productId: string | undefined) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: catalogQueryKeys.adminProduct(productId ?? ""),
    queryFn: () => getAdminProduct(requireAccessToken(accessToken), productId as string),
    enabled: Boolean(accessToken && productId),
  });
}

export function useCreateProduct() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpsertProductRequest) =>
      createProduct(requireAccessToken(accessToken), request),
    onSuccess: (product) => {
      queryClient.setQueryData(catalogQueryKeys.adminProduct(product.id), product);
      queryClient.invalidateQueries({ queryKey: catalogQueryKeys.all });
    },
  });
}

export function useUpdateProduct() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { productId: string; request: UpsertProductRequest }) =>
      updateProduct(requireAccessToken(accessToken), input.productId, input.request),
    onSuccess: (product) => {
      queryClient.setQueryData(catalogQueryKeys.adminProduct(product.id), product);
      queryClient.setQueryData(catalogQueryKeys.product(product.id), product);
      queryClient.invalidateQueries({ queryKey: catalogQueryKeys.all });
    },
  });
}

export function useDeactivateProduct() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) =>
      deactivateProduct(requireAccessToken(accessToken), productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogQueryKeys.all });
    },
  });
}

export function useUploadProductImage() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { productId: string; file: File }) =>
      uploadProductImage(requireAccessToken(accessToken), input.productId, input.file),
    onSuccess: (product) => {
      queryClient.setQueryData(catalogQueryKeys.adminProduct(product.id), product);
      queryClient.setQueryData(catalogQueryKeys.product(product.id), product);
      queryClient.invalidateQueries({ queryKey: catalogQueryKeys.all });
    },
  });
}

function requireAccessToken(accessToken: string | null): string {
  if (!accessToken) {
    throw new Error("Authentication is required.");
  }

  return accessToken;
}