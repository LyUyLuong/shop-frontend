import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { authSessionExpiredEventName } from "../../shared/auth/authEvents";
import { AuthProvider } from "../../shared/auth/AuthProvider";
import {
  readAccessToken,
  saveAccessToken,
  saveAuthSession,
} from "../../shared/auth/tokenStorage";
import { RequireAuth } from "./RequireAuth";
import { RequireRole } from "./RequireRole";

describe("route guards", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("redirects unauthenticated users to login", async () => {
    renderWithAuthRoutes("/cart", {
      guard: <RequireAuth />,
      protectedPath: "/cart",
      protectedText: "Cart page",
    });

    expect(await screen.findByText("Login page")).toBeInTheDocument();
  });

  it("allows authenticated users through RequireAuth", async () => {
    storeSession(["USER"]);

    renderWithAuthRoutes("/cart", {
      guard: <RequireAuth />,
      protectedPath: "/cart",
      protectedText: "Cart page",
    });

    expect(await screen.findByText("Cart page")).toBeInTheDocument();
  });

  it("redirects non-admin users away from admin routes", async () => {
    storeSession(["USER"]);

    renderWithAuthRoutes("/admin/orders", {
      guard: <RequireRole role="ADMIN" />,
      protectedPath: "/admin/orders",
      protectedText: "Admin orders page",
    });

    expect(await screen.findByText("Forbidden page")).toBeInTheDocument();
  });

  it("allows admin users through RequireRole", async () => {
    storeSession(["ADMIN"]);

    renderWithAuthRoutes("/admin/orders", {
      guard: <RequireRole role="ADMIN" />,
      protectedPath: "/admin/orders",
      protectedText: "Admin orders page",
    });

    expect(await screen.findByText("Admin orders page")).toBeInTheDocument();
  });

  it("clears session and redirects when auth expiry event is received", async () => {
    storeSession(["USER"]);

    renderWithAuthRoutes("/cart", {
      guard: <RequireAuth />,
      protectedPath: "/cart",
      protectedText: "Cart page",
    });

    expect(await screen.findByText("Cart page")).toBeInTheDocument();

    window.dispatchEvent(new Event(authSessionExpiredEventName));

    expect(await screen.findByText("Login page")).toBeInTheDocument();
    expect(readAccessToken()).toBeNull();
  });
});

type RenderOptions = {
  guard: React.ReactElement;
  protectedPath: string;
  protectedText: string;
};

function renderWithAuthRoutes(initialPath: string, options: RenderOptions) {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route path="/forbidden" element={<div>Forbidden page</div>} />
          <Route element={options.guard}>
            <Route path={options.protectedPath} element={<div>{options.protectedText}</div>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

function storeSession(roles: string[]) {
  saveAccessToken("access-token-1");
  saveAuthSession({
    userId: "11111111-1111-4111-8111-111111111111",
    email: "user@example.com",
    name: "Demo User",
    roles,
    tokenType: "Bearer",
  });
}
