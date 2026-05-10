import type { FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { useAuth } from '../hooks/useAuth'
import { useTiposSinalizacao } from '../hooks/useTiposSinalizacao'
import { reverseGeocode } from '../services/geocoding'
import { createSinalizacao } from '../services/sinalizacoes'
import type { SinalizacaoTipo } from '../types/sinalizacaoTipo'

type CategoriaIrregularidade = 'Vertical' | 'Horizontal' | 'Outros'

export function NovaIrregularidade() {
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
  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState<CategoriaIrregularidade>('Vertical')
  const [buscaTipo, setBuscaTipo] = useState('')
  const [selectedTipoIds, setSelectedTipoIds] = useState<string[]>(['r1-pare'])
  const [patrimonios, setPatrimonios] = useState<Record<string, string>>({})
  const [endereco, setEndereco] = useState('')
  const [situacao, setSituacao] = useState('')
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
  const tiposVisiveis = useMemo(() => {
    if (categoriaSelecionada === 'Outros') {
      return []
    }

    const normalizedSearch = buscaTipo.trim().toLowerCase()
    const tiposDaCategoria = tiposAtivos.filter(
      (tipo) => tipo.categoria === categoriaSelecionada,
    )

    if (!normalizedSearch) {
      return tiposDaCategoria.filter((tipo) => tipo.popular).slice(0, 4)
    }

    return tiposDaCategoria.filter((tipo) => {
      const matchesSearch =
        tipo.codigo.toLowerCase().includes(normalizedSearch) ||
        tipo.nome.toLowerCase().includes(normalizedSearch)

      return matchesSearch
    })
  }, [buscaTipo, categoriaSelecionada, tiposAtivos])

  function selectCategoria(categoria: CategoriaIrregularidade) {
    setCategoriaSelecionada(categoria)
    setBuscaTipo('')

    if (categoria === 'Outros') {
      setSelectedTipoIds(['irregularidade-outros'])
      return
    }

    const selectedIsSameCategory =
      tiposSelecionados.some((tipo) => tipo.categoria === categoria)

    if (!selectedIsSameCategory) {
      const firstPopular =
        tiposAtivos.find((tipo) => tipo.categoria === categoria && tipo.popular) ??
        tiposAtivos.find((tipo) => tipo.categoria === categoria)

      setSelectedTipoIds(firstPopular ? [firstPopular.id] : [])
    }
  }

  function toggleTipo(tipoId: string) {
    setSelectedTipoIds((current) => {
      if (current.includes(tipoId)) {
        return current.filter((id) => id !== tipoId)
      }

      return [...current.filter((id) => id !== 'irregularidade-outros'), tipoId]
    })
  }

  function getTipoIrregularidadePayloads() {
    if (categoriaSelecionada === 'Outros') {
      return [{
        tipo_id: 'irregularidade-outros',
        tipo_nome: 'Irregularidade - Outros',
        patrimonio: '',
      }]
    }

    if (tiposSelecionados.length === 0) {
      return []
    }

    return tiposSelecionados.map((tipo) => ({
      tipo_id: tipo.id,
      tipo_nome: `Irregularidade - ${tipo.codigo} - ${tipo.nome}`,
      patrimonio: tipo.categoria === 'Vertical' ? patrimonios[tipo.id]?.trim() ?? '' : '',
    }))
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavedMessage('')
    setErrorMessage('')

    const parsedLatitude = Number(latitude)
    const parsedLongitude = Number(longitude)

    if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) {
      setErrorMessage('Informe uma latitude e longitude válidas.')
      return
    }

    const tipoPayloads = getTipoIrregularidadePayloads()

    if (tipoPayloads.length === 0) {
      setErrorMessage('Selecione pelo menos um tipo da irregularidade.')
      return
    }

    if (!situacao.trim()) {
      setErrorMessage('Descreva a situação observada.')
      return
    }

    if (!user || isDevelopmentMode) {
      setErrorMessage('Para salvar no Appwrite, entre com um usuário real do Appwrite.')
      return
    }

    setIsSaving(true)

    try {
      const irregularidades = await Promise.all(
        tipoPayloads.map((tipoPayload) =>
          createSinalizacao({
            tipo_id: tipoPayload.tipo_id,
            tipo_nome: tipoPayload.tipo_nome,
            categoria: 'irregularidade',
            condicao: 'irregularidade',
            latitude: parsedLatitude,
            longitude: parsedLongitude,
            endereco: endereco.trim(),
            observacoes: situacao.trim(),
            foto_nome: fotoNome,
            patrimonio: tipoPayload.patrimonio,
            criado_por: user.$id,
          }),
        ),
      )

      setSavedMessage(
        irregularidades.length === 1
          ? `Irregularidade salva com sucesso. Protocolo: ${irregularidades[0].$id}`
          : `${irregularidades.length} irregularidades salvas no mesmo ponto.`,
      )
      window.setTimeout(() => {
        navigate('/campo', { replace: true })
      }, 1200)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar a irregularidade no Appwrite.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 px-4 py-6 md:px-8">
      <PageHeader
        title="Nova Irregularidade"
        description="Registro de situação observada pela equipe GCM durante o serviço."
      />

      <form
        onSubmit={handleSubmit}
        className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-2"
      >
        <section className="lg:col-span-2">
          <div>
            <p className="text-sm font-semibold text-slate-950">Tipo</p>
            <p className="mt-1 text-sm text-slate-600">
              Escolha vertical ou horizontal para selecionar a sinalização relacionada, ou use Outros para descrever uma situação diferente.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {(['Vertical', 'Horizontal', 'Outros'] as const).map((categoria) => (
              <button
                key={categoria}
                type="button"
                onClick={() => selectCategoria(categoria)}
                className={`min-h-12 rounded-md border px-3 text-sm font-semibold transition ${
                  categoriaSelecionada === categoria
                    ? 'border-blue-600 bg-blue-50 text-blue-800 ring-4 ring-blue-600/10'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {categoria}
              </button>
            ))}
          </div>

          {categoriaSelecionada !== 'Outros' && (
            <>
              <label className="mt-4 block">
                <span className="text-sm font-medium text-slate-700">
                  Buscar por código ou nome
                </span>
                <input
                  type="search"
                  value={buscaTipo}
                  onChange={(event) => setBuscaTipo(event.target.value)}
                  placeholder="Ex.: R1, Pare, Lombada, faixa"
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
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
                {tiposVisiveis.map((tipo: SinalizacaoTipo) => (
                  <button
                    key={tipo.id}
                    type="button"
                    onClick={() => toggleTipo(tipo.id)}
                    className={`flex min-h-28 flex-col items-start justify-start rounded-md border p-3 text-left align-top transition ${
                      selectedTipoIds.includes(tipo.id)
                        ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-600/10'
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
                        className="rounded-md border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-50"
                        aria-label={`Remover ${tipo.codigo} - ${tipo.nome}`}
                      >
                        {tipo.codigo} - {tipo.nome}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {verticalSelecionados.length > 0 && (
          <section className="lg:col-span-2">
            <p className="text-sm font-semibold text-slate-950">Nº patrimônio</p>
            <p className="mt-1 text-sm text-slate-600">
              Preencha o patrimônio quando a irregularidade envolver placa vertical.
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
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                  />
                </label>
              ))}
            </div>
          </section>
        )}

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Latitude</span>
          <input
            type="number"
            step="any"
            value={latitude}
            onChange={(event) => setLatitude(event.target.value)}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Longitude</span>
          <input
            type="number"
            step="any"
            value={longitude}
            onChange={(event) => setLongitude(event.target.value)}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
          />
        </label>

        <label className="block lg:col-span-2">
          <span className="text-sm font-medium text-slate-700">Endereço ou referência</span>
          <input
            type="text"
            value={endereco}
            onChange={(event) => setEndereco(event.target.value)}
            placeholder="Ex.: Rua, cruzamento ou referência"
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
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
          <span className="text-sm font-medium text-slate-700">Situação observada</span>
          <textarea
            value={situacao}
            onChange={(event) => setSituacao(event.target.value)}
            placeholder="Ex.: Placa caída no canteiro, sinalização apagada, obstáculo na via."
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
          {fotoNome && <p className="mt-2 text-xs text-slate-500">{fotoNome}</p>}
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
            {isSaving ? 'Salvando...' : 'Salvar irregularidade'}
          </button>
        </div>
      </form>
    </div>
  )
}
