# SQL Setup

Este projeto usa React/Vite no frontend e uma API PHP simples com MySQL/MariaDB.

## Local

1. Crie um banco MySQL chamado `sinalizamap`.
2. Importe `database/schema.sql`.
3. Importe `database/seed.sql`.
4. Copie `api/config/local.example.php` para `api/config/local.php`.
5. Ajuste usuário, senha e `app_secret` em `api/config/local.php`.
6. Configure o frontend:

```env
VITE_API_URL=http://localhost/sinalizamap/api/index.php
```

Usuário inicial para testes:

```text
E-mail: admin@sinalizamap.local
Senha: admin123
```

Troque a senha depois do primeiro acesso.

## cPanel

1. Crie o banco em MySQL Databases.
2. Crie um usuário do banco e associe com permissões.
3. Importe `database/schema.sql` e `database/seed.sql` pelo phpMyAdmin.
4. Crie `api/config/local.php` no servidor com as credenciais reais.
5. Rode `npm run build` e publique o conteúdo de `dist/` junto da pasta `api/`.
6. Ajuste `VITE_API_URL` para o domínio final antes do build.
