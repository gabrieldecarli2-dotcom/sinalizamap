import { useEffect, useMemo, useState } from 'react'
import type { Models } from 'appwrite'
import { account, isAppwriteConfigured } from '../services/appwrite'
import { upsertUsuarioIdentidade } from '../services/usuarios'
import { AuthContext } from './auth'
import type { AuthContextValue, AuthUser } from './auth'

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
  const [session, setSession] = useState<Models.Session | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [devAuthenticated, setDevAuthenticated] = useState(
    () => import.meta.env.DEV && localStorage.getItem(devAuthStorageKey) === 'true',
  )
  const [isLoading, setIsLoading] = useState(isAppwriteConfigured)

  useEffect(() => {
    if (!isAppwriteConfigured) {
      return undefined
    }

    let isMounted = true

    account
      .get()
      .then((currentUser) => {
        if (isMounted) {
          upsertUsuarioIdentidade({
            id: currentUser.$id,
            nome: currentUser.name,
            email: currentUser.email,
          })
          setUser(currentUser)
        }
      })
      .catch(() => {
        if (isMounted) {
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
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? (devAuthenticated ? devUser : null),
      session,
      isLoading,
      isAuthenticated: Boolean(user || devAuthenticated),
      isDevelopmentMode: devAuthenticated,
      signIn: async (email: string, password: string) => {
        if (!isAppwriteConfigured) {
          throw new Error('Configure VITE_APPWRITE_PROJECT_ID para autenticar.')
        }

        const nextSession = await account.createEmailPasswordSession({
          email,
          password,
        })
        const nextUser = await account.get()
        upsertUsuarioIdentidade({
          id: nextUser.$id,
          nome: nextUser.name,
          email: nextUser.email,
        })
        setSession(nextSession)
        setUser(nextUser)
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
        if (isAppwriteConfigured && user) {
          await account.deleteSession({ sessionId: 'current' }).catch(() => undefined)
        }
        localStorage.removeItem(devAuthStorageKey)
        setDevAuthenticated(false)
        setSession(null)
        setUser(null)
      },
      refreshUser: async () => {
        if (!isAppwriteConfigured || devAuthenticated) {
          return
        }

        const nextUser = await account.get()
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
