export type ProductStatus = "ACTIVE" | "INACTIVE";

export type ProductResponse = {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  status: ProductStatus;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductSearchParams = {
  keyword?: string;
  page?: number;
  size?: number;
};