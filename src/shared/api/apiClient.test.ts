import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authSessionExpiredEventName } from "../auth/authEvents";
import { ApiError } from "./apiError";
import { apiClient } from "./apiClient";

vi.mock("../config/env", () => ({
  env: {
    apiBaseUrl: "http://localhost:8081/api/v1",
  },
}));

describe("apiClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("unwraps successful ApiResponse data", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        success: true,
        data: { id: "product-1" },
        timestamp: "2026-07-06T00:00:00Z",
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await apiClient.get<{ id: string }>("/products", {
      query: { page: 0, size: 20 },
    });

    expect(result).toEqual({ id: "product-1" });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:8081/api/v1/products?page=0&size=20");
    expect(init.method).toBe("GET");
    expect((init.headers as Headers).get("Accept")).toBe("application/json");
    expect((init.headers as Headers).get("X-Request-Id")).toBeTruthy();
  });

  it("attaches bearer token when accessToken is provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        success: true,
        data: [],
        timestamp: "2026-07-06T00:00:00Z",
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await apiClient.get<unknown[]>("/admin/orders", {
      accessToken: "access-token-1",
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Headers).get("Authorization")).toBe(
      "Bearer access-token-1",
    );
  });

  it("loads blobs from absolute URLs with bearer token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("image-bytes", {
        status: 200,
        headers: { "Content-Type": "image/jpeg" },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await apiClient.getBlob(
      "http://localhost:8081/api/v1/orders/order-1/items/item-1/image",
      { accessToken: "access-token-1" },
    );

    expect(result.type).toBe("image/jpeg");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "http://localhost:8081/api/v1/orders/order-1/items/item-1/image",
    );
    expect(init.method).toBe("GET");
    expect((init.headers as Headers).get("Accept")).toBe("image/*");
    expect((init.headers as Headers).get("Authorization")).toBe(
      "Bearer access-token-1",
    );
  });

  it("converts ApiResponse error into ApiError with requestId", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          success: false,
          error: {
            code: "COMMON_005",
            message: "Invalid value for parameter 'status'",
          },
          timestamp: "2026-07-06T00:00:00Z",
        },
        { status: 400, headers: { "X-Request-Id": "request-123" } },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(apiClient.get("/admin/orders", { query: { status: "paid" } }))
      .rejects
      .toMatchObject({
        name: "ApiError",
        status: 400,
        code: "COMMON_005",
        backendMessage: "Invalid value for parameter 'status'",
        userMessage: "The request is invalid.",
        requestId: "request-123",
      } satisfies Partial<ApiError>);
  });

  it("notifies auth layer when backend returns 401", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          success: false,
          error: {
            code: "COMMON_002",
            message: "Unauthorized",
          },
          timestamp: "2026-07-06T00:00:00Z",
        },
        { status: 401 },
      ),
    );
    const listener = vi.fn();

    vi.stubGlobal("fetch", fetchMock);
    window.addEventListener(authSessionExpiredEventName, listener);

    await expect(
      apiClient.get("/cart", { accessToken: "expired-token" }),
    ).rejects.toMatchObject({ status: 401 });

    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener(authSessionExpiredEventName, listener);
  });
});

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
}
