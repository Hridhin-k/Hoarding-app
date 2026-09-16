-- Production hardening: lock down SECURITY DEFINER RPCs and public helper grants.

-- 1) Audit log: authenticated callers may only write to tenants they belong to.
--    Service role (auth.uid() IS NULL) remains able to write for system jobs.
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
  IF auth.uid() IS NOT NULL AND NOT public.is_org_member(p_tenant_id) THEN
    RAISE EXCEPTION 'You do not have permission to do that.';
  END IF;

  IF p_action IS NULL OR length(trim(p_action)) = 0 THEN
    RAISE EXCEPTION 'Audit action is required.';
  END IF;
  IF p_entity_type IS NULL OR length(trim(p_entity_type)) = 0 THEN
    RAISE EXCEPTION 'Audit entity type is required.';
  END IF;

  INSERT INTO public.audit_logs (
    tenant_id, user_id, action, entity_type, entity_id, old_data, new_data, ip_address
  )
  VALUES (
    p_tenant_id, auth.uid(), trim(p_action), trim(p_entity_type), p_entity_id, p_old_data, p_new_data, p_ip
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- 2) Operational alert refresh and hold expiry: cron / service_role only.
REVOKE EXECUTE ON FUNCTION public.refresh_operational_alerts() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_operational_alerts() FROM anon;
REVOKE EXECUTE ON FUNCTION public.refresh_operational_alerts() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.expire_holds(date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.expire_holds(date) FROM anon;
REVOKE EXECUTE ON FUNCTION public.expire_holds(date) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.refresh_operational_alerts() TO service_role;
GRANT EXECUTE ON FUNCTION public.expire_holds(date) TO service_role;

-- 3) Tenant-scoped alert refresh for authenticated ops (membership required).
CREATE OR REPLACE FUNCTION public.refresh_tenant_operational_alerts(p_tenant uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  r record;
BEGIN
  IF NOT public.is_org_member(p_tenant) THEN
    RAISE EXCEPTION 'You do not have permission to do that.';
  END IF;
  IF NOT (
    public.has_permission(p_tenant, 'occupancy.manage')
    OR public.has_permission(p_tenant, 'compliance.manage')
    OR public.has_permission(p_tenant, 'settings.manage')
  ) THEN
    RAISE EXCEPTION 'You do not have permission to do that.';
  END IF;

  FOR r IN
    SELECT
      f.id AS face_id,
      f.tenant_id,
      f.face_label,
      b.name AS board_name,
      op.end_date
    FROM public.occupancy_periods op
    JOIN public.board_faces f ON f.id = op.face_id
    JOIN public.boards b ON b.id = f.board_id
    JOIN public.organization_settings s ON s.tenant_id = f.tenant_id
    WHERE f.tenant_id = p_tenant
      AND op.state = 'occupied'
      AND CURRENT_DATE BETWEEN op.start_date AND op.end_date
      AND op.end_date <= (CURRENT_DATE + s.vacancy_prelisting_days)
      AND public.face_occupancy_dimension(f.id, CURRENT_DATE) = 'becoming_vacant'
  LOOP
    PERFORM public.notify_tenant_role(
      r.tenant_id,
      ARRAY['OWNER', 'ADMIN', 'SALES']::public.app_role[],
      'VACANCY_APPROACHING',
      'Upcoming vacancy',
      format('%s %s becomes vacant on %s.', r.board_name, r.face_label, to_char(r.end_date + 1, 'DD FMMonth YYYY')),
      'face',
      r.face_id
    );
    v_count := v_count + 1;
  END LOOP;

  FOR r IN
    SELECT
      c.id,
      c.tenant_id,
      c.clearance_type,
      c.expiry_date,
      c.status,
      b.name AS board_name,
      (c.expiry_date - CURRENT_DATE) AS days_left
    FROM public.compliance_records c
    JOIN public.boards b ON b.id = c.board_id
    WHERE c.tenant_id = p_tenant
      AND c.is_mandatory
      AND c.expiry_date IS NOT NULL
      AND (
        c.status = 'expired'
        OR (c.expiry_date - CURRENT_DATE) IN (90, 60, 30, 15, 7)
      )
  LOOP
    IF r.status = 'expired' THEN
      PERFORM public.notify_tenant_role(
        r.tenant_id,
        ARRAY['OWNER', 'ADMIN', 'COMPLIANCE']::public.app_role[],
        'COMPLIANCE_EXPIRED',
        'Permit expired',
        format('%s — %s expired on %s.', r.board_name, r.clearance_type, to_char(r.expiry_date, 'DD FMMonth YYYY')),
        'compliance',
        r.id
      );
    ELSE
      PERFORM public.notify_tenant_role(
        r.tenant_id,
        ARRAY['OWNER', 'ADMIN', 'COMPLIANCE']::public.app_role[],
        'COMPLIANCE_EXPIRING',
        format('Permit expires in %s days', r.days_left),
        format('%s — %s expires on %s.', r.board_name, r.clearance_type, to_char(r.expiry_date, 'DD FMMonth YYYY')),
        'compliance',
        r.id
      );
    END IF;
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_tenant_operational_alerts(uuid) TO authenticated;

-- 4) Occupancy/compliance helpers: views still work (owner rights); revoke anon direct probing.
REVOKE EXECUTE ON FUNCTION public.face_occupancy_dimension(uuid, date) FROM anon;
REVOKE EXECUTE ON FUNCTION public.board_compliance_dimension(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.face_is_marketplace_eligible(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.face_available_from(uuid) FROM anon;

-- Keep authenticated execute for app/server usage; eligibility remains enforced by marketplace views for public reads.
GRANT EXECUTE ON FUNCTION public.face_occupancy_dimension(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.board_compliance_dimension(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.face_is_marketplace_eligible(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.face_available_from(uuid) TO authenticated;
