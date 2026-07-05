import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearAccessToken,
  clearAuthSession,
  readAccessToken,
  readAuthSession,
  saveAccessToken,
  saveAuthSession,
  type StoredAuthSession,
} from "./tokenStorage";

export type AuthUser = {
  userId: string;
  email: string;
  name: string;
  roles: string[];
};

export type AuthSessionInput = StoredAuthSession & {
  accessToken: string;
};

export type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasRole: (role: string) => boolean;
  setAuthSession: (session: AuthSessionInput) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

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

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return value;
}