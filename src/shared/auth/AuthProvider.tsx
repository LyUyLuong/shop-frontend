import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { subscribeAuthSessionExpired } from "./authEvents";
import {
  AuthContext,
  type AuthContextValue,
  type AuthSessionInput,
  type AuthUser,
} from "./authStore";
import {
  clearAccessToken,
  clearAuthSession,
  readAccessToken,
  readAuthSession,
  saveAccessToken,
  saveAuthSession,
  type StoredAuthSession,
} from "./tokenStorage";

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    readAccessToken(),
  );
  const [storedSession, setStoredSession] = useState<StoredAuthSession | null>(
    () => readAuthSession(),
  );

  const user = useMemo<AuthUser | null>(() => {
    if (!storedSession) {
      return null;
    }

    return {
      userId: storedSession.userId,
      email: storedSession.email,
      name: storedSession.name,
      roles: storedSession.roles,
    };
  }, [storedSession]);

  const hasRole = useCallback(
    (role: string): boolean => {
      return user?.roles.includes(role) ?? false;
    },
    [user],
  );

  const setAuthSession = useCallback((session: AuthSessionInput): void => {
    const nextStoredSession: StoredAuthSession = {
      userId: session.userId,
      email: session.email,
      name: session.name,
      roles: session.roles,
      tokenType: session.tokenType,
    };

    saveAccessToken(session.accessToken);
    saveAuthSession(nextStoredSession);

    setAccessToken(session.accessToken);
    setStoredSession(nextStoredSession);
  }, []);

  const logout = useCallback((): void => {
    clearAccessToken();
    clearAuthSession();

    setAccessToken(null);
    setStoredSession(null);
  }, []);

  useEffect(() => subscribeAuthSessionExpired(logout), [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(accessToken && user),
      isAdmin: hasRole("ADMIN"),
      hasRole,
      setAuthSession,
      logout,
    }),
    [accessToken, hasRole, logout, setAuthSession, user],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
