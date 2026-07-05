type RoutePlaceholderProps = {
  title: string;
  description?: string;
};

export function RoutePlaceholder({ title, description }: RoutePlaceholderProps) {
  return (
    <section className="max-w-5xl">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
          Phase 15
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h1>
        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}