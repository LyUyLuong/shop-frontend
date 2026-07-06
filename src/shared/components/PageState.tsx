import { Link } from "react-router-dom";
import { isApiError } from "../api/apiError";

type LoadingStateProps = {
  message: string;
};

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
      {message}
    </section>
  );
}

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  actionTo,
}: EmptyStateProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
      {description && <p className="mt-2 text-sm text-slate-600">{description}</p>}
      {actionLabel && actionTo && (
        <Link
          className="mt-5 inline-flex rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
          to={actionTo}
        >
          {actionLabel}
        </Link>
      )}
    </section>
  );
}

type ErrorStateProps = {
  error: unknown;
  fallback: string;
  title?: string;
};

export function ErrorState({ error, fallback, title = "Something went wrong" }: ErrorStateProps) {
  const message = isApiError(error) ? error.userMessage : fallback;
  const requestId = isApiError(error) ? error.requestId : undefined;

  return (
    <section className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
      <h2 className="font-semibold text-red-800">{title}</h2>
      <p className="mt-1">{message}</p>
      {requestId && (
        <p className="mt-2 break-all text-xs text-red-600">
          Request ID: {requestId}
        </p>
      )}
    </section>
  );
}
