import type { SinalizacaoCategoriaFilter } from '../types/mapFilters'
import { MapFilterIcon } from './MapFilterIcon'

const filters: Array<{
  value: SinalizacaoCategoriaFilter
  label: string
  icon?: 'triangle' | 'square' | 'circle'
}> = [
  { value: 'todos', label: 'Todos' },
  { value: 'vertical', label: 'Vertical', icon: 'triangle' },
  { value: 'horizontal', label: 'Horizontal', icon: 'square' },
  { value: 'irregularidade', label: 'Irregularidades', icon: 'circle' },
]

export function MapCategoryFilter({
  value,
  onChange,
}: {
  value: SinalizacaoCategoriaFilter
  onChange: (value: SinalizacaoCategoriaFilter) => void
}) {
  return (
    <div className="grid min-w-0 grid-cols-2 rounded-md border border-slate-200 bg-white p-1 shadow-sm sm:inline-grid sm:grid-cols-4">
      {filters.map((filter) => (
        <button
          key={filter.value}
          type="button"
          onClick={() => onChange(filter.value)}
          className={`inline-flex min-w-0 items-center justify-center gap-1.5 rounded px-2 py-2 text-xs font-semibold leading-4 transition sm:px-3 ${
            value === filter.value
              ? 'admin-bg text-slate-950'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {filter.icon && <MapFilterIcon type={filter.icon} />}
          {filter.label}
        </button>
      ))}
    </div>
  )
}
