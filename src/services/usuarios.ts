export type UsuarioPerfil = 'admin' | 'usuario' | 'gcm'

export interface UsuarioSistema {
  id: string
  nome: string
  email: string
  appwrite_id?: string
  perfil: UsuarioPerfil
  ativo: boolean
  criado_em: string
}

const storageKey = 'sinalizamap:usuarios'
const identityStorageKey = 'sinalizamap:appwrite-identidades'
const updateEventName = 'sinalizamap:usuarios-updated'

export interface UsuarioIdentidade {
  id: string
  nome: string
  email: string
}

const initialUsers: UsuarioSistema[] = [
  {
    id: 'admin-email',
    nome: 'Administrador',
    email: 'admin@email.com',
    perfil: 'admin',
    ativo: true,
    criado_em: new Date().toISOString(),
  },
]

function notifyUsuariosUpdated() {
  window.dispatchEvent(new Event(updateEventName))
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function getUsuariosSistema() {
  const storedValue = window.localStorage.getItem(storageKey)

  if (!storedValue) {
    return initialUsers
  }

  try {
    const parsedValue = JSON.parse(storedValue) as UsuarioSistema[]

    if (!Array.isArray(parsedValue)) {
      return initialUsers
    }

    return parsedValue
  } catch {
    return initialUsers
  }
}

export function saveUsuariosSistema(usuarios: UsuarioSistema[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(usuarios))
  notifyUsuariosUpdated()
}

export function getUsuariosSistemaUpdateEventName() {
  return updateEventName
}

export function getUsuariosIdentidades() {
  const storedValue = window.localStorage.getItem(identityStorageKey)

  if (!storedValue) {
    return [] satisfies UsuarioIdentidade[]
  }

  try {
    const parsedValue = JSON.parse(storedValue) as UsuarioIdentidade[]

    if (!Array.isArray(parsedValue)) {
      return [] satisfies UsuarioIdentidade[]
    }

    return parsedValue
  } catch {
    return [] satisfies UsuarioIdentidade[]
  }
}

export function upsertUsuarioIdentidade(input: UsuarioIdentidade) {
  const identidades = getUsuariosIdentidades()
  const nextIdentidades = [
    ...identidades.filter((item) => item.id !== input.id),
    {
      id: input.id,
      nome: input.nome,
      email: normalizeEmail(input.email),
    },
  ]

  window.localStorage.setItem(identityStorageKey, JSON.stringify(nextIdentidades))
  notifyUsuariosUpdated()
}

export function resolveUsuarioPerfil(input: {
  email?: string
  prefsRole?: unknown
  isDevelopmentMode?: boolean
}) {
  if (input.isDevelopmentMode || input.prefsRole === 'admin') {
    return 'admin' satisfies UsuarioPerfil
  }

  const email = normalizeEmail(input.email ?? '')
  const usuario = getUsuariosSistema().find((item) => normalizeEmail(item.email) === email)

  if (usuario && usuario.ativo) {
    return usuario.perfil
  }

  if (usuario && !usuario.ativo) {
    return 'usuario' satisfies UsuarioPerfil
  }

  return 'usuario' satisfies UsuarioPerfil
}
