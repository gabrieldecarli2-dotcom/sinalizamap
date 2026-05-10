import { useEffect, useMemo, useState } from 'react'
import { useAuth } from './useAuth'
import {
  getUsuariosSistemaUpdateEventName,
  resolveUsuarioPerfil,
  type UsuarioPerfil,
} from '../services/usuarios'

function getPrefsRole(prefs: unknown) {
  if (!prefs || typeof prefs !== 'object' || !('role' in prefs)) {
    return undefined
  }

  return (prefs as { role?: unknown }).role
}

export function useUsuarioPerfil() {
  const { user, isDevelopmentMode } = useAuth()
  const [version, setVersion] = useState(0)

  useEffect(() => {
    function syncProfile() {
      setVersion((current) => current + 1)
    }

    window.addEventListener(getUsuariosSistemaUpdateEventName(), syncProfile)
    window.addEventListener('storage', syncProfile)

    return () => {
      window.removeEventListener(getUsuariosSistemaUpdateEventName(), syncProfile)
      window.removeEventListener('storage', syncProfile)
    }
  }, [])

  return useMemo<UsuarioPerfil>(
    () => {
      void version

      return resolveUsuarioPerfil({
        email: user?.email,
        prefsRole: getPrefsRole(user?.prefs),
        isDevelopmentMode,
      })
    },
    [isDevelopmentMode, user?.email, user?.prefs, version],
  )
}
