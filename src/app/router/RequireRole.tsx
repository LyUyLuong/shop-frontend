import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../shared/auth/authStore";

type RequireRoleProps = {
  role: string;
};

export function RequireRole({ role }: RequireRoleProps) {
  const { hasRole, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ returnTo: location }} />;
  }

  if (!hasRole(role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}