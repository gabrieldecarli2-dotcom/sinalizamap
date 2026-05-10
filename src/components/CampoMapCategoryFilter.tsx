import type { SinalizacaoCategoriaFilter } from '../types/mapFilters'
import { MapFilterIcon } from './MapFilterIcon'

type CampoCategoriaFilter = Extract<SinalizacaoCategoriaFilter, 'todos' | 'vertical' | 'horizontal'>

const filters: Array<{
  value: CampoCategoriaFilter
  label: string
  icon?: 'triangle' | 'square'
}> = [
  { value: 'todos', label: 'Todos' },
  { value: 'vertical', label: 'Vertical', icon: 'triangle' },
  { value: 'horizontal', label: 'Horizontal', icon: 'square' },
]

export function CampoMapCategoryFilter({
  value,
  onChange,
}: {
  value: CampoCategoriaFilter
  onChange: (value: CampoCategoriaFilter) => void
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

export type { CampoCategoriaFilter }
