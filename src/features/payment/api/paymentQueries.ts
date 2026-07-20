import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  payOrderOperationId,
  runIdempotentOperation,
} from "../../../shared/api/idempotency";
import { useAuth } from "../../../shared/auth/authStore";
import { orderingQueryKeys } from "../../ordering/api/orderingQueries";
import { getPayment, payMock } from "./paymentApi";

export const paymentQueryKeys = {
  all: ["payment"] as const,
  payment: (paymentId: string) =>
    [...paymentQueryKeys.all, "payment", paymentId] as const,
};

export function usePayment(paymentId: string | undefined) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: paymentQueryKeys.payment(paymentId ?? ""),
    queryFn: () => getPayment(requireAccessToken(accessToken), paymentId as string),
    enabled: Boolean(accessToken && paymentId),
  });
}

export function usePayMockPayment() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => {
      const token = requireAccessToken(accessToken);

      return runIdempotentOperation(
        payOrderOperationId(orderId),
        (idempotencyKey) => payMock(token, { orderId }, idempotencyKey),
      );
    },
    onSuccess: (payment) => {
      queryClient.setQueryData(paymentQueryKeys.payment(payment.id), payment);
      queryClient.invalidateQueries({ queryKey: orderingQueryKeys.orders() });
      queryClient.invalidateQueries({
        queryKey: orderingQueryKeys.order(payment.orderId),
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
