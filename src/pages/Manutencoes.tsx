import { PageHeader } from '../components/PageHeader'

export function Manutencoes() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Manutenções"
        description="Fila de solicitações, execução e conclusão de serviços vinculados às sinalizações."
      />

      <section className="grid min-h-80 place-items-center rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="max-w-md text-sm leading-6 text-slate-600">
          Fluxo preparado para carregar manutenções abertas, em andamento e concluídas.
        </p>
      </section>
    </div>
  )
}
