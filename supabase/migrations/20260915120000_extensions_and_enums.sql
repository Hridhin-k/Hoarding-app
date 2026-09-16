-- HOARDINGS360 MVP — extensions, enums, and permission catalog

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE public.app_role AS ENUM (
  'OWNER',
  'ADMIN',
  'OPS_MANAGER',
  'SALES',
  'COMPLIANCE',
  'TECHNICIAN'
);

CREATE TYPE public.member_status AS ENUM ('invited', 'active', 'suspended');

CREATE TYPE public.board_lifecycle AS ENUM (
  'draft',
  'active',
  'maintenance',
  'blocked',
  'retired'
);

CREATE TYPE public.verification_status AS ENUM (
  'unverified',
  'pending',
  'verified',
  'rejected'
);

CREATE TYPE public.structure_type AS ENUM (
  'hoarding',
  'unipole',
  'billboard',
  'gantry',
  'wall_wrap',
  'transit',
  'digital_led',
  'pole_kiosk',
  'other'
);

CREATE TYPE public.ownership_type AS ENUM (
  'owned',
  'leased',
  'managed',
  'joint'
);

CREATE TYPE public.illumination_type AS ENUM (
  'none',
  'front_lit',
  'back_lit',
  'led',
  'digital'
);

CREATE TYPE public.dimension_unit AS ENUM ('ft', 'm');

CREATE TYPE public.compliance_status AS ENUM (
  'valid',
  'expiring',
  'expired',
  'missing'
);

CREATE TYPE public.occupancy_state AS ENUM (
  'occupied',
  'on_hold',
  'booked_future',
  'blocked'
);

CREATE TYPE public.occupancy_source AS ENUM (
  'manual',
  'campaign',
  'enquiry'
);

CREATE TYPE public.customer_type AS ENUM (
  'advertiser',
  'agency',
  'other'
);

CREATE TYPE public.enquiry_status AS ENUM (
  'new',
  'contacted',
  'qualified',
  'proposal',
  'won',
  'lost',
  'closed'
);

CREATE TYPE public.enquiry_source AS ENUM (
  'marketplace',
  'direct',
  'referral',
  'other'
);

CREATE TYPE public.campaign_status AS ENUM (
  'draft',
  'active',
  'completed',
  'cancelled'
);

CREATE TYPE public.field_job_status AS ENUM (
  'pending',
  'assigned',
  'in_progress',
  'completed',
  'cancelled'
);

CREATE TYPE public.field_job_type AS ENUM (
  'installation',
  'removal',
  'inspection',
  'maintenance',
  'proof_capture'
);

CREATE TYPE public.field_job_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

CREATE TYPE public.agreement_status AS ENUM (
  'draft',
  'active',
  'expired',
  'terminated'
);

CREATE TABLE public.role_permissions (
  role public.app_role NOT NULL,
  permission text NOT NULL,
  PRIMARY KEY (role, permission)
);

INSERT INTO public.role_permissions (role, permission) VALUES
  -- OWNER
  ('OWNER', 'boards.view'),
  ('OWNER', 'boards.create'),
  ('OWNER', 'boards.update'),
  ('OWNER', 'boards.delete'),
  ('OWNER', 'faces.view'),
  ('OWNER', 'faces.create'),
  ('OWNER', 'faces.update'),
  ('OWNER', 'faces.delete'),
  ('OWNER', 'compliance.view'),
  ('OWNER', 'compliance.manage'),
  ('OWNER', 'occupancy.view'),
  ('OWNER', 'occupancy.manage'),
  ('OWNER', 'enquiries.view'),
  ('OWNER', 'enquiries.manage'),
  ('OWNER', 'field.view'),
  ('OWNER', 'field.manage'),
  ('OWNER', 'documents.view'),
  ('OWNER', 'documents.manage'),
  ('OWNER', 'team.manage'),
  ('OWNER', 'settings.manage'),
  ('OWNER', 'audit.view'),
  ('OWNER', 'marketplace.publish'),
  ('OWNER', 'customers.view'),
  ('OWNER', 'customers.manage'),
  ('OWNER', 'campaigns.view'),
  ('OWNER', 'campaigns.manage'),
  -- ADMIN (same operational surface as owner)
  ('ADMIN', 'boards.view'),
  ('ADMIN', 'boards.create'),
  ('ADMIN', 'boards.update'),
  ('ADMIN', 'boards.delete'),
  ('ADMIN', 'faces.view'),
  ('ADMIN', 'faces.create'),
  ('ADMIN', 'faces.update'),
  ('ADMIN', 'faces.delete'),
  ('ADMIN', 'compliance.view'),
  ('ADMIN', 'compliance.manage'),
  ('ADMIN', 'occupancy.view'),
  ('ADMIN', 'occupancy.manage'),
  ('ADMIN', 'enquiries.view'),
  ('ADMIN', 'enquiries.manage'),
  ('ADMIN', 'field.view'),
  ('ADMIN', 'field.manage'),
  ('ADMIN', 'documents.view'),
  ('ADMIN', 'documents.manage'),
  ('ADMIN', 'team.manage'),
  ('ADMIN', 'settings.manage'),
  ('ADMIN', 'audit.view'),
  ('ADMIN', 'marketplace.publish'),
  ('ADMIN', 'customers.view'),
  ('ADMIN', 'customers.manage'),
  ('ADMIN', 'campaigns.view'),
  ('ADMIN', 'campaigns.manage'),
  -- OPS_MANAGER
  ('OPS_MANAGER', 'boards.view'),
  ('OPS_MANAGER', 'boards.create'),
  ('OPS_MANAGER', 'boards.update'),
  ('OPS_MANAGER', 'faces.view'),
  ('OPS_MANAGER', 'faces.create'),
  ('OPS_MANAGER', 'faces.update'),
  ('OPS_MANAGER', 'compliance.view'),
  ('OPS_MANAGER', 'occupancy.view'),
  ('OPS_MANAGER', 'occupancy.manage'),
  ('OPS_MANAGER', 'enquiries.view'),
  ('OPS_MANAGER', 'field.view'),
  ('OPS_MANAGER', 'field.manage'),
  ('OPS_MANAGER', 'documents.view'),
  ('OPS_MANAGER', 'documents.manage'),
  ('OPS_MANAGER', 'customers.view'),
  ('OPS_MANAGER', 'campaigns.view'),
  -- SALES
  ('SALES', 'boards.view'),
  ('SALES', 'faces.view'),
  ('SALES', 'faces.update'),
  ('SALES', 'occupancy.view'),
  ('SALES', 'occupancy.manage'),
  ('SALES', 'enquiries.view'),
  ('SALES', 'enquiries.manage'),
  ('SALES', 'documents.view'),
  ('SALES', 'marketplace.publish'),
  ('SALES', 'customers.view'),
  ('SALES', 'customers.manage'),
  ('SALES', 'campaigns.view'),
  ('SALES', 'campaigns.manage'),
  -- COMPLIANCE
  ('COMPLIANCE', 'boards.view'),
  ('COMPLIANCE', 'faces.view'),
  ('COMPLIANCE', 'compliance.view'),
  ('COMPLIANCE', 'compliance.manage'),
  ('COMPLIANCE', 'documents.view'),
  ('COMPLIANCE', 'documents.manage'),
  -- TECHNICIAN — field only, no financial/admin
  ('TECHNICIAN', 'field.view');

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY role_permissions_read
  ON public.role_permissions
  FOR SELECT
  TO authenticated
  USING (true);
