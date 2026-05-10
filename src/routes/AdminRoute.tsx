import { Navigate, Outlet } from 'react-router-dom'
import { useUsuarioPerfil } from '../hooks/useUsuarioPerfil'

export function AdminRoute() {
  const perfil = useUsuarioPerfil()

  if (perfil !== 'admin') {
    return <Navigate to="/campo" replace />
  }

  return <Outlet />
}
