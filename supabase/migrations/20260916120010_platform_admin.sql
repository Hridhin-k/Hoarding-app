-- M33 V1.0: platform super admin (HOARDINGS360 staff, not a tenant role).

CREATE TYPE public.platform_staff_role AS ENUM ('SUPER_ADMIN', 'SUPPORT');
CREATE TYPE public.organization_status AS ENUM ('active', 'suspended', 'pending');

ALTER TABLE public.organizations
  ADD COLUMN status public.organization_status NOT NULL DEFAULT 'active';

CREATE INDEX organizations_status_idx ON public.organizations (status);

CREATE TABLE public.platform_staff (
  user_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  role public.platform_staff_role NOT NULL DEFAULT 'SUPER_ADMIN',
  status public.member_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.platform_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  action text NOT NULL,
  tenant_id uuid REFERENCES public.organizations (id) ON DELETE SET NULL,
  entity_type text,
  entity_id uuid,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX platform_audit_logs_created_idx ON public.platform_audit_logs (created_at DESC);
CREATE INDEX platform_audit_logs_tenant_idx ON public.platform_audit_logs (tenant_id, created_at DESC);

CREATE TABLE public.platform_inspect_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  ended_at timestamptz,
  CONSTRAINT platform_inspect_reason_len CHECK (char_length(trim(reason)) >= 8)
);

CREATE INDEX platform_inspect_staff_idx ON public.platform_inspect_sessions (staff_user_id, expires_at DESC);

CREATE TRIGGER platform_staff_set_updated_at
  BEFORE UPDATE ON public.platform_staff
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.platform_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_inspect_sessions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_platform_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_staff s
    WHERE s.user_id = auth.uid()
      AND s.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.platform_staff_role()
RETURNS public.platform_staff_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.role
  FROM public.platform_staff s
  WHERE s.user_id = auth.uid()
    AND s.status = 'active'
  LIMIT 1;
$$;

CREATE POLICY platform_staff_self_select ON public.platform_staff
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND status = 'active');

CREATE POLICY platform_audit_staff_select ON public.platform_audit_logs
  FOR SELECT TO authenticated
  USING (public.is_platform_staff());

CREATE POLICY platform_inspect_self_select ON public.platform_inspect_sessions
  FOR SELECT TO authenticated
  USING (staff_user_id = auth.uid() AND public.is_platform_staff());

CREATE OR REPLACE FUNCTION public.protect_organization_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT public.is_platform_staff() THEN
    RAISE EXCEPTION 'Organization status can only be changed by platform staff.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER organizations_protect_status
  BEFORE UPDATE OF status ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.protect_organization_status();

CREATE OR REPLACE FUNCTION public.write_platform_audit(
  p_action text,
  p_tenant uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_reason text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_staff() THEN
    RAISE EXCEPTION 'Not platform staff' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.platform_audit_logs (
    actor_id, action, tenant_id, entity_type, entity_id, reason, metadata
  ) VALUES (
    auth.uid(), p_action, p_tenant, p_entity_type, p_entity_id, p_reason, coalesce(p_metadata, '{}'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.platform_overview()
RETURNS TABLE (
  tenant_count bigint,
  active_tenant_count bigint,
  suspended_tenant_count bigint,
  board_count bigint,
  face_count bigint,
  published_listing_count bigint,
  enquiry_count_7d bigint,
  open_field_job_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_staff() THEN
    RAISE EXCEPTION 'Not platform staff' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT count(*) FROM public.organizations),
    (SELECT count(*) FROM public.organizations WHERE status = 'active'),
    (SELECT count(*) FROM public.organizations WHERE status = 'suspended'),
    (SELECT count(*) FROM public.boards),
    (SELECT count(*) FROM public.board_faces WHERE archived_at IS NULL),
    (SELECT count(*) FROM public.marketplace_listings),
    (SELECT count(*) FROM public.enquiries WHERE created_at > now() - interval '7 days'),
    (SELECT count(*) FROM public.field_jobs WHERE status IN ('assigned', 'in_progress'));
END;
$$;

CREATE OR REPLACE FUNCTION public.platform_list_tenants()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  city text,
  state text,
  status public.organization_status,
  created_at timestamptz,
  member_count bigint,
  board_count bigint,
  published_face_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_staff() THEN
    RAISE EXCEPTION 'Not platform staff' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    o.id,
    o.name,
    o.slug,
    o.city,
    o.state,
    o.status,
    o.created_at,
    (SELECT count(*) FROM public.organization_members m WHERE m.organization_id = o.id AND m.status = 'active'),
    (SELECT count(*) FROM public.boards b WHERE b.tenant_id = o.id),
    (
      SELECT count(*)
      FROM public.board_faces f
      JOIN public.boards b ON b.id = f.board_id
      WHERE b.tenant_id = o.id
        AND public.face_is_marketplace_eligible(f.id)
    )
  FROM public.organizations o
  ORDER BY o.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.platform_start_inspect(p_tenant uuid, p_reason text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT public.is_platform_staff() THEN
    RAISE EXCEPTION 'Not platform staff' USING ERRCODE = '42501';
  END IF;
  IF p_reason IS NULL OR char_length(trim(p_reason)) < 8 THEN
    RAISE EXCEPTION 'A support reason of at least 8 characters is required.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = p_tenant) THEN
    RAISE EXCEPTION 'Tenant not found.';
  END IF;

  INSERT INTO public.platform_inspect_sessions (staff_user_id, tenant_id, reason)
  VALUES (auth.uid(), p_tenant, trim(p_reason))
  RETURNING id INTO v_id;

  PERFORM public.write_platform_audit(
    'TENANT_IMPERSONATION_STARTED',
    p_tenant,
    'organization',
    p_tenant,
    trim(p_reason),
    jsonb_build_object('session_id', v_id)
  );

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.platform_tenant_detail(p_session uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.platform_inspect_sessions%ROWTYPE;
  v_org public.organizations%ROWTYPE;
BEGIN
  IF NOT public.is_platform_staff() THEN
    RAISE EXCEPTION 'Not platform staff' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_session
  FROM public.platform_inspect_sessions
  WHERE id = p_session
    AND staff_user_id = auth.uid()
    AND ended_at IS NULL
    AND expires_at > now();

  IF v_session.id IS NULL THEN
    RAISE EXCEPTION 'Inspect session expired or invalid. Start a new inspect with a reason.';
  END IF;

  SELECT * INTO v_org FROM public.organizations WHERE id = v_session.tenant_id;

  RETURN jsonb_build_object(
    'organization', jsonb_build_object(
      'id', v_org.id,
      'name', v_org.name,
      'slug', v_org.slug,
      'email', v_org.email,
      'phone', v_org.phone,
      'city', v_org.city,
      'state', v_org.state,
      'status', v_org.status,
      'created_at', v_org.created_at
    ),
    'session', jsonb_build_object(
      'id', v_session.id,
      'reason', v_session.reason,
      'expires_at', v_session.expires_at
    ),
    'members', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'user_id', m.user_id,
        'role', m.role,
        'status', m.status,
        'full_name', p.full_name,
        'email', u.email
      ) ORDER BY m.created_at), '[]'::jsonb)
      FROM public.organization_members m
      JOIN public.profiles p ON p.id = m.user_id
      JOIN auth.users u ON u.id = m.user_id
      WHERE m.organization_id = v_org.id
    ),
    'boards', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', b.id,
        'board_code', b.board_code,
        'name', b.name,
        'city', b.city,
        'lifecycle_status', b.lifecycle_status
      ) ORDER BY b.board_code), '[]'::jsonb)
      FROM public.boards b
      WHERE b.tenant_id = v_org.id
    ),
    'recent_enquiries', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', e.id,
        'name', e.name,
        'status', e.status,
        'source', e.source,
        'created_at', e.created_at
      ) ORDER BY e.created_at DESC), '[]'::jsonb)
      FROM (
        SELECT e.id, e.name, e.status, e.source, e.created_at
        FROM public.enquiries e
        WHERE e.tenant_id = v_org.id
        ORDER BY e.created_at DESC
        LIMIT 10
      ) e
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.platform_set_tenant_status(
  p_tenant uuid,
  p_status public.organization_status,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.platform_staff_role;
  v_old public.organization_status;
BEGIN
  v_role := public.platform_staff_role();
  IF v_role IS DISTINCT FROM 'SUPER_ADMIN' THEN
    RAISE EXCEPTION 'Only platform super admins can change tenant status.' USING ERRCODE = '42501';
  END IF;
  IF p_reason IS NULL OR char_length(trim(p_reason)) < 8 THEN
    RAISE EXCEPTION 'A reason of at least 8 characters is required.';
  END IF;

  SELECT status INTO v_old FROM public.organizations WHERE id = p_tenant;
  IF v_old IS NULL THEN
    RAISE EXCEPTION 'Tenant not found.';
  END IF;

  UPDATE public.organizations SET status = p_status WHERE id = p_tenant;

  PERFORM public.write_platform_audit(
    CASE WHEN p_status = 'suspended' THEN 'TENANT_SUSPENDED' ELSE 'TENANT_STATUS_CHANGED' END,
    p_tenant,
    'organization',
    p_tenant,
    trim(p_reason),
    jsonb_build_object('from', v_old, 'to', p_status)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.face_is_marketplace_eligible(p_face_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_face public.board_faces%ROWTYPE;
  v_board public.boards%ROWTYPE;
  v_org_status public.organization_status;
  v_compliance public.compliance_status;
  v_occupancy text;
BEGIN
  SELECT * INTO v_face FROM public.board_faces WHERE id = p_face_id;
  IF v_face.id IS NULL OR v_face.archived_at IS NOT NULL THEN
    RETURN false;
  END IF;

  SELECT * INTO v_board FROM public.boards WHERE id = v_face.board_id;
  IF v_board.lifecycle_status <> 'active' THEN
    RETURN false;
  END IF;

  SELECT o.status INTO v_org_status FROM public.organizations o WHERE o.id = v_board.tenant_id;
  IF v_org_status IS DISTINCT FROM 'active' THEN
    RETURN false;
  END IF;

  IF NOT v_face.marketplace_visible OR NOT v_face.publishable THEN
    RETURN false;
  END IF;

  v_compliance := public.board_compliance_dimension(v_board.id);
  IF v_compliance IN ('expired', 'missing') THEN
    RETURN false;
  END IF;

  v_occupancy := public.face_occupancy_dimension(v_face.id, CURRENT_DATE);
  IF v_occupancy = 'blocked' THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_organization(
  p_name text,
  p_slug text,
  p_phone text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_state text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF public.is_platform_staff() THEN
    RAISE EXCEPTION 'Platform staff cannot create a tenant organization.' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.organizations (name, slug, phone, email, city, state)
  VALUES (p_name, lower(p_slug), p_phone, p_email, p_city, p_state)
  RETURNING id INTO v_org_id;

  INSERT INTO public.organization_members (organization_id, user_id, role, status)
  VALUES (v_org_id, auth.uid(), 'OWNER', 'active');

  INSERT INTO public.organization_settings (tenant_id)
  VALUES (v_org_id);

  RETURN v_org_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_organization(text, text, text, text, text, text) TO authenticated;

GRANT SELECT ON public.platform_staff TO authenticated;
GRANT SELECT ON public.platform_audit_logs TO authenticated;
GRANT SELECT ON public.platform_inspect_sessions TO authenticated;
GRANT USAGE ON TYPE public.platform_staff_role TO authenticated;
GRANT USAGE ON TYPE public.organization_status TO authenticated;

GRANT EXECUTE ON FUNCTION public.is_platform_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_staff_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.write_platform_audit(text, uuid, text, uuid, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_list_tenants() TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_start_inspect(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_tenant_detail(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.platform_set_tenant_status(uuid, public.organization_status, text) TO authenticated;

REVOKE ALL ON public.platform_staff FROM anon;
REVOKE ALL ON public.platform_audit_logs FROM anon;
REVOKE ALL ON public.platform_inspect_sessions FROM anon;
REVOKE ALL ON FUNCTION public.is_platform_staff() FROM anon, public;
REVOKE ALL ON FUNCTION public.platform_staff_role() FROM anon, public;
REVOKE ALL ON FUNCTION public.write_platform_audit(text, uuid, text, uuid, text, jsonb) FROM anon, public;
REVOKE ALL ON FUNCTION public.platform_overview() FROM anon, public;
REVOKE ALL ON FUNCTION public.platform_list_tenants() FROM anon, public;
REVOKE ALL ON FUNCTION public.platform_start_inspect(uuid, text) FROM anon, public;
REVOKE ALL ON FUNCTION public.platform_tenant_detail(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.platform_set_tenant_status(uuid, public.organization_status, text) FROM anon, public;

DO $$
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    '30000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'platform@hoardings360.com',
    extensions.crypt('Password123!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', 'H360 Platform'),
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    '30000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    jsonb_build_object('sub', '30000000-0000-4000-8000-000000000001', 'email', 'platform@hoardings360.com'),
    'email',
    '30000000-0000-4000-8000-000000000001',
    now(),
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, full_name)
  VALUES ('30000000-0000-4000-8000-000000000001', 'H360 Platform')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.platform_staff (user_id, role, status)
  VALUES ('30000000-0000-4000-8000-000000000001', 'SUPER_ADMIN', 'active')
  ON CONFLICT (user_id) DO NOTHING;
END
$$;
