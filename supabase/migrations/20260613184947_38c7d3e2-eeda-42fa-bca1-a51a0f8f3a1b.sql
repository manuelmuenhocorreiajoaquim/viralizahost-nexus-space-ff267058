
CREATE TABLE public.domain_extensions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ext TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  price_brl NUMERIC(12,2) NOT NULL DEFAULT 0,
  price_aoa NUMERIC(14,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.domain_extensions TO anon;
GRANT SELECT ON public.domain_extensions TO authenticated;
GRANT ALL ON public.domain_extensions TO service_role;

ALTER TABLE public.domain_extensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active domain extensions"
  ON public.domain_extensions FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage domain extensions"
  ON public.domain_extensions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_domain_extensions_updated_at
  BEFORE UPDATE ON public.domain_extensions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.domain_extensions (ext, slug, price_brl, price_aoa, is_active, is_featured, sort_order) VALUES
  ('.com',    'com',    59,  20000, true, true,  10),
  ('.com.br', 'com-br', 49,  15000, true, false, 20),
  ('.net',    'net',    69,  12900, true, false, 30),
  ('.org',    'org',    69,  12900, true, false, 40),
  ('.ao',     'ao',     250, 46500, true, false, 50),
  ('.co.ao',  'co-ao',  350, 65000, true, false, 60),
  ('.online', 'online', 20,  12000, true, false, 70),
  ('.shop',   'shop',   16,  10000, true, false, 80),
  ('.store',  'store',  18,  11000, true, false, 90),
  ('.site',   'site',   19,  12000, true, false, 100),
  ('.blog',   'blog',   25,  15000, true, false, 110);
