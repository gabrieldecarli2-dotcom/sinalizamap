import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, RefreshCw, Search } from 'lucide-react'
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
import { listSinalizacoes } from '../services/sinalizacoes'
import type { SinalizacaoDocument } from '../services/sinalizacoes'
import type { SinalizacaoCategoriaFilter } from '../types/mapFilters'

export function Mapa() {
  const [sinalizacoes, setSinalizacoes] = useState<SinalizacaoDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [mapFilter, setMapFilter] = useState<SinalizacaoCategoriaFilter>('todos')
  const [irregularidadeStatusFilter, setIrregularidadeStatusFilter] =
    useState<IrregularidadeStatusFilterValue>('todas')
  const [condicaoFilter, setCondicaoFilter] = useState<CondicaoFilterValue>('todas')
  const [patrimonioSearch, setPatrimonioSearch] = useState('')

  useEffect(() => {
    let isMounted = true

    listSinalizacoes()
      .then((response) => {
        if (isMounted) {
          setSinalizacoes(response.rows)
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Não foi possível carregar o mapa.',
          )
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

  const filteredSinalizacoes = useMemo(() => {
    const normalizedPatrimonio = patrimonioSearch.trim().toLowerCase()
    const sinalizacoesByCategory =
      mapFilter === 'todos'
        ? sinalizacoes
        : sinalizacoes.filter((sinalizacao) => sinalizacao.categoria === mapFilter)
    const sinalizacoesByStatus =
      mapFilter !== 'irregularidade'
        ? (mapFilter === 'vertical' || mapFilter === 'horizontal') &&
          condicaoFilter !== 'todas'
          ? sinalizacoesByCategory.filter(
              (sinalizacao) => sinalizacao.condicao === condicaoFilter,
            )
          : sinalizacoesByCategory
        : sinalizacoesByCategory.filter((sinalizacao) => {
            if (irregularidadeStatusFilter === 'pendentes') {
              return sinalizacao.status !== 'resolvida'
            }

            if (irregularidadeStatusFilter === 'resolvidas') {
              return sinalizacao.status === 'resolvida'
            }

            return true
          })

    if (!normalizedPatrimonio) {
      return sinalizacoesByStatus
    }

    return sinalizacoesByStatus.filter((sinalizacao) =>
      sinalizacao.patrimonio?.toLowerCase().includes(normalizedPatrimonio),
    )
  }, [condicaoFilter, irregularidadeStatusFilter, mapFilter, patrimonioSearch, sinalizacoes])

  const hasActiveSearch = patrimonioSearch.trim().length > 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mapa"
        description="Visualização territorial dos registros cadastrados em campo."
        action={
          <Link
            to="/sinalizacoes/nova"
            className="admin-bg admin-bg-hover inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold text-slate-950"
          >
            <Plus className="h-4 w-4" />
            Registrar aqui
          </Link>
        }
      />

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-950">
              {filteredSinalizacoes.length} sinaliza
              {filteredSinalizacoes.length === 1 ? 'ção' : 'ções'} no mapa
            </p>
            <p className="text-xs text-slate-500">
              {hasActiveSearch
                ? `Busca por patrimônio: ${patrimonioSearch.trim()}`
                : 'Dados carregados'}
            </p>
          </div>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <label className="relative block min-w-0 lg:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={patrimonioSearch}
                onChange={(event) => setPatrimonioSearch(event.target.value)}
                placeholder="Buscar Nº patrimônio"
                className="admin-focus w-full rounded-md border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-4"
              />
            </label>
            <MapCategoryFilter value={mapFilter} onChange={setMapFilter} />
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </button>
          </div>
        </div>

        {mapFilter === 'irregularidade' && (
          <div className="mb-4 flex flex-col gap-2 rounded-md border border-blue-100 bg-blue-50/60 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">Status da irregularidade</p>
              <p className="text-xs text-slate-600">
                Mostre pendentes, resolvidas ou todas no mapa.
              </p>
            </div>
            <IrregularidadeStatusFilter
              value={irregularidadeStatusFilter}
              onChange={setIrregularidadeStatusFilter}
            />
          </div>
        )}

        {(mapFilter === 'vertical' || mapFilter === 'horizontal') && (
          <div className="admin-bg-softer admin-border-soft mb-4 flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">Condição</p>
              <p className="text-xs text-slate-600">
                Filtre pela nota da sinalização, de 0 a 5.
              </p>
            </div>
            <CondicaoFilter value={condicaoFilter} onChange={setCondicaoFilter} />
          </div>
        )}

        {hasActiveSearch && filteredSinalizacoes.length === 0 && !isLoading && !errorMessage && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Nenhuma sinalização encontrada com esse patrimônio.
          </div>
        )}

        <div className="h-[calc(100vh-17rem)] min-h-[28rem] overflow-hidden rounded-lg border border-slate-200">
          {isLoading && (
            <div className="grid h-full place-items-center bg-slate-50 text-sm font-medium text-slate-600">
              Carregando mapa...
            </div>
          )}

          {!isLoading && errorMessage && (
            <div className="grid h-full place-items-center bg-red-50 p-6 text-center text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {!isLoading && !errorMessage && (
            <SinalizacoesMap sinalizacoes={filteredSinalizacoes} />
          )}
        </div>
      </section>
    </div>
  )
}
