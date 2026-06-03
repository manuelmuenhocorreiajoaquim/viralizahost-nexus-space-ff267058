
-- Domain orders: add manual-activation lifecycle columns.
ALTER TABLE public.domain_orders
  ADD COLUMN IF NOT EXISTS order_id uuid,
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS activated_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- Allow deletes (admin can clean test entries).
DROP POLICY IF EXISTS domain_orders_delete_admin ON public.domain_orders;
CREATE POLICY domain_orders_delete_admin
ON public.domain_orders
FOR DELETE
USING (private.has_role(auth.uid(), 'admin'::app_role));

-- Index for lookups by user.
CREATE INDEX IF NOT EXISTS idx_domain_orders_user ON public.domain_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_domain_orders_status ON public.domain_orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_domain_orders_order_id ON public.domain_orders(order_id);
