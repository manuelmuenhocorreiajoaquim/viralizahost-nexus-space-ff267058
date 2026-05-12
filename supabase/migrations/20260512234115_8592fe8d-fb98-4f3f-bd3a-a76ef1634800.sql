ALTER TABLE public.whm_servers
  ALTER COLUMN token DROP NOT NULL;

UPDATE public.whm_servers
SET token_encrypted = COALESCE(token_encrypted, token)
WHERE token IS NOT NULL AND token_encrypted IS NULL;