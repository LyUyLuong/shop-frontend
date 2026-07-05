import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../shared/auth/authStore";

export function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ returnTo: location }} />;
  }

  return <Outlet />;
}