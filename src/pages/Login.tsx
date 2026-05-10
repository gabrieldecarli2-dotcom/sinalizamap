import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Loader2, MapPinned } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { isAppwriteConfigured } from '../services/appwrite'

type LocationState = {
  from?: {
    pathname?: string
  }
}

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { isAuthenticated, signIn, signInDevelopment } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null
  const redirectTo = state?.from?.pathname ?? '/dashboard'

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!isAppwriteConfigured) {
      setError('Configure VITE_APPWRITE_PROJECT_ID para autenticar.')
      return
    }

    setIsSubmitting(true)
    try {
      await signIn(email, password)
      navigate(redirectTo, { replace: true })
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : 'Não foi possível autenticar.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleDevelopmentLogin() {
    signInDevelopment()
    navigate(redirectTo, { replace: true })
  }

  return (
    <main className="grid min-h-screen bg-slate-950 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="flex min-h-[42vh] flex-col justify-between bg-[linear-gradient(135deg,#ebb734,#ffd363)] p-8 text-slate-950 md:p-12">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-white/15 ring-1 ring-white/20">
            <MapPinned className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-semibold">SinalizaMap</p>
            <p className="text-sm text-slate-900/70">Controle e registro da sinalização horizontal e vertical.</p>
          </div>
        </div>

        <div className="max-w-xl">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Coordenadoria Municipal de Trânsito
          </h1>

          <p className="mt-5 text-base leading-7 text-slate-900/75">
          Secretaria Municipal de Segurança, Trânsito, Cidadania e Defesa Civil.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center bg-slate-50 px-5 py-10">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8"
        >
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">Entrar</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Acesse com um usuário cadastrado no projeto Appwrite.
            </p>
          </div>

          <div className="mt-7 space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">E-mail</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="admin-focus mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none transition focus:ring-4"
                autoComplete="email"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Senha</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="admin-focus mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none transition focus:ring-4"
                autoComplete="current-password"
                required
              />
            </label>
          </div>

          {error && (
            <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="admin-bg admin-bg-hover mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Acessar sistema
          </button>

          {import.meta.env.DEV && (
            <button
              type="button"
              onClick={handleDevelopmentLogin}
              className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Entrar em modo desenvolvimento
            </button>
          )}
        </form>
      </section>
    </main>
  )
}
