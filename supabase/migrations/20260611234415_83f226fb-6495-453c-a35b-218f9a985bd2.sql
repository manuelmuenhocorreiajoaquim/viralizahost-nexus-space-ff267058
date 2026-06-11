
-- =========================
-- CMS tables for site mgmt
-- =========================

-- service_plans
CREATE TABLE IF NOT EXISTS public.service_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  category text NOT NULL,
  name text NOT NULL,
  short_description text,
  benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
  cta_label text DEFAULT 'Contratar',
  cta_href text,
  price_brl numeric(12,2),
  price_aoa numeric(14,2),
  currency_default text NOT NULL DEFAULT 'BRL',
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  badge text,
  sort_order int NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.service_plans TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.service_plans TO authenticated;
GRANT ALL ON public.service_plans TO service_role;

ALTER TABLE public.service_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_plans_public_read"
  ON public.service_plans FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "service_plans_admin_write"
  ON public.service_plans FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_service_plans_category ON public.service_plans(category);
CREATE INDEX IF NOT EXISTS idx_service_plans_active ON public.service_plans(is_active);

CREATE TRIGGER trg_service_plans_updated_at
  BEFORE UPDATE ON public.service_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- site_sections
CREATE TABLE IF NOT EXISTS public.site_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  page text NOT NULL DEFAULT 'home',
  title text,
  subtitle text,
  body text,
  cta_label text,
  cta_href text,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_sections TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_sections TO authenticated;
GRANT ALL ON public.site_sections TO service_role;

ALTER TABLE public.site_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_sections_public_read"
  ON public.site_sections FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "site_sections_admin_write"
  ON public.site_sections FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_site_sections_updated_at
  BEFORE UPDATE ON public.site_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- site_contents
CREATE TABLE IF NOT EXISTS public.site_contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_contents TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_contents TO authenticated;
GRANT ALL ON public.site_contents TO service_role;

ALTER TABLE public.site_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_contents_public_read"
  ON public.site_contents FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "site_contents_admin_write"
  ON public.site_contents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_site_contents_updated_at
  BEFORE UPDATE ON public.site_contents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- site_images
CREATE TABLE IF NOT EXISTS public.site_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  url text NOT NULL,
  alt text,
  bucket text,
  path text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_images TO authenticated;
GRANT ALL ON public.site_images TO service_role;

ALTER TABLE public.site_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_images_public_read"
  ON public.site_images FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "site_images_admin_write"
  ON public.site_images FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_site_images_updated_at
  BEFORE UPDATE ON public.site_images
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- site_settings
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_settings_public_read"
  ON public.site_settings FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "site_settings_admin_write"
  ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===========================
-- Seed: hosting plans (BRL)
-- ===========================
INSERT INTO public.service_plans
  (slug, category, name, short_description, benefits, price_brl, currency_default, is_active, is_featured, badge, sort_order)
VALUES
  ('host-start', 'hosting', 'Starter Host', 'Para começar',
   '["1 Site","10 GB SSD NVMe","SSL grátis","Email profissional","Cloudflare CDN","Suporte 24/7"]'::jsonb,
   19, 'BRL', true, false, 'Para começar', 1),
  ('host-business', 'hosting', 'Business Cloud', 'Mais popular',
   '["Sites ilimitados","LiteSpeed Web Server","IA integrada","Backup diário","100 GB NVMe","Email ilimitado"]'::jsonb,
   79, 'BRL', true, true, 'Mais popular', 2),
  ('host-pro', 'hosting', 'Cloud Pro', 'Performance máxima',
   '["Sites ilimitados","Recursos dedicados","Auto-scaling","WAF + DDoS","200 GB NVMe","Migração grátis"]'::jsonb,
   159, 'BRL', true, false, 'Performance máxima', 3),
  ('host-revenda', 'hosting', 'Revenda WHM', 'Negócio próprio',
   '["Contas ilimitadas","WHM + cPanel","Marca branca","DNS próprios","500 GB NVMe","Suporte premium"]'::jsonb,
   249, 'BRL', true, false, 'Negócio próprio', 4)
ON CONFLICT (slug) DO NOTHING;

-- Seed: email plans
INSERT INTO public.service_plans
  (slug, category, name, short_description, benefits, price_brl, currency_default, is_active, is_featured, sort_order)
VALUES
  ('email-starter', 'email', 'E-mail Starter', 'Para começar com e-mail profissional',
   '["1 conta de e-mail","10 GB armazenamento","Webmail e cPanel","Antispam","Suporte 24/7"]'::jsonb, 9, 'BRL', true, false, 1),
  ('email-business', 'email', 'E-mail Business', 'Para pequenas equipas',
   '["5 contas de e-mail","50 GB armazenamento","Webmail e cPanel","Antispam premium","Backup diário"]'::jsonb, 29, 'BRL', true, true, 2),
  ('email-premium', 'email', 'E-mail Premium', 'Para equipas em crescimento',
   '["20 contas de e-mail","200 GB armazenamento","Antispam premium","Backup diário","Suporte prioritário"]'::jsonb, 79, 'BRL', true, false, 3),
  ('email-enterprise', 'email', 'E-mail Enterprise', 'Para grandes empresas',
   '["Contas ilimitadas","1 TB armazenamento","Antispam premium","Backup diário","Suporte dedicado"]'::jsonb, 199, 'BRL', true, false, 4)
ON CONFLICT (slug) DO NOTHING;

-- Seed: domains (sample TLDs — admin can edit)
INSERT INTO public.service_plans
  (slug, category, name, short_description, benefits, price_brl, currency_default, is_active, is_featured, sort_order)
VALUES
  ('domain-com', 'domain', '.com', 'Domínio internacional', '["WHOIS privacy","DNS gerido","SSL grátis"]'::jsonb, 89, 'BRL', true, true, 1),
  ('domain-com-br', 'domain', '.com.br', 'Domínio Brasil', '["WHOIS privacy","DNS gerido","SSL grátis"]'::jsonb, 49, 'BRL', true, false, 2),
  ('domain-net', 'domain', '.net', 'Domínio internacional', '["WHOIS privacy","DNS gerido","SSL grátis"]'::jsonb, 99, 'BRL', true, false, 3),
  ('domain-org', 'domain', '.org', 'Para organizações', '["WHOIS privacy","DNS gerido","SSL grátis"]'::jsonb, 99, 'BRL', true, false, 4)
ON CONFLICT (slug) DO NOTHING;

-- ============================
-- Site sections seed (home)
-- ============================
INSERT INTO public.site_sections (key, page, title, subtitle, body, cta_label, cta_href, sort_order)
VALUES
  ('home.hero', 'home', 'Hospedagem premium para acelerar o seu negócio', 'Velocidade, segurança e suporte 24/7', NULL, 'Ver planos', '#planos', 1),
  ('home.hosting', 'home', 'Planos para qualquer escala', 'Hospedagem Premium', 'Servidores LiteSpeed com SSD NVMe, IA integrada e infraestrutura global.', NULL, NULL, 2),
  ('home.email', 'home', 'E-mail profissional para a sua empresa', 'E-mail Corporativo', 'Caixas de entrada com o seu domínio, antispam e suporte 24/7.', NULL, NULL, 3),
  ('home.domains', 'home', 'Registe o seu domínio', 'Domínios', 'Mais de 300 extensões disponíveis com WHOIS privacy gratuito.', NULL, NULL, 4),
  ('home.cta', 'home', 'Pronto para começar?', NULL, 'Fale com a nossa equipa e tire as suas dúvidas.', 'Falar com vendas', '/contacto', 99)
ON CONFLICT (key) DO NOTHING;

-- Site settings seed
INSERT INTO public.site_settings (key, value, description) VALUES
  ('currencies', '{"enabled":["BRL","AOA"],"default":"BRL"}'::jsonb, 'Moedas aceites e padrão'),
  ('contact', '{"phone":"","whatsapp":"","email":"contato@viralizahost.com"}'::jsonb, 'Contactos públicos'),
  ('social', '{"instagram":"","facebook":"","linkedin":""}'::jsonb, 'Redes sociais')
ON CONFLICT (key) DO NOTHING;
