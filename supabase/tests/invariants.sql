-- Run against hosted or local Postgres after migrations.
-- These statements encode the tenant-isolation and RBAC contract.

-- Technician must not have financial/admin permissions.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.role_permissions
    WHERE role = 'TECHNICIAN'
      AND permission IN ('occupancy.manage', 'team.manage', 'marketplace.publish', 'audit.view', 'settings.manage')
  ) THEN
    RAISE EXCEPTION 'Technician must not receive financial/admin permissions';
  END IF;

  IF (
    SELECT count(*) FROM public.role_permissions WHERE role = 'TECHNICIAN'
  ) <> 1 THEN
    RAISE EXCEPTION 'Technician must have exactly field.view';
  END IF;
END;
$$;

-- Sales must sell, not administer the tenant.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.role_permissions
    WHERE role = 'SALES'
      AND permission IN ('team.manage', 'settings.manage', 'boards.delete', 'field.manage')
  ) THEN
    RAISE EXCEPTION 'Sales must not receive admin/ops permissions';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.role_permissions
    WHERE role = 'SALES' AND permission = 'occupancy.manage'
  ) THEN
    RAISE EXCEPTION 'Sales must manage occupancy';
  END IF;
END;
$$;

-- Admin matches owner on the permission catalog.
DO $$
BEGIN
  IF EXISTS (
    SELECT permission FROM public.role_permissions WHERE role = 'OWNER'
    EXCEPT
    SELECT permission FROM public.role_permissions WHERE role = 'ADMIN'
  ) OR EXISTS (
    SELECT permission FROM public.role_permissions WHERE role = 'ADMIN'
    EXCEPT
    SELECT permission FROM public.role_permissions WHERE role = 'OWNER'
  ) THEN
    RAISE EXCEPTION 'ADMIN and OWNER permission sets must match';
  END IF;
END;
$$;

-- Identity tables must exist with RLS.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'organizations' AND c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'organizations must exist with RLS';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'profiles' AND c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'profiles must exist with RLS';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'organization_members' AND c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'organization_members must exist with RLS';
  END IF;
END;
$$;

-- Exclusion constraint must exist for occupancy overlap prevention.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'occupancy_periods_no_overlap'
  ) THEN
    RAISE EXCEPTION 'occupancy_periods_no_overlap constraint missing';
  END IF;
END;
$$;

-- Inventory tables must exist with RLS and PostGIS location.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'boards' AND column_name = 'location'
  ) THEN
    RAISE EXCEPTION 'boards.location is required for PostGIS inventory';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'board_faces' AND column_name = 'archived_at'
  ) THEN
    RAISE EXCEPTION 'board_faces.archived_at is required for soft archive';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'boards' AND c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'boards must have RLS enabled';
  END IF;
END;
$$;

-- Campaign faces and dashboard RPC for Manage Phase 5.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'campaign_faces' AND c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'campaign_faces must exist with RLS';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'dashboard_upcoming_vacancies'
  ) THEN
    RAISE EXCEPTION 'dashboard_upcoming_vacancies RPC missing';
  END IF;
END;
$$;

-- Marketplace public view must not expose compliance or floor_rate.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'marketplace_listings'
      AND column_name IN ('compliance_dimension', 'floor_rate', 'tenant_id')
  ) THEN
    RAISE EXCEPTION 'marketplace_listings must not expose compliance_dimension, floor_rate, or tenant_id';
  END IF;
END;
$$;

-- Hardened RPCs: expire_holds / refresh_operational_alerts must not be callable by authenticated.
DO $$
BEGIN
  IF has_function_privilege('authenticated', 'public.expire_holds(date)', 'EXECUTE') THEN
    RAISE EXCEPTION 'expire_holds must not be executable by authenticated';
  END IF;
  IF has_function_privilege('authenticated', 'public.refresh_operational_alerts()', 'EXECUTE') THEN
    RAISE EXCEPTION 'refresh_operational_alerts must not be executable by authenticated';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'refresh_tenant_operational_alerts'
  ) THEN
    RAISE EXCEPTION 'refresh_tenant_operational_alerts RPC missing';
  END IF;
END;
$$;
