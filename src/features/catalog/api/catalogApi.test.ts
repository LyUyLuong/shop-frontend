import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createProduct, updateProduct } from "./catalogApi";

vi.mock("../../../shared/config/env", () => ({
  env: {
    apiBaseUrl: "http://localhost:8081/api/v1",
  },
}));

const productFields = {
  sku: "SKU-001",
  name: "Product one",
  description: "Description",
  price: 125000,
  stockQuantity: 8,
};

describe("catalogApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not send an expected version when creating a product", async () => {
    const fetchMock = successfulProductFetch();
    vi.stubGlobal("fetch", fetchMock);

    await createProduct("access-token-1", productFields);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;

    expect(body).toEqual(productFields);
    expect(body).not.toHaveProperty("expectedVersion");
  });

  it("sends the expected version when updating a product", async () => {
    const fetchMock = successfulProductFetch();
    vi.stubGlobal("fetch", fetchMock);

    await updateProduct("access-token-1", "product-1", {
      ...productFields,
      expectedVersion: 7,
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toBe("http://localhost:8081/api/v1/admin/products/product-1");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual({
      ...productFields,
      expectedVersion: 7,
    });
  });
});

function successfulProductFetch() {
  return vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        success: true,
        data: { id: "product-1", version: 7 },
        timestamp: "2026-07-20T00:00:00Z",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    ),
  );
}
