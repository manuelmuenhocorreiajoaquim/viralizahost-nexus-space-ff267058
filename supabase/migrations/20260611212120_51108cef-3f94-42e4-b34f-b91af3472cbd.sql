
CREATE TABLE IF NOT EXISTS public.email_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_email text,
  plan_id text NOT NULL,
  plan_name text NOT NULL,
  domain text,
  accounts_count integer NOT NULL DEFAULT 1,
  storage_gb integer NOT NULL DEFAULT 10,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  status text NOT NULL DEFAULT 'PENDENTE_ATIVACAO',
  webmail_url text,
  cpanel_url text,
  admin_notes text,
  admin_activated_by uuid,
  activated_at timestamptz,
  cancelled_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.email_orders TO authenticated;
GRANT ALL ON public.email_orders TO service_role;

ALTER TABLE public.email_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_orders_select_own" ON public.email_orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "email_orders_admin_update" ON public.email_orders
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER email_orders_set_updated_at
  BEFORE UPDATE ON public.email_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_email_orders_user ON public.email_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_email_orders_status ON public.email_orders(status);
