import { Account, Client, ID, Query, Storage, TablesDB } from 'appwrite'

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1'
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID as string | undefined

export const appwriteConfig = {
  endpoint,
  projectId: projectId ?? '',
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || '',
  sinalizacoesTableId:
    import.meta.env.VITE_APPWRITE_SINALIZACOES_TABLE_ID ||
    import.meta.env.VITE_APPWRITE_SINALIZACOES_COLLECTION_ID ||
    '',
  historicoSinalizacoesTableId:
    import.meta.env.VITE_APPWRITE_HISTORICO_SINALIZACOES_TABLE_ID ||
    'historico_sinalizacoes',
  sinalizacoesCollectionId: import.meta.env.VITE_APPWRITE_SINALIZACOES_COLLECTION_ID || '',
  tiposCollectionId: import.meta.env.VITE_APPWRITE_TIPOS_COLLECTION_ID || '',
  manutencoesCollectionId: import.meta.env.VITE_APPWRITE_MANUTENCOES_COLLECTION_ID || '',
  profilesCollectionId: import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION_ID || '',
  fotosBucketId: import.meta.env.VITE_APPWRITE_FOTOS_BUCKET_ID || '',
}

export const isAppwriteConfigured = Boolean(appwriteConfig.projectId)

export const client = new Client().setEndpoint(appwriteConfig.endpoint)

if (appwriteConfig.projectId) {
  client.setProject(appwriteConfig.projectId)
}

export const account = new Account(client)
export const tablesDB = new TablesDB(client)
export const storage = new Storage(client)
export { ID, Query }
