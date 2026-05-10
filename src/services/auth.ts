import type { AuthUser } from '../contexts/auth'
import { apiRequest, clearAuthToken, getAuthToken, setAuthToken } from './api'

type LoginResponse = {
  token: string
  user: AuthUser
}

export function getStoredAuthToken() {
  return getAuthToken()
}

export async function login(email: string, password: string) {
  const response = await apiRequest<LoginResponse>(
    'auth',
    {
      method: 'POST',
      body: { email, password },
    },
    { action: 'login' },
  )

  setAuthToken(response.token)

  return response
}

export async function getCurrentUser() {
  return apiRequest<AuthUser>('auth', {}, { action: 'me' })
}

export function logout() {
  clearAuthToken()
}
