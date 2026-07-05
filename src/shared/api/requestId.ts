export function createRequestId(): string {
  return crypto.randomUUID();
}

export function readResponseRequestId(response: Response): string | undefined {
  return (
    response.headers.get("X-Request-Id") ??
    response.headers.get("X-Correlation-Id") ??
    undefined
  );
}