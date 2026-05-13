interface StatCardProps {
  label: string
  value: string
  hint: string
  tone?: 'default' | 'danger' | 'info'
}

const toneClassNames = {
  default: 'border-slate-200 bg-white',
  danger: 'border-red-200 bg-red-50',
  info: 'border-blue-200 bg-blue-50',
}

export function StatCard({ label, value, hint, tone = 'default' }: StatCardProps) {
  return (
    <div className={`admin-card rounded-lg border p-5 shadow-sm transition hover:shadow-md ${toneClassNames[tone]}`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{hint}</p>
    </div>
  )
}
