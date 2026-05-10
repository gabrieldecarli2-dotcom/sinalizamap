import { tiposSinalizacao } from '../constants/sinalizacaoOptions'
import type { SinalizacaoTipo } from '../types/sinalizacaoTipo'

const storageKey = 'sinalizamap:tipos-sinalizacao'
const updateEventName = 'sinalizamap:tipos-sinalizacao-updated'

function sortTipos(tipos: SinalizacaoTipo[]) {
  return [...tipos].sort((first, second) =>
    `${first.categoria}-${first.grupo}-${first.codigo}`.localeCompare(
      `${second.categoria}-${second.grupo}-${second.codigo}`,
      'pt-BR',
      { numeric: true },
    ),
  )
}

function notifyTiposUpdated() {
  window.dispatchEvent(new Event(updateEventName))
}

export function getTiposSinalizacao() {
  const storedValue = window.localStorage.getItem(storageKey)

  if (!storedValue) {
    return sortTipos(tiposSinalizacao)
  }

  try {
    const parsedValue = JSON.parse(storedValue) as SinalizacaoTipo[]

    if (!Array.isArray(parsedValue)) {
      return sortTipos(tiposSinalizacao)
    }

    return sortTipos(parsedValue)
  } catch {
    return sortTipos(tiposSinalizacao)
  }
}

export function saveTiposSinalizacao(tipos: SinalizacaoTipo[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(sortTipos(tipos)))
  notifyTiposUpdated()
}

export function resetTiposSinalizacao() {
  window.localStorage.removeItem(storageKey)
  notifyTiposUpdated()
}

export function getTiposSinalizacaoUpdateEventName() {
  return updateEventName
}
