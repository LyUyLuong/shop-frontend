import type { ProductResponse } from "../api/catalogTypes";

export function productImageSrc(
  product: Pick<ProductResponse, "imageUrl" | "updatedAt">,
): string | undefined {
  if (!product.imageUrl) {
    return undefined;
  }

  const separator = product.imageUrl.includes("?") ? "&" : "?";

  return `${product.imageUrl}${separator}v=${encodeURIComponent(product.updatedAt)}`;
}