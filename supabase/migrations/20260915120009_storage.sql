-- Storage buckets and tenant_id immutability

CREATE OR REPLACE FUNCTION public.prevent_tenant_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.tenant_id IS DISTINCT FROM OLD.tenant_id THEN
    RAISE EXCEPTION 'tenant_id cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'boards',
    'board_faces',
    'board_images',
    'documents',
    'compliance_records',
    'agreements',
    'customers',
    'campaigns',
    'occupancy_periods',
    'enquiries',
    'field_jobs',
    'proof_records',
    'notifications',
    'audit_logs',
    'organization_settings',
    'organization_invites'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I_prevent_tenant_change BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.prevent_tenant_change()',
      t, t
    );
  END LOOP;
END;
$$;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'board-images',
    'board-images',
    false,
    15728640,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'documents',
    'documents',
    false,
    20971520,
    ARRAY[
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  ),
  (
    'proof-of-display',
    'proof-of-display',
    false,
    15728640,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  )
ON CONFLICT (id) DO NOTHING;

CREATE POLICY board_images_storage_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'board-images'
    AND public.has_permission((split_part(name, '/', 1))::uuid, 'boards.view')
  );

CREATE POLICY board_images_storage_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'board-images'
    AND public.has_permission((split_part(name, '/', 1))::uuid, 'boards.update')
  );

CREATE POLICY board_images_storage_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'board-images'
    AND public.has_permission((split_part(name, '/', 1))::uuid, 'boards.update')
  );

CREATE POLICY documents_storage_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND public.has_permission((split_part(name, '/', 1))::uuid, 'documents.view')
  );

CREATE POLICY documents_storage_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND public.has_permission((split_part(name, '/', 1))::uuid, 'documents.manage')
  );

CREATE POLICY documents_storage_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND public.has_permission((split_part(name, '/', 1))::uuid, 'documents.manage')
  );

CREATE POLICY proof_storage_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'proof-of-display'
    AND (
      public.has_permission((split_part(name, '/', 1))::uuid, 'field.manage')
      OR owner = auth.uid()
    )
  );

CREATE POLICY proof_storage_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'proof-of-display'
    AND public.is_org_member((split_part(name, '/', 1))::uuid)
    AND public.has_permission((split_part(name, '/', 1))::uuid, 'field.view')
  );

-- Marketplace photos: signed URLs from the app. No public bucket access.
