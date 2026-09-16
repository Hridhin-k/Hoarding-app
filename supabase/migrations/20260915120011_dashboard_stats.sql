CREATE OR REPLACE FUNCTION public.dashboard_stats(p_tenant uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prelisting integer := 30;
BEGIN
  IF NOT public.is_org_member(p_tenant) THEN
    RAISE EXCEPTION 'You do not have permission to do that.';
  END IF;

  SELECT vacancy_prelisting_days INTO v_prelisting
  FROM public.organization_settings
  WHERE tenant_id = p_tenant;

  RETURN jsonb_build_object(
    'boards', (SELECT COUNT(*) FROM public.boards WHERE tenant_id = p_tenant AND lifecycle_status <> 'retired'),
    'faces', (SELECT COUNT(*) FROM public.board_faces f JOIN public.boards b ON b.id = f.board_id WHERE f.tenant_id = p_tenant AND b.lifecycle_status <> 'retired'),
    'occupied', (
      SELECT COUNT(*) FROM public.board_faces f
      WHERE f.tenant_id = p_tenant
        AND public.face_occupancy_dimension(f.id, CURRENT_DATE) IN ('occupied', 'becoming_vacant')
    ),
    'vacant', (
      SELECT COUNT(*) FROM public.board_faces f
      JOIN public.boards b ON b.id = f.board_id
      WHERE f.tenant_id = p_tenant
        AND b.lifecycle_status = 'active'
        AND public.face_occupancy_dimension(f.id, CURRENT_DATE) = 'vacant'
    ),
    'becoming_vacant', (
      SELECT COUNT(*) FROM public.board_faces f
      WHERE f.tenant_id = p_tenant
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

GRANT EXECUTE ON FUNCTION public.dashboard_stats(uuid) TO authenticated;
