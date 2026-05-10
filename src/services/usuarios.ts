import { apiRequest } from './api'

export type UsuarioPerfil = 'admin' | 'usuario' | 'gcm'

export interface UsuarioSistema {
  id: string
  $id?: string
  nome: string
  name?: string
  email: string
  perfil: UsuarioPerfil
  prefs?: {
    role?: string
  }
  ativo: boolean
  criado_em: string
  atualizado_em?: string
}

export interface UsuarioIdentidade {
  id: string
  nome: string
  email: string
}

export type UsuarioPayload = {
  nome: string
  email: string
  perfil: UsuarioPerfil
  ativo: boolean
  senha?: string
}

const cacheStorageKey = 'sinalizamap:usuarios-cache'
const updateEventName = 'sinalizamap:usuarios-updated'

function notifyUsuariosUpdated() {
  window.dispatchEvent(new Event(updateEventName))
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function normalizeUsuario(usuario: UsuarioSistema): UsuarioSistema {
  return {
    ...usuario,
    id: usuario.id ?? usuario.$id ?? '',
    nome: usuario.nome ?? usuario.name ?? '',
    perfil: usuario.perfil ?? (usuario.prefs?.role as UsuarioPerfil) ?? 'usuario',
  }
}

function cacheUsuarios(usuarios: UsuarioSistema[]) {
  window.localStorage.setItem(cacheStorageKey, JSON.stringify(usuarios.map(normalizeUsuario)))
  notifyUsuariosUpdated()
}

export function getUsuariosSistema() {
  const storedValue = window.localStorage.getItem(cacheStorageKey)

  if (!storedValue) {
    return [] satisfies UsuarioSistema[]
  }

  try {
    const parsedValue = JSON.parse(storedValue) as UsuarioSistema[]

    if (!Array.isArray(parsedValue)) {
      return [] satisfies UsuarioSistema[]
    }

    return parsedValue.map(normalizeUsuario)
  } catch {
    return [] satisfies UsuarioSistema[]
  }
}

export function saveUsuariosSistema(usuarios: UsuarioSistema[]) {
  cacheUsuarios(usuarios)
}

export async function listUsuariosSistema() {
  const response = await apiRequest<{ rows: UsuarioSistema[]; total: number }>('usuarios')
  const usuarios = response.rows.map(normalizeUsuario)
  cacheUsuarios(usuarios)

  return usuarios
}

export async function createUsuarioSistema(input: UsuarioPayload) {
  const usuario = normalizeUsuario(
    await apiRequest<UsuarioSistema>('usuarios', {
      method: 'POST',
      body: input,
    }),
  )

  await listUsuariosSistema().catch(() => undefined)
  return usuario
}

export async function updateUsuarioSistema(id: string, input: Partial<UsuarioPayload>) {
  const usuario = normalizeUsuario(
    await apiRequest<UsuarioSistema>(
      'usuarios',
      {
        method: 'PATCH',
        body: input,
      },
      { id },
    ),
  )

  await listUsuariosSistema().catch(() => undefined)
  return usuario
}

export async function deleteUsuarioSistema(id: string) {
  await apiRequest<{ ok: boolean }>(
    'usuarios',
    {
      method: 'DELETE',
    },
    { id },
  )

  await listUsuariosSistema().catch(() => undefined)
}

export function getUsuariosSistemaUpdateEventName() {
  return updateEventName
}

export function getUsuariosIdentidades() {
  return [] as UsuarioIdentidade[]
}

export function upsertUsuarioIdentidade(input: UsuarioIdentidade) {
  const usuarios = getUsuariosSistema()
  const usuarioExists = usuarios.some((usuario) => usuario.id === input.id)

  if (!usuarioExists) {
    cacheUsuarios([
      ...usuarios,
      {
        id: input.id,
        nome: input.nome,
        email: normalizeEmail(input.email),
        perfil: 'usuario',
        ativo: true,
        criado_em: new Date().toISOString(),
      },
    ])
  }
}

export function resolveUsuarioPerfil(input: {
  email?: string
  prefsRole?: unknown
  isDevelopmentMode?: boolean
}) {
  if (input.isDevelopmentMode || input.prefsRole === 'admin') {
    return 'admin' satisfies UsuarioPerfil
  }

  if (input.prefsRole === 'gcm') {
    return 'gcm' satisfies UsuarioPerfil
  }

  if (input.prefsRole === 'usuario') {
    return 'usuario' satisfies UsuarioPerfil
  }

  const email = normalizeEmail(input.email ?? '')
  const usuario = getUsuariosSistema().find((item) => normalizeEmail(item.email) === email)

  if (usuario && usuario.ativo) {
    return usuario.perfil
  }

  return 'usuario' satisfies UsuarioPerfil
}
