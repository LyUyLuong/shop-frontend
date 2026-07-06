import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../shared/auth/authStore";
import { cartQueryKeys } from "../../cart/api/cartQueries";
import {
  changeAdminOrderStatus,
  getAdminOrder,
  getAdminOrderStatusHistory,
  getOrder,
  getOrders,
  placeOrder,
  searchAdminOrders,
} from "./orderingApi";
import type {
  AdminOrderSearchParams,
  ChangeOrderStatusRequest,
} from "./orderingTypes";

export const orderingQueryKeys = {
  all: ["ordering"] as const,
  orders: () => [...orderingQueryKeys.all, "orders"] as const,
  order: (orderId: string) => [...orderingQueryKeys.all, "order", orderId] as const,
  adminOrders: (params: AdminOrderSearchParams) =>
    [...orderingQueryKeys.all, "admin-orders", params] as const,
  adminOrder: (orderId: string) =>
    [...orderingQueryKeys.all, "admin-order", orderId] as const,
  adminOrderStatusHistory: (orderId: string) =>
    [...orderingQueryKeys.all, "admin-order-status-history", orderId] as const,
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

export function useAdminOrders(params: AdminOrderSearchParams) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: orderingQueryKeys.adminOrders(params),
    queryFn: () => searchAdminOrders(requireAccessToken(accessToken), params),
    enabled: Boolean(accessToken),
  });
}

export function useAdminOrder(orderId: string | undefined) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: orderingQueryKeys.adminOrder(orderId ?? ""),
    queryFn: () => getAdminOrder(requireAccessToken(accessToken), orderId as string),
    enabled: Boolean(accessToken && orderId),
  });
}

export function useAdminOrderStatusHistory(orderId: string | undefined) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: orderingQueryKeys.adminOrderStatusHistory(orderId ?? ""),
    queryFn: () =>
      getAdminOrderStatusHistory(requireAccessToken(accessToken), orderId as string),
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

export function useChangeAdminOrderStatus() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { orderId: string; request: ChangeOrderStatusRequest }) =>
      changeAdminOrderStatus(
        requireAccessToken(accessToken),
        input.orderId,
        input.request,
      ),
    onSuccess: (order) => {
      queryClient.setQueryData(orderingQueryKeys.adminOrder(order.id), order);
      queryClient.invalidateQueries({ queryKey: orderingQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: orderingQueryKeys.adminOrderStatusHistory(order.id),
      });
    },
  });
}

function requireAccessToken(accessToken: string | null): string {
  if (!accessToken) {
    throw new Error("Authentication is required.");
  }

  return accessToken;
}
