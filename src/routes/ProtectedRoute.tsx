import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute() {
  const location = useLocation()
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 text-slate-700">
        <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin admin-text" />
          <span className="text-sm font-medium">Carregando sessão</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
