import { createContext } from 'react'
import type { Models } from 'appwrite'

export type AuthUser = Pick<Models.User<Models.Preferences>, '$id' | 'email' | 'name'> & {
  prefs?: Models.Preferences
}

export interface AuthContextValue {
  user: AuthUser | null
  session: Models.Session | null
  isLoading: boolean
  isAuthenticated: boolean
  isDevelopmentMode: boolean
  signIn: (email: string, password: string) => Promise<void>
  signInDevelopment: () => void
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
