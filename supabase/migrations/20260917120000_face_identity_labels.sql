-- Enquiry and vacancy alerts must name the board, not only the face label.

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
  v_board_name text;
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
  SELECT b.name INTO v_board_name FROM public.boards b WHERE b.id = v_face.board_id;

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
    format('%s enquired about %s · %s.', trim(p_name), coalesce(v_board_name, 'a board'), v_face.face_label),
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
