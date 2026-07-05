import { Link, useParams } from "react-router-dom";
import { isApiError } from "../../../shared/api/apiError";
import { usePayment } from "../api/paymentQueries";

export function PaymentDetailPage() {
  const { paymentId } = useParams();
  const paymentQuery = usePayment(paymentId);

  if (paymentQuery.isLoading) {
    return <Panel>Loading payment...</Panel>;
  }

  if (paymentQuery.error) {
    return (
      <Panel>
        <p className="text-sm text-red-700">
          {isApiError(paymentQuery.error)
            ? paymentQuery.error.userMessage
            : "Could not load payment."}
        </p>
      </Panel>
    );
  }

  if (!paymentQuery.data) {
    return <Panel>Payment was not found.</Panel>;
  }

  const payment = paymentQuery.data;
  const succeeded = payment.status === "SUCCEEDED";

  return (
    <section className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div
        className={`rounded-md p-4 ${
          succeeded
            ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border border-red-200 bg-red-50 text-red-800"
        }`}
      >
        <h1 className="text-2xl font-semibold">
          {succeeded ? "Payment succeeded" : "Payment failed"}
        </h1>
        <p className="mt-2 text-sm">Status: {payment.status}</p>
      </div>

      <dl className="mt-6 space-y-3 text-sm">
        <Row label="Payment ID" value={payment.id} />
        <Row label="Order ID" value={payment.orderId} />
        <Row label="Method" value={payment.method} />
        <Row label="Amount" value={formatVnd(payment.amount)} />
        {payment.paidAt && (
          <Row label="Paid at" value={new Date(payment.paidAt).toLocaleString()} />
        )}
        {payment.failureReason && (
          <Row label="Failure reason" value={payment.failureReason} />
        )}
      </dl>

      <Link
        className="mt-6 inline-flex rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
        to={`/orders/${payment.orderId}`}
      >
        View order
      </Link>
    </section>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-3 border-b border-slate-100 pb-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-950">{value}</dd>
    </div>
  );
}

function formatVnd(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}