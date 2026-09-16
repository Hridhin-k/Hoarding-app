-- Row Level Security — tenant isolation is release-blocking

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_faces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupancy_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiry_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proof_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- organizations
CREATE POLICY organizations_select ON public.organizations
  FOR SELECT TO authenticated
  USING (public.is_org_member(id));

CREATE POLICY organizations_update ON public.organizations
  FOR UPDATE TO authenticated
  USING (public.has_permission(id, 'settings.manage'))
  WITH CHECK (public.has_permission(id, 'settings.manage'));

-- profiles
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.organization_members mine
      JOIN public.organization_members theirs
        ON theirs.organization_id = mine.organization_id
      WHERE mine.user_id = auth.uid()
        AND mine.status = 'active'
        AND theirs.user_id = profiles.id
        AND theirs.status IN ('active', 'invited', 'suspended')
    )
  );

CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- memberships
CREATE POLICY members_select ON public.organization_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_org_member(organization_id));

CREATE POLICY members_insert ON public.organization_members
  FOR INSERT TO authenticated
  WITH CHECK (public.has_permission(organization_id, 'team.manage'));

CREATE POLICY members_update ON public.organization_members
  FOR UPDATE TO authenticated
  USING (public.has_permission(organization_id, 'team.manage'))
  WITH CHECK (public.has_permission(organization_id, 'team.manage'));

CREATE POLICY members_delete ON public.organization_members
  FOR DELETE TO authenticated
  USING (
    public.has_permission(organization_id, 'team.manage')
    AND user_id <> auth.uid()
  );

-- settings
CREATE POLICY settings_select ON public.organization_settings
  FOR SELECT TO authenticated
  USING (public.is_org_member(tenant_id));

CREATE POLICY settings_update ON public.organization_settings
  FOR UPDATE TO authenticated
  USING (public.has_permission(tenant_id, 'settings.manage'))
  WITH CHECK (public.has_permission(tenant_id, 'settings.manage'));

-- invites
CREATE POLICY invites_select ON public.organization_invites
  FOR SELECT TO authenticated
  USING (public.has_permission(tenant_id, 'team.manage') OR email = lower(auth.jwt() ->> 'email'));

CREATE POLICY invites_insert ON public.organization_invites
  FOR INSERT TO authenticated
  WITH CHECK (public.has_permission(tenant_id, 'team.manage'));

CREATE POLICY invites_update ON public.organization_invites
  FOR UPDATE TO authenticated
  USING (public.has_permission(tenant_id, 'team.manage') OR email = lower(auth.jwt() ->> 'email'))
  WITH CHECK (public.has_permission(tenant_id, 'team.manage') OR email = lower(auth.jwt() ->> 'email'));

CREATE POLICY invites_delete ON public.organization_invites
  FOR DELETE TO authenticated
  USING (public.has_permission(tenant_id, 'team.manage'));

-- boards
CREATE POLICY boards_select ON public.boards
  FOR SELECT TO authenticated
  USING (
    public.has_permission(tenant_id, 'boards.view')
    OR (
      public.has_permission(tenant_id, 'field.view')
      AND EXISTS (
        SELECT 1 FROM public.field_jobs j
        WHERE j.board_id = boards.id
          AND j.assigned_to = auth.uid()
          AND j.status IN ('assigned', 'in_progress', 'pending')
      )
    )
  );

CREATE POLICY boards_insert ON public.boards
  FOR INSERT TO authenticated
  WITH CHECK (public.has_permission(tenant_id, 'boards.create'));

CREATE POLICY boards_update ON public.boards
  FOR UPDATE TO authenticated
  USING (public.has_permission(tenant_id, 'boards.update'))
  WITH CHECK (public.has_permission(tenant_id, 'boards.update'));

CREATE POLICY boards_delete ON public.boards
  FOR DELETE TO authenticated
  USING (public.has_permission(tenant_id, 'boards.delete'));

-- faces
CREATE POLICY faces_select ON public.board_faces
  FOR SELECT TO authenticated
  USING (
    public.has_permission(tenant_id, 'faces.view')
    OR (
      public.has_permission(tenant_id, 'field.view')
      AND EXISTS (
        SELECT 1 FROM public.field_jobs j
        WHERE j.face_id = board_faces.id
          AND j.assigned_to = auth.uid()
      )
    )
  );

CREATE POLICY faces_insert ON public.board_faces
  FOR INSERT TO authenticated
  WITH CHECK (public.has_permission(tenant_id, 'faces.create'));

CREATE POLICY faces_update ON public.board_faces
  FOR UPDATE TO authenticated
  USING (
    public.has_permission(tenant_id, 'faces.update')
    OR public.has_permission(tenant_id, 'marketplace.publish')
  )
  WITH CHECK (
    public.has_permission(tenant_id, 'faces.update')
    OR public.has_permission(tenant_id, 'marketplace.publish')
  );

CREATE POLICY faces_delete ON public.board_faces
  FOR DELETE TO authenticated
  USING (public.has_permission(tenant_id, 'faces.delete'));

-- images
CREATE POLICY images_select ON public.board_images
  FOR SELECT TO authenticated
  USING (public.has_permission(tenant_id, 'boards.view'));

CREATE POLICY images_insert ON public.board_images
  FOR INSERT TO authenticated
  WITH CHECK (public.has_permission(tenant_id, 'boards.update'));

CREATE POLICY images_update ON public.board_images
  FOR UPDATE TO authenticated
  USING (public.has_permission(tenant_id, 'boards.update'))
  WITH CHECK (public.has_permission(tenant_id, 'boards.update'));

CREATE POLICY images_delete ON public.board_images
  FOR DELETE TO authenticated
  USING (public.has_permission(tenant_id, 'boards.update'));

-- documents
CREATE POLICY documents_select ON public.documents
  FOR SELECT TO authenticated
  USING (public.has_permission(tenant_id, 'documents.view'));

CREATE POLICY documents_insert ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (public.has_permission(tenant_id, 'documents.manage'));

CREATE POLICY documents_delete ON public.documents
  FOR DELETE TO authenticated
  USING (public.has_permission(tenant_id, 'documents.manage'));

-- compliance
CREATE POLICY compliance_select ON public.compliance_records
  FOR SELECT TO authenticated
  USING (public.has_permission(tenant_id, 'compliance.view'));

CREATE POLICY compliance_insert ON public.compliance_records
  FOR INSERT TO authenticated
  WITH CHECK (public.has_permission(tenant_id, 'compliance.manage'));

CREATE POLICY compliance_update ON public.compliance_records
  FOR UPDATE TO authenticated
  USING (public.has_permission(tenant_id, 'compliance.manage'))
  WITH CHECK (public.has_permission(tenant_id, 'compliance.manage'));

CREATE POLICY compliance_delete ON public.compliance_records
  FOR DELETE TO authenticated
  USING (public.has_permission(tenant_id, 'compliance.manage'));

-- agreements
CREATE POLICY agreements_select ON public.agreements
  FOR SELECT TO authenticated
  USING (public.has_permission(tenant_id, 'documents.view'));

CREATE POLICY agreements_write ON public.agreements
  FOR INSERT TO authenticated
  WITH CHECK (public.has_permission(tenant_id, 'documents.manage'));

CREATE POLICY agreements_update ON public.agreements
  FOR UPDATE TO authenticated
  USING (public.has_permission(tenant_id, 'documents.manage'))
  WITH CHECK (public.has_permission(tenant_id, 'documents.manage'));

CREATE POLICY agreements_delete ON public.agreements
  FOR DELETE TO authenticated
  USING (public.has_permission(tenant_id, 'documents.manage'));

-- customers
CREATE POLICY customers_select ON public.customers
  FOR SELECT TO authenticated
  USING (public.has_permission(tenant_id, 'customers.view'));

CREATE POLICY customers_insert ON public.customers
  FOR INSERT TO authenticated
  WITH CHECK (public.has_permission(tenant_id, 'customers.manage'));

CREATE POLICY customers_update ON public.customers
  FOR UPDATE TO authenticated
  USING (public.has_permission(tenant_id, 'customers.manage'))
  WITH CHECK (public.has_permission(tenant_id, 'customers.manage'));

CREATE POLICY customers_delete ON public.customers
  FOR DELETE TO authenticated
  USING (public.has_permission(tenant_id, 'customers.manage'));

-- campaigns
CREATE POLICY campaigns_select ON public.campaigns
  FOR SELECT TO authenticated
  USING (public.has_permission(tenant_id, 'campaigns.view'));

CREATE POLICY campaigns_insert ON public.campaigns
  FOR INSERT TO authenticated
  WITH CHECK (public.has_permission(tenant_id, 'campaigns.manage'));

CREATE POLICY campaigns_update ON public.campaigns
  FOR UPDATE TO authenticated
  USING (public.has_permission(tenant_id, 'campaigns.manage'))
  WITH CHECK (public.has_permission(tenant_id, 'campaigns.manage'));

CREATE POLICY campaigns_delete ON public.campaigns
  FOR DELETE TO authenticated
  USING (public.has_permission(tenant_id, 'campaigns.manage'));

-- occupancy
CREATE POLICY occupancy_select ON public.occupancy_periods
  FOR SELECT TO authenticated
  USING (public.has_permission(tenant_id, 'occupancy.view'));

CREATE POLICY occupancy_insert ON public.occupancy_periods
  FOR INSERT TO authenticated
  WITH CHECK (public.has_permission(tenant_id, 'occupancy.manage'));

CREATE POLICY occupancy_update ON public.occupancy_periods
  FOR UPDATE TO authenticated
  USING (public.has_permission(tenant_id, 'occupancy.manage'))
  WITH CHECK (public.has_permission(tenant_id, 'occupancy.manage'));

CREATE POLICY occupancy_delete ON public.occupancy_periods
  FOR DELETE TO authenticated
  USING (public.has_permission(tenant_id, 'occupancy.manage'));

-- enquiries
CREATE POLICY enquiries_select ON public.enquiries
  FOR SELECT TO authenticated
  USING (public.has_permission(tenant_id, 'enquiries.view'));

CREATE POLICY enquiries_insert ON public.enquiries
  FOR INSERT TO authenticated
  WITH CHECK (public.has_permission(tenant_id, 'enquiries.manage'));

CREATE POLICY enquiries_update ON public.enquiries
  FOR UPDATE TO authenticated
  USING (public.has_permission(tenant_id, 'enquiries.manage'))
  WITH CHECK (public.has_permission(tenant_id, 'enquiries.manage'));

-- rate limits: no client access
CREATE POLICY enquiry_rate_limits_deny ON public.enquiry_rate_limits
  FOR ALL TO authenticated, anon
  USING (false)
  WITH CHECK (false);

-- field jobs
CREATE POLICY field_jobs_select ON public.field_jobs
  FOR SELECT TO authenticated
  USING (
    public.has_permission(tenant_id, 'field.manage')
    OR (
      public.has_permission(tenant_id, 'field.view')
      AND assigned_to = auth.uid()
    )
  );

CREATE POLICY field_jobs_insert ON public.field_jobs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_permission(tenant_id, 'field.manage'));

CREATE POLICY field_jobs_update ON public.field_jobs
  FOR UPDATE TO authenticated
  USING (
    public.has_permission(tenant_id, 'field.manage')
    OR (
      public.has_permission(tenant_id, 'field.view')
      AND assigned_to = auth.uid()
    )
  )
  WITH CHECK (
    public.has_permission(tenant_id, 'field.manage')
    OR (
      public.has_permission(tenant_id, 'field.view')
      AND assigned_to = auth.uid()
    )
  );

CREATE POLICY field_jobs_delete ON public.field_jobs
  FOR DELETE TO authenticated
  USING (public.has_permission(tenant_id, 'field.manage'));

-- proof
CREATE POLICY proof_select ON public.proof_records
  FOR SELECT TO authenticated
  USING (
    public.has_permission(tenant_id, 'field.manage')
    OR captured_by = auth.uid()
  );

CREATE POLICY proof_insert ON public.proof_records
  FOR INSERT TO authenticated
  WITH CHECK (
    captured_by = auth.uid()
    AND (
      public.has_permission(tenant_id, 'field.manage')
      OR EXISTS (
        SELECT 1 FROM public.field_jobs j
        WHERE j.id = field_job_id
          AND j.assigned_to = auth.uid()
          AND j.status IN ('assigned', 'in_progress')
      )
    )
  );

-- notifications
CREATE POLICY notifications_select ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY notifications_update ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- audit
CREATE POLICY audit_select ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.has_permission(tenant_id, 'audit.view'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
