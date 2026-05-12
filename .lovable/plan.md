## Integração WHM/cPanel — Provisionamento automático

Vou implementar a integração real com WHM/cPanel via API Token, com provisionamento automático após pagamento aprovado.

### 1. Base de dados (migration)

**Nova tabela `whm_servers`** (admin-only):
- `hostname`, `api_url`, `username`, `token` (encrypted), `nameserver1`, `nameserver2`, `active`, `max_accounts`, `current_accounts`, `notes`
- RLS: apenas admins podem ler/escrever (criar tabela `user_roles` + enum `app_role` + função `has_role`)

**Estender `cpanel_accounts`** (já existe) com:
- `server_id` (FK → whm_servers), `server_ip`, `nameservers` (jsonb), `cpanel_url`, `password_encrypted`, `package`, `expiry_date`, `provisioned_at`, `last_error`

**Estender `orders`** com:
- `provisioned` (bool), `provisioning_error` (text)

**Tabela `provisioning_logs`**:
- `order_id`, `cpanel_account_id`, `event`, `payload` (jsonb), `success`, `created_at` — auditoria

### 2. Roles & segurança

- Criar `app_role` enum (`admin`, `user`)
- Criar `user_roles` table + `has_role()` security-definer function
- RLS de `whm_servers` exige `has_role(auth.uid(), 'admin')`

### 3. Edge Function `create-cpanel-account`

Localização: `supabase/functions/create-cpanel-account/index.ts`

Fluxo:
1. Recebe `{ order_id }` + JWT do user
2. Lê order via `supabase` (RLS = só o dono)
3. Valida `status = 'paid'` e `provisioned = false`
4. Lê primeiro item do tipo `hosting` → `package` (slug)
5. Escolhe servidor: `whm_servers WHERE active=true ORDER BY current_accounts ASC LIMIT 1` (via service role)
6. Gera `username` (8 chars, derivado do domínio) e `password` (forte)
7. Chama `POST {api_url}/json-api/createacct?api.version=1` com header `Authorization: whm <user>:<token>` (form-encoded: `username`, `domain`, `password`, `plan`, `contactemail`)
8. Persiste em `cpanel_accounts` + cria `domains` + `services` + marca `orders.provisioned=true` + insere `provisioning_logs`
9. Devolve `{ success, account, cpanel_url }`. Em erro: grava log e devolve mensagem amigável.

Credenciais: usa `server.api_url` + `server.token` lidos da DB (não env), encrypted-at-rest pelo service role.

### 4. Hook automático (cliente)

No `checkout.tsx` (passo confirmação), após gravar pagamento aprovado, invocar `supabase.functions.invoke('create-cpanel-account', { body: { order_id }})` para cada order. Mostrar estado "A provisionar…" → "Hospedagem ativa".

### 5. Painel admin — `/admin/servers`

Nova rota `_authenticated/admin/servers.tsx` (visível só se `has_role admin`):
- Listar servidores
- Form: adicionar/editar (hostname, api_url, username, token, nameservers, active)
- Botão **Testar conexão** → Edge Function `whm-test-connection` (chama `/json-api/version`)
- Toggle ativar/desativar

Edge Function auxiliar: `whm-test-connection` (admin-only).

### 6. Painel do cliente (já existe parcialmente)

Atualizar `/_authenticated/hosting`, `/_authenticated/domains`, `/_authenticated/account`:
- **Minhas hospedagens**: lista `cpanel_accounts` com badge status, package, nameservers, botão **Login cPanel** (abre `cpanel_url` em nova aba — single-sign-on via `create_user_session` futuro; nesta fase abre URL direto)
- **Uso de disco / banda**: nova Edge Function `cpanel-usage` (chama `listaccts?search={username}`) — chamada on-demand
- Domínios e emails já listam da DB; emails ligam ao cpanel via `cpanel_account_id`

### 7. Email de boas-vindas

Após provisionamento OK, Edge Function envia email via `resend` (se `RESEND_API_KEY` existir) com credenciais cPanel + nameservers. Se a key não estiver configurada, salta o passo silenciosamente e mostra os dados no painel.

### Detalhes técnicos

- WHM API Token: header `Authorization: whm USERNAME:TOKEN`
- Endpoints: `createacct`, `listaccts`, `version`, `removeacct`, `create_user_session`
- Todas as credenciais ficam apenas em `whm_servers` (DB, RLS admin-only) e nas Edge Functions (service role). Nunca chegam ao browser.
- Passwords cPanel geradas server-side e guardadas encrypted (pgcrypto `pgp_sym_encrypt` com `WHM_ENCRYPTION_KEY` secret).

### Secret necessário

- `WHM_ENCRYPTION_KEY` — para cifrar passwords cPanel guardadas (vou pedir após aprovação do plano)
- `RESEND_API_KEY` (opcional, para email de boas-vindas)

### Ordem de execução

1. Migration: roles, whm_servers, extensões, logs, pgcrypto
2. Pedir secret `WHM_ENCRYPTION_KEY`
3. Edge Functions: `create-cpanel-account`, `whm-test-connection`, `cpanel-usage`
4. Admin UI `/admin/servers`
5. Trigger no checkout
6. Atualizar painel cliente com dados reais

Confirmas para eu avançar?
