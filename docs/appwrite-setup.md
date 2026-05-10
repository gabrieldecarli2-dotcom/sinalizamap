# Appwrite Setup

Use este schema para testar o cadastro de sinalizações pelo app.

## Banco

No Appwrite Console:

1. Abra **Databases**.
2. Crie ou abra o database usado em `VITE_APPWRITE_DATABASE_ID`.
3. Crie uma tabela com ID `sinalizacoes`.
4. Em **Settings > Permissions**, adicione a role `users` com permissões:
   - Create
   - Read
   - Update
   - Delete

Para teste rápido, pode usar `users`. Depois refinamos por perfil.

## Tabela `sinalizacoes`

Crie as colunas:

| Coluna | Tipo | Tamanho | Obrigatória |
| --- | --- | ---: | --- |
| `tipo_id` | varchar | 64 | Sim |
| `tipo_nome` | varchar | 128 | Sim |
| `categoria` | varchar | 32 | Sim |
| `condicao` | varchar | 40 | Sim |
| `latitude` | float | - | Sim |
| `longitude` | float | - | Sim |
| `endereco` | varchar | 255 | Não |
| `observacoes` | text | - | Não |
| `foto_nome` | varchar | 255 | Não |
| `patrimonio` | varchar | 64 | Não |
| `status` | varchar | 40 | Sim |
| `criado_por` | varchar | 64 | Sim |
| `excluida_motivo` | text | - | Não |
| `excluida_por` | varchar | 64 | Não |
| `excluida_em` | varchar | 40 | Não |

## Tabela `historico_sinalizacoes`

Crie outra tabela com ID `historico_sinalizacoes`.

Permissões para teste: role `users` com Create, Read, Update e Delete.

Colunas:

| Coluna | Tipo | Tamanho | Obrigatória |
| --- | --- | ---: | --- |
| `sinalizacao_id` | varchar | 64 | Sim |
| `acao` | varchar | 32 | Sim |
| `motivo` | text | - | Não |
| `data_ocorrencia` | varchar | 10 | Não |
| `dados_anteriores` | text | - | Não |
| `dados_novos` | text | - | Não |
| `criado_por` | varchar | 64 | Sim |

## Variáveis

No `.env`, mantenha:

```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=...
VITE_APPWRITE_DATABASE_ID=...
VITE_APPWRITE_SINALIZACOES_TABLE_ID=sinalizacoes
VITE_APPWRITE_HISTORICO_SINALIZACOES_TABLE_ID=historico_sinalizacoes
```

Se você já preencheu `VITE_APPWRITE_SINALIZACOES_COLLECTION_ID`, o app também aceita esse valor por compatibilidade.

## Teste

1. Entre com usuário real do Appwrite, não com modo desenvolvimento.
2. Abra `/campo`.
3. Toque no mapa.
4. Clique em **Registrar ponto**.
5. Salve o formulário.
6. Abra `/sinalizacoes` para ver os registros carregados do Appwrite.
