import { useEffect, useMemo, useState } from 'react'
import { getCurrentUser, getStoredAuthToken, login, logout } from '../services/auth'
import { listUsuariosSistema, upsertUsuarioIdentidade } from '../services/usuarios'
import { AuthContext } from './auth'
import type { AuthContextValue, AuthSession, AuthUser } from './auth'

const devAuthStorageKey = 'sinalizamap:dev-auth'
const devUser: AuthUser = {
  $id: 'dev-user',
  email: 'dev@sinalizamap.local',
  name: 'Usuário Desenvolvimento',
  prefs: {
    role: 'admin',
  },
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => {
    const token = getStoredAuthToken()
    return token ? { token } : null
  })
  const [user, setUser] = useState<AuthUser | null>(null)
  const [devAuthenticated, setDevAuthenticated] = useState(
    () => import.meta.env.DEV && localStorage.getItem(devAuthStorageKey) === 'true',
  )
  const [isLoading, setIsLoading] = useState(Boolean(getStoredAuthToken()))

  useEffect(() => {
    if (!getStoredAuthToken() || devAuthenticated) {
      setIsLoading(false)
      return undefined
    }

    let isMounted = true

    getCurrentUser()
      .then((currentUser) => {
        if (isMounted) {
          upsertUsuarioIdentidade({
            id: currentUser.$id,
            nome: currentUser.name,
            email: currentUser.email,
          })
          listUsuariosSistema().catch(() => undefined)
          setUser(currentUser)
        }
      })
      .catch(() => {
        if (isMounted) {
          logout()
          setUser(null)
          setSession(null)
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
  }, [devAuthenticated])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? (devAuthenticated ? devUser : null),
      session,
      isLoading,
      isAuthenticated: Boolean(user || devAuthenticated),
      isDevelopmentMode: devAuthenticated,
      signIn: async (email: string, password: string) => {
        const response = await login(email, password)
        upsertUsuarioIdentidade({
          id: response.user.$id,
          nome: response.user.name,
          email: response.user.email,
        })
        listUsuariosSistema().catch(() => undefined)
        setSession({ token: response.token })
        setUser(response.user)
        localStorage.removeItem(devAuthStorageKey)
        setDevAuthenticated(false)
      },
      signInDevelopment: () => {
        if (!import.meta.env.DEV) {
          return
        }

        localStorage.setItem(devAuthStorageKey, 'true')
        setDevAuthenticated(true)
      },
      signOut: async () => {
        logout()
        localStorage.removeItem(devAuthStorageKey)
        setDevAuthenticated(false)
        setSession(null)
        setUser(null)
      },
      refreshUser: async () => {
        if (devAuthenticated) {
          return
        }

        const nextUser = await getCurrentUser()
        upsertUsuarioIdentidade({
          id: nextUser.$id,
          nome: nextUser.name,
          email: nextUser.email,
        })
        setUser(nextUser)
      },
    }),
    [devAuthenticated, isLoading, session, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
