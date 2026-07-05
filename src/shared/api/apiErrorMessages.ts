const fallbackMessage = "Something went wrong. Please try again.";

const errorMessages: Record<string, string> = {
  COMMON_001: "Please check the submitted data.",
  COMMON_002: "Please sign in to continue.",
  COMMON_003: "You do not have permission to perform this action.",
  COMMON_004: "The requested resource was not found.",
  COMMON_005: "The request is invalid.",
  COMMON_006: "This action is not supported.",
  COMMON_999: fallbackMessage,

  AUTH_001: "This email is already registered.",
  AUTH_002: "Invalid email or password.",
  AUTH_003: "This account is disabled.",

  CATALOG_001: "Product was not found.",
  CATALOG_002: "Product SKU already exists.",
  CATALOG_003: "This product is not active.",
  CATALOG_004: "The selected product image is invalid.",
  CATALOG_005: "Could not upload product image. Please try again.",

  CART_001: "Cart item was not found.",
  CART_002: "This product cannot be added to cart.",
  CART_003: "Cart was not found.",
  CART_004: "Product stock is not enough.",

  ORDERING_001: "Your cart is empty.",
  ORDERING_002: "A product is no longer available.",
  ORDERING_003: "Product stock is not enough.",
  ORDERING_004: "Order was not found.",
  ORDERING_005: "Order cannot be paid.",
  ORDERING_006: "Order status cannot be changed to the selected status.",

  PAYMENT_001: "Order was not found.",
  PAYMENT_002: "Order cannot be paid.",
  PAYMENT_003: "This order has already been paid.",
  PAYMENT_004: "Payment was not found.",
};

export function toUserSafeMessage(code: string | undefined): string {
  if (!code) {
    return fallbackMessage;
  }

  return errorMessages[code] ?? fallbackMessage;
}