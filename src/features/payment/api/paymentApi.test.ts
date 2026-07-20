import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { payMock } from "./paymentApi";

vi.mock("../../../shared/config/env", () => ({
  env: {
    apiBaseUrl: "http://localhost:8081/api/v1",
  },
}));

describe("paymentApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the order id and idempotency key for mock payment", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        success: true,
        data: { id: "payment-1", orderId: "order-1" },
        timestamp: "2026-07-20T00:00:00Z",
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await payMock(
      "access-token-1",
      { orderId: "order-1" },
      "11111111-1111-4111-8111-111111111111",
    );

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;

    expect(url).toBe("http://localhost:8081/api/v1/payments/mock");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ orderId: "order-1" });
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
