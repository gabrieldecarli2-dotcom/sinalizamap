import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Search } from 'lucide-react'
import {
  IrregularidadeStatusFilter,
  type IrregularidadeStatusFilterValue,
} from '../components/IrregularidadeStatusFilter'
import { PageHeader } from '../components/PageHeader'
import { listSinalizacoes } from '../services/sinalizacoes'
import type { SinalizacaoDocument } from '../services/sinalizacoes'

function formatDate(value?: string) {
  if (!value) {
    return 'Data não informada'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function ListaIrregularidades() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [registros, setRegistros] = useState<SinalizacaoDocument[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const statusFilter =
    (searchParams.get('status') as IrregularidadeStatusFilterValue | null) ?? 'todas'

  useEffect(() => {
    let isMounted = true

    listSinalizacoes()
      .then((response) => {
        if (isMounted) {
          setRegistros(
            response.rows.filter((registro) => registro.categoria === 'irregularidade'),
          )
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar as irregularidades.',
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

  const filteredRegistros = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    const registrosByStatus = registros.filter((registro) => {
      if (statusFilter === 'pendentes') {
        return registro.status !== 'resolvida'
      }

      if (statusFilter === 'resolvidas') {
        return registro.status === 'resolvida'
      }

      return true
    })

    if (!normalizedSearch) {
      return registrosByStatus
    }

    return registrosByStatus.filter((registro) =>
      [
        registro.tipo_nome,
        registro.endereco,
        registro.observacoes,
        registro.foto_nome,
        registro.$id,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedSearch)),
    )
  }, [registros, search, statusFilter])

  function handleStatusFilterChange(nextStatus: IrregularidadeStatusFilterValue) {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('status', nextStatus)
    setSearchParams(nextParams)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Irregularidades"
        description="Consulta dos registros observados pela equipe GCM em campo."
      />

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-4 border-b border-slate-200 p-4">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por tipo, endereço, situação ou protocolo"
              className="w-full rounded-md border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
            />
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">Status da irregularidade</p>
              <p className="text-xs text-slate-500">
                Filtre registros ainda pendentes ou já resolvidos.
              </p>
            </div>
            <IrregularidadeStatusFilter
              value={statusFilter}
              onChange={handleStatusFilterChange}
            />
          </div>
        </div>

        {isLoading && (
          <div className="grid min-h-72 place-items-center p-6 text-center">
            <p className="font-medium text-slate-800">Carregando irregularidades...</p>
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

        {!isLoading && !errorMessage && filteredRegistros.length === 0 && (
          <div className="grid min-h-72 place-items-center p-6 text-center">
            <div>
              <AlertTriangle className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-3 font-medium text-slate-800">Nenhuma irregularidade encontrada</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                Registros criados pela tela de campo GCM aparecerão aqui.
              </p>
            </div>
          </div>
        )}

        {!isLoading && !errorMessage && filteredRegistros.length > 0 && (
          <div className="divide-y divide-slate-200">
            {filteredRegistros.map((registro) => (
              <Link
                key={registro.$id}
                to={`/sinalizacoes/${registro.$id}`}
                className="block p-4 transition hover:bg-slate-50"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">{registro.tipo_nome}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {registro.observacoes || 'Sem descrição informada'}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {registro.endereco || 'Sem endereço informado'}
                    </p>
                    <p className="mt-2 font-mono text-xs text-slate-500">
                      {registro.latitude.toFixed(6)}, {registro.longitude.toFixed(6)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                      Irregularidade
                    </span>
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-medium ${
                        registro.status === 'resolvida'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {registro.status === 'resolvida' ? 'Resolvida' : 'Pendente'}
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      {formatDate(registro.$createdAt)}
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
