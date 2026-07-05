import { createBrowserRouter } from "react-router-dom";
import { ProductDetailPage } from "../../features/catalog/pages/ProductDetailPage";
import { ProductListPage } from "../../features/catalog/pages/ProductListPage";
import { AdminLayout } from "../layout/AdminLayout";
import { AppLayout } from "../layout/AppLayout";
import { RequireAuth } from "./RequireAuth";
import { RequireRole } from "./RequireRole";
import { RoutePlaceholder } from "./RoutePlaceholder";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <ProductListPage />,
      },
      { path: "login", element: <RoutePlaceholder title="Login" /> },
      { path: "register", element: <RoutePlaceholder title="Register" /> },
      { path: "products", element: <ProductListPage /> },
      {
        path: "products/:productId",
        element: <ProductDetailPage />,
      },
      { path: "forbidden", element: <RoutePlaceholder title="Access denied" /> },

      {
        element: <RequireAuth />,
        children: [
          { path: "cart", element: <RoutePlaceholder title="Cart" /> },
          { path: "checkout", element: <RoutePlaceholder title="Checkout" /> },
          { path: "orders", element: <RoutePlaceholder title="My orders" /> },
          {
            path: "orders/:orderId",
            element: <RoutePlaceholder title="Order detail" />,
          },
          {
            path: "payments/:paymentId",
            element: <RoutePlaceholder title="Payment detail" />,
          },
        ],
      },

      {
        path: "admin",
        element: <RequireRole role="ADMIN" />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, element: <RoutePlaceholder title="Admin" /> },
              {
                path: "products",
                element: <RoutePlaceholder title="Admin products" />,
              },
              {
                path: "products/new",
                element: <RoutePlaceholder title="Create product" />,
              },
              {
                path: "products/:productId",
                element: <RoutePlaceholder title="Edit product" />,
              },
              {
                path: "orders",
                element: <RoutePlaceholder title="Admin orders" />,
              },
              {
                path: "orders/:orderId",
                element: <RoutePlaceholder title="Admin order detail" />,
              },
            ],
          },
        ],
      },

      { path: "*", element: <RoutePlaceholder title="Page not found" /> },
    ],
  },
]);