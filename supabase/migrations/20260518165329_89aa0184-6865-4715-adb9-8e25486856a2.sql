
-- Bloquear provisionamento sem pagamento aprovado.
-- 1) Marcar jobs existentes cujos pedidos NÃO estão pagos como 'waiting_payment'.
UPDATE public.provisioning_jobs j
SET status = 'waiting_payment'
WHERE j.status IN ('pending', 'processing', 'failed')
  AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = j.order_id
      AND (o.status IS DISTINCT FROM 'paid' OR o.payment_status IS DISTINCT FROM 'approved')
  )
  AND j.provider_resource_id IS NULL;

-- 2) Garantir idempotência: índice único no provider_payment_id por provedor.
CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_payment_id_unique
  ON public.payments (provider, provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;
