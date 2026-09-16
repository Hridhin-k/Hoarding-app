-- Field technicians can identify boards by QR within their tenant without boards.view.

CREATE OR REPLACE FUNCTION public.lookup_tenant_board_qr(p_qr_slug text)
RETURNS TABLE (
  id uuid,
  name text,
  board_code text,
  locality text,
  city text,
  qr_slug text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant uuid;
BEGIN
  IF p_qr_slug IS NULL OR length(trim(p_qr_slug)) < 4 THEN
    RETURN;
  END IF;

  SELECT om.organization_id INTO v_tenant
  FROM public.organization_members om
  WHERE om.user_id = auth.uid()
    AND om.status = 'active'
    AND (
      public.has_permission(om.organization_id, 'field.view')
      OR public.has_permission(om.organization_id, 'boards.view')
    )
  ORDER BY om.created_at
  LIMIT 1;

  IF v_tenant IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT b.id, b.name, b.board_code, b.locality, b.city, b.qr_slug
  FROM public.boards b
  WHERE b.tenant_id = v_tenant
    AND b.qr_slug = trim(p_qr_slug)
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_tenant_board_qr(text) TO authenticated;
