
-- pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

DROP POLICY IF EXISTS "user_roles_select_self_or_admin" ON public.user_roles;
CREATE POLICY "user_roles_select_self_or_admin" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "user_roles_admin_write" ON public.user_roles;
CREATE POLICY "user_roles_admin_write" ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- whm_servers
CREATE TABLE IF NOT EXISTS public.whm_servers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hostname text NOT NULL,
  api_url text NOT NULL,
  username text NOT NULL,
  token text NOT NULL,
  server_ip text,
  nameserver1 text NOT NULL,
  nameserver2 text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  max_accounts integer NOT NULL DEFAULT 500,
  current_accounts integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.whm_servers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "whm_servers_admin_all" ON public.whm_servers;
CREATE POLICY "whm_servers_admin_all" ON public.whm_servers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_whm_servers_updated_at
  BEFORE UPDATE ON public.whm_servers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- cpanel_accounts extras
ALTER TABLE public.cpanel_accounts
  ADD COLUMN IF NOT EXISTS server_id uuid REFERENCES public.whm_servers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS server_ip text,
  ADD COLUMN IF NOT EXISTS nameservers jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS cpanel_url text,
  ADD COLUMN IF NOT EXISTS password_encrypted text,
  ADD COLUMN IF NOT EXISTS package text,
  ADD COLUMN IF NOT EXISTS expiry_date timestamptz,
  ADD COLUMN IF NOT EXISTS provisioned_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL;

-- orders extras
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS provisioned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS provisioning_error text;

-- provisioning_logs
CREATE TABLE IF NOT EXISTS public.provisioning_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  cpanel_account_id uuid REFERENCES public.cpanel_accounts(id) ON DELETE SET NULL,
  user_id uuid,
  event text NOT NULL,
  success boolean NOT NULL DEFAULT true,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.provisioning_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "logs_select_own_or_admin" ON public.provisioning_logs;
CREATE POLICY "logs_select_own_or_admin" ON public.provisioning_logs FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
