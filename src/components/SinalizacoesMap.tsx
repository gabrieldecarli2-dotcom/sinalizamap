import type { SinalizacaoDocument } from '../services/sinalizacoes'
import { OpenLayersSinalizacoesMap } from './OpenLayersSinalizacoesMap'

export function SinalizacoesMap({
  sinalizacoes,
  compact = false,
}: {
  sinalizacoes: SinalizacaoDocument[]
  compact?: boolean
}) {
  return <OpenLayersSinalizacoesMap sinalizacoes={sinalizacoes} compact={compact} />
}
