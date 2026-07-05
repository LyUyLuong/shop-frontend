export type PaymentMethod = "MOCK";

export type PaymentStatus = "SUCCEEDED" | "FAILED";

export type PaymentResponse = {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  paidAt?: string;
  failureReason?: string;
};

export type PayMockPaymentRequest = {
  orderId: string;
};