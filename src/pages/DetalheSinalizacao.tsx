import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, CheckCircle2, Edit3, MapPin } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { useAuth } from '../hooks/useAuth'
import {
  getSinalizacao,
  listHistoricoSinalizacao,
  resolveIrregularidade,
} from '../services/sinalizacoes'
import type {
  HistoricoSinalizacaoDocument,
  SinalizacaoDocument,
} from '../services/sinalizacoes'
import { getCondicaoLabel } from '../utils/condicao'
import { resolveUsuarioLabel } from '../utils/usuarios'

function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Data não informada'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Data não informada'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
  }).format(new Date(`${value}T00:00:00`))
}

function getTodayInputValue() {
  const today = new Date()
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset())
  return today.toISOString().slice(0, 10)
}

export function DetalheSinalizacao() {
  const { id } = useParams()
  const { user, isDevelopmentMode } = useAuth()
  const [registro, setRegistro] = useState<SinalizacaoDocument | null>(null)
  const [historico, setHistorico] = useState<HistoricoSinalizacaoDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingCorrection, setIsSavingCorrection] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [correctionMessage, setCorrectionMessage] = useState('')
  const [correctionError, setCorrectionError] = useState('')
  const [correctionDate, setCorrectionDate] = useState(getTodayInputValue)
  const [correctionDescription, setCorrectionDescription] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadRegistro() {
      if (!id) {
        setErrorMessage('Registro não informado.')
        setIsLoading(false)
        return
      }

      try {
        const [nextRegistro, nextHistorico] = await Promise.all([
          getSinalizacao(id),
          listHistoricoSinalizacao(id).catch(() => ({ rows: [] })),
        ])

        if (isMounted) {
          setRegistro(nextRegistro)
          setHistorico(nextHistorico.rows)
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar o detalhe do registro.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadRegistro()

    return () => {
      isMounted = false
    }
  }, [id])

  const isIrregularidade = registro?.categoria === 'irregularidade'
  const isIrregularidadeResolvida = registro?.status === 'resolvida'

  async function handleResolveIrregularidade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCorrectionMessage('')
    setCorrectionError('')

    if (!id) {
      setCorrectionError('Registro não informado.')
      return
    }

    if (!correctionDate) {
      setCorrectionError('Informe a data da correção.')
      return
    }

    if (!correctionDescription.trim()) {
      setCorrectionError('Descreva o que foi realizado.')
      return
    }

    if (!user || isDevelopmentMode) {
      setCorrectionError('Para registrar a correção, entre com um usuário real.')
      return
    }

    setIsSavingCorrection(true)

    try {
      const updated = await resolveIrregularidade(id, {
        data_ocorrencia: correctionDate,
        realizado: correctionDescription.trim(),
        criado_por: user.$id,
      })

      setRegistro(updated)
      setCorrectionDescription('')
      setCorrectionMessage('Correção registrada. A irregularidade agora está resolvida.')
      const nextHistorico = await listHistoricoSinalizacao(id).catch(() => ({ rows: [] }))
      setHistorico(nextHistorico.rows)
    } catch (error) {
      setCorrectionError(
        error instanceof Error
          ? error.message
          : 'Não foi possível registrar a correção.',
      )
    } finally {
      setIsSavingCorrection(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isIrregularidade ? 'Detalhe da Irregularidade' : 'Detalhe da Sinalização'}
        description={
          isIrregularidade
            ? 'Informações do registro observado pela equipe GCM.'
            : 'Informações completas do registro, histórico, fotos e localização.'
        }
        action={
          <Link
            to={isIrregularidade ? '/irregularidades' : '/sinalizacoes'}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        }
      />

      {isLoading && (
        <section className="grid min-h-72 place-items-center rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-medium text-slate-800">Carregando detalhe...</p>
        </section>
      )}

      {!isLoading && errorMessage && (
        <section className="grid min-h-72 place-items-center rounded-lg border border-red-200 bg-red-50 p-5 text-center shadow-sm">
          <p className="max-w-lg text-sm leading-6 text-red-700">{errorMessage}</p>
        </section>
      )}

      {!isLoading && !errorMessage && registro && (
        <>
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {isIrregularidade && <AlertTriangle className="h-5 w-5 text-blue-600" />}
                  <h2 className="text-xl font-semibold text-slate-950">{registro.tipo_nome}</h2>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Protocolo <span className="font-mono">{registro.$id}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                  {isIrregularidade ? 'irregularidade' : registro.categoria}
                </span>
                {isIrregularidade && (
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-medium ${
                      isIrregularidadeResolvida
                        ? 'admin-bg-soft admin-text'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {isIrregularidadeResolvida ? 'resolvida' : 'pendente'}
                  </span>
                )}
                {!isIrregularidade && (
                  <span className="rounded-md admin-bg-soft px-2 py-1 text-xs font-medium admin-text">
                    {getCondicaoLabel(registro.condicao)}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-md border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Localização
                </p>
                <p className="mt-2 text-sm text-slate-800">
                  {registro.endereco || 'Sem endereço informado'}
                </p>
                <p className="mt-2 flex items-center gap-2 font-mono text-xs text-slate-500">
                  <MapPin className="h-4 w-4" />
                  {registro.latitude.toFixed(6)}, {registro.longitude.toFixed(6)}
                </p>
              </div>

              <div className="rounded-md border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Registro
                </p>
                <p className="mt-2 text-sm text-slate-800">
                  Criado em {formatDateTime(registro.$createdAt)}
                </p>
                <p className="mt-1 text-sm text-slate-800">
                  Atualizado em {formatDateTime(registro.$updatedAt)}
                </p>
                <p className="mt-1 text-sm text-slate-800">
                  Criado por {resolveUsuarioLabel(registro.criado_por, user)}
                </p>
                {registro.patrimonio && (
                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    Patrimônio: {registro.patrimonio}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-md border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {isIrregularidade ? 'Situação observada' : 'Observações'}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                {registro.observacoes || 'Sem observações informadas.'}
              </p>
            </div>

            {registro.foto_nome && (
              <div className="mt-4 rounded-md border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Foto
                </p>
                <p className="mt-2 text-sm text-slate-800">{registro.foto_nome}</p>
              </div>
            )}

            {!isIrregularidade && (
              <Link
                to={`/sinalizacoes/${registro.$id}/editar`}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-md admin-bg px-4 py-2.5 text-sm font-semibold text-slate-950 admin-bg-hover"
              >
                <Edit3 className="h-4 w-4" />
                Editar sinalização
              </Link>
            )}
          </section>

          {isIrregularidade && (
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-slate-950">
                  Correção da irregularidade
                </h2>
              </div>

              {isIrregularidadeResolvida ? (
                <div className="mt-4 rounded-md border admin-border-soft admin-bg-soft px-3 py-2 text-sm admin-text">
                  Esta irregularidade já foi marcada como resolvida. A correção aparece no histórico.
                </div>
              ) : (
                <form onSubmit={handleResolveIrregularidade} className="mt-4 grid gap-4">
                  <label className="block max-w-xs">
                    <span className="text-sm font-medium text-slate-700">Data da correção</span>
                    <input
                      type="date"
                      value={correctionDate}
                      onChange={(event) => setCorrectionDate(event.target.value)}
                      className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">O que foi realizado</span>
                    <textarea
                      value={correctionDescription}
                      onChange={(event) => setCorrectionDescription(event.target.value)}
                      placeholder="Ex.: Placa recolocada, equipe removeu o risco, local vistoriado e regularizado."
                      className="mt-2 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                    />
                  </label>

                  {correctionMessage && (
                    <div className="rounded-md border admin-border-soft admin-bg-soft px-3 py-2 text-sm admin-text">
                      {correctionMessage}
                    </div>
                  )}

                  {correctionError && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {correctionError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSavingCorrection}
                    className="inline-flex w-fit items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {isSavingCorrection ? 'Registrando...' : 'Registrar correção'}
                  </button>
                </form>
              )}
            </section>
          )}

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Histórico</h2>
            {historico.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">
                Nenhum histórico encontrado para este registro.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-slate-200">
                {historico.map((item) => (
                  <div key={item.$id} className="py-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-semibold capitalize text-slate-950">{item.acao}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {item.motivo || 'Sem motivo informado'}
                        </p>
                      </div>
                      <div className="text-sm text-slate-500 md:text-right">
                        <p>Usuário: {resolveUsuarioLabel(item.criado_por, user)}</p>
                        <p>Ocorrência: {formatDate(item.data_ocorrencia)}</p>
                        <p>Registro: {formatDateTime(item.$createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
