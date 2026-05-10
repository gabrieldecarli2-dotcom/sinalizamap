import { MapFilterIcon } from './MapFilterIcon'

export type IrregularidadeStatusFilterValue = 'todas' | 'pendentes' | 'resolvidas'

const filters: Array<{ value: IrregularidadeStatusFilterValue; label: string; color?: string }> = [
  { value: 'todas', label: 'Todas' },
  { value: 'pendentes', label: 'Pendentes', color: '#2563eb' },
  { value: 'resolvidas', label: 'Resolvidas', color: '#16a34a' },
]

export function IrregularidadeStatusFilter({
  value,
  onChange,
  variant = 'admin',
}: {
  value: IrregularidadeStatusFilterValue
  onChange: (value: IrregularidadeStatusFilterValue) => void
  variant?: 'admin' | 'gcm'
}) {
  return (
    <div className="inline-grid grid-cols-3 rounded-md border border-slate-200 bg-white p-1 shadow-sm">
      {filters.map((filter) => (
        <button
          key={filter.value}
          type="button"
          onClick={() => onChange(filter.value)}
          className={`inline-flex items-center justify-center gap-1.5 rounded px-3 py-2 text-xs font-semibold transition ${
            value === filter.value
              ? variant === 'gcm'
                ? 'bg-blue-600 text-white'
                : 'admin-bg text-slate-950'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {filter.color && <MapFilterIcon type="circle" color={filter.color} />}
          {filter.label}
        </button>
      ))}
    </div>
  )
}
