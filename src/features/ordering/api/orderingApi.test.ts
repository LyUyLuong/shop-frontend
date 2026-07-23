import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { placeOrder } from "./orderingApi";

vi.mock("../../../shared/config/env", () => ({
  env: {
    apiBaseUrl: "http://localhost:8081/api/v1",
  },
}));

describe("orderingApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the cart snapshot and idempotency key when placing an order", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        success: true,
        data: { id: "order-1" },
        timestamp: "2026-07-20T00:00:00Z",
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await placeOrder(
      "access-token-1",
      {
        cartId: "cart-1",
        cartVersion: 4,
        recipientName: "Nguyen Van A",
        recipientPhone: "0901234567",
        shippingAddress: "123 Nguyen Hue, District 1",
        shippingMethod: "STANDARD",
        paymentMode: "MOCK",
      },
      "11111111-1111-4111-8111-111111111111",
    );

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;

    expect(url).toBe("http://localhost:8081/api/v1/orders");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      cartId: "cart-1",
      cartVersion: 4,
      recipientName: "Nguyen Van A",
      recipientPhone: "0901234567",
      shippingAddress: "123 Nguyen Hue, District 1",
      shippingMethod: "STANDARD",
      paymentMode: "MOCK",
    });
    expect(headers.get("Authorization")).toBe("Bearer access-token-1");
    expect(headers.get("Idempotency-Key")).toBe(
      "11111111-1111-4111-8111-111111111111",
    );
  });
});

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
