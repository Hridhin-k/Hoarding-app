ALTER TABLE public.boards
  ADD COLUMN latitude double precision GENERATED ALWAYS AS (
    CASE WHEN location IS NULL THEN NULL ELSE ST_Y(location::geometry) END
  ) STORED,
  ADD COLUMN longitude double precision GENERATED ALWAYS AS (
    CASE WHEN location IS NULL THEN NULL ELSE ST_X(location::geometry) END
  ) STORED;

CREATE OR REPLACE FUNCTION public.set_board_location(
  p_board_id uuid,
  p_lng double precision,
  p_lat double precision
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant uuid;
BEGIN
  SELECT tenant_id INTO v_tenant FROM public.boards WHERE id = p_board_id;
  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'Board not found';
  END IF;
  IF NOT public.has_permission(v_tenant, 'boards.update')
     AND NOT public.has_permission(v_tenant, 'boards.create') THEN
    RAISE EXCEPTION 'You do not have permission to do that.';
  END IF;

  UPDATE public.boards
  SET location = ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
  WHERE id = p_board_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_board_location(uuid, double precision, double precision)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.expire_holds(p_as_of date DEFAULT CURRENT_DATE)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  WITH expired AS (
    DELETE FROM public.occupancy_periods
    WHERE state = 'on_hold'
      AND end_date < p_as_of
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_count FROM expired;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_holds(date) TO authenticated;
