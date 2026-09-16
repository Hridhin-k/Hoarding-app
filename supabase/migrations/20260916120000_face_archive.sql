-- Phase 2 inventory: soft-archive faces; search indexes; exclude archived from marketplace

ALTER TABLE public.board_faces
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE INDEX IF NOT EXISTS board_faces_active_board_idx
  ON public.board_faces (board_id)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS boards_locality_idx
  ON public.boards (tenant_id, locality);

CREATE INDEX IF NOT EXISTS boards_structure_idx
  ON public.boards (tenant_id, structure_type);

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
  IF v_face.id IS NULL OR v_face.archived_at IS NOT NULL THEN
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
