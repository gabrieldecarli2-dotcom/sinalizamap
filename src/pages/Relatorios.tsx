import { PageHeader } from '../components/PageHeader'

export function Relatorios() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Indicadores, exportações e acompanhamento gerencial da sinalização viária."
      />

      <section className="grid min-h-80 place-items-center rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="max-w-md text-sm leading-6 text-slate-600">
          Área reservada para gráficos e filtros alimentados por dados reais.
        </p>
      </section>
    </div>
  )
}
