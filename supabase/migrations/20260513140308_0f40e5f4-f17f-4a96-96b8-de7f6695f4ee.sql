
CREATE TABLE public.domain_search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  searched_domain text NOT NULL,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.domain_search_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "domain_search_logs_insert_anyone"
  ON public.domain_search_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "domain_search_logs_select_own_or_admin"
  ON public.domain_search_logs FOR SELECT
  USING (
    (user_id IS NOT NULL AND auth.uid() = user_id)
    OR private.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE TABLE public.domain_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_name text NOT NULL,
  extension text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  status text NOT NULL DEFAULT 'pending',
  customer_email text,
  user_id uuid,
  provider text NOT NULL DEFAULT 'namesilo',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.domain_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "domain_orders_insert_anyone"
  ON public.domain_orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "domain_orders_select_own_or_admin"
  ON public.domain_orders FOR SELECT
  USING (
    (user_id IS NOT NULL AND auth.uid() = user_id)
    OR private.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "domain_orders_update_admin"
  ON public.domain_orders FOR UPDATE
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER domain_orders_set_updated_at
  BEFORE UPDATE ON public.domain_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_domain_search_logs_created ON public.domain_search_logs(created_at DESC);
CREATE INDEX idx_domain_orders_status ON public.domain_orders(status);
