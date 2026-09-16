-- Compliance, documents, agreements

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  document_type text NOT NULL,
  file_name text NOT NULL,
  storage_path text NOT NULL,
  mime_type text NOT NULL,
  file_size integer NOT NULL,
  checksum text,
  version integer NOT NULL DEFAULT 1,
  uploaded_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT documents_size_limit CHECK (file_size > 0 AND file_size <= 20971520),
  CONSTRAINT documents_mime CHECK (
    mime_type IN (
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
  ),
  CONSTRAINT documents_entity_type CHECK (
    entity_type IN (
      'board',
      'face',
      'compliance',
      'agreement',
      'organization',
      'customer',
      'field_job'
    )
  )
);

CREATE TABLE public.compliance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  board_id uuid NOT NULL REFERENCES public.boards (id) ON DELETE CASCADE,
  clearance_type text NOT NULL,
  authority text,
  reference_number text,
  issue_date date,
  expiry_date date,
  renewal_cycle text,
  status public.compliance_status NOT NULL DEFAULT 'missing',
  is_mandatory boolean NOT NULL DEFAULT true,
  document_id uuid REFERENCES public.documents (id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  board_id uuid REFERENCES public.boards (id) ON DELETE SET NULL,
  face_id uuid REFERENCES public.board_faces (id) ON DELETE SET NULL,
  customer_id uuid,
  title text NOT NULL,
  agreement_type text NOT NULL DEFAULT 'media_contract',
  start_date date,
  end_date date,
  document_id uuid REFERENCES public.documents (id) ON DELETE SET NULL,
  status public.agreement_status NOT NULL DEFAULT 'draft',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX documents_tenant_idx ON public.documents (tenant_id);
CREATE INDEX documents_entity_idx ON public.documents (tenant_id, entity_type, entity_id);
CREATE INDEX compliance_tenant_idx ON public.compliance_records (tenant_id);
CREATE INDEX compliance_board_idx ON public.compliance_records (board_id);
CREATE INDEX compliance_expiry_idx ON public.compliance_records (tenant_id, expiry_date);
CREATE INDEX compliance_status_idx ON public.compliance_records (tenant_id, status);
CREATE INDEX agreements_tenant_idx ON public.agreements (tenant_id);
CREATE INDEX agreements_board_idx ON public.agreements (board_id);

CREATE OR REPLACE FUNCTION public.compute_compliance_status(
  p_expiry date,
  p_as_of date DEFAULT CURRENT_DATE
)
RETURNS public.compliance_status
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  IF p_expiry IS NULL THEN
    RETURN 'missing';
  ELSIF p_expiry < p_as_of THEN
    RETURN 'expired';
  ELSIF p_expiry <= (p_as_of + 90) THEN
    RETURN 'expiring';
  ELSE
    RETURN 'valid';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_compliance_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.status := public.compute_compliance_status(NEW.expiry_date, CURRENT_DATE);
  RETURN NEW;
END;
$$;

CREATE TRIGGER compliance_records_sync_status
  BEFORE INSERT OR UPDATE OF expiry_date ON public.compliance_records
  FOR EACH ROW EXECUTE FUNCTION public.sync_compliance_status();

CREATE TRIGGER compliance_records_set_updated_at
  BEFORE UPDATE ON public.compliance_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER agreements_set_updated_at
  BEFORE UPDATE ON public.agreements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
