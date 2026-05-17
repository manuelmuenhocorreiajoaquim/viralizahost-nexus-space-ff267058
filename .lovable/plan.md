## Integração ViralizaHost + Hostinger

### O que a API Hostinger permite hoje (verificado em developers.hostinger.com)

| Serviço | Endpoint | Automatizável? |
|---|---|---|
| VPS (compra) | `POST /api/billing/v1/orders` (BillingOrdersApi) + `GET /api/billing/v1/catalog` | **Sim** — fluxo `createServiceOrderV1` com `price_id` do catálogo, cobrado no saldo/método pré-cadastrado da conta Hostinger |
| VPS (gestão pós-compra) | `/api/vps/v1/*` (start/stop, reinstall, SSH keys, snapshots, metrics) | Sim |
| Domínios | `/api/domains/v1/availability`, `/api/domains/v1/portfolio`; compra via `BillingOrdersApi` | Compra: sim (via billing/orders) — disponibilidade: sim |
| DNS | `/api/dns/v1/*` | Sim |
| Hospedagem partilhada / Builder / E-mail Comercial / E-mail Marketing | **Sem endpoint público de compra/provisionamento** atualmente | **Não** — fica em `manual_review` |

→ Conclusão: VPS e domínios podem ir 100% automáticos via `BillingOrdersApi`. Restantes serviços ficam semi-automáticos (job criado, admin ativa manualmente, cliente vê "ativação em análise"). A integração WHM/cPanel atual continua a funcionar exatamente como hoje.

---

### 1. Base de dados (migração)

**`provider_products`** — mapeia produto ViralizaHost ↔ produto Hostinger
- `id`, `internal_product_id` (slug catálogo ViralizaHost), `internal_product_name`
- `provider` (`hostinger`), `provider_service_type` (`vps`, `domain`, `hosting`, `email`, `email_marketing`, `builder`, `vibecode`)
- `provider_price_id` (texto, vindo de `/billing/v1/catalog`; pode ser null se manual)
- `auto_provision` (bool — só `true` para VPS/domínio hoje)
- `internal_price`, `currency`, `active`, timestamps
- RLS: leitura pública só dos `active=true`; escrita admin via `has_role(auth.uid(),'admin')`

**`provisioning_jobs`**
- `id`, `order_id` FK orders, `order_item_id` FK order_items, `user_id`
- `provider` (`hostinger`), `provider_service_type`, `provider_product_id` FK provider_products
- `status`: `pending | processing | provisioned | failed | manual_review`
- `provider_request` jsonb, `provider_response` jsonb, `provider_resource_id` (id retornado p/ VPS/domínio)
- `error_message`, `attempts` int, `last_attempt_at`, timestamps
- RLS: user vê os seus; admin vê tudo; insert apenas via service role

**`hostinger_logs`** (auditoria fina) — `job_id`, `endpoint`, `request`, `response`, `status_code`, `duration_ms`, `created_at`. RLS admin-only.

**Estender `services`** com `provisioning_job_id` para o painel cliente ligar serviço ↔ job e mostrar status (`a provisionar`, `ativo`, `em análise`).

### 2. Secret

Pedir **`HOSTINGER_API_TOKEN`** (Bearer token gerado em hpanel.hostinger.com → API). Nunca toca o browser — só nas server functions.

### 3. Cliente Hostinger (server-only)

`src/integrations/hostinger/client.server.ts`:
- `hostingerFetch(path, init)` → `https://developers.hostinger.com${path}` com `Authorization: Bearer ${process.env.HOSTINGER_API_TOKEN}`, timeout, log para `hostinger_logs`
- Wrappers: `listCatalog()`, `createServiceOrder({price_id, payment_method_id, ...})`, `checkDomainAvailability(domain)`, `listVps()`, `getVps(id)`

### 4. Server functions / route

**Webhook MP existente** (`src/routes/api/public/payments/mercadopago/webhook.ts`) — após `activateOrderAfterPayment`, despoletar `enqueueHostingerProvisioning(orderId)` (já criada como server util) que, para cada `order_item`:
1. Lê `provider_products` por `internal_product_id`
2. Cria linha em `provisioning_jobs` (`status=pending`)
3. Se `auto_provision=true` → chama `processProvisioningJob(jobId)` (cria `service_order` na Hostinger, guarda `provider_resource_id`, marca `provisioned`, cria/atualiza `services` do cliente)
4. Se `auto_provision=false` → marca `manual_review` e envia notificação ao admin (linha em `provisioning_logs`)

**Server functions** (em `src/lib/hostinger.functions.ts`):
- `listMyProvisioningJobs` (user) — para painel cliente
- `adminListProvisioningJobs({status?})` (admin) — painel admin
- `adminRetryProvisioning(jobId)` (admin) — re-tenta
- `adminMarkProvisioned(jobId, providerResourceId)` (admin) — fecha manual
- `adminListProviderProducts` / `adminUpsertProviderProduct` — gestão mapeamento

### 5. UI

- **`/admin/provisioning`** (admin) — tabela com filtros por status, botões Retry / Mark provisioned / Ver logs
- **`/admin/provider-products`** (admin) — CRUD mapeamento ViralizaHost → Hostinger (com dropdown que carrega catálogo Hostinger live)
- **Painel cliente** (`_authenticated/account` + páginas existentes de hosting/domains/etc.) — secção “Estado de ativação” mostra: `Em fila → A provisionar → Ativo` ou `Pedido recebido, ativação em análise`
- Adicionar ícone no header de admin para a nova área

### 6. WHM/cPanel — preservado

O fluxo `activateOrderAfterPayment` continua a chamar `create-cpanel-account` para itens `product_type='hosting'` exatamente como hoje. A nova fila Hostinger corre em paralelo só para itens com mapping em `provider_products`. Nada quebra.

### 7. Ordem de execução

1. Migration (tabelas + RLS + extensão services) — pedir aprovação
2. Pedir secret `HOSTINGER_API_TOKEN`
3. Cliente Hostinger + server functions + integração no webhook MP
4. Páginas admin (`/admin/provisioning`, `/admin/provider-products`)
5. Atualizar painel cliente com badge de estado
6. Smoke test: criar mapping VPS sandbox → simular order paga → verificar job → consultar `hostinger_logs`

Confirmas para avançar com a migration?
