import { apiClient } from "../../../shared/api/apiClient";
import type { OrderResponse } from "./orderingTypes";

export function placeOrder(accessToken: string): Promise<OrderResponse> {
  return apiClient.post<OrderResponse>("/orders", undefined, { accessToken });
}

export function getOrders(accessToken: string): Promise<OrderResponse[]> {
  return apiClient.get<OrderResponse[]>("/orders", { accessToken });
}

export function getOrder(
  accessToken: string,
  orderId: string,
): Promise<OrderResponse> {
  return apiClient.get<OrderResponse>(`/orders/${orderId}`, { accessToken });
}