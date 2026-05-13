
DROP POLICY IF EXISTS "domain_search_logs_insert_anyone" ON public.domain_search_logs;
CREATE POLICY "domain_search_logs_insert_self_or_anon"
  ON public.domain_search_logs FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "domain_orders_insert_anyone" ON public.domain_orders;
CREATE POLICY "domain_orders_insert_self_or_anon"
  ON public.domain_orders FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
