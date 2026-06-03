
ALTER TABLE public.domain_orders
  ADD COLUMN IF NOT EXISTS admin_activated_by uuid,
  ADD COLUMN IF NOT EXISTS hostinger_purchased_at timestamptz;

ALTER TABLE public.domains
  ADD COLUMN IF NOT EXISTS nameservers jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS dns_records jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS target_ip text,
  ADD COLUMN IF NOT EXISTS domain_order_id uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS domains_order_idx ON public.domains(domain_order_id);
CREATE INDEX IF NOT EXISTS domains_user_idx ON public.domains(user_id);
