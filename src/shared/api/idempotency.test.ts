import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "./apiError";
import {
  getOrCreateIdempotencyKey,
  payOrderOperationId,
  placeOrderOperationId,
  runIdempotentOperation,
} from "./idempotency";

const firstUuid = "11111111-1111-4111-8111-111111111111";
const secondUuid = "22222222-2222-4222-8222-222222222222";
const placeOrderInput = {
  cartId: "cart-1",
  cartVersion: 4,
  recipientName: "Nguyen Van A",
  recipientPhone: "0901234567",
  shippingAddress: "123 Nguyen Hue, District 1",
  shippingMethod: "STANDARD",
  paymentMode: "MOCK",
};

describe("idempotency operation keys", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("reuses a key for the same cart snapshot and rotates after its version changes", () => {
    const randomUuid = vi
      .spyOn(crypto, "randomUUID")
      .mockReturnValueOnce(firstUuid)
      .mockReturnValueOnce(secondUuid);

    const firstOperation = placeOrderOperationId(placeOrderInput);
    const nextOperation = placeOrderOperationId({
      ...placeOrderInput,
      cartVersion: 5,
    });

    expect(getOrCreateIdempotencyKey(firstOperation)).toBe(firstUuid);
    expect(getOrCreateIdempotencyKey(firstOperation)).toBe(firstUuid);
    expect(getOrCreateIdempotencyKey(nextOperation)).toBe(secondUuid);
    expect(randomUuid).toHaveBeenCalledTimes(2);
  });

  it("canonicalizes equivalent fulfillment values into one operation identity", () => {
    const firstOperation = placeOrderOperationId({
      ...placeOrderInput,
      recipientName: "  Nguyen   Van A ",
      recipientPhone: "090-123 4567",
      shippingAddress: "  123   Nguyen Hue,   District 1 ",
    });
    const secondOperation = placeOrderOperationId(placeOrderInput);

    expect(firstOperation).toBe(secondOperation);
  });

  it("changes the operation identity when checkout fulfillment changes", () => {
    const originalOperation = placeOrderOperationId(placeOrderInput);
    const changedAddressOperation = placeOrderOperationId({
      ...placeOrderInput,
      shippingAddress: "456 Le Loi, District 1",
    });
    const changedModeOperation = placeOrderOperationId({
      ...placeOrderInput,
      paymentMode: "COD",
    });

    expect(changedAddressOperation).not.toBe(originalOperation);
    expect(changedModeOperation).not.toBe(originalOperation);
  });

  it("uses the order id as the payment operation identity", () => {
    expect(payOrderOperationId("order-1")).toBe("pay-order:order-1");
    expect(payOrderOperationId("order-2")).toBe("pay-order:order-2");
  });

  it("clears the key after a successful operation", async () => {
    vi.spyOn(crypto, "randomUUID")
      .mockReturnValueOnce(firstUuid)
      .mockReturnValueOnce(secondUuid);

    const operationId = payOrderOperationId("order-1");

    await expect(
      runIdempotentOperation(operationId, async (idempotencyKey) =>
        Promise.resolve(idempotencyKey),
      ),
    ).resolves.toBe(firstUuid);

    expect(getOrCreateIdempotencyKey(operationId)).toBe(secondUuid);
  });

  it("retains the key after an ambiguous network failure", async () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue(firstUuid);

    const operationId = placeOrderOperationId(placeOrderInput);
    const observedKeys: string[] = [];

    await expect(
      runIdempotentOperation(operationId, async (idempotencyKey) => {
        observedKeys.push(idempotencyKey);
        throw new TypeError("Failed to fetch");
      }),
    ).rejects.toThrow("Failed to fetch");

    await runIdempotentOperation(operationId, async (idempotencyKey) => {
      observedKeys.push(idempotencyKey);
      return "order-1";
    });

    expect(observedKeys).toEqual([firstUuid, firstUuid]);
  });

  it("retains the key after a server failure", async () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue(firstUuid);

    const operationId = payOrderOperationId("order-1");
    const serverError = new ApiError({ status: 503, code: "COMMON_999" });

    await expect(
      runIdempotentOperation(operationId, async () => {
        throw serverError;
      }),
    ).rejects.toBe(serverError);

    expect(getOrCreateIdempotencyKey(operationId)).toBe(firstUuid);
  });

  it("clears the key after a definitive conflict", async () => {
    vi.spyOn(crypto, "randomUUID")
      .mockReturnValueOnce(firstUuid)
      .mockReturnValueOnce(secondUuid);

    const operationId = placeOrderOperationId(placeOrderInput);
    const conflict = new ApiError({ status: 409, code: "COMMON_005" });

    await expect(
      runIdempotentOperation(operationId, async () => {
        throw conflict;
      }),
    ).rejects.toBe(conflict);

    expect(getOrCreateIdempotencyKey(operationId)).toBe(secondUuid);
  });
});
