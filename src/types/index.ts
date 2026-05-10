export type UserRole = 'admin' | 'supervisor' | 'campo' | 'consulta'

export type SinalizacaoCategoria = 'horizontal' | 'vertical'

export type CondicaoSinalizacao =
  | 'boa'
  | 'regular'
  | 'danificada'
  | 'ausente'
  | 'necessita_manutencao'

export type StatusManutencao =
  | 'aberta'
  | 'em_andamento'
  | 'concluida'
  | 'cancelada'

export interface Profile {
  id: string
  nome: string
  email: string
  role: UserRole
  telefone?: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface TipoSinalizacao {
  id: string
  nome: string
  categoria: SinalizacaoCategoria
  descricao?: string | null
  ativo: boolean
  created_at: string
}

export interface Sinalizacao {
  id: string
  tipo_id: string
  tipo?: TipoSinalizacao
  latitude: number
  longitude: number
  endereco?: string | null
  condicao: CondicaoSinalizacao
  observacoes?: string | null
  fotos: string[]
  criado_por: string
  profile?: Profile
  created_at: string
  updated_at: string
}

export interface Manutencao {
  id: string
  sinalizacao_id: string
  sinalizacao?: Sinalizacao
  status: StatusManutencao
  descricao: string
  responsavel_id?: string | null
  responsavel?: Profile | null
  prevista_para?: string | null
  concluida_em?: string | null
  created_at: string
  updated_at: string
}
