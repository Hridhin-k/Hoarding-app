-- Occupancy dimension, vacancy loop, marketplace eligibility

CREATE OR REPLACE FUNCTION public.face_occupancy_dimension(
  p_face_id uuid,
  p_as_of date DEFAULT CURRENT_DATE
)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant uuid;
  v_window integer := 30;
  v_current occupancy_periods%ROWTYPE;
  v_future occupancy_periods%ROWTYPE;
BEGIN
  SELECT tenant_id INTO v_tenant FROM public.board_faces WHERE id = p_face_id;
  IF v_tenant IS NULL THEN
    RETURN 'vacant';
  END IF;

  SELECT vacancy_prelisting_days INTO v_window
  FROM public.organization_settings
  WHERE tenant_id = v_tenant;

  SELECT * INTO v_current
  FROM public.occupancy_periods
  WHERE face_id = p_face_id
    AND p_as_of BETWEEN start_date AND end_date
    AND state IN ('occupied', 'on_hold', 'booked_future', 'blocked')
  ORDER BY
    CASE state
      WHEN 'blocked' THEN 1
      WHEN 'occupied' THEN 2
      WHEN 'on_hold' THEN 3
      WHEN 'booked_future' THEN 4
    END
  LIMIT 1;

  IF v_current.id IS NOT NULL THEN
    IF v_current.state = 'blocked' THEN
      RETURN 'blocked';
    END IF;
    IF v_current.state = 'on_hold' THEN
      RETURN 'on_hold';
    END IF;
    IF v_current.state IN ('occupied', 'booked_future') THEN
      IF v_current.end_date <= (p_as_of + COALESCE(v_window, 30)) THEN
        SELECT * INTO v_future
        FROM public.occupancy_periods
        WHERE face_id = p_face_id
          AND id <> v_current.id
          AND state IN ('occupied', 'booked_future')
          AND start_date <= (v_current.end_date + 1)
          AND end_date > v_current.end_date
        LIMIT 1;

        IF v_future.id IS NULL THEN
          RETURN 'becoming_vacant';
        END IF;
      END IF;
      RETURN 'occupied';
    END IF;
  END IF;

  SELECT * INTO v_future
  FROM public.occupancy_periods
  WHERE face_id = p_face_id
    AND start_date > p_as_of
    AND state IN ('occupied', 'booked_future')
  ORDER BY start_date
  LIMIT 1;

  IF v_future.id IS NOT NULL THEN
    RETURN 'booked_future';
  END IF;

  RETURN 'vacant';
END;
$$;

CREATE OR REPLACE FUNCTION public.board_compliance_dimension(p_board_id uuid)
RETURNS public.compliance_status
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_mandatory boolean := false;
  v_has_expired boolean := false;
  v_has_missing boolean := false;
  v_has_expiring boolean := false;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE is_mandatory) > 0,
    COUNT(*) FILTER (WHERE is_mandatory AND status = 'expired') > 0,
    COUNT(*) FILTER (WHERE is_mandatory AND status = 'missing') > 0,
    COUNT(*) FILTER (WHERE is_mandatory AND status = 'expiring') > 0
  INTO v_has_mandatory, v_has_expired, v_has_missing, v_has_expiring
  FROM public.compliance_records
  WHERE board_id = p_board_id;

  IF NOT v_has_mandatory THEN
    RETURN 'missing';
  END IF;
  IF v_has_expired THEN
    RETURN 'expired';
  END IF;
  IF v_has_missing THEN
    RETURN 'missing';
  END IF;
  IF v_has_expiring THEN
    RETURN 'expiring';
  END IF;
  RETURN 'valid';
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
  v_compliance public.compliance_status;
  v_occupancy text;
BEGIN
  SELECT * INTO v_face FROM public.board_faces WHERE id = p_face_id;
  IF v_face.id IS NULL THEN
    RETURN false;
  END IF;

  SELECT * INTO v_board FROM public.boards WHERE id = v_face.board_id;
  IF v_board.lifecycle_status <> 'active' THEN
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

CREATE OR REPLACE FUNCTION public.face_available_from(p_face_id uuid)
RETURNS date
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_end date;
BEGIN
  SELECT MAX(end_date) INTO v_end
  FROM public.occupancy_periods
  WHERE face_id = p_face_id
    AND state IN ('occupied', 'booked_future')
    AND end_date >= CURRENT_DATE;

  IF v_end IS NULL THEN
    RETURN CURRENT_DATE;
  END IF;
  RETURN v_end + 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.face_occupancy_dimension(uuid, date) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.board_compliance_dimension(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.face_is_marketplace_eligible(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.face_available_from(uuid) TO authenticated, anon;

CREATE OR REPLACE VIEW public.marketplace_listings
WITH (security_invoker = false, security_barrier = true)
AS
SELECT
  f.id AS face_id,
  b.id AS board_id,
  b.name AS board_name,
  b.board_code,
  b.structure_type,
  b.locality,
  b.city,
  b.district,
  b.state,
  b.pincode,
  b.landmark,
  ST_Y(b.location::geometry) AS latitude,
  ST_X(b.location::geometry) AS longitude,
  f.face_label,
  f.direction,
  f.width,
  f.height,
  f.unit,
  f.area_sqft,
  f.illumination,
  f.visibility_notes,
  f.card_rate,
  f.marketplace_visible,
  public.face_occupancy_dimension(f.id, CURRENT_DATE) AS occupancy_dimension,
  public.face_available_from(f.id) AS available_from,
  public.board_compliance_dimension(b.id) AS compliance_dimension
FROM public.board_faces f
JOIN public.boards b ON b.id = f.board_id
WHERE public.face_is_marketplace_eligible(f.id);

GRANT SELECT ON public.marketplace_listings TO anon, authenticated;

CREATE OR REPLACE VIEW public.marketplace_photos
WITH (security_invoker = false, security_barrier = true)
AS
SELECT
  i.id,
  i.board_id,
  i.face_id,
  i.storage_path,
  i.caption,
  i.is_primary,
  i.sort_order
FROM public.board_images i
JOIN public.boards b ON b.id = i.board_id
WHERE i.marketplace_visible = true
  AND b.lifecycle_status = 'active'
  AND EXISTS (
    SELECT 1
    FROM public.board_faces f
    WHERE f.board_id = b.id
      AND public.face_is_marketplace_eligible(f.id)
  );

GRANT SELECT ON public.marketplace_photos TO anon, authenticated;
