import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { isApiError } from "../../../shared/api/apiError";
import { useAuth } from "../../../shared/auth/authStore";
import { login } from "../api/authApi";

type LocationState = {
  returnTo?: string;
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthSession } = useAuth();

  const returnTo = (location.state as LocationState | null)?.returnTo ?? "/products";

  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Password123");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const session = await login({ email, password });

      setAuthSession(session);
      navigate(returnTo, { replace: true });
    } catch (error) {
      setErrorMessage(
        isApiError(error) ? error.userMessage : "Could not login.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-950">Login</h1>
      <p className="mt-2 text-sm text-slate-600">
        Login is required when adding products to cart or placing orders.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Password
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <button
          className="w-full rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        No account?{" "}
        <Link className="font-medium text-teal-700" to="/register">
          Register
        </Link>
      </p>
    </section>
  );
}