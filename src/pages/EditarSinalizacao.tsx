import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { condicoesNumericas } from '../constants/sinalizacaoOptions'
import { useAuth } from '../hooks/useAuth'
import {
  deleteSinalizacaoWithHistory,
  getSinalizacao,
  listHistoricoSinalizacao,
  updateSinalizacao,
} from '../services/sinalizacoes'
import type { HistoricoSinalizacaoDocument, SinalizacaoDocument } from '../services/sinalizacoes'

const motivosAlteracao = ['Verificação', 'Manutenção', 'Sinalização', 'Outros'] as const
type MotivoAlteracao = (typeof motivosAlteracao)[number]

function getTodayInputValue() {
  const today = new Date()
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset())
  return today.toISOString().slice(0, 10)
}

function formatInputDate(value?: string) {
  if (!value) {
    return ''
  }

  const [year, month, day] = value.split('-')

  if (!year || !month || !day) {
    return value
  }

  return `${day}/${month}/${year}`
}

function getHistoricoFotoNome(item: HistoricoSinalizacaoDocument) {
  if (!item.dados_novos) {
    return ''
  }

  try {
    const dadosNovos = JSON.parse(item.dados_novos) as { foto_nome?: unknown }
    return typeof dadosNovos.foto_nome === 'string' ? dadosNovos.foto_nome : ''
  } catch {
    return ''
  }
}

export function EditarSinalizacao() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isDevelopmentMode } = useAuth()
  const [sinalizacao, setSinalizacao] = useState<SinalizacaoDocument | null>(null)
  const [historico, setHistorico] = useState<HistoricoSinalizacaoDocument[]>([])
  const [tipoId, setTipoId] = useState('')
  const [condicaoNota, setCondicaoNota] = useState(5)
  const [endereco, setEndereco] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [patrimonio, setPatrimonio] = useState('')
  const [fotoNome, setFotoNome] = useState('')
  const [motivoAlteracao, setMotivoAlteracao] = useState<MotivoAlteracao>('Verificação')
  const [motivoOutro, setMotivoOutro] = useState('')
  const [dataOcorrencia, setDataOcorrencia] = useState(getTodayInputValue)
  const [deleteReason, setDeleteReason] = useState('')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const condicaoSelecionada = condicoesNumericas[condicaoNota]
  const motivoHistorico =
    motivoAlteracao === 'Outros'
      ? motivoOutro.trim()
      : motivoAlteracao

  function normalizeCondicaoToNota(condicao: string) {
    const numericValue = Number(condicao)

    if (Number.isFinite(numericValue)) {
      return Math.min(5, Math.max(0, numericValue))
    }

    const legacyValues: Record<string, number> = {
      ausente: 0,
      danificada: 3,
      necessita_manutencao: 4,
      regular: 3,
      boa: 4,
    }

    return legacyValues[condicao] ?? 5
  }

  useEffect(() => {
    if (!id) {
      return
    }

    let isMounted = true

    getSinalizacao(id)
      .then((record) => {
        if (isMounted) {
          setSinalizacao(record)
          setTipoId(record.tipo_id)
          setCondicaoNota(normalizeCondicaoToNota(record.condicao))
          setEndereco(record.endereco ?? '')
          setObservacoes(record.observacoes ?? '')
          setPatrimonio(record.patrimonio ?? '')
          setFotoNome(record.foto_nome ?? '')
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Não foi possível carregar a sinalização.',
          )
        }
      })

    listHistoricoSinalizacao(id)
      .then((response) => {
        if (isMounted) {
          setHistorico(response.rows)
        }
      })
      .catch(() => undefined)

    return () => {
      isMounted = false
    }
  }, [id])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')

    if (!id || !sinalizacao) {
      setErrorMessage('Registro inválido para edição.')
      return
    }

    if (!user || isDevelopmentMode) {
      setErrorMessage('Para editar, entre com um usuário real do Appwrite.')
      return
    }

    if (!motivoHistorico) {
      setErrorMessage('Informe o motivo da alteração para registrar no histórico.')
      return
    }

    if (!dataOcorrencia) {
      setErrorMessage('Informe a data da alteração para registrar no histórico.')
      return
    }

    setIsSaving(true)

    try {
      await updateSinalizacao(
        id,
        {
          condicao: String(condicaoNota),
          endereco: endereco.trim(),
          observacoes: observacoes.trim(),
          patrimonio: patrimonio.trim(),
          foto_nome: fotoNome,
        },
        {
          motivo: motivoHistorico,
          data_ocorrencia: dataOcorrencia,
          criado_por: user.$id,
        },
      )

      setMessage('Alteração salva e registrada no histórico.')
      window.setTimeout(() => navigate('/campo', { replace: true }), 1000)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Não foi possível salvar a alteração.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    setMessage('')
    setErrorMessage('')

    if (!id || !user || isDevelopmentMode) {
      setErrorMessage('Para excluir, entre com um usuário real do Appwrite.')
      return
    }

    if (!deleteReason.trim()) {
      setErrorMessage('Informe o motivo da exclusão.')
      return
    }

    setIsSaving(true)

    try {
      await deleteSinalizacaoWithHistory(id, {
        motivo: deleteReason.trim(),
        criado_por: user.$id,
      })
      setMessage('Sinalização excluída e histórico registrado.')
      window.setTimeout(() => navigate('/campo', { replace: true }), 1000)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Não foi possível excluir a sinalização.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editar Sinalização"
        description="Atualize condição, observações e registre o motivo da alteração."
      />

      <form
        onSubmit={handleSubmit}
        className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-2"
      >
        <div className="block">
          <span className="text-sm font-medium text-slate-700">Tipo</span>
          <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="font-semibold text-slate-950">
              {sinalizacao?.tipo_nome || tipoId || 'Tipo não informado'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Para trocar o tipo da sinalização, exclua este registro com motivo e cadastre uma nova no mesmo local.
            </p>
          </div>
        </div>

        <section className="block">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-700">Condição</span>
            <span className="text-sm font-semibold text-slate-950">
              {condicaoNota}/5 · {condicaoSelecionada?.label}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-6 gap-2">
            {condicoesNumericas.map((item) => (
              <button
                key={item.nota}
                type="button"
                onClick={() => setCondicaoNota(item.nota)}
                className={`min-h-10 rounded-md text-sm font-bold text-white shadow-sm transition ${
                  condicaoNota === item.nota
                    ? 'scale-105 ring-4 ring-slate-900/15'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: item.color }}
              >
                {item.nota}
              </button>
            ))}
          </div>
        </section>

        <label className="block lg:col-span-2">
          <span className="text-sm font-medium text-slate-700">Endereço ou referência</span>
          <input
            value={endereco}
            onChange={(event) => setEndereco(event.target.value)}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none admin-focus focus:ring-4"
          />
        </label>

        <label className="block lg:col-span-2">
          <span className="text-sm font-medium text-slate-700">Nº patrimônio</span>
          <input
            value={patrimonio}
            onChange={(event) => setPatrimonio(event.target.value)}
            placeholder="Ex.: PL-000123"
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none admin-focus focus:ring-4 sm:max-w-xs"
          />
        </label>

        <label className="block lg:col-span-2">
          <span className="text-sm font-medium text-slate-700">Observações</span>
          <textarea
            value={observacoes}
            onChange={(event) => setObservacoes(event.target.value)}
            className="mt-2 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none admin-focus focus:ring-4"
          />
        </label>

        <label className="block lg:col-span-2">
          <span className="text-sm font-medium text-slate-700">Foto</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => setFotoNome(event.target.files?.[0]?.name ?? fotoNome)}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
          {fotoNome && (
            <p className="mt-2 text-xs font-semibold text-slate-600">
              Foto atual: {fotoNome}
            </p>
          )}
        </label>

        <section className="lg:col-span-2">
          <span className="text-sm font-medium text-slate-700">Motivo da alteração</span>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {motivosAlteracao.map((motivo) => (
              <button
                key={motivo}
                type="button"
                onClick={() => setMotivoAlteracao(motivo)}
                className={`min-h-12 rounded-md border px-3 text-sm font-semibold transition ${
                  motivoAlteracao === motivo
                    ? 'admin-border admin-bg-soft admin-text ring-4 admin-ring'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {motivo}
              </button>
            ))}
          </div>

          {motivoAlteracao === 'Outros' && (
            <textarea
              value={motivoOutro}
              onChange={(event) => setMotivoOutro(event.target.value)}
              placeholder="Descreva o motivo da alteração"
              className="mt-3 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none admin-focus focus:ring-4"
            />
          )}
        </section>

        <label className="block lg:col-span-2">
          <span className="text-sm font-medium text-slate-700">Data da alteração</span>
          <input
            type="date"
            value={dataOcorrencia}
            onChange={(event) => setDataOcorrencia(event.target.value)}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none admin-focus focus:ring-4 sm:max-w-xs"
          />
        </label>

        {message && (
          <div className="rounded-md border admin-border-soft admin-bg-soft px-3 py-2 text-sm admin-text lg:col-span-2">
            {message}
          </div>
        )}
        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 lg:col-span-2">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row lg:col-span-2">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md admin-bg px-4 py-2.5 text-sm font-semibold text-slate-950 admin-bg-hover disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? 'Salvando...' : 'Salvar alteração'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/campo')}
            className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Voltar ao campo
          </button>
        </div>
      </form>

      <section className="rounded-lg border border-red-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-red-700">Excluir sinalização</h2>
        <p className="mt-1 text-sm text-slate-600">
          A exclusão remove do mapa operacional, mas mantém o histórico para auditoria.
        </p>
        <textarea
          value={deleteReason}
          onChange={(event) => setDeleteReason(event.target.value)}
          placeholder="Informe o motivo da exclusão"
          className="mt-4 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/10"
        />
        <button
          type="button"
          onClick={handleDelete}
          disabled={isSaving}
          className="mt-3 rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Excluir com histórico
        </button>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Histórico</h2>
        <div className="mt-4 space-y-3">
          {historico.length === 0 && (
            <p className="text-sm text-slate-600">Nenhum histórico carregado.</p>
          )}
          {historico.map((item) => (
            <div key={item.$id} className="rounded-md border border-slate-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-950">{item.acao}</p>
                <p className="text-xs text-slate-500">
                  Registrado em {new Date(item.$createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
              {item.data_ocorrencia && (
                <p className="mt-2 text-xs font-semibold admin-text">
                  Data da alteração: {formatInputDate(item.data_ocorrencia)}
                </p>
              )}
              {getHistoricoFotoNome(item) && (
                <p className="mt-2 text-xs font-semibold text-slate-600">
                  Foto: {getHistoricoFotoNome(item)}
                </p>
              )}
              {item.motivo && <p className="mt-2 text-sm text-slate-600">{item.motivo}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
