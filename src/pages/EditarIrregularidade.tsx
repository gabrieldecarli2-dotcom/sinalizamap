import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { useAuth } from '../hooks/useAuth'
import { useTiposSinalizacao } from '../hooks/useTiposSinalizacao'
import {
  getSinalizacao,
  updateSinalizacao,
} from '../services/sinalizacoes'
import type { SinalizacaoDocument } from '../services/sinalizacoes'

function getTodayInputValue() {
  const today = new Date()
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset())
  return today.toISOString().slice(0, 10)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
  }).format(new Date(`${value}T00:00:00`))
}

export function EditarIrregularidade() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isDevelopmentMode } = useAuth()
  const tiposSinalizacao = useTiposSinalizacao()
  const [registro, setRegistro] = useState<SinalizacaoDocument | null>(null)
  const [situacao, setSituacao] = useState('')
  const [dataOcorrencia, setDataOcorrencia] = useState(getTodayInputValue)
  const [patrimonio, setPatrimonio] = useState('')
  const [fotoNome, setFotoNome] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [savedMessage, setSavedMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadRegistro() {
      if (!id) {
        setErrorMessage('Registro não informado.')
        setIsLoading(false)
        return
      }

      try {
        const response = await getSinalizacao(id)

        if (isMounted) {
          setRegistro(response)
          setPatrimonio(response.patrimonio ?? '')
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar a irregularidade.',
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

  const tipoRelacionado = useMemo(
    () => tiposSinalizacao.find((tipo) => tipo.id === registro?.tipo_id),
    [registro?.tipo_id, tiposSinalizacao],
  )
  const isVertical = tipoRelacionado?.categoria === 'Vertical'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setSavedMessage('')

    if (!id || !registro) {
      setErrorMessage('Registro não informado.')
      return
    }

    if (!situacao.trim()) {
      setErrorMessage('Descreva a nova informação observada.')
      return
    }

    if (!dataOcorrencia) {
      setErrorMessage('Informe a data da ocorrência.')
      return
    }

    if (!user || isDevelopmentMode) {
      setErrorMessage('Para salvar no Appwrite, entre com um usuário real do Appwrite.')
      return
    }

    setIsSaving(true)

    try {
      const blocoHistorico = `[${formatDate(dataOcorrencia)}] ${situacao.trim()}`
      const observacoes = registro.observacoes
        ? `${registro.observacoes.trim()}\n\n${blocoHistorico}`
        : blocoHistorico

      const updated = await updateSinalizacao(
        id,
        {
          observacoes,
          foto_nome: fotoNome || registro.foto_nome || '',
          patrimonio: isVertical ? patrimonio.trim() : registro.patrimonio ?? '',
          status: 'registrada',
        },
        {
          motivo: situacao.trim(),
          data_ocorrencia: dataOcorrencia,
          criado_por: user.$id,
        },
      )

      setRegistro(updated)
      setSituacao('')
      setSavedMessage('Irregularidade atualizada. Ela está marcada como pendente.')
      window.setTimeout(() => {
        navigate('/campo', { replace: true })
      }, 1200)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar a irregularidade.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 px-4 py-6 md:px-8">
      <PageHeader
        title="Editar Irregularidade"
        description="Acrescente uma nova observação no histórico da irregularidade."
      />

      {isLoading && (
        <section className="grid min-h-72 place-items-center rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-medium text-slate-800">Carregando irregularidade...</p>
        </section>
      )}

      {!isLoading && errorMessage && !registro && (
        <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {errorMessage}
        </section>
      )}

      {!isLoading && registro && (
        <form
          onSubmit={handleSubmit}
          className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-2"
        >
          <section className="lg:col-span-2">
            <p className="text-sm font-semibold text-slate-950">{registro.tipo_nome}</p>
            <p className="mt-1 text-sm text-slate-600">
              {registro.endereco || 'Sem endereço informado'}
            </p>
            <span
              className={`mt-3 inline-flex rounded-md px-2 py-1 text-xs font-semibold ${
                registro.status === 'resolvida'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-blue-50 text-blue-700'
              }`}
            >
              {registro.status === 'resolvida' ? 'Resolvida' : 'Pendente'}
            </span>
          </section>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Data da ocorrência</span>
            <input
              type="date"
              value={dataOcorrencia}
              onChange={(event) => setDataOcorrencia(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
            />
          </label>

          {isVertical && (
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Nº patrimônio</span>
              <input
                type="text"
                value={patrimonio}
                onChange={(event) => setPatrimonio(event.target.value)}
                placeholder="Ex.: PL-000123"
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
              />
            </label>
          )}

          <label className="block lg:col-span-2">
            <span className="text-sm font-medium text-slate-700">Nova informação</span>
            <textarea
              value={situacao}
              onChange={(event) => setSituacao(event.target.value)}
              placeholder="Ex.: A placa voltou a cair no local, pintura apagada novamente, risco permanece."
              className="mt-2 min-h-32 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
            />
          </label>

          <label className="block lg:col-span-2">
            <span className="text-sm font-medium text-slate-700">Foto</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => setFotoNome(event.target.files?.[0]?.name ?? '')}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
            {(fotoNome || registro.foto_nome) && (
              <p className="mt-2 text-xs text-slate-500">{fotoNome || registro.foto_nome}</p>
            )}
          </label>

          {savedMessage && (
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 lg:col-span-2">
              {savedMessage}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 lg:col-span-2">
              {errorMessage}
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row lg:col-span-2">
            <button
              type="button"
              onClick={() => navigate('/campo')}
              className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Voltar ao campo
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? 'Salvando...' : 'Salvar atualização'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
