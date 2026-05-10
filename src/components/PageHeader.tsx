interface PageHeaderProps {
  title: string
  description: string
  action?: React.ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {action}
    </div>
  )
}
