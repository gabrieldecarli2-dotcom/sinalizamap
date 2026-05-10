import { CampoGcmMapa } from './CampoGcmMapa'
import { CampoMapa } from './CampoMapa'
import { useUsuarioPerfil } from '../hooks/useUsuarioPerfil'

export function CampoPorPerfil() {
  const perfil = useUsuarioPerfil()

  if (perfil === 'gcm') {
    return <CampoGcmMapa />
  }

  return <CampoMapa />
}
