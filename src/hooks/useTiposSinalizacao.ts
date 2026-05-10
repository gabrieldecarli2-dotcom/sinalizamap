import { useEffect, useState } from 'react'
import {
  getTiposSinalizacao,
  getTiposSinalizacaoUpdateEventName,
} from '../services/tiposSinalizacao'

export function useTiposSinalizacao() {
  const [tipos, setTipos] = useState(() => getTiposSinalizacao())

  useEffect(() => {
    function syncTipos() {
      setTipos(getTiposSinalizacao())
    }

    window.addEventListener(getTiposSinalizacaoUpdateEventName(), syncTipos)
    window.addEventListener('storage', syncTipos)

    return () => {
      window.removeEventListener(getTiposSinalizacaoUpdateEventName(), syncTipos)
      window.removeEventListener('storage', syncTipos)
    }
  }, [])

  return tipos
}
