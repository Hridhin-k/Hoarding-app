-- Production readiness: index field job scheduling for dashboard + field lists

CREATE INDEX IF NOT EXISTS field_jobs_tenant_scheduled_idx
  ON public.field_jobs (tenant_id, scheduled_at);

CREATE INDEX IF NOT EXISTS documents_tenant_created_idx
  ON public.documents (tenant_id, created_at DESC);
