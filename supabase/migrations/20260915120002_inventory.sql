-- Boards, faces, images, QR — the physical asset and sellable inventory

CREATE TABLE public.boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  board_code text NOT NULL,
  name text NOT NULL,
  description text,
  structure_type public.structure_type NOT NULL DEFAULT 'hoarding',
  location geography(Point, 4326),
  address text,
  locality text,
  city text,
  district text,
  state text,
  pincode text,
  landmark text,
  ownership_type public.ownership_type NOT NULL DEFAULT 'owned',
  lifecycle_status public.board_lifecycle NOT NULL DEFAULT 'draft',
  verification_status public.verification_status NOT NULL DEFAULT 'unverified',
  verified_at timestamptz,
  verified_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  qr_slug text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(10), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, board_code),
  CONSTRAINT boards_active_require_location CHECK (
    lifecycle_status <> 'active' OR location IS NOT NULL
  )
);

CREATE TABLE public.board_faces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  board_id uuid NOT NULL REFERENCES public.boards (id) ON DELETE CASCADE,
  face_label text NOT NULL,
  direction text,
  width numeric(10, 2) NOT NULL,
  height numeric(10, 2) NOT NULL,
  unit public.dimension_unit NOT NULL DEFAULT 'ft',
  area_sqft numeric(12, 2) GENERATED ALWAYS AS (
    CASE
      WHEN unit = 'm' THEN round((width * height * 10.7639)::numeric, 2)
      ELSE round((width * height)::numeric, 2)
    END
  ) STORED,
  illumination public.illumination_type NOT NULL DEFAULT 'none',
  visibility_notes text,
  card_rate numeric(12, 2),
  floor_rate numeric(12, 2),
  publishable boolean NOT NULL DEFAULT false,
  marketplace_visible boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (board_id, face_label),
  CONSTRAINT board_faces_positive_size CHECK (width > 0 AND height > 0),
  CONSTRAINT board_faces_rates_nonneg CHECK (
    (card_rate IS NULL OR card_rate >= 0)
    AND (floor_rate IS NULL OR floor_rate >= 0)
  )
);

CREATE TABLE public.board_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  board_id uuid NOT NULL REFERENCES public.boards (id) ON DELETE CASCADE,
  face_id uuid REFERENCES public.board_faces (id) ON DELETE SET NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  file_size integer NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  marketplace_visible boolean NOT NULL DEFAULT false,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  uploaded_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT board_images_size_limit CHECK (file_size > 0 AND file_size <= 15728640),
  CONSTRAINT board_images_mime CHECK (
    mime_type IN ('image/jpeg', 'image/png', 'image/webp')
  )
);

CREATE INDEX boards_tenant_idx ON public.boards (tenant_id);
CREATE INDEX boards_code_idx ON public.boards (tenant_id, board_code);
CREATE INDEX boards_city_idx ON public.boards (tenant_id, city);
CREATE INDEX boards_state_idx ON public.boards (tenant_id, state);
CREATE INDEX boards_lifecycle_idx ON public.boards (tenant_id, lifecycle_status);
CREATE INDEX boards_location_gix ON public.boards USING gist (location);
CREATE INDEX board_faces_tenant_idx ON public.board_faces (tenant_id);
CREATE INDEX board_faces_board_idx ON public.board_faces (board_id);
CREATE INDEX board_faces_marketplace_idx ON public.board_faces (marketplace_visible, publishable)
  WHERE marketplace_visible = true;
CREATE INDEX board_images_board_idx ON public.board_images (board_id);
CREATE INDEX board_images_tenant_idx ON public.board_images (tenant_id);

CREATE TRIGGER boards_set_updated_at
  BEFORE UPDATE ON public.boards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER board_faces_set_updated_at
  BEFORE UPDATE ON public.board_faces
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.ensure_board_face_tenant()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT tenant_id INTO NEW.tenant_id FROM public.boards WHERE id = NEW.board_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER board_faces_tenant_sync
  BEFORE INSERT OR UPDATE OF board_id ON public.board_faces
  FOR EACH ROW EXECUTE FUNCTION public.ensure_board_face_tenant();

CREATE OR REPLACE FUNCTION public.ensure_board_image_tenant()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT tenant_id INTO NEW.tenant_id FROM public.boards WHERE id = NEW.board_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER board_images_tenant_sync
  BEFORE INSERT OR UPDATE OF board_id ON public.board_images
  FOR EACH ROW EXECUTE FUNCTION public.ensure_board_image_tenant();
