interface StatCardProps {
  label: string
  value: string
  hint: string
}

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="admin-card rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{hint}</p>
    </div>
  )
}
