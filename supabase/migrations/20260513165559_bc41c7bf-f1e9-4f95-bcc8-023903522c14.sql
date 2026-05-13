ALTER TABLE public.orders
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.payments
  ALTER COLUMN user_id DROP NOT NULL;

DROP POLICY IF EXISTS orders_select_own ON public.orders;
DROP POLICY IF EXISTS orders_insert_own ON public.orders;
DROP POLICY IF EXISTS orders_update_own ON public.orders;

CREATE POLICY orders_select_own
ON public.orders
FOR SELECT
USING (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY orders_insert_own
ON public.orders
FOR INSERT
WITH CHECK (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY orders_update_own
ON public.orders
FOR UPDATE
USING (user_id IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS payments_select_own ON public.payments;
DROP POLICY IF EXISTS payments_insert_own ON public.payments;
DROP POLICY IF EXISTS payments_update_own ON public.payments;

CREATE POLICY payments_select_own
ON public.payments
FOR SELECT
USING (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY payments_insert_own
ON public.payments
FOR INSERT
WITH CHECK (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY payments_update_own
ON public.payments
FOR UPDATE
USING (user_id IS NOT NULL AND auth.uid() = user_id);