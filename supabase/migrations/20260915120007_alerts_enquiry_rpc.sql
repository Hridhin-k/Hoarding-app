-- Vacancy / compliance alerts and public enquiry RPC

CREATE OR REPLACE FUNCTION public.notify_tenant_role(
  p_tenant uuid,
  p_roles public.app_role[],
  p_type text,
  p_title text,
  p_message text,
  p_entity_type text,
  p_entity_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (tenant_id, user_id, type, title, message, entity_type, entity_id)
  SELECT p_tenant, m.user_id, p_type, p_title, p_message, p_entity_type, p_entity_id
  FROM public.organization_members m
  WHERE m.organization_id = p_tenant
    AND m.status = 'active'
    AND m.role = ANY (p_roles)
    AND NOT EXISTS (
      SELECT 1
      FROM public.notifications n
      WHERE n.tenant_id = p_tenant
        AND n.user_id = m.user_id
        AND n.type = p_type
        AND n.entity_id = p_entity_id
        AND n.created_at > now() - interval '24 hours'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_operational_alerts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  r record;
  v_days integer;
BEGIN
  -- Vacancy loop: occupied faces entering the pre-listing window
  FOR r IN
    SELECT
      f.id AS face_id,
      f.tenant_id,
      f.face_label,
      b.name AS board_name,
      op.end_date,
      s.vacancy_prelisting_days
    FROM public.occupancy_periods op
    JOIN public.board_faces f ON f.id = op.face_id
    JOIN public.boards b ON b.id = f.board_id
    JOIN public.organization_settings s ON s.tenant_id = f.tenant_id
    WHERE op.state = 'occupied'
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

  -- Compliance windows: 90, 60, 30, 15, 7 days, plus expired
  FOR r IN
    SELECT
      c.id,
      c.tenant_id,
      c.board_id,
      c.clearance_type,
      c.expiry_date,
      c.status,
      b.name AS board_name,
      (c.expiry_date - CURRENT_DATE) AS days_left
    FROM public.compliance_records c
    JOIN public.boards b ON b.id = c.board_id
    WHERE c.is_mandatory
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

CREATE OR REPLACE FUNCTION public.submit_marketplace_enquiry(
  p_face_id uuid,
  p_name text,
  p_company_name text,
  p_email text,
  p_phone text,
  p_message text,
  p_start date,
  p_end date,
  p_ip_hash text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_face public.board_faces%ROWTYPE;
  v_id uuid;
  v_recent integer;
BEGIN
  IF p_name IS NULL OR length(trim(p_name)) < 2 THEN
    RAISE EXCEPTION 'Please enter your name.';
  END IF;
  IF p_email IS NULL OR p_email !~* '^[^@]+@[^@]+\.[^@]+$' THEN
    RAISE EXCEPTION 'Please enter a valid email address.';
  END IF;
  IF p_phone IS NULL OR length(regexp_replace(p_phone, '\D', '', 'g')) < 10 THEN
    RAISE EXCEPTION 'Please enter a valid phone number.';
  END IF;

  SELECT COUNT(*) INTO v_recent
  FROM public.enquiry_rate_limits
  WHERE ip_hash = p_ip_hash
    AND created_at > now() - interval '1 hour';

  IF v_recent >= 5 THEN
    RAISE EXCEPTION 'Too many enquiries from this network. Please try again later.';
  END IF;

  IF NOT public.face_is_marketplace_eligible(p_face_id) THEN
    RAISE EXCEPTION 'This face is not currently available for enquiry.';
  END IF;

  SELECT * INTO v_face FROM public.board_faces WHERE id = p_face_id;

  INSERT INTO public.enquiry_rate_limits (ip_hash) VALUES (p_ip_hash);

  INSERT INTO public.enquiries (
    tenant_id, face_id, source, name, company_name, email, phone, message,
    requested_start_date, requested_end_date, status
  )
  VALUES (
    v_face.tenant_id, p_face_id, 'marketplace', trim(p_name), nullif(trim(p_company_name), ''),
    lower(trim(p_email)), trim(p_phone), nullif(trim(p_message), ''),
    p_start, p_end, 'new'
  )
  RETURNING id INTO v_id;

  PERFORM public.notify_tenant_role(
    v_face.tenant_id,
    ARRAY['OWNER', 'ADMIN', 'SALES']::public.app_role[],
    'ENQUIRY_CREATED',
    'New marketplace enquiry',
    format('%s enquired about %s.', trim(p_name), v_face.face_label),
    'enquiry',
    v_id
  );

  PERFORM public.write_audit_log(
    v_face.tenant_id,
    'ENQUIRY_CREATED',
    'enquiry',
    v_id,
    NULL,
    jsonb_build_object('face_id', p_face_id, 'source', 'marketplace')
  );

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_marketplace_enquiry(uuid, text, text, text, text, text, date, date, text)
  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_operational_alerts() TO authenticated;
