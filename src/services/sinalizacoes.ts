import type { Models } from 'appwrite'
import { appwriteConfig, ID, Query, tablesDB } from './appwrite'

export interface SinalizacaoDocument extends Models.Row {
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
  status: string
  criado_por: string
  excluida_motivo?: string
  excluida_por?: string
  excluida_em?: string
}

export interface HistoricoSinalizacaoDocument extends Models.Row {
  sinalizacao_id: string
  acao: 'criada' | 'editada' | 'excluida' | 'corrigida'
  motivo?: string
  data_ocorrencia?: string
  dados_anteriores?: string
  dados_novos?: string
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

function assertSinalizacoesConfig() {
  if (!appwriteConfig.databaseId || !appwriteConfig.sinalizacoesTableId) {
    throw new Error(
      'Configure VITE_APPWRITE_DATABASE_ID e VITE_APPWRITE_SINALIZACOES_TABLE_ID.',
    )
  }
}

function assertHistoricoConfig() {
  if (!appwriteConfig.databaseId || !appwriteConfig.historicoSinalizacoesTableId) {
    throw new Error(
      'Configure VITE_APPWRITE_DATABASE_ID e VITE_APPWRITE_HISTORICO_SINALIZACOES_TABLE_ID.',
    )
  }
}

function serializeHistoryData(value: unknown) {
  return JSON.stringify(value, null, 2)
}

export async function createHistoricoSinalizacao(input: {
  sinalizacao_id: string
  acao: HistoricoSinalizacaoDocument['acao']
  motivo?: string
  data_ocorrencia?: string
  dados_anteriores?: unknown
  dados_novos?: unknown
  criado_por: string
}) {
  assertHistoricoConfig()

  return tablesDB.createRow<HistoricoSinalizacaoDocument>({
    databaseId: appwriteConfig.databaseId,
    tableId: appwriteConfig.historicoSinalizacoesTableId,
    rowId: ID.unique(),
    data: {
      sinalizacao_id: input.sinalizacao_id,
      acao: input.acao,
      motivo: input.motivo ?? '',
      ...(input.data_ocorrencia ? { data_ocorrencia: input.data_ocorrencia } : {}),
      dados_anteriores: input.dados_anteriores
        ? serializeHistoryData(input.dados_anteriores)
        : '',
      dados_novos: input.dados_novos ? serializeHistoryData(input.dados_novos) : '',
      criado_por: input.criado_por,
    },
  })
}

export async function createSinalizacao(input: CreateSinalizacaoInput) {
  assertSinalizacoesConfig()
  const { motivo, data_ocorrencia, ...sinalizacaoData } = input

  const sinalizacao = await tablesDB.createRow<SinalizacaoDocument>({
    databaseId: appwriteConfig.databaseId,
    tableId: appwriteConfig.sinalizacoesTableId,
    rowId: ID.unique(),
    data: {
      ...sinalizacaoData,
      status: 'registrada',
    },
  })

  await createHistoricoSinalizacao({
    sinalizacao_id: sinalizacao.$id,
    acao: 'criada',
    motivo,
    data_ocorrencia,
    dados_novos: sinalizacao,
    criado_por: input.criado_por,
  }).catch(() => undefined)

  return sinalizacao
}

export async function getSinalizacao(id: string) {
  assertSinalizacoesConfig()

  return tablesDB.getRow<SinalizacaoDocument>({
    databaseId: appwriteConfig.databaseId,
    tableId: appwriteConfig.sinalizacoesTableId,
    rowId: id,
  })
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
  assertSinalizacoesConfig()

  const previous = await getSinalizacao(id)
  const updated = await tablesDB.updateRow<SinalizacaoDocument>({
    databaseId: appwriteConfig.databaseId,
    tableId: appwriteConfig.sinalizacoesTableId,
    rowId: id,
    data: input,
  })

  await createHistoricoSinalizacao({
    sinalizacao_id: id,
    acao: 'editada',
    motivo: metadata.motivo,
    data_ocorrencia: metadata.data_ocorrencia,
    dados_anteriores: previous,
    dados_novos: updated,
    criado_por: metadata.criado_por,
  }).catch(() => undefined)

  return updated
}

export async function deleteSinalizacaoWithHistory(
  id: string,
  input: {
    motivo: string
    criado_por: string
  },
) {
  assertSinalizacoesConfig()

  const previous = await getSinalizacao(id)
  const updated = await tablesDB.updateRow<SinalizacaoDocument>({
    databaseId: appwriteConfig.databaseId,
    tableId: appwriteConfig.sinalizacoesTableId,
    rowId: id,
    data: {
      status: 'excluida',
      excluida_motivo: input.motivo,
      excluida_por: input.criado_por,
      excluida_em: new Date().toISOString(),
    },
  })

  await createHistoricoSinalizacao({
    sinalizacao_id: id,
    acao: 'excluida',
    motivo: input.motivo,
    dados_anteriores: previous,
    dados_novos: updated,
    criado_por: input.criado_por,
  }).catch(() => undefined)

  return updated
}

export async function resolveIrregularidade(
  id: string,
  input: {
    realizado: string
    data_ocorrencia: string
    criado_por: string
  },
) {
  assertSinalizacoesConfig()

  const previous = await getSinalizacao(id)
  const updated = await tablesDB.updateRow<SinalizacaoDocument>({
    databaseId: appwriteConfig.databaseId,
    tableId: appwriteConfig.sinalizacoesTableId,
    rowId: id,
    data: {
      status: 'resolvida',
    },
  })

  await createHistoricoSinalizacao({
    sinalizacao_id: id,
    acao: 'corrigida',
    motivo: input.realizado,
    data_ocorrencia: input.data_ocorrencia,
    dados_anteriores: previous,
    dados_novos: {
      status: 'resolvida',
      realizado: input.realizado,
      data_ocorrencia: input.data_ocorrencia,
    },
    criado_por: input.criado_por,
  })

  return updated
}

export async function listSinalizacoes() {
  assertSinalizacoesConfig()

  const response = await tablesDB.listRows<SinalizacaoDocument>({
    databaseId: appwriteConfig.databaseId,
    tableId: appwriteConfig.sinalizacoesTableId,
    queries: [Query.orderDesc('$createdAt'), Query.limit(100)],
  })

  return {
    ...response,
    rows: response.rows.filter((sinalizacao) => sinalizacao.status !== 'excluida'),
  }
}

export async function listHistoricoSinalizacao(sinalizacaoId: string) {
  assertHistoricoConfig()

  return tablesDB.listRows<HistoricoSinalizacaoDocument>({
    databaseId: appwriteConfig.databaseId,
    tableId: appwriteConfig.historicoSinalizacoesTableId,
    queries: [
      Query.equal('sinalizacao_id', sinalizacaoId),
      Query.orderDesc('$createdAt'),
      Query.limit(100),
    ],
  })
}
