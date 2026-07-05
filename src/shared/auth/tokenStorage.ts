const accessTokenKey = "shop.accessToken";
const authSessionKey = "shop.authSession";

export type StoredAuthSession = {
  userId: string;
  email: string;
  name: string;
  roles: string[];
  tokenType: string;
};

export function saveAccessToken(accessToken: string): void {
  localStorage.setItem(accessTokenKey, accessToken);
}

export function readAccessToken(): string | null {
  return localStorage.getItem(accessTokenKey);
}

export function clearAccessToken(): void {
  localStorage.removeItem(accessTokenKey);
}

export function saveAuthSession(session: StoredAuthSession): void {
  localStorage.setItem(authSessionKey, JSON.stringify(session));
}

export function readAuthSession(): StoredAuthSession | null {
  const value = localStorage.getItem(authSessionKey);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as StoredAuthSession;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function clearAuthSession(): void {
  localStorage.removeItem(authSessionKey);
}