# Deploy no cPanel

## Banco

1. Abra MySQL Databases no cPanel.
2. Crie o banco, por exemplo `usuario_sinalizamap`.
3. Crie um usuário do banco e vincule ao banco com permissões.
4. No phpMyAdmin, importe:
   - `database/schema.sql`
   - `database/seed.sql`

## API

1. Copie `api/config/local.example.php` para `api/config/local.php`.
2. Preencha `db_host`, `db_name`, `db_user`, `db_pass` e `app_secret`.
3. Envie a pasta `api/` para `public_html/api`.
4. Teste no navegador:

```text
https://seudominio.com.br/api/index.php?resource=health
```

Para ativar alertas no Telegram quando a GCM registrar irregularidades, adicione também:

```php
'app_url' => 'https://sinalizamap.transitoleme.sp.gov.br',
'telegram_alertas_ativos' => true,
'telegram_bot_token' => 'TOKEN_DO_BOT',
'telegram_chat_id' => 'CHAT_ID_DO_GRUPO',
```

Se não quiser alertas, mantenha `telegram_alertas_ativos` como `false`.

## Frontend

Antes do build, configure:

```env
VITE_API_URL=https://seudominio.com.br/api/index.php
```

Depois rode:

```bash
npm run build
```

Envie o conteúdo da pasta `dist/` para `public_html/`.

## Login Inicial

```text
E-mail: admin@sinalizamap.local
Senha: admin123
```

Troque a senha no primeiro acesso.
