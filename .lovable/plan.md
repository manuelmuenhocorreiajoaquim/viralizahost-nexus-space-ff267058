# Plano: Gestão do Site / CMS no Admin

Módulo grande. Vou implementar em fases para entregar incremental e sem quebrar nada do que já existe (domínios/e-mails/hospedagem manuais, checkout, área do cliente).

## Escopo

Painel Admin → "Gestão do Site" com 5 abas: **Preços**, **Serviços**, **Conteúdos**, **Imagens**, **Configurações**. Apenas admin (RLS por `has_role`). Frontend público lê do banco, com fallback aos defaults atuais para não quebrar nada caso uma tabela esteja vazia.

## Estrutura de dados (Supabase)

Novas tabelas (todas com RLS — SELECT público apenas em conteúdo publicável; escrita só admin):

- `service_plans` — substitui/estende `hosting_plans` e os arrays hardcoded em `src/components/site/*Plans.tsx`.
  - `id`, `slug` (único), `category` (`hosting|email|domain|vps|ai|marketing|design|audiovisual`), `name`, `short_description`, `benefits jsonb` (array de strings), `cta_label`, `price_brl numeric`, `price_aoa numeric`, `currency_default`, `is_active bool`, `is_featured bool`, `badge text`, `sort_order int`, timestamps.
- `site_sections` — seções da home/páginas. `key` único (ex.: `home.hero`, `home.domains`), `page`, `title`, `subtitle`, `body text`, `cta_label`, `cta_href`, `is_active`, `sort_order`.
- `site_contents` — textos avulsos chave/valor (menus, footer, CTAs). `key` único, `value jsonb`, `description`.
- `site_images` — `key` único (ex.: `home.hero.bg`, `logo.main`), `url`, `alt`, `bucket`, `path`.
- `site_settings` — `key` único, `value jsonb` (config global: moedas habilitadas, padrão, telefone, social).
- Bucket público `site-assets` para upload de imagens (RLS: insert/update/delete só admin; select público).

Domínios mantém a tabela `domain_search_logs` etc.; preços fixos atuais (`src/config/domainFixedPrices.ts`) migram para `service_plans` (category `domain`) com fallback ao arquivo se vazio.

## Server functions (`src/lib/cms.functions.ts` + `cms.server.ts`)

Públicas (sem auth): `getServicePlans({category?})`, `getSiteSection(key)`, `getSiteSections(page?)`, `getSiteContents(keys[])`, `getSiteImage(key)`, `getSiteSettings()`. Todas com fallback estático.

Admin (`requireSupabaseAuth` + check `has_role admin`):
`adminListServicePlans`, `adminUpsertServicePlan`, `adminDeleteServicePlan`, idem para sections/contents/images/settings, `adminUploadSiteImage`.

## UI Admin

Nova rota `src/routes/_authenticated/admin/site.tsx` com `Tabs`:
- **Preços**: tabela editável agrupada por categoria — colunas Nome, BRL, AOA, Ativo, Destaque, Ações. Editar inline + dialog.
- **Serviços**: CRUD completo de `service_plans` (dialog com todos os campos, incluindo `benefits` como lista editável).
- **Conteúdos**: editor de `site_sections` e `site_contents` (título, subtítulo, body, CTA).
- **Imagens**: grid de `site_images` com upload (storage `site-assets`) e troca.
- **Configurações**: chave/valor de `site_settings`.

Botões: Editar, Salvar, Pré-visualizar (abre `/` em nova aba).

Adicionar item "Gestão do Site" na sidebar admin de `src/routes/_authenticated.tsx`.

## Frontend público (consumo)

Refatorar para ler do banco com fallback aos defaults atuais:
- `HostingPlans`, `EmailPlans`, `DomainsSection`, `AIPlans`, `TrafficPlans`, `DesignPlans`, `AudiovisualPlans`, `VPSSection` → usam `useQuery(getServicePlans({category}))`; se vazio, usam o array hardcoded existente.
- `Hero`, `CTAFooter`, `Section` headers → `useQuery(getSiteSection(key))` com fallback ao texto atual.
- Imagens (`hero`, banners) → `getSiteImage(key)` com fallback ao import atual.

Sem mudanças visuais; só fonte dos dados.

## Segurança

- Todas as tabelas: `ALTER ... ENABLE RLS`.
- SELECT: `anon, authenticated` (leitura pública).
- INSERT/UPDATE/DELETE: `USING (public.has_role(auth.uid(), 'admin'))`.
- Bucket `site-assets`: público leitura; políticas em `storage.objects` para escrita só admin.
- GRANTs explícitos a `anon, authenticated, service_role`.

## Fases de entrega

1. **Migration** (tabelas + RLS + bucket + seeds dos preços/plans atuais).
2. **Server functions** CMS + admin.
3. **Rota Admin `/admin/site`** com as 5 abas funcionais.
4. **Refatoração dos componentes públicos** para ler do banco com fallback (incremental — começo por Hosting/Email/Domain/AI, depois os demais).
5. **Sidebar** + verificação.

Tudo idempotente; nada existente é removido. Os arquivos `domainFixedPrices.ts` e arrays de planos permanecem como fallback.

## Observação

É bastante código (≈10 arquivos novos + ~10 editados). Posso entregar em uma só passada ou dividir. Confirma para eu seguir, ou me diz se quer cortar escopo (ex.: começar só por Preços + Serviços e deixar Conteúdos/Imagens para uma fase seguinte).
