CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  cycle TEXT NOT NULL DEFAULT 'monthly',
  currency TEXT NOT NULL DEFAULT 'BRL',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT,
  payment_provider TEXT,
  payment_ref TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_type TEXT NOT NULL,
  product_name TEXT NOT NULL,
  cycle TEXT NOT NULL DEFAULT 'monthly',
  unit_price NUMERIC NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  total NUMERIC NOT NULL DEFAULT 0,
  domain TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY orders_select_own ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY orders_insert_own ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY orders_update_own ON public.orders FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY order_items_select_own ON public.order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY order_items_insert_own ON public.order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY order_items_update_own ON public.order_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);