export default function KpiCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-card border border-card-border bg-white p-4">
      <div className="flex items-center gap-2 text-muted">
        {Icon && <Icon className="size-4" aria-hidden="true" />}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  )
}
