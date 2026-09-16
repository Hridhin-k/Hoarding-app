-- Field jobs, proof of display, notifications, audit logs

CREATE TABLE public.field_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  board_id uuid NOT NULL REFERENCES public.boards (id) ON DELETE CASCADE,
  face_id uuid REFERENCES public.board_faces (id) ON DELETE SET NULL,
  job_type public.field_job_type NOT NULL,
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  scheduled_at timestamptz,
  status public.field_job_status NOT NULL DEFAULT 'pending',
  priority public.field_job_priority NOT NULL DEFAULT 'medium',
  qr_verified_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.proof_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  field_job_id uuid NOT NULL REFERENCES public.field_jobs (id) ON DELETE CASCADE,
  board_id uuid NOT NULL REFERENCES public.boards (id) ON DELETE CASCADE,
  face_id uuid REFERENCES public.board_faces (id) ON DELETE SET NULL,
  photo_storage_path text NOT NULL,
  captured_at timestamptz NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  accuracy_meters double precision,
  captured_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT proof_valid_gps CHECK (
    latitude BETWEEN -90 AND 90
    AND longitude BETWEEN -180 AND 180
  ),
  CONSTRAINT proof_accuracy_nonneg CHECK (
    accuracy_meters IS NULL OR accuracy_meters >= 0
  )
);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX field_jobs_tenant_idx ON public.field_jobs (tenant_id);
CREATE INDEX field_jobs_assigned_idx ON public.field_jobs (assigned_to);
CREATE INDEX field_jobs_status_idx ON public.field_jobs (tenant_id, status);
CREATE INDEX field_jobs_board_idx ON public.field_jobs (board_id);
CREATE INDEX proof_tenant_idx ON public.proof_records (tenant_id);
CREATE INDEX proof_job_idx ON public.proof_records (field_job_id);
CREATE INDEX notifications_user_idx ON public.notifications (user_id, read_at, created_at DESC);
CREATE INDEX notifications_tenant_idx ON public.notifications (tenant_id);
CREATE INDEX audit_logs_tenant_idx ON public.audit_logs (tenant_id, created_at DESC);
CREATE INDEX audit_logs_entity_idx ON public.audit_logs (tenant_id, entity_type, entity_id);

CREATE TRIGGER field_jobs_set_updated_at
  BEFORE UPDATE ON public.field_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.write_audit_log(
  p_tenant_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_old_data jsonb DEFAULT NULL,
  p_new_data jsonb DEFAULT NULL,
  p_ip inet DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.audit_logs (
    tenant_id, user_id, action, entity_type, entity_id, old_data, new_data, ip_address
  )
  VALUES (
    p_tenant_id, auth.uid(), p_action, p_entity_type, p_entity_id, p_old_data, p_new_data, p_ip
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.write_audit_log(uuid, text, text, uuid, jsonb, jsonb, inet)
  TO authenticated;
