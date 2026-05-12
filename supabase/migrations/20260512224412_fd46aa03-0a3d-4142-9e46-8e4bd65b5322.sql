
-- HOSTING PLANS (catálogo público)
CREATE TABLE public.hosting_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  price_monthly numeric NOT NULL DEFAULT 0,
  price_annual numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hosting_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hosting_plans_public_read" ON public.hosting_plans
  FOR SELECT USING (is_active = true);
CREATE TRIGGER trg_hosting_plans_updated_at
  BEFORE UPDATE ON public.hosting_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- CPANEL ACCOUNTS
CREATE TABLE public.cpanel_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  username text NOT NULL,
  domain text NOT NULL,
  server text,
  plan_name text,
  status text NOT NULL DEFAULT 'active',
  disk_quota_mb integer,
  bandwidth_quota_mb integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cpanel_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cpanel_select_own" ON public.cpanel_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cpanel_insert_own" ON public.cpanel_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cpanel_update_own" ON public.cpanel_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cpanel_delete_own" ON public.cpanel_accounts FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_cpanel_user ON public.cpanel_accounts(user_id);
CREATE TRIGGER trg_cpanel_updated_at
  BEFORE UPDATE ON public.cpanel_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- PAYMENTS
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  method text,
  provider text,
  provider_ref text,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_select_own" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "payments_insert_own" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "payments_update_own" ON public.payments FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX idx_payments_user ON public.payments(user_id);
CREATE INDEX idx_payments_order ON public.payments(order_id);
CREATE INDEX idx_payments_invoice ON public.payments(invoice_id);
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
