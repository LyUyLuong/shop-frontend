export type OrderStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "PAID"
  | "PACKING"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

export type OrderStatusChangeActorType = "ADMIN" | "SYSTEM";

export type ShippingMethod = "STANDARD";

export type OrderPaymentMode = "MOCK" | "COD";

export type PlaceOrderRequest = {
  cartId: string;
  cartVersion: number;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  shippingMethod: ShippingMethod;
  paymentMode: OrderPaymentMode;
};

export type OrderItemResponse = {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  imageUrl?: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type OrderFulfillmentResponse = {
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  shippingMethod: ShippingMethod;
};

export type OrderResponse = {
  id: string;
  userId: string;
  status: OrderStatus;
  paymentMode?: OrderPaymentMode;
  subtotalAmount?: number;
  shippingFee?: number;
  totalAmount: number;
  fulfillment?: OrderFulfillmentResponse | null;
  items: OrderItemResponse[];
  createdAt: string;
  updatedAt: string;
};

export type AdminOrderSummaryResponse = {
  id: string;
  userId: string;
  status: OrderStatus;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminOrderDetailResponse = {
  id: string;
  userId: string;
  status: OrderStatus;
  paymentMode?: OrderPaymentMode;
  subtotalAmount?: number;
  shippingFee?: number;
  totalAmount: number;
  fulfillment?: OrderFulfillmentResponse | null;
  items: OrderItemResponse[];
  createdAt: string;
  updatedAt: string;
};

export type OrderStatusHistoryResponse = {
  id: string;
  orderId: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  actorType: OrderStatusChangeActorType;
  actorUserId: string;
  reason: string;
  createdAt: string;
};

export type AdminOrderSearchParams = {
  status?: OrderStatus | "";
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  size?: number;
};

export type ChangeOrderStatusRequest = {
  status: OrderStatus;
  reason: string;
};
