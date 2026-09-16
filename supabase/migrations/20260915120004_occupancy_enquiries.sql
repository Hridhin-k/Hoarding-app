-- Occupancy (with exclusion constraint), customers, campaigns, enquiries

CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name text NOT NULL,
  company_name text,
  email text,
  phone text,
  type public.customer_type NOT NULL DEFAULT 'advertiser',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers (id) ON DELETE SET NULL,
  name text NOT NULL,
  start_date date,
  end_date date,
  status public.campaign_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campaigns_date_order CHECK (
    start_date IS NULL OR end_date IS NULL OR end_date >= start_date
  )
);

CREATE TABLE public.occupancy_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  face_id uuid NOT NULL REFERENCES public.board_faces (id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  state public.occupancy_state NOT NULL,
  source public.occupancy_source NOT NULL DEFAULT 'manual',
  customer_id uuid REFERENCES public.customers (id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.campaigns (id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT occupancy_date_order CHECK (end_date >= start_date),
  CONSTRAINT occupancy_periods_no_overlap EXCLUDE USING gist (
    face_id WITH =,
    daterange(start_date, end_date, '[]') WITH &&
  ) WHERE (state IN ('occupied', 'on_hold', 'booked_future', 'blocked'))
);

CREATE TABLE public.enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  face_id uuid NOT NULL REFERENCES public.board_faces (id) ON DELETE RESTRICT,
  customer_id uuid REFERENCES public.customers (id) ON DELETE SET NULL,
  source public.enquiry_source NOT NULL DEFAULT 'direct',
  name text NOT NULL,
  company_name text,
  email text NOT NULL,
  phone text NOT NULL,
  message text,
  requested_start_date date,
  requested_end_date date,
  status public.enquiry_status NOT NULL DEFAULT 'new',
  assigned_to uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT enquiries_date_order CHECK (
    requested_start_date IS NULL
    OR requested_end_date IS NULL
    OR requested_end_date >= requested_start_date
  )
);

CREATE TABLE public.enquiry_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX customers_tenant_idx ON public.customers (tenant_id);
CREATE INDEX campaigns_tenant_idx ON public.campaigns (tenant_id);
CREATE INDEX occupancy_tenant_idx ON public.occupancy_periods (tenant_id);
CREATE INDEX occupancy_face_idx ON public.occupancy_periods (face_id);
CREATE INDEX occupancy_dates_idx ON public.occupancy_periods (face_id, start_date, end_date);
CREATE INDEX occupancy_state_idx ON public.occupancy_periods (tenant_id, state);
CREATE INDEX enquiries_tenant_idx ON public.enquiries (tenant_id);
CREATE INDEX enquiries_face_idx ON public.enquiries (face_id);
CREATE INDEX enquiries_status_idx ON public.enquiries (tenant_id, status);
CREATE INDEX enquiries_assigned_idx ON public.enquiries (assigned_to);
CREATE INDEX enquiry_rate_limits_ip_idx ON public.enquiry_rate_limits (ip_hash, created_at);

CREATE TRIGGER customers_set_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER campaigns_set_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER occupancy_periods_set_updated_at
  BEFORE UPDATE ON public.occupancy_periods
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER enquiries_set_updated_at
  BEFORE UPDATE ON public.enquiries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.agreements
  ADD CONSTRAINT agreements_customer_fk
  FOREIGN KEY (customer_id) REFERENCES public.customers (id) ON DELETE SET NULL;
