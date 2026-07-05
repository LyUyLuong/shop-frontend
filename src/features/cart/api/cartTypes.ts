export type CartResponse = {
  id: string;
  userId: string;
  items: CartItemResponse[];
  createdAt: string;
  updatedAt: string;
};

export type CartItemResponse = {
  id: string;
  productId: string;
  quantity: number;
};

export type AddCartItemRequest = {
  productId: string;
  quantity: number;
};

export type UpdateCartItemRequest = {
  quantity: number;
};