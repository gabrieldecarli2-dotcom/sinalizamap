import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Crosshair,
  LayoutDashboard,
  Loader2,
  LocateFixed,
  LogOut,
  MapPinned,
  Plus,
  RefreshCw,
  ShieldAlert,
  X,
} from 'lucide-react'
import {
  IrregularidadeStatusFilter,
  type IrregularidadeStatusFilterValue,
} from '../components/IrregularidadeStatusFilter'
import { OpenLayersCampoMap } from '../components/OpenLayersCampoMap'
import { useAuth } from '../hooks/useAuth'
import { useCurrentLocation } from '../hooks/useCurrentLocation'
import { useUsuarioPerfil } from '../hooks/useUsuarioPerfil'
import { listSinalizacoes } from '../services/sinalizacoes'
import type { SinalizacaoDocument } from '../services/sinalizacoes'

export function CampoGcmMapa() {
  const [followLocation, setFollowLocation] = useState(true)
  const [selectedPoint, setSelectedPoint] = useState<[number, number] | null>(null)
  const [sinalizacoes, setSinalizacoes] = useState<SinalizacaoDocument[]>([])
  const [irregularidadeFilter, setIrregularidadeFilter] =
    useState<IrregularidadeStatusFilterValue>('pendentes')
  const { location, status, error, requestLocation } = useCurrentLocation()
  const { signOut, user } = useAuth()
  const perfil = useUsuarioPerfil()
  const navigate = useNavigate()

  const center = location
    ? ([location.latitude, location.longitude] as [number, number])
    : null
  const accuracy = location?.accuracy ?? null
  const registerPoint = selectedPoint ?? center
  const irregularidades = useMemo(
    () =>
      sinalizacoes.filter((sinalizacao) => {
        if (sinalizacao.categoria !== 'irregularidade') {
          return false
        }

        if (irregularidadeFilter === 'pendentes') {
          return sinalizacao.status !== 'resolvida'
        }

        if (irregularidadeFilter === 'resolvidas') {
          return sinalizacao.status === 'resolvida'
        }

        return true
      }),
    [irregularidadeFilter, sinalizacoes],
  )

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

    return () => {
      isMounted = false
    }
  }, [])

  function handleNewIrregularidade() {
    const search = registerPoint
      ? `?lat=${registerPoint[0].toFixed(7)}&lng=${registerPoint[1].toFixed(7)}`
      : ''

    navigate(`/irregularidades/nova${search}`)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <main className="relative h-[100svh] overflow-hidden bg-slate-950 text-slate-950">
      <OpenLayersCampoMap
        center={center}
        selectedPoint={selectedPoint}
        sinalizacoes={irregularidades}
        followLocation={followLocation}
        accuracy={accuracy}
        mode="gcm"
        onSelectPoint={(position) => {
          setSelectedPoint(position)
          setFollowLocation(false)
        }}
      />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto flex items-center justify-between rounded-lg border border-white/70 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-600 text-white">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">Campo GCM</p>
              <p className="truncate text-xs text-slate-500">{user?.email ?? 'Sessão ativa'}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {perfil === 'admin' && (
              <Link
                to="/dashboard"
                className="grid h-10 w-10 place-items-center rounded-md text-slate-600 hover:bg-slate-100"
                aria-label="Abrir painel administrativo"
              >
                <LayoutDashboard className="h-5 w-5" />
              </Link>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              className="grid h-10 w-10 place-items-center rounded-md text-slate-600 hover:bg-slate-100"
              aria-label="Sair"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="pointer-events-none absolute inset-x-0 top-20 z-20 px-3">
        <div className="pointer-events-auto flex justify-end">
          <IrregularidadeStatusFilter
            value={irregularidadeFilter}
            onChange={setIrregularidadeFilter}
            variant="gcm"
          />
        </div>
      </div>

      <section className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto rounded-lg border border-white/70 bg-white/95 p-3 shadow-2xl backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                {status === 'loading' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                ) : (
                  <LocateFixed className="h-4 w-4 text-blue-600" />
                )}
                <p className="text-sm font-semibold text-slate-950">
                  {status === 'ready' ? 'Localização em tempo real' : 'Buscando GPS'}
                </p>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                {selectedPoint
                  ? `Ponto selecionado: ${selectedPoint[0].toFixed(6)}, ${selectedPoint[1].toFixed(6)}`
                  : center
                    ? `${location?.latitude.toFixed(6)}, ${location?.longitude.toFixed(6)}`
                    : error || 'Toque no mapa ou permita o GPS para registrar.'}
              </p>
              {accuracy && (
                <p className="mt-1 text-xs text-slate-500">
                  Precisão aproximada: {Math.round(accuracy)} m
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                requestLocation()
                setFollowLocation(false)
                window.setTimeout(() => setFollowLocation(true), 0)
              }}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
              aria-label="Atualizar localização"
            >
              {status === 'loading' ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <Crosshair className="h-5 w-5" />
              )}
            </button>
          </div>

          {selectedPoint && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
              <p className="text-xs font-medium leading-5 text-blue-800">
                A irregularidade será registrada no ponto escolhido no mapa.
              </p>
              <button
                type="button"
                onClick={() => setSelectedPoint(null)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-blue-700 hover:bg-blue-100"
                aria-label="Limpar ponto selecionado"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleNewIrregularidade}
            className="mt-3 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            {selectedPoint ? 'Registrar ponto' : 'Registrar irregularidade'}
          </button>

          <button
            type="button"
            onClick={() => setFollowLocation((value) => !value)}
            className={`mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold ${
              followLocation ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <MapPinned className="h-4 w-4" />
            {followLocation ? 'Acompanhando meu deslocamento' : 'Mapa livre para navegar'}
          </button>
        </div>
      </section>
    </main>
  )
}
