export type CondicaoFilterValue = 'todas' | '0' | '1' | '2' | '3' | '4' | '5'

const filters: Array<{ value: CondicaoFilterValue; label: string; color?: string }> = [
  { value: 'todas', label: 'Todas' },
  { value: '0', label: '0', color: 'hsl(0 72% 43%)' },
  { value: '1', label: '1', color: 'hsl(24 72% 43%)' },
  { value: '2', label: '2', color: 'hsl(48 72% 43%)' },
  { value: '3', label: '3', color: 'hsl(72 72% 43%)' },
  { value: '4', label: '4', color: 'hsl(96 72% 43%)' },
  { value: '5', label: '5', color: 'hsl(120 72% 43%)' },
]

export function CondicaoFilter({
  value,
  onChange,
}: {
  value: CondicaoFilterValue
  onChange: (value: CondicaoFilterValue) => void
}) {
  return (
    <div className="flex w-full max-w-full flex-wrap gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-sm sm:inline-flex sm:w-auto">
      {filters.map((filter) => (
        <button
          key={filter.value}
          type="button"
          onClick={() => onChange(filter.value)}
          className={`min-w-10 rounded px-2.5 py-2 text-xs font-semibold transition ${
            filter.color
              ? 'text-white hover:brightness-105'
              : value === filter.value
                ? 'admin-bg text-slate-950'
                : 'text-slate-600 hover:bg-slate-100'
          } ${
            value === filter.value
              ? 'scale-105 outline outline-2 outline-offset-2 outline-slate-950 shadow-md'
              : ''
          }`}
          style={filter.color ? { backgroundColor: filter.color } : undefined}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}
