
CREATE TABLE IF NOT EXISTS public.hosting_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email TEXT,
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  domain TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'PENDENTE_ATIVACAO',
  cpanel_username TEXT,
  cpanel_url TEXT,
  server_ip TEXT,
  whm_package TEXT,
  storage_gb INTEGER,
  admin_notes TEXT,
  activated_at TIMESTAMPTZ,
  admin_activated_by UUID,
  cancelled_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hosting_orders TO authenticated;
GRANT ALL ON public.hosting_orders TO service_role;

ALTER TABLE public.hosting_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hosting_orders_select_own"
  ON public.hosting_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "hosting_orders_admin_all"
  ON public.hosting_orders FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS hosting_orders_user_id_idx ON public.hosting_orders(user_id);
CREATE INDEX IF NOT EXISTS hosting_orders_order_id_idx ON public.hosting_orders(order_id);
CREATE INDEX IF NOT EXISTS hosting_orders_status_idx ON public.hosting_orders(status);

CREATE TRIGGER hosting_orders_set_updated_at
  BEFORE UPDATE ON public.hosting_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
