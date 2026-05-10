import type { FormEvent } from 'react'
import { useState } from 'react'
import { Save } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { useAuth } from '../hooks/useAuth'
import {
  getUsuariosSistema,
  saveUsuariosSistema,
  updateUsuarioSistema,
} from '../services/usuarios'

export function Perfil() {
  const { user, isDevelopmentMode, refreshUser } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [emailPassword, setEmailPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  function syncLocalUser(nextName: string, nextEmail: string) {
    if (!user) {
      return
    }

    const usuarios = getUsuariosSistema()
    const nextUsuarios = usuarios.map((usuario) =>
      usuario.email === user.email || usuario.id === user.$id
        ? {
            ...usuario,
            nome: nextName || usuario.nome,
            email: nextEmail || usuario.email,
          }
        : usuario,
    )

    saveUsuariosSistema(nextUsuarios)
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')

    if (!user || isDevelopmentMode) {
      setErrorMessage('Entre com um usuário real para alterar o perfil.')
      return
    }

    if (!name.trim() || !email.trim()) {
      setErrorMessage('Informe nome e e-mail.')
      return
    }

    setIsSavingProfile(true)

    try {
      if (email.trim().toLowerCase() !== user.email.toLowerCase() && !emailPassword) {
        setErrorMessage('Informe a senha atual para alterar o e-mail.')
        return
      }

      await updateUsuarioSistema(user.$id, {
        nome: name.trim(),
        email: email.trim().toLowerCase(),
      })
      syncLocalUser(name.trim(), email.trim().toLowerCase())
      await refreshUser()
      setEmailPassword('')
      setMessage('Perfil atualizado.')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Não foi possível atualizar o perfil.',
      )
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')

    if (!user || isDevelopmentMode) {
      setErrorMessage('Entre com um usuário real para alterar a senha.')
      return
    }

    if (!newPassword || !oldPassword) {
      setErrorMessage('Informe a senha atual e a nova senha.')
      return
    }

    setIsSavingPassword(true)

    try {
      await updateUsuarioSistema(user.$id, {
        senha: newPassword,
      })
      setNewPassword('')
      setOldPassword('')
      setMessage('Senha atualizada.')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Não foi possível atualizar a senha.',
      )
    } finally {
      setIsSavingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meu perfil"
        description="Atualize seus dados de acesso ao SinalizaMap."
      />

      <section className="grid gap-5 lg:grid-cols-2">
        <form
          onSubmit={handleProfileSubmit}
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-950">Dados do usuário</h2>
          <div className="mt-5 grid gap-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Nome</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="admin-focus mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:ring-4"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">E-mail</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="admin-focus mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:ring-4"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Senha atual para alterar e-mail
              </span>
              <input
                type="password"
                value={emailPassword}
                onChange={(event) => setEmailPassword(event.target.value)}
                className="admin-focus mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:ring-4"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isSavingProfile}
            className="admin-bg admin-bg-hover mt-5 inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Save className="h-4 w-4" />
            {isSavingProfile ? 'Salvando...' : 'Salvar perfil'}
          </button>
        </form>

        <form
          onSubmit={handlePasswordSubmit}
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-950">Senha</h2>
          <div className="mt-5 grid gap-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Senha atual</span>
              <input
                type="password"
                value={oldPassword}
                onChange={(event) => setOldPassword(event.target.value)}
                className="admin-focus mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:ring-4"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Nova senha</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="admin-focus mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:ring-4"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isSavingPassword}
            className="admin-bg admin-bg-hover mt-5 inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Save className="h-4 w-4" />
            {isSavingPassword ? 'Salvando...' : 'Alterar senha'}
          </button>
        </form>
      </section>

      {message && (
        <div className="rounded-md border admin-border-soft admin-bg-soft px-3 py-2 text-sm admin-text">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      )}
    </div>
  )
}
