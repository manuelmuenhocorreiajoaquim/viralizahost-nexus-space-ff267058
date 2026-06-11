
ALTER TABLE public.domains
  ADD COLUMN IF NOT EXISTS dns_change_pending boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dns_change_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS dns_change_applied_at timestamptz,
  ADD COLUMN IF NOT EXISTS dns_change_note text;

CREATE INDEX IF NOT EXISTS domains_dns_pending_idx ON public.domains(dns_change_pending) WHERE dns_change_pending = true;
