import type { FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { condicoesNumericas } from '../constants/sinalizacaoOptions'
import { useAuth } from '../hooks/useAuth'
import { useTiposSinalizacao } from '../hooks/useTiposSinalizacao'
import { reverseGeocode } from '../services/geocoding'
import { createSinalizacao } from '../services/sinalizacoes'
import type { SinalizacaoTipo } from '../types/sinalizacaoTipo'

const motivosAlteracao = ['Verificação', 'Manutenção', 'Sinalização', 'Outros'] as const
type MotivoAlteracao = (typeof motivosAlteracao)[number]

function getTodayInputValue() {
  const today = new Date()
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset())
  return today.toISOString().slice(0, 10)
}

export function NovaSinalizacao() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, isDevelopmentMode } = useAuth()
  const tiposSinalizacao = useTiposSinalizacao()
  const tiposAtivos = useMemo(
    () => tiposSinalizacao.filter((tipo) => tipo.ativo),
    [tiposSinalizacao],
  )
  const initialCoordinates = useMemo(
    () => ({
      latitude: searchParams.get('lat') ?? '',
      longitude: searchParams.get('lng') ?? '',
    }),
    [searchParams],
  )
  const [latitude, setLatitude] = useState(initialCoordinates.latitude)
  const [longitude, setLongitude] = useState(initialCoordinates.longitude)
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<'Vertical' | 'Horizontal'>(
    'Vertical',
  )
  const [buscaTipo, setBuscaTipo] = useState('')
  const [selectedTipoIds, setSelectedTipoIds] = useState<string[]>(['r1-pare'])
  const [patrimonios, setPatrimonios] = useState<Record<string, string>>({})
  const [condicaoNota, setCondicaoNota] = useState(5)
  const [endereco, setEndereco] = useState('')
  const [observacoes, setObservacoes] = useState(
    initialCoordinates.latitude
      ? 'Registro criado a partir do ponto selecionado no mapa.'
      : '',
  )
  const [motivoAlteracao, setMotivoAlteracao] = useState<MotivoAlteracao>('Verificação')
  const [motivoOutro, setMotivoOutro] = useState('')
  const [dataOcorrencia, setDataOcorrencia] = useState(getTodayInputValue)
  const [fotoNome, setFotoNome] = useState('')
  const [savedMessage, setSavedMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [addressMessage, setAddressMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isResolvingAddress, setIsResolvingAddress] = useState(false)

  const tiposSelecionados = useMemo(
    () =>
      selectedTipoIds
        .map((tipoId) => tiposSinalizacao.find((tipo) => tipo.id === tipoId))
        .filter((tipo): tipo is SinalizacaoTipo => Boolean(tipo)),
    [selectedTipoIds, tiposSinalizacao],
  )
  const verticalSelecionados = tiposSelecionados.filter(
    (tipo) => tipo.categoria === 'Vertical',
  )
  const condicaoSelecionada = condicoesNumericas[condicaoNota]
  const motivoHistorico =
    motivoAlteracao === 'Outros'
      ? motivoOutro.trim()
      : motivoAlteracao
  const tiposVisiveis = useMemo(() => {
    const normalizedSearch = buscaTipo.trim().toLowerCase()

    const tiposDaCategoria = tiposAtivos.filter(
      (tipo) => tipo.categoria === categoriaSelecionada,
    )

    if (!normalizedSearch) {
      return tiposDaCategoria.filter((tipo) => tipo.popular).slice(0, 4)
    }

    return tiposDaCategoria.filter((tipo) => {
      const matchesCategory = tipo.categoria === categoriaSelecionada
      const matchesSearch =
        tipo.codigo.toLowerCase().includes(normalizedSearch) ||
        tipo.nome.toLowerCase().includes(normalizedSearch)

      return matchesCategory && matchesSearch
    })
  }, [buscaTipo, categoriaSelecionada, tiposAtivos])

  function toggleTipo(tipoId: string) {
    setSelectedTipoIds((current) => {
      if (current.includes(tipoId)) {
        return current.filter((id) => id !== tipoId)
      }

      return [...current, tipoId]
    })
  }

  const fillAddressFromCoordinates = useCallback(
    async (nextLatitude: string, nextLongitude: string, force = false) => {
      if (endereco.trim() && !force) {
        return
      }

      const parsedLatitude = Number(nextLatitude)
      const parsedLongitude = Number(nextLongitude)

      if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) {
        return
      }

      setIsResolvingAddress(true)
      setAddressMessage('')

      try {
        const resolvedAddress = await reverseGeocode(parsedLatitude, parsedLongitude)

        if (resolvedAddress) {
          setEndereco(resolvedAddress)
          setAddressMessage('Endereço preenchido automaticamente pelo mapa.')
        } else {
          setAddressMessage('Não encontramos um endereço para este ponto.')
        }
      } catch (error) {
        setAddressMessage(
          error instanceof Error
            ? error.message
            : 'Não foi possível preencher o endereço automaticamente.',
        )
      } finally {
        setIsResolvingAddress(false)
      }
    },
    [endereco],
  )

  useEffect(() => {
    if (initialCoordinates.latitude && initialCoordinates.longitude) {
      const timeoutId = window.setTimeout(() => {
        void fillAddressFromCoordinates(
          initialCoordinates.latitude,
          initialCoordinates.longitude,
        )
      }, 0)

      return () => window.clearTimeout(timeoutId)
    }

    return undefined
  }, [fillAddressFromCoordinates, initialCoordinates.latitude, initialCoordinates.longitude])

  function handleUseCurrentLocation() {
    if (!('geolocation' in navigator)) {
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLatitude = position.coords.latitude.toFixed(7)
        const nextLongitude = position.coords.longitude.toFixed(7)

        setLatitude(nextLatitude)
        setLongitude(nextLongitude)
        void fillAddressFromCoordinates(nextLatitude, nextLongitude, true)
      },
      undefined,
      {
        enableHighAccuracy: true,
        timeout: 12000,
      },
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavedMessage('')
    setErrorMessage('')

    if (tiposSelecionados.length === 0) {
      setErrorMessage('Selecione pelo menos um tipo de sinalização.')
      return
    }

    const parsedLatitude = Number(latitude)
    const parsedLongitude = Number(longitude)

    if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) {
      setErrorMessage('Informe uma latitude e longitude válidas.')
      return
    }

    if (!user || isDevelopmentMode) {
      setErrorMessage('Para salvar no Appwrite, entre com um usuário real do Appwrite.')
      return
    }

    if (!motivoHistorico) {
      setErrorMessage('Informe o motivo para registrar no histórico.')
      return
    }

    if (!dataOcorrencia) {
      setErrorMessage('Informe a data para registrar no histórico.')
      return
    }

    setIsSaving(true)

    try {
      const sinalizacoes = await Promise.all(
        tiposSelecionados.map((tipoSelecionado) =>
          createSinalizacao({
            tipo_id: tipoSelecionado.id,
            tipo_nome: `${tipoSelecionado.codigo} - ${tipoSelecionado.nome}`,
            categoria: tipoSelecionado.categoria.toLowerCase(),
            condicao: String(condicaoNota),
            latitude: parsedLatitude,
            longitude: parsedLongitude,
            endereco: endereco.trim(),
            observacoes: observacoes.trim(),
            foto_nome: fotoNome,
            patrimonio:
              tipoSelecionado.categoria === 'Vertical'
                ? patrimonios[tipoSelecionado.id]?.trim() ?? ''
                : '',
            criado_por: user.$id,
            motivo: motivoHistorico,
            data_ocorrencia: dataOcorrencia,
          }),
        ),
      )

      setSavedMessage(
        sinalizacoes.length === 1
          ? `Sinalização salva com sucesso. Protocolo: ${sinalizacoes[0].$id}`
          : `${sinalizacoes.length} sinalizações salvas no mesmo ponto.`,
      )
      window.setTimeout(() => {
        navigate('/campo', { replace: true })
      }, 1200)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar a sinalização no Appwrite.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Sinalização"
        description="Cadastro de localização, tipo, condição, fotos e observações para a equipe de campo."
      />

      <form
        onSubmit={handleSubmit}
        className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-2"
      >
        <section className="lg:col-span-2">
          <div>
            <p className="text-sm font-semibold text-slate-950">1. Tipo de sinalização</p>
            <p className="mt-1 text-sm text-slate-600">
              Escolha a categoria. Mostramos os 4 mais usados; use a busca para outros tipos.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {(['Vertical', 'Horizontal'] as const).map((categoria) => (
              <button
                key={categoria}
                type="button"
                onClick={() => {
                  setCategoriaSelecionada(categoria)
                  setBuscaTipo('')
                }}
                className={`min-h-14 rounded-md border px-4 py-3 text-sm font-semibold transition ${
                  categoriaSelecionada === categoria
                    ? 'admin-border admin-bg-soft admin-text ring-4 admin-ring'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {categoria}
              </button>
            ))}
          </div>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-slate-700">Buscar outro por código ou nome</span>
            <input
              type="search"
              value={buscaTipo}
              onChange={(event) => setBuscaTipo(event.target.value)}
              placeholder="Ex.: R1, Pare, Lombada, faixa"
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base text-slate-950 outline-none admin-focus focus:ring-4"
            />
          </label>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {buscaTipo.trim() ? 'Resultados da busca' : 'Mais utilizados'}
            </p>
            {!buscaTipo.trim() && (
              <p className="text-xs text-slate-500">Busque para ver a lista completa</p>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
            {tiposVisiveis.map((tipo) => (
              <button
                key={tipo.id}
                type="button"
                onClick={() => toggleTipo(tipo.id)}
                className={`flex min-h-28 flex-col items-start justify-start rounded-md border p-3 text-left align-top transition ${
                  selectedTipoIds.includes(tipo.id)
                    ? 'admin-border admin-bg-soft ring-4 admin-ring'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="inline-flex h-7 items-center rounded bg-slate-900 px-2 text-xs font-semibold leading-none text-white">
                  {tipo.codigo}
                </span>
                <span className="mt-3 block text-sm font-semibold leading-5 text-slate-950">
                  {tipo.nome}
                </span>
              </button>
            ))}
          </div>

          {tiposVisiveis.length === 0 && (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Nenhum tipo encontrado para esta busca.
            </div>
          )}

          {tiposSelecionados.length > 0 && (
            <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Selecionadas para este ponto
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {tiposSelecionados.map((tipo) => (
                  <button
                    key={tipo.id}
                    type="button"
                    onClick={() => toggleTipo(tipo.id)}
                    className="rounded-md border admin-border-soft bg-white px-2.5 py-1.5 text-xs font-semibold admin-text hover:admin-bg-soft"
                    aria-label={`Remover ${tipo.codigo} - ${tipo.nome}`}
                  >
                    {tipo.codigo} - {tipo.nome}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {verticalSelecionados.length > 0 && (
          <section className="lg:col-span-2">
            <p className="text-sm font-semibold text-slate-950">Nº patrimônio</p>
            <p className="mt-1 text-sm text-slate-600">
              Preencha o patrimônio de cada placa vertical selecionada.
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {verticalSelecionados.map((tipo) => (
                <label key={tipo.id} className="block">
                  <span className="text-sm font-medium text-slate-700">
                    {tipo.codigo} - {tipo.nome}
                  </span>
                  <input
                    type="text"
                    value={patrimonios[tipo.id] ?? ''}
                    onChange={(event) =>
                      setPatrimonios((current) => ({
                        ...current,
                        [tipo.id]: event.target.value,
                      }))
                    }
                    placeholder="Ex.: PL-000123"
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none admin-focus focus:ring-4"
                  />
                </label>
              ))}
            </div>
          </section>
        )}

        <section className="lg:col-span-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">2. Condição</p>
              <p className="mt-1 text-sm text-slate-600">
                0 significa ausente; 5 significa excelente.
              </p>
            </div>
            <p className="text-sm font-semibold text-slate-950">
              Nota {condicaoNota}/5 · {condicaoSelecionada?.label}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-6 gap-2">
            {condicoesNumericas.map((item) => (
              <button
                key={item.nota}
                type="button"
                onClick={() => setCondicaoNota(item.nota)}
                className={`min-h-11 rounded-md text-sm font-bold text-white shadow-sm transition ${
                  condicaoNota === item.nota
                    ? 'scale-105 ring-4 ring-slate-900/15'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: item.color }}
                aria-label={`Condição ${item.nota}: ${item.label}`}
              >
                {item.nota}
              </button>
            ))}
          </div>
        </section>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Latitude</span>
          <input
            type="number"
            step="any"
            value={latitude}
            onChange={(event) => setLatitude(event.target.value)}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none admin-focus focus:ring-4"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Longitude</span>
          <input
            type="number"
            step="any"
            value={longitude}
            onChange={(event) => setLongitude(event.target.value)}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none admin-focus focus:ring-4"
          />
        </label>

        <label className="block lg:col-span-2">
          <span className="text-sm font-medium text-slate-700">Endereço ou referência</span>
          <input
            type="text"
            value={endereco}
            onChange={(event) => setEndereco(event.target.value)}
            placeholder="Ex.: Av. Brasil, próximo ao cruzamento"
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none admin-focus focus:ring-4"
          />
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              {isResolvingAddress
                ? 'Buscando endereço aproximado...'
                : addressMessage || 'Você pode ajustar manualmente se o endereço vier incompleto.'}
            </p>
            <button
              type="button"
              onClick={() => void fillAddressFromCoordinates(latitude, longitude, true)}
              disabled={isResolvingAddress || !latitude || !longitude}
              className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isResolvingAddress ? 'Buscando...' : 'Preencher pelo mapa'}
            </button>
          </div>
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
          {fotoNome && <p className="mt-2 text-xs text-slate-500">{fotoNome}</p>}
        </label>

        <label className="block lg:col-span-2">
          <span className="text-sm font-medium text-slate-700">Observações</span>
          <textarea
            value={observacoes}
            onChange={(event) => setObservacoes(event.target.value)}
            className="mt-2 min-h-32 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none admin-focus focus:ring-4"
          />
        </label>

        <section className="lg:col-span-2">
          <span className="text-sm font-medium text-slate-700">Motivo</span>
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
              placeholder="Descreva o motivo"
              className="mt-3 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none admin-focus focus:ring-4"
            />
          )}
        </section>

        <label className="block lg:col-span-2">
          <span className="text-sm font-medium text-slate-700">Data</span>
          <input
            type="date"
            value={dataOcorrencia}
            onChange={(event) => setDataOcorrencia(event.target.value)}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none admin-focus focus:ring-4 sm:max-w-xs"
          />
        </label>

        {savedMessage && (
          <div className="rounded-md border admin-border-soft admin-bg-soft px-3 py-2 text-sm admin-text lg:col-span-2">
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
            onClick={handleUseCurrentLocation}
            className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Usar localização atual
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md admin-bg px-4 py-2.5 text-sm font-semibold text-slate-950 admin-bg-hover disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? 'Salvando...' : 'Salvar sinalização'}
          </button>
        </div>
      </form>
    </div>
  )
}
