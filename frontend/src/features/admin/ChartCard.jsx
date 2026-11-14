export default function ChartCard({ title, caption, empty = false, children }) {
  return (
    <section className="rounded-card border border-card-border bg-white p-4">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <div className="mt-3">
        {empty ? (
          <p className="py-10 text-center text-sm text-muted">No data for this chart yet.</p>
        ) : (
          <div role="img" aria-label={title}>
            {children}
          </div>
        )}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">{caption}</p>
    </section>
  )
}
