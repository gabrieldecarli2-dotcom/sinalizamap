import { createContext } from 'react'

export type AuthUser = {
  $id: string
  id?: string
  email: string
  name: string
  nome?: string
  prefs?: {
    role?: string
  }
}

export type AuthSession = {
  token: string
}

export interface AuthContextValue {
  user: AuthUser | null
  session: AuthSession | null
  isLoading: boolean
  isAuthenticated: boolean
  isDevelopmentMode: boolean
  signIn: (email: string, password: string) => Promise<void>
  signInDevelopment: () => void
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
