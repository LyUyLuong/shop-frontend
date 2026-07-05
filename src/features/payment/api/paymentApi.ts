import { apiClient } from "../../../shared/api/apiClient";
import type { PaymentResponse, PayMockPaymentRequest } from "./paymentTypes";

export function payMock(
  accessToken: string,
  request: PayMockPaymentRequest,
): Promise<PaymentResponse> {
  return apiClient.post<PaymentResponse>("/payments/mock", request, {
    accessToken,
  });
}

export function getPayment(
  accessToken: string,
  paymentId: string,
): Promise<PaymentResponse> {
  return apiClient.get<PaymentResponse>(`/payments/${paymentId}`, {
    accessToken,
  });
}