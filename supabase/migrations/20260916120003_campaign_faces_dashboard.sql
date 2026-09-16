-- Campaign ↔ face links for lightweight campaigns; tighten dashboard stats

CREATE TABLE public.campaign_faces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.campaigns (id) ON DELETE CASCADE,
  face_id uuid NOT NULL REFERENCES public.board_faces (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campaign_faces_unique UNIQUE (campaign_id, face_id)
);

CREATE INDEX campaign_faces_tenant_idx ON public.campaign_faces (tenant_id);
CREATE INDEX campaign_faces_campaign_idx ON public.campaign_faces (campaign_id);
CREATE INDEX campaign_faces_face_idx ON public.campaign_faces (face_id);

ALTER TABLE public.campaign_faces ENABLE ROW LEVEL SECURITY;

CREATE POLICY campaign_faces_select ON public.campaign_faces
  FOR SELECT TO authenticated
  USING (public.has_permission(tenant_id, 'campaigns.view'));

CREATE POLICY campaign_faces_insert ON public.campaign_faces
  FOR INSERT TO authenticated
  WITH CHECK (public.has_permission(tenant_id, 'campaigns.manage'));

CREATE POLICY campaign_faces_delete ON public.campaign_faces
  FOR DELETE TO authenticated
  USING (public.has_permission(tenant_id, 'campaigns.manage'));

CREATE TRIGGER campaign_faces_prevent_tenant_change
  BEFORE UPDATE ON public.campaign_faces
  FOR EACH ROW EXECUTE FUNCTION public.prevent_tenant_change();

CREATE OR REPLACE FUNCTION public.dashboard_stats(p_tenant uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_org_member(p_tenant) THEN
    RAISE EXCEPTION 'You do not have permission to do that.';
  END IF;

  RETURN jsonb_build_object(
    'boards', (
      SELECT COUNT(*) FROM public.boards
      WHERE tenant_id = p_tenant AND lifecycle_status <> 'retired'
    ),
    'faces', (
      SELECT COUNT(*) FROM public.board_faces f
      JOIN public.boards b ON b.id = f.board_id
      WHERE f.tenant_id = p_tenant
        AND f.archived_at IS NULL
        AND b.lifecycle_status <> 'retired'
    ),
    'occupied', (
      SELECT COUNT(*) FROM public.board_faces f
      WHERE f.tenant_id = p_tenant
        AND f.archived_at IS NULL
        AND public.face_occupancy_dimension(f.id, CURRENT_DATE) IN ('occupied', 'becoming_vacant')
    ),
    'vacant', (
      SELECT COUNT(*) FROM public.board_faces f
      JOIN public.boards b ON b.id = f.board_id
      WHERE f.tenant_id = p_tenant
        AND f.archived_at IS NULL
        AND b.lifecycle_status = 'active'
        AND public.face_occupancy_dimension(f.id, CURRENT_DATE) = 'vacant'
    ),
    'becoming_vacant', (
      SELECT COUNT(*) FROM public.board_faces f
      WHERE f.tenant_id = p_tenant
        AND f.archived_at IS NULL
        AND public.face_occupancy_dimension(f.id, CURRENT_DATE) = 'becoming_vacant'
    ),
    'permits_expiring', (
      SELECT COUNT(*) FROM public.compliance_records
      WHERE tenant_id = p_tenant AND status = 'expiring' AND is_mandatory
    ),
    'permits_expired', (
      SELECT COUNT(*) FROM public.compliance_records
      WHERE tenant_id = p_tenant AND status = 'expired' AND is_mandatory
    ),
    'marketplace_enquiries', (
      SELECT COUNT(*) FROM public.enquiries
      WHERE tenant_id = p_tenant
        AND source = 'marketplace'
        AND status IN ('new', 'contacted', 'qualified', 'proposal')
    ),
    'enquiries_open', (
      SELECT COUNT(*) FROM public.enquiries
      WHERE tenant_id = p_tenant AND status IN ('new', 'contacted', 'qualified', 'proposal')
    ),
    'campaigns_active', (
      SELECT COUNT(*) FROM public.campaigns
      WHERE tenant_id = p_tenant AND status = 'active'
    ),
    'jobs_pending', (
      SELECT COUNT(*) FROM public.field_jobs
      WHERE tenant_id = p_tenant AND status IN ('pending', 'assigned', 'in_progress')
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.dashboard_upcoming_vacancies(
  p_tenant uuid,
  p_limit integer DEFAULT 8
)
RETURNS TABLE (
  face_id uuid,
  face_label text,
  board_name text,
  board_code text,
  end_date date,
  available_from date
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_org_member(p_tenant) THEN
    RAISE EXCEPTION 'You do not have permission to do that.';
  END IF;

  RETURN QUERY
  SELECT
    f.id,
    f.face_label,
    b.name,
    b.board_code,
    op.end_date,
    (op.end_date + 1)::date
  FROM public.occupancy_periods op
  JOIN public.board_faces f ON f.id = op.face_id
  JOIN public.boards b ON b.id = f.board_id
  WHERE op.tenant_id = p_tenant
    AND f.archived_at IS NULL
    AND op.state IN ('occupied', 'booked_future')
    AND CURRENT_DATE BETWEEN op.start_date AND op.end_date
    AND public.face_occupancy_dimension(f.id, CURRENT_DATE) = 'becoming_vacant'
  ORDER BY op.end_date ASC
  LIMIT GREATEST(1, LEAST(p_limit, 50));
END;
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dashboard_upcoming_vacancies(uuid, integer) TO authenticated;
