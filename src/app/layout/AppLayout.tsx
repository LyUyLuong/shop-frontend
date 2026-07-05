import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../../shared/auth/authStore";

const navLinkClass =
  "text-sm font-medium text-slate-600 transition hover:text-slate-950";

export function AppLayout() {
  const { isAdmin, isAuthenticated, logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <Link className="text-xl font-bold tracking-tight text-slate-950" to="/">
            Shop
          </Link>

          <nav
            className="flex flex-wrap items-center gap-x-5 gap-y-3"
            aria-label="Main navigation"
          >
            <Link className={navLinkClass} to="/products">
              Products
            </Link>

            {isAuthenticated && (
              <>
                <Link className={navLinkClass} to="/cart">
                  Cart
                </Link>
                <Link className={navLinkClass} to="/orders">
                  My orders
                </Link>
              </>
            )}

            {isAdmin && (
              <Link className={navLinkClass} to="/admin">
                Admin
              </Link>
            )}

            {!isAuthenticated && (
              <>
                <Link className={navLinkClass} to="/login">
                  Login
                </Link>
                <Link className={navLinkClass} to="/register">
                  Register
                </Link>
              </>
            )}

            {isAuthenticated && (
              <button
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                type="button"
                onClick={logout}
              >
                Logout {user?.name}
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}