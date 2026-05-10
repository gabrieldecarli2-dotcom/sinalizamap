import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import {
  CondicaoFilter,
  type CondicaoFilterValue,
} from '../components/CondicaoFilter'
import { PageHeader } from '../components/PageHeader'
import { listSinalizacoes } from '../services/sinalizacoes'
import type { SinalizacaoDocument } from '../services/sinalizacoes'
import { getCondicaoColor, getCondicaoNome } from '../utils/condicao'

export function ListaSinalizacoes() {
  const [searchParams] = useSearchParams()
  const [sinalizacoes, setSinalizacoes] = useState<SinalizacaoDocument[]>([])
  const [search, setSearch] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState<'todas' | 'vertical' | 'horizontal'>(
    'todas',
  )
  const [condicaoFilter, setCondicaoFilter] = useState<CondicaoFilterValue>(
    (searchParams.get('condicao') as CondicaoFilterValue | null) ?? 'todas',
  )
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

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
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar as sinalizações.',
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
    const normalizedSearch = search.trim().toLowerCase()
    const operacionais = sinalizacoes.filter(
      (sinalizacao) =>
        sinalizacao.categoria === 'vertical' || sinalizacao.categoria === 'horizontal',
    )

    const byCategoria =
      categoriaFilter === 'todas'
        ? operacionais
        : operacionais.filter((sinalizacao) => sinalizacao.categoria === categoriaFilter)

    const byCondicao =
      condicaoFilter === 'todas'
        ? byCategoria
        : byCategoria.filter((sinalizacao) => sinalizacao.condicao === condicaoFilter)

    if (!normalizedSearch) {
      return byCondicao
    }

    return byCondicao.filter((sinalizacao) =>
      [
        sinalizacao.tipo_nome,
        sinalizacao.categoria,
        sinalizacao.condicao,
        sinalizacao.endereco,
        sinalizacao.patrimonio,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedSearch)),
    )
  }, [categoriaFilter, condicaoFilter, search, sinalizacoes])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sinalizações"
        description="Consulta e acompanhamento dos registros coletados em campo."
        action={
          <Link
            to="/sinalizacoes/nova"
            className="admin-bg admin-bg-hover inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold text-slate-950"
          >
            <Plus className="h-4 w-4" />
            Novo registro
          </Link>
        }
      />

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-4 border-b border-slate-200 p-4">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por tipo, endereço ou condição"
              className="admin-focus w-full rounded-md border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-4"
            />
          </label>
          <div className="grid gap-3 xl:grid-cols-[auto_1fr] xl:items-end">
            <div>
              <p className="text-sm font-semibold text-slate-950">Tipo</p>
              <div className="mt-2 inline-grid grid-cols-3 rounded-md border border-slate-200 bg-white p-1 shadow-sm">
                {([
                  ['todas', 'Todas'],
                  ['vertical', 'Vertical'],
                  ['horizontal', 'Horizontal'],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCategoriaFilter(value)}
                    className={`rounded px-3 py-2 text-xs font-semibold transition ${
                      categoriaFilter === value
                        ? 'admin-bg text-slate-950'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">Condição</p>
              <p className="mt-1 text-xs text-slate-500">
                0 indica ausente; 5 indica excelente.
              </p>
              <div className="mt-2">
                <CondicaoFilter value={condicaoFilter} onChange={setCondicaoFilter} />
              </div>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="grid min-h-72 place-items-center p-6 text-center">
            <p className="font-medium text-slate-800">Carregando sinalizações...</p>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="grid min-h-72 place-items-center p-6 text-center">
            <div>
              <p className="font-medium text-red-700">Erro ao carregar</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{errorMessage}</p>
            </div>
          </div>
        )}

        {!isLoading && !errorMessage && filteredSinalizacoes.length === 0 && (
          <div className="grid min-h-72 place-items-center p-6 text-center">
            <div>
              <p className="font-medium text-slate-800">Nenhum registro encontrado</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                Salve uma sinalização pelo formulário para ela aparecer aqui.
              </p>
            </div>
          </div>
        )}

        {!isLoading && !errorMessage && filteredSinalizacoes.length > 0 && (
          <div className="divide-y divide-slate-200">
            {filteredSinalizacoes.map((sinalizacao) => (
              <Link
                key={sinalizacao.$id}
                to={`/sinalizacoes/${sinalizacao.$id}`}
                className="block p-4 transition hover:bg-slate-50"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">{sinalizacao.tipo_nome}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {sinalizacao.endereco || 'Sem endereço informado'}
                    </p>
                    <p className="mt-2 font-mono text-xs text-slate-500">
                      {sinalizacao.latitude.toFixed(6)}, {sinalizacao.longitude.toFixed(6)}
                    </p>
                    {sinalizacao.patrimonio && (
                      <p className="mt-2 text-xs font-semibold text-slate-600">
                        Patrimônio: {sinalizacao.patrimonio}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      {sinalizacao.categoria}
                    </span>
                    <span
                      className="rounded-md px-2 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: getCondicaoColor(sinalizacao.condicao) }}
                    >
                      {getCondicaoNome(sinalizacao.condicao)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
