import { createContext, useContext } from "react";
import type { StoredAuthSession } from "./tokenStorage";

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

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return value;
}
