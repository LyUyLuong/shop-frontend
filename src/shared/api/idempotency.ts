import { isApiError } from "./apiError";

const storagePrefix = "shop.idempotency.v1";
const generatedKeyPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const volatileKeys = new Map<string, string>();

export function placeOrderOperationId(
  cartId: string,
  cartVersion: number,
): string {
  return `place-order:${cartId}:${cartVersion}`;
}

export function payOrderOperationId(orderId: string): string {
  return `pay-order:${orderId}`;
}

export async function runIdempotentOperation<T>(
  operationId: string,
  operation: (idempotencyKey: string) => Promise<T>,
): Promise<T> {
  const idempotencyKey = getOrCreateIdempotencyKey(operationId);

  try {
    const result = await operation(idempotencyKey);
    clearIdempotencyKey(operationId);
    return result;
  } catch (error) {
    if (!shouldRetainIdempotencyKey(error)) {
      clearIdempotencyKey(operationId);
    }

    throw error;
  }
}

export function getOrCreateIdempotencyKey(operationId: string): string {
  const key = readKey(operationId);

  if (key && generatedKeyPattern.test(key)) {
    return key;
  }

  clearIdempotencyKey(operationId);

  const createdKey = crypto.randomUUID();
  writeKey(operationId, createdKey);
  return createdKey;
}

export function clearIdempotencyKey(operationId: string): void {
  const storageKey = toStorageKey(operationId);
  volatileKeys.delete(storageKey);

  try {
    sessionStorage.removeItem(storageKey);
  } catch {
    // The in-memory key is still cleared when browser storage is unavailable.
  }
}

function shouldRetainIdempotencyKey(error: unknown): boolean {
  if (!isApiError(error)) {
    return true;
  }

  return (
    error.status === 408 ||
    error.status === 425 ||
    error.status === 429 ||
    error.status >= 500
  );
}

function readKey(operationId: string): string | null {
  const storageKey = toStorageKey(operationId);

  try {
    return sessionStorage.getItem(storageKey) ?? volatileKeys.get(storageKey) ?? null;
  } catch {
    return volatileKeys.get(storageKey) ?? null;
  }
}

function writeKey(operationId: string, idempotencyKey: string): void {
  const storageKey = toStorageKey(operationId);

  try {
    sessionStorage.setItem(storageKey, idempotencyKey);
    volatileKeys.delete(storageKey);
  } catch {
    volatileKeys.set(storageKey, idempotencyKey);
  }
}

function toStorageKey(operationId: string): string {
  return `${storagePrefix}:${operationId}`;
}
