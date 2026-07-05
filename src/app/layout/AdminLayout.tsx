import { Link, Outlet } from "react-router-dom";

const adminLinkClass =
  "rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950";

export function AdminLayout() {
  return (
    <section className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Admin</h2>
        <nav className="mt-4 flex flex-col gap-1" aria-label="Admin navigation">
          <Link className={adminLinkClass} to="/admin/products">
            Products
          </Link>
          <Link className={adminLinkClass} to="/admin/orders">
            Orders
          </Link>
        </nav>
      </aside>

      <div className="min-w-0">
        <Outlet />
      </div>
    </section>
  );
}