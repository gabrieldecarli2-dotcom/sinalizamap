export type SinalizacaoCategoria = 'Vertical' | 'Horizontal'

export interface SinalizacaoTipo {
  id: string
  codigo: string
  nome: string
  categoria: SinalizacaoCategoria
  grupo: string
  popular: boolean
  ativo: boolean
}
