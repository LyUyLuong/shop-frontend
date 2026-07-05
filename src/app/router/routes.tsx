import { createBrowserRouter } from "react-router-dom";
import { LoginPage } from "../../features/auth/pages/LoginPage";
import { RegisterPage } from "../../features/auth/pages/RegisterPage";
import { CartPage } from "../../features/cart/pages/CartPage";
import { ProductDetailPage } from "../../features/catalog/pages/ProductDetailPage";
import { ProductListPage } from "../../features/catalog/pages/ProductListPage";
import { AdminLayout } from "../layout/AdminLayout";
import { AppLayout } from "../layout/AppLayout";
import { RequireAuth } from "./RequireAuth";
import { RequireRole } from "./RequireRole";
import { CheckoutPage } from "../../features/ordering/pages/CheckoutPage";
import { OrderDetailPage } from "../../features/ordering/pages/OrderDetailPage";
import { OrdersPage } from "../../features/ordering/pages/OrdersPage";
import { PaymentDetailPage } from "../../features/payment/pages/PaymentDetailPage";
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
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "products", element: <ProductListPage /> },
      {
        path: "products/:productId",
        element: <ProductDetailPage />,
      },
      { path: "forbidden", element: <RoutePlaceholder title="Access denied" /> },

      {
        element: <RequireAuth />,
        children: [
          { path: "cart", element: <CartPage /> },
          { path: "checkout", element: <CheckoutPage /> },
          { path: "orders", element: <OrdersPage /> },
          {
            path: "orders/:orderId",
            element: <OrderDetailPage />,
          },
          {
            path: "payments/:paymentId",
            element: <PaymentDetailPage />,
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