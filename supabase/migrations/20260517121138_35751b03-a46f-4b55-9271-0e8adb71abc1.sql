
-- provider_products: mapping ViralizaHost ↔ external provider
CREATE TABLE public.provider_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_product_id text NOT NULL,
  internal_product_name text NOT NULL,
  provider text NOT NULL DEFAULT 'hostinger',
  provider_service_type text NOT NULL,
  provider_price_id text,
  provider_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  auto_provision boolean NOT NULL DEFAULT false,
  internal_price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, internal_product_id)
);

ALTER TABLE public.provider_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY provider_products_public_read ON public.provider_products
  FOR SELECT USING (active = true);

CREATE POLICY provider_products_admin_all ON public.provider_products
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER provider_products_set_updated_at
  BEFORE UPDATE ON public.provider_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- provisioning_jobs: queue of activation tasks
CREATE TABLE public.provisioning_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid,
  order_item_id uuid,
  user_id uuid,
  provider text NOT NULL DEFAULT 'hostinger',
  provider_service_type text NOT NULL,
  provider_product_id uuid REFERENCES public.provider_products(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  provider_request jsonb NOT NULL DEFAULT '{}'::jsonb,
  provider_response jsonb NOT NULL DEFAULT '{}'::jsonb,
  provider_resource_id text,
  error_message text,
  attempts integer NOT NULL DEFAULT 0,
  last_attempt_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX provisioning_jobs_order_id_idx ON public.provisioning_jobs (order_id);
CREATE INDEX provisioning_jobs_user_id_idx ON public.provisioning_jobs (user_id);
CREATE INDEX provisioning_jobs_status_idx ON public.provisioning_jobs (status);

ALTER TABLE public.provisioning_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY provisioning_jobs_select_own ON public.provisioning_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY provisioning_jobs_admin_select_all ON public.provisioning_jobs
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY provisioning_jobs_admin_update_all ON public.provisioning_jobs
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER provisioning_jobs_set_updated_at
  BEFORE UPDATE ON public.provisioning_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- hostinger_logs: per-call audit trail
CREATE TABLE public.hostinger_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.provisioning_jobs(id) ON DELETE SET NULL,
  endpoint text NOT NULL,
  method text NOT NULL DEFAULT 'GET',
  status_code integer,
  duration_ms integer,
  request jsonb NOT NULL DEFAULT '{}'::jsonb,
  response jsonb NOT NULL DEFAULT '{}'::jsonb,
  success boolean NOT NULL DEFAULT true,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX hostinger_logs_job_id_idx ON public.hostinger_logs (job_id);
CREATE INDEX hostinger_logs_created_at_idx ON public.hostinger_logs (created_at DESC);

ALTER TABLE public.hostinger_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY hostinger_logs_admin_select ON public.hostinger_logs
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- services: link to provisioning job for status badges in client panel
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS provisioning_job_id uuid REFERENCES public.provisioning_jobs(id) ON DELETE SET NULL;
