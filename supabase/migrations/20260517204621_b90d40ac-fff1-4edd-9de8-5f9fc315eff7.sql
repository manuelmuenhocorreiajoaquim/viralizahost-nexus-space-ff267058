ALTER TABLE public.provisioning_jobs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.provisioning_jobs;