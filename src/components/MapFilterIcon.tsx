export function MapFilterIcon({
  type,
  color = '#334155',
}: {
  type: 'triangle' | 'square' | 'circle'
  color?: string
}) {
  if (type === 'triangle') {
    return (
      <span
        className="h-0 w-0 shrink-0 border-x-[5px] border-b-[9px] border-x-transparent"
        style={{ borderBottomColor: color }}
      />
    )
  }

  if (type === 'square') {
    return <span className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: color }} />
  }

  return <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
}
