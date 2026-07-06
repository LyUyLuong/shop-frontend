export const authSessionExpiredEventName = "shop:auth-session-expired";

export function notifyAuthSessionExpired(): void {
  window.dispatchEvent(new Event(authSessionExpiredEventName));
}

export function subscribeAuthSessionExpired(handler: () => void): () => void {
  window.addEventListener(authSessionExpiredEventName, handler);

  return () => window.removeEventListener(authSessionExpiredEventName, handler);
}
