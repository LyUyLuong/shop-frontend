import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../shared/auth/authStore";
import {
  addCartItem,
  getCart,
  removeCartItem,
  updateCartItem,
} from "./cartApi";
import type { AddCartItemRequest, CartResponse } from "./cartTypes";

export const cartQueryKeys = {
  current: ["cart", "current"] as const,
};

export function useCart() {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: cartQueryKeys.current,
    queryFn: () => getCart(requireAccessToken(accessToken)),
    enabled: Boolean(accessToken),
  });
}

export function useAddCartItem() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AddCartItemRequest) =>
      addCartItem(requireAccessToken(accessToken), request),
    onSuccess: (cart) => updateCartCache(queryClient, cart),
  });
}

export function useUpdateCartItem() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { itemId: string; quantity: number }) =>
      updateCartItem(requireAccessToken(accessToken), input.itemId, {
        quantity: input.quantity,
      }),
    onSuccess: (cart) => updateCartCache(queryClient, cart),
  });
}

export function useRemoveCartItem() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) =>
      removeCartItem(requireAccessToken(accessToken), itemId),
    onSuccess: (cart) => updateCartCache(queryClient, cart),
  });
}

function updateCartCache(
  queryClient: ReturnType<typeof useQueryClient>,
  cart: CartResponse,
): void {
  queryClient.setQueryData(cartQueryKeys.current, cart);
}

function requireAccessToken(accessToken: string | null): string {
  if (!accessToken) {
    throw new Error("Authentication is required.");
  }

  return accessToken;
}