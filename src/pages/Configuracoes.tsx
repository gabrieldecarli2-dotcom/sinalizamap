import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { Edit2, Plus, RotateCcw, Search, Trash2, X } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { appwriteConfig, isAppwriteConfigured } from '../services/appwrite'
import {
  getTiposSinalizacao,
  resetTiposSinalizacao,
  saveTiposSinalizacao,
} from '../services/tiposSinalizacao'
import type { SinalizacaoCategoria, SinalizacaoTipo } from '../types/sinalizacaoTipo'

type TipoForm = {
  codigo: string
  nome: string
  categoria: SinalizacaoCategoria
  grupo: string
  popular: boolean
  ativo: boolean
}

const emptyForm: TipoForm = {
  codigo: '',
  nome: '',
  categoria: 'Vertical',
  grupo: 'Regulamentação',
  popular: false,
  ativo: true,
}

function createTipoId(codigo: string, nome: string) {
  const normalized = `${codigo}-${nome}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || crypto.randomUUID()
}

export function Configuracoes() {
  const [tipos, setTipos] = useState(() => getTiposSinalizacao())
  const [form, setForm] = useState<TipoForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState<'todos' | SinalizacaoCategoria>('todos')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const filteredTipos = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return tipos.filter((tipo) => {
      const matchesCategory = categoriaFilter === 'todos' || tipo.categoria === categoriaFilter
      const matchesSearch =
        !normalizedSearch ||
        [tipo.codigo, tipo.nome, tipo.grupo]
          .some((value) => value.toLowerCase().includes(normalizedSearch))

      return matchesCategory && matchesSearch
    })
  }, [categoriaFilter, search, tipos])

  const totalAtivos = tipos.filter((tipo) => tipo.ativo).length
  const totalVerticais = tipos.filter((tipo) => tipo.categoria === 'Vertical').length
  const totalHorizontais = tipos.filter((tipo) => tipo.categoria === 'Horizontal').length

  function persistTipos(nextTipos: SinalizacaoTipo[], successMessage: string) {
    setTipos(nextTipos)
    saveTiposSinalizacao(nextTipos)
    setMessage(successMessage)
    setErrorMessage('')
  }

  function clearForm() {
    setForm(emptyForm)
    setEditingId(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')

    if (!form.codigo.trim() || !form.nome.trim()) {
      setErrorMessage('Informe código e nome da sinalização.')
      return
    }

    if (editingId) {
      const nextTipos = tipos.map((tipo) =>
        tipo.id === editingId
          ? {
              ...tipo,
              codigo: form.codigo.trim(),
              nome: form.nome.trim(),
              categoria: form.categoria,
              grupo: form.grupo.trim() || form.categoria,
              popular: form.popular,
              ativo: form.ativo,
            }
          : tipo,
      )

      persistTipos(nextTipos, 'Sinalização atualizada.')
      clearForm()
      return
    }

    const nextTipo: SinalizacaoTipo = {
      id: createTipoId(form.codigo, form.nome),
      codigo: form.codigo.trim(),
      nome: form.nome.trim(),
      categoria: form.categoria,
      grupo: form.grupo.trim() || form.categoria,
      popular: form.popular,
      ativo: form.ativo,
    }

    persistTipos([...tipos, nextTipo], 'Sinalização incluída.')
    clearForm()
  }

  function handleEdit(tipo: SinalizacaoTipo) {
    setEditingId(tipo.id)
    setForm({
      codigo: tipo.codigo,
      nome: tipo.nome,
      categoria: tipo.categoria,
      grupo: tipo.grupo,
      popular: tipo.popular,
      ativo: tipo.ativo,
    })
    setMessage('')
    setErrorMessage('')
  }

  function handleDelete(tipo: SinalizacaoTipo) {
    if (!window.confirm(`Excluir ${tipo.codigo} - ${tipo.nome}?`)) {
      return
    }

    persistTipos(
      tipos.filter((item) => item.id !== tipo.id),
      'Sinalização excluída do catálogo.',
    )

    if (editingId === tipo.id) {
      clearForm()
    }
  }

  function handleReset() {
    if (!window.confirm('Restaurar o catálogo inicial? Alterações locais serão perdidas.')) {
      return
    }

    resetTiposSinalizacao()
    setTipos(getTiposSinalizacao())
    clearForm()
    setMessage('Catálogo inicial restaurado.')
    setErrorMessage('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Preferências do sistema, integrações e catálogo de sinalizações."
      />

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Integração Appwrite</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Status das variáveis de ambiente necessárias para autenticação e acesso aos dados.
        </p>
        <div className="mt-5 space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-medium">
            {isAppwriteConfigured
              ? 'Appwrite configurado para este ambiente.'
              : 'Configure VITE_APPWRITE_PROJECT_ID.'}
          </p>
          <p>Endpoint: {appwriteConfig.endpoint}</p>
          <p>Database ID: {appwriteConfig.databaseId || 'não configurado'}</p>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Catálogo de sinalizações</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Cadastre os tipos exibidos nas telas de nova sinalização e edição. A lista inicial
              inclui placas de regulamentação, advertência e marcas horizontais do Manual
              Brasileiro de Sinalização de Trânsito.
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar inicial
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Ativas</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{totalAtivos}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Verticais</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{totalVerticais}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Horizontais</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{totalHorizontais}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-3 rounded-lg border border-slate-200 p-4 lg:grid-cols-[0.7fr_1.2fr_0.8fr_0.8fr_auto_auto]">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Código</span>
            <input
              value={form.codigo}
              onChange={(event) => setForm((current) => ({ ...current, codigo: event.target.value }))}
              placeholder="Ex.: R1"
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none admin-focus focus:ring-4"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Nome</span>
            <input
              value={form.nome}
              onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
              placeholder="Ex.: Pare"
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none admin-focus focus:ring-4"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Categoria</span>
            <select
              value={form.categoria}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  categoria: event.target.value as SinalizacaoCategoria,
                  grupo: event.target.value === 'Horizontal' ? 'Marcas horizontais' : current.grupo,
                }))
              }
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none admin-focus focus:ring-4"
            >
              <option value="Vertical">Vertical</option>
              <option value="Horizontal">Horizontal</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Grupo</span>
            <input
              value={form.grupo}
              onChange={(event) => setForm((current) => ({ ...current, grupo: event.target.value }))}
              placeholder="Regulamentação"
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none admin-focus focus:ring-4"
            />
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.popular}
              onChange={(event) => setForm((current) => ({ ...current, popular: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 admin-text focus:ring-[#ebb734]"
            />
            Popular
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

          <div className="flex gap-2 lg:col-span-6">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-md admin-bg px-4 py-2.5 text-sm font-semibold text-slate-950 admin-bg-hover"
            >
              <Plus className="h-4 w-4" />
              {editingId ? 'Salvar edição' : 'Incluir sinalização'}
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
              placeholder="Buscar por código, nome ou grupo"
              className="w-full rounded-md border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none admin-focus focus:ring-4"
            />
          </label>
          <div className="inline-grid grid-cols-3 rounded-md border border-slate-200 bg-white p-1 shadow-sm">
            {(['todos', 'Vertical', 'Horizontal'] as const).map((categoria) => (
              <button
                key={categoria}
                type="button"
                onClick={() => setCategoriaFilter(categoria)}
                className={`rounded px-3 py-2 text-xs font-semibold transition ${
                  categoriaFilter === categoria
                    ? 'admin-bg text-slate-950'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {categoria === 'todos' ? 'Todos' : categoria}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
          <div className="max-h-[32rem] divide-y divide-slate-200 overflow-auto">
            {filteredTipos.map((tipo) => (
              <div key={tipo.id} className="grid gap-3 p-4 lg:grid-cols-[0.7fr_1.4fr_0.8fr_0.8fr_auto] lg:items-center">
                <div>
                  <p className="font-semibold text-slate-950">{tipo.codigo}</p>
                  <p className="mt-1 text-xs text-slate-500">{tipo.categoria}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{tipo.nome}</p>
                  <p className="mt-1 text-xs text-slate-500">{tipo.grupo}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tipo.popular && (
                    <span className="rounded admin-bg-soft px-2 py-1 text-xs font-semibold admin-text">
                      popular
                    </span>
                  )}
                  <span className={`rounded px-2 py-1 text-xs font-semibold ${
                    tipo.ativo
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {tipo.ativo ? 'ativo' : 'inativo'}
                  </span>
                </div>
                <div className="text-xs text-slate-500">{tipo.id}</div>
                <div className="flex gap-2 lg:justify-end">
                  <button
                    type="button"
                    onClick={() => handleEdit(tipo)}
                    className="grid h-9 w-9 place-items-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
                    aria-label={`Editar ${tipo.codigo}`}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(tipo)}
                    className="grid h-9 w-9 place-items-center rounded-md border border-red-200 text-red-700 hover:bg-red-50"
                    aria-label={`Excluir ${tipo.codigo}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {filteredTipos.length === 0 && (
              <div className="grid min-h-40 place-items-center p-6 text-center text-sm text-slate-600">
                Nenhuma sinalização encontrada.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
