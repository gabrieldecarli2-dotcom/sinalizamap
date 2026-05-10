import { apiRequest } from './api'

export interface ApiDocument {
  $id: string
  $createdAt: string
  $updatedAt: string
}

export interface ApiListResponse<T> {
  total: number
  rows: T[]
}

export interface SinalizacaoDocument extends ApiDocument {
  tipo_id: string
  tipo_nome: string
  categoria: string
  condicao: string
  latitude: number
  longitude: number
  endereco?: string | null
  observacoes?: string | null
  foto_nome?: string | null
  patrimonio?: string | null
  status: string
  criado_por: string
  excluida_motivo?: string | null
  excluida_por?: string | null
  excluida_em?: string | null
}

export interface HistoricoSinalizacaoDocument extends ApiDocument {
  sinalizacao_id: string
  acao: 'criada' | 'editada' | 'excluida' | 'corrigida'
  motivo?: string | null
  data_ocorrencia?: string | null
  dados_anteriores?: string | null
  dados_novos?: string | null
  criado_por: string
}

export interface CreateSinalizacaoInput {
  tipo_id: string
  tipo_nome: string
  categoria: string
  condicao: string
  latitude: number
  longitude: number
  endereco?: string
  observacoes?: string
  foto_nome?: string
  patrimonio?: string
  criado_por: string
  motivo?: string
  data_ocorrencia?: string
}

export type UpdateSinalizacaoInput = Partial<
  Pick<
    SinalizacaoDocument,
    | 'tipo_id'
    | 'tipo_nome'
    | 'categoria'
    | 'condicao'
    | 'latitude'
    | 'longitude'
    | 'endereco'
    | 'observacoes'
    | 'foto_nome'
    | 'patrimonio'
    | 'status'
  >
>

export async function createSinalizacao(input: CreateSinalizacaoInput) {
  return apiRequest<SinalizacaoDocument>('sinalizacoes', {
    method: 'POST',
    body: input,
  })
}

export async function getSinalizacao(id: string) {
  return apiRequest<SinalizacaoDocument>('sinalizacoes', {}, { id })
}

export async function updateSinalizacao(
  id: string,
  input: UpdateSinalizacaoInput,
  metadata: {
    motivo: string
    data_ocorrencia?: string
    criado_por: string
  },
) {
  return apiRequest<SinalizacaoDocument>(
    'sinalizacoes',
    {
      method: 'PATCH',
      body: {
        ...input,
        _metadata: metadata,
      },
    },
    { id },
  )
}

export async function deleteSinalizacaoWithHistory(
  id: string,
  input: {
    motivo: string
    criado_por: string
  },
) {
  return apiRequest<SinalizacaoDocument>(
    'sinalizacoes',
    {
      method: 'DELETE',
      body: input,
    },
    { id },
  )
}

export async function resolveIrregularidade(
  id: string,
  input: {
    realizado: string
    data_ocorrencia: string
    criado_por: string
  },
) {
  return apiRequest<SinalizacaoDocument>(
    'sinalizacoes',
    {
      method: 'PATCH',
      body: input,
    },
    { id, action: 'resolve' },
  )
}

export async function listSinalizacoes() {
  return apiRequest<ApiListResponse<SinalizacaoDocument>>('sinalizacoes')
}

export async function listHistoricoSinalizacao(sinalizacaoId: string) {
  return apiRequest<ApiListResponse<HistoricoSinalizacaoDocument>>(
    'sinalizacoes',
    {},
    { id: sinalizacaoId, action: 'historico' },
  )
}
