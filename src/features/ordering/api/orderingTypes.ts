export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PACKING"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";

export type OrderStatusChangeActorType = "ADMIN" | "SYSTEM";

export type PlaceOrderRequest = {
  cartId: string;
  cartVersion: number;
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

export type OrderResponse = {
  id: string;
  userId: string;
  status: OrderStatus;
  totalAmount: number;
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
  totalAmount: number;
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
