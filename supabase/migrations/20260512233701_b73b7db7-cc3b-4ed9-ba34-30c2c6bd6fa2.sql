ALTER TABLE public.whm_servers
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS token_encrypted text,
  ADD COLUMN IF NOT EXISTS nameservers jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.whm_servers
SET
  name = COALESCE(name, hostname),
  nameservers = CASE
    WHEN jsonb_array_length(nameservers) = 0 THEN jsonb_build_array(nameserver1, nameserver2)
    ELSE nameservers
  END
WHERE name IS NULL OR jsonb_array_length(nameservers) = 0;

ALTER TABLE public.whm_servers
  ALTER COLUMN name SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_whm_servers_active ON public.whm_servers(active);
CREATE INDEX IF NOT EXISTS idx_whm_servers_nameservers ON public.whm_servers USING gin(nameservers);