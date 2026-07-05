import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../shared/auth/authStore";
import { cartQueryKeys } from "../../cart/api/cartQueries";
import { getOrder, getOrders, placeOrder } from "./orderingApi";

export const orderingQueryKeys = {
  all: ["ordering"] as const,
  orders: () => [...orderingQueryKeys.all, "orders"] as const,
  order: (orderId: string) => [...orderingQueryKeys.all, "order", orderId] as const,
};

export function useOrders() {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: orderingQueryKeys.orders(),
    queryFn: () => getOrders(requireAccessToken(accessToken)),
    enabled: Boolean(accessToken),
  });
}

export function useOrder(orderId: string | undefined) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: orderingQueryKeys.order(orderId ?? ""),
    queryFn: () => getOrder(requireAccessToken(accessToken), orderId as string),
    enabled: Boolean(accessToken && orderId),
  });
}

export function usePlaceOrder() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => placeOrder(requireAccessToken(accessToken)),
    onSuccess: (order) => {
      queryClient.setQueryData(orderingQueryKeys.order(order.id), order);
      queryClient.invalidateQueries({ queryKey: orderingQueryKeys.orders() });
      queryClient.invalidateQueries({ queryKey: cartQueryKeys.current });
    },
  });
}

function requireAccessToken(accessToken: string | null): string {
  if (!accessToken) {
    throw new Error("Authentication is required.");
  }

  return accessToken;
}