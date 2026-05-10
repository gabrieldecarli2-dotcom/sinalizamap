import type { AuthUser } from '../contexts/auth'
import { getUsuariosIdentidades, getUsuariosSistema } from '../services/usuarios'

export function resolveUsuarioLabel(userId?: string, currentUser?: AuthUser | null) {
  if (!userId) {
    return 'Usuário não informado'
  }

  if (currentUser?.$id === userId) {
    return currentUser.name || currentUser.email || 'Usuário atual'
  }

  const usuarios = getUsuariosSistema()
  const usuario = usuarios.find(
    (item) => item.id === userId || item.appwrite_id === userId || item.email === userId,
  )

  if (usuario) {
    return `${usuario.nome} (${usuario.email})`
  }

  const identidade = getUsuariosIdentidades().find((item) => item.id === userId)

  if (identidade) {
    return `${identidade.nome || identidade.email} (${identidade.email})`
  }

  return `Usuário não identificado (${userId})`
}
