-- Strip compliance_dimension / marketplace_visible from the public listings view.
-- Eligibility still enforces compliance server-side; status is not public.

DROP VIEW IF EXISTS public.marketplace_listings;

CREATE VIEW public.marketplace_listings
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
  public.face_occupancy_dimension(f.id, CURRENT_DATE) AS occupancy_dimension,
  public.face_available_from(f.id) AS available_from
FROM public.board_faces f
JOIN public.boards b ON b.id = f.board_id
WHERE public.face_is_marketplace_eligible(f.id);

GRANT SELECT ON public.marketplace_listings TO anon, authenticated;
