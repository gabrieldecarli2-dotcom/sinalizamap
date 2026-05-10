import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPinned } from 'lucide-react'
import {
  IrregularidadeStatusFilter,
  type IrregularidadeStatusFilterValue,
} from '../components/IrregularidadeStatusFilter'
import {
  CondicaoFilter,
  type CondicaoFilterValue,
} from '../components/CondicaoFilter'
import { MapCategoryFilter } from '../components/MapCategoryFilter'
import { PageHeader } from '../components/PageHeader'
import { SinalizacoesMap } from '../components/SinalizacoesMap'
import { StatCard } from '../components/StatCard'
import { listSinalizacoes } from '../services/sinalizacoes'
import type { SinalizacaoDocument } from '../services/sinalizacoes'
import type { SinalizacaoCategoriaFilter } from '../types/mapFilters'
import { isCondicaoPendente } from '../utils/condicao'

export function Dashboard() {
  const [sinalizacoes, setSinalizacoes] = useState<SinalizacaoDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [mapFilter, setMapFilter] = useState<SinalizacaoCategoriaFilter>('todos')
  const [irregularidadeStatusFilter, setIrregularidadeStatusFilter] =
    useState<IrregularidadeStatusFilterValue>('todas')
  const [condicaoFilter, setCondicaoFilter] = useState<CondicaoFilterValue>('todas')

  useEffect(() => {
    let isMounted = true

    listSinalizacoes()
      .then((response) => {
        if (isMounted) {
          setSinalizacoes(response.rows)
        }
      })
      .catch(() => {
        if (isMounted) {
          setSinalizacoes([])
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const pendentes = sinalizacoes.filter((sinalizacao) =>
    isCondicaoPendente(sinalizacao.condicao),
  ).length
  const irregularidadesPendentes = sinalizacoes.filter(
    (sinalizacao) =>
      sinalizacao.categoria === 'irregularidade' && sinalizacao.status !== 'resolvida',
  ).length
  const filteredSinalizacoes = useMemo(() => {
    if (mapFilter === 'todos') {
      return sinalizacoes
    }

    const byCategory = sinalizacoes.filter((sinalizacao) => sinalizacao.categoria === mapFilter)

    if (mapFilter !== 'irregularidade') {
      if (
        (mapFilter === 'vertical' || mapFilter === 'horizontal') &&
        condicaoFilter !== 'todas'
      ) {
        return byCategory.filter((sinalizacao) => sinalizacao.condicao === condicaoFilter)
      }

      return byCategory
    }

    if (irregularidadeStatusFilter === 'pendentes') {
      return byCategory.filter((sinalizacao) => sinalizacao.status !== 'resolvida')
    }

    if (irregularidadeStatusFilter === 'resolvidas') {
      return byCategory.filter((sinalizacao) => sinalizacao.status === 'resolvida')
    }

    return byCategory
  }, [condicaoFilter, irregularidadeStatusFilter, mapFilter, sinalizacoes])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral da operação, indicadores principais e acesso rápido aos fluxos de campo."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link to="/sinalizacoes" className="block">
          <StatCard
            label="Sinalizações"
            value={
              isLoading
                ? '...'
                : String(sinalizacoes.filter((item) => item.categoria !== 'irregularidade').length)
            }
            hint="Registros"
          />
        </Link>
        <Link to="/sinalizacoes?condicao=0" className="block">
          <StatCard
            label="Pendências"
            value={isLoading ? '...' : String(pendentes)}
            hint="Sinalização ausente"
          />
        </Link>
        <StatCard label="Equipes" value="-" hint="Usuários de campo ativos" />
        <Link to="/irregularidades?status=pendentes" className="block">
          <StatCard
            label="Irregularidades"
            value={isLoading ? '...' : String(irregularidadesPendentes)}
            hint="Pendentes da GCM"
          />
        </Link>
      </div>

      <section>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <MapPinned className="admin-text h-5 w-5" />
              <h2 className="text-lg font-semibold text-slate-950">Mapa operacional</h2>
            </div>
            <MapCategoryFilter value={mapFilter} onChange={setMapFilter} />
          </div>
          {mapFilter === 'irregularidade' && (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </p>
              <IrregularidadeStatusFilter
                value={irregularidadeStatusFilter}
                onChange={setIrregularidadeStatusFilter}
              />
            </div>
          )}
          {(mapFilter === 'vertical' || mapFilter === 'horizontal') && (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <div className="sm:text-right">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Condição
                </p>
                <p className="text-xs text-slate-500">0 ausente, 5 excelente</p>
              </div>
              <CondicaoFilter value={condicaoFilter} onChange={setCondicaoFilter} />
            </div>
          )}
          <div className="mt-5 h-80 overflow-hidden rounded-lg border border-slate-200">
            {isLoading ? (
              <div className="grid h-full place-items-center bg-slate-50 text-sm font-medium text-slate-600">
                Carregando mapa...
              </div>
            ) : (
              <SinalizacoesMap sinalizacoes={filteredSinalizacoes} compact />
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
