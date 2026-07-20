import { apiClient } from "../../../shared/api/apiClient";
import type { PageResponse } from "../../../shared/api/apiTypes";
import type {
  AdminOrderDetailResponse,
  AdminOrderSearchParams,
  AdminOrderSummaryResponse,
  ChangeOrderStatusRequest,
  OrderResponse,
  OrderStatusHistoryResponse,
  PlaceOrderRequest,
} from "./orderingTypes";

export function placeOrder(
  accessToken: string,
  request: PlaceOrderRequest,
  idempotencyKey: string,
): Promise<OrderResponse> {
  return apiClient.post<OrderResponse>("/orders", request, {
    accessToken,
    headers: { "Idempotency-Key": idempotencyKey },
  });
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

export function searchAdminOrders(
  accessToken: string,
  params: AdminOrderSearchParams,
): Promise<PageResponse<AdminOrderSummaryResponse>> {
  return apiClient.get<PageResponse<AdminOrderSummaryResponse>>("/admin/orders", {
    accessToken,
    query: params,
  });
}

export function getAdminOrder(
  accessToken: string,
  orderId: string,
): Promise<AdminOrderDetailResponse> {
  return apiClient.get<AdminOrderDetailResponse>(`/admin/orders/${orderId}`, {
    accessToken,
  });
}

export function getAdminOrderStatusHistory(
  accessToken: string,
  orderId: string,
): Promise<OrderStatusHistoryResponse[]> {
  return apiClient.get<OrderStatusHistoryResponse[]>(
    `/admin/orders/${orderId}/status-history`,
    { accessToken },
  );
}

export function changeAdminOrderStatus(
  accessToken: string,
  orderId: string,
  request: ChangeOrderStatusRequest,
): Promise<AdminOrderDetailResponse> {
  return apiClient.patch<AdminOrderDetailResponse>(
    `/admin/orders/${orderId}/status`,
    request,
    { accessToken },
  );
}
