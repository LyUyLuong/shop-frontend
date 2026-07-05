import { apiClient } from "../../../shared/api/apiClient";
import type {
  AddCartItemRequest,
  CartResponse,
  UpdateCartItemRequest,
} from "./cartTypes";

export function getCart(accessToken: string): Promise<CartResponse> {
  return apiClient.get<CartResponse>("/cart", { accessToken });
}

export function addCartItem(
  accessToken: string,
  request: AddCartItemRequest,
): Promise<CartResponse> {
  return apiClient.post<CartResponse>("/cart/items", request, { accessToken });
}

export function updateCartItem(
  accessToken: string,
  itemId: string,
  request: UpdateCartItemRequest,
): Promise<CartResponse> {
  return apiClient.put<CartResponse>(`/cart/items/${itemId}`, request, {
    accessToken,
  });
}

export function removeCartItem(
  accessToken: string,
  itemId: string,
): Promise<CartResponse> {
  return apiClient.delete<CartResponse>(`/cart/items/${itemId}`, {
    accessToken,
  });
}