ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

ALTER TABLE public.cpanel_accounts ADD COLUMN IF NOT EXISTS disk_used_mb integer;

CREATE UNIQUE INDEX IF NOT EXISTS cpanel_accounts_server_username_uniq
  ON public.cpanel_accounts (server_id, username)
  WHERE server_id IS NOT NULL;