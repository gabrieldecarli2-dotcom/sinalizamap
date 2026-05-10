import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Edit2, Plus, Search, Trash2, X } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import {
  createUsuarioSistema,
  deleteUsuarioSistema,
  listUsuariosSistema,
  updateUsuarioSistema,
  type UsuarioPerfil,
  type UsuarioSistema,
} from '../services/usuarios'

type UsuarioForm = {
  nome: string
  email: string
  senha: string
  perfil: UsuarioPerfil
  ativo: boolean
}

const emptyForm: UsuarioForm = {
  nome: '',
  email: '',
  senha: '',
  perfil: 'usuario',
  ativo: true,
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function Usuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([])
  const [form, setForm] = useState<UsuarioForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [perfilFilter, setPerfilFilter] = useState<'todos' | UsuarioPerfil>('todos')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let isMounted = true

    listUsuariosSistema()
      .then((nextUsuarios) => {
        if (isMounted) {
          setUsuarios(nextUsuarios)
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Não foi possível carregar usuários.',
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

  const filteredUsuarios = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return usuarios.filter((usuario) => {
      const matchesPerfil = perfilFilter === 'todos' || usuario.perfil === perfilFilter
      const matchesSearch =
        !normalizedSearch ||
        [usuario.nome, usuario.email, usuario.perfil].some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        )

      return matchesPerfil && matchesSearch
    })
  }, [perfilFilter, search, usuarios])

  const totalAdmins = usuarios.filter((usuario) => usuario.perfil === 'admin').length
  const totalUsuarios = usuarios.filter((usuario) => usuario.perfil === 'usuario').length
  const totalGcm = usuarios.filter((usuario) => usuario.perfil === 'gcm').length
  const totalAtivos = usuarios.filter((usuario) => usuario.ativo).length

  function persistUsuarios(nextUsuarios: UsuarioSistema[], successMessage: string) {
    setUsuarios(nextUsuarios)
    setMessage(successMessage)
    setErrorMessage('')
  }

  function clearForm() {
    setForm(emptyForm)
    setEditingId(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')

    const email = normalizeEmail(form.email)

    if (!form.nome.trim() || !email) {
      setErrorMessage('Informe nome e e-mail do usuário.')
      return
    }

    const emailAlreadyExists = usuarios.some(
      (usuario) => normalizeEmail(usuario.email) === email && usuario.id !== editingId,
    )

    if (emailAlreadyExists) {
      setErrorMessage('Já existe um usuário cadastrado com esse e-mail.')
      return
    }

    if (!editingId && !form.senha) {
      setErrorMessage('Informe uma senha inicial para o usuário.')
      return
    }

    setIsSaving(true)

    try {
      if (editingId) {
        const updated = await updateUsuarioSistema(editingId, {
          nome: form.nome.trim(),
          email,
          ...(form.senha ? { senha: form.senha } : {}),
          perfil: form.perfil,
          ativo: form.ativo,
        })
        const nextUsuarios = usuarios.map((usuario) =>
          usuario.id === editingId ? updated : usuario,
        )

        persistUsuarios(nextUsuarios, 'Usuário atualizado.')
        clearForm()
        return
      }

      const created = await createUsuarioSistema({
        nome: form.nome.trim(),
        email,
        senha: form.senha,
        perfil: form.perfil,
        ativo: form.ativo,
      })

      persistUsuarios([...usuarios, created], 'Usuário incluído.')
      clearForm()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Não foi possível salvar.')
    } finally {
      setIsSaving(false)
    }
  }

  function handleEdit(usuario: UsuarioSistema) {
    setEditingId(usuario.id)
    setForm({
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      perfil: usuario.perfil,
      ativo: usuario.ativo,
    })
    setMessage('')
    setErrorMessage('')
  }

  async function handleDelete(usuario: UsuarioSistema) {
    if (!window.confirm(`Excluir ${usuario.nome}?`)) {
      return
    }

    setIsSaving(true)
    setMessage('')
    setErrorMessage('')

    try {
      await deleteUsuarioSistema(usuario.id)
      persistUsuarios(
        usuarios.filter((item) => item.id !== usuario.id),
        'Usuário excluído.',
      )

      if (editingId === usuario.id) {
        clearForm()
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Não foi possível excluir.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários"
        description="Gestão de acesso ao sistema e perfil operacional."
      />

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Gestão de usuários</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              O perfil admin tem acesso total. O perfil usuário acessa a tela de campo da
              sinalização. O perfil GCM acessa a tela de campo para registrar irregularidades.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Ativos</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{totalAtivos}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Admins</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{totalAdmins}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Usuários de campo</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{totalUsuarios}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">GCM</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{totalGcm}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-3 rounded-lg border border-slate-200 p-4 lg:grid-cols-[1fr_1fr_1fr_0.8fr_auto]">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Nome</span>
            <input
              value={form.nome}
              onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
              placeholder="Ex.: João Silva"
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none admin-focus focus:ring-4"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">E-mail</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="usuario@email.com"
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none admin-focus focus:ring-4"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              {editingId ? 'Nova senha' : 'Senha inicial'}
            </span>
            <input
              type="password"
              value={form.senha}
              onChange={(event) => setForm((current) => ({ ...current, senha: event.target.value }))}
              placeholder={editingId ? 'Deixe em branco para manter' : 'Senha de acesso'}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none admin-focus focus:ring-4"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Perfil</span>
            <select
              value={form.perfil}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  perfil: event.target.value as UsuarioPerfil,
                }))
              }
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none admin-focus focus:ring-4"
            >
              <option value="admin">Admin</option>
              <option value="usuario">Usuário</option>
              <option value="gcm">GCM</option>
            </select>
          </label>

          <label className="flex items-end gap-2 pb-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(event) => setForm((current) => ({ ...current, ativo: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 admin-text focus:ring-[#ebb734]"
            />
            Ativo
          </label>

          <div className="flex gap-2 lg:col-span-5">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-md admin-bg px-4 py-2.5 text-sm font-semibold text-slate-950 admin-bg-hover"
            >
              <Plus className="h-4 w-4" />
              {isSaving ? 'Salvando...' : editingId ? 'Salvar edição' : 'Criar usuário'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={clearForm}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
            )}
          </div>
        </form>

        {message && (
          <div className="mt-4 rounded-md border admin-border-soft admin-bg-soft px-3 py-2 text-sm admin-text">
            {message}
          </div>
        )}
        {errorMessage && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block lg:w-96">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, e-mail ou perfil"
              className="w-full rounded-md border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none admin-focus focus:ring-4"
            />
          </label>

          <div className="inline-grid grid-cols-2 rounded-md border border-slate-200 bg-white p-1 shadow-sm sm:grid-cols-4">
            {(['todos', 'admin', 'usuario', 'gcm'] as const).map((perfil) => (
              <button
                key={perfil}
                type="button"
                onClick={() => setPerfilFilter(perfil)}
                className={`rounded px-3 py-2 text-xs font-semibold transition ${
                  perfilFilter === perfil
                    ? 'admin-bg text-slate-950'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {perfil === 'todos'
                  ? 'Todos'
                  : perfil === 'admin'
                    ? 'Admin'
                    : perfil === 'gcm'
                      ? 'GCM'
                      : 'Usuário'}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
          <div className="divide-y divide-slate-200">
            {isLoading && (
              <div className="grid min-h-40 place-items-center p-6 text-center text-sm text-slate-600">
                Carregando usuários.
              </div>
            )}

            {!isLoading && filteredUsuarios.map((usuario) => (
              <div key={usuario.id} className="grid gap-3 p-4 lg:grid-cols-[1fr_1.3fr_0.7fr_0.7fr_auto] lg:items-center">
                <div>
                  <p className="font-semibold text-slate-950">{usuario.nome}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Criado em {new Date(usuario.criado_em).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <p className="text-sm text-slate-700">{usuario.email}</p>
                <span className={`w-fit rounded px-2 py-1 text-xs font-semibold ${
                  usuario.perfil === 'admin'
                    ? 'admin-bg-soft admin-text'
                    : usuario.perfil === 'gcm'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-slate-100 text-slate-700'
                }`}>
                  {usuario.perfil === 'admin'
                    ? 'Admin'
                    : usuario.perfil === 'gcm'
                      ? 'GCM'
                      : 'Usuário'}
                </span>
                <span className={`w-fit rounded px-2 py-1 text-xs font-semibold ${
                  usuario.ativo
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {usuario.ativo ? 'Ativo' : 'Inativo'}
                </span>
                <div className="flex gap-2 lg:justify-end">
                  <button
                    type="button"
                    onClick={() => handleEdit(usuario)}
                    className="grid h-9 w-9 place-items-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
                    aria-label={`Editar ${usuario.nome}`}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(usuario)}
                    className="grid h-9 w-9 place-items-center rounded-md border border-red-200 text-red-700 hover:bg-red-50"
                    aria-label={`Excluir ${usuario.nome}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {!isLoading && filteredUsuarios.length === 0 && (
              <div className="grid min-h-40 place-items-center p-6 text-center text-sm text-slate-600">
                Nenhum usuário encontrado.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
