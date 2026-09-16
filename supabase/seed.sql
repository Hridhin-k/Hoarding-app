-- Statewide Kerala demo tenant: Horizon Outdoor Media + isolation tenant Malabar Media Co

CREATE OR REPLACE FUNCTION public.seed_auth_user(
  p_id uuid,
  p_email text,
  p_name text,
  p_password text DEFAULT 'Password123!'
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    p_id,
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', p_name),
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    p_id,
    p_id,
    jsonb_build_object('sub', p_id::text, 'email', p_email),
    'email',
    p_id::text,
    now(),
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$;

SELECT public.seed_auth_user('10000000-0000-4000-8000-000000000001', 'owner@horizonoutdoor.com', 'Arun Menon');
SELECT public.seed_auth_user('10000000-0000-4000-8000-000000000002', 'sales@horizonoutdoor.com', 'Nisha Varghese');
SELECT public.seed_auth_user('10000000-0000-4000-8000-000000000003', 'ops@horizonoutdoor.com', 'Faisal Rahman');
SELECT public.seed_auth_user('10000000-0000-4000-8000-000000000004', 'compliance@horizonoutdoor.com', 'Meera Das');
SELECT public.seed_auth_user('10000000-0000-4000-8000-000000000005', 'tech@horizonoutdoor.com', 'Sanjay K');
SELECT public.seed_auth_user('10000000-0000-4000-8000-000000000006', 'admin@horizonoutdoor.com', 'Lakshmi Nair');
SELECT public.seed_auth_user('20000000-0000-4000-8000-000000000001', 'owner@malabarmedia.com', 'Ravi Nambiar');
SELECT public.seed_auth_user('30000000-0000-4000-8000-000000000001', 'platform@hoardings360.com', 'H360 Platform');

INSERT INTO public.organizations (id, name, slug, phone, email, city, state, country)
VALUES
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Horizon Outdoor Media', 'horizon-outdoor', '+91 471 400 0360', 'hello@horizonoutdoor.com', NULL, 'Kerala', 'India'),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'Malabar Media Co', 'malabar-media', '+91 497 234 5678', 'hello@malabarmedia.com', 'Kannur', 'Kerala', 'India')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.organization_members (organization_id, user_id, role, status)
VALUES
  ('aaaaaaaa-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'OWNER', 'active'),
  ('aaaaaaaa-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'SALES', 'active'),
  ('aaaaaaaa-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'OPS_MANAGER', 'active'),
  ('aaaaaaaa-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004', 'COMPLIANCE', 'active'),
  ('aaaaaaaa-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000005', 'TECHNICIAN', 'active'),
  ('aaaaaaaa-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000006', 'ADMIN', 'active'),
  ('aaaaaaaa-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'OWNER', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO public.platform_staff (user_id, role, status)
VALUES ('30000000-0000-4000-8000-000000000001', 'SUPER_ADMIN', 'active')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.organization_settings (tenant_id, vacancy_prelisting_days)
VALUES
  ('aaaaaaaa-0000-4000-8000-000000000001', 30),
  ('aaaaaaaa-0000-4000-8000-000000000002', 30)
ON CONFLICT (tenant_id) DO NOTHING;

INSERT INTO public.boards (
  id, tenant_id, board_code, name, structure_type, location, locality, city, district, state, pincode, landmark, ownership_type, lifecycle_status
)
VALUES
  ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'H360-HZN-001', 'Statue Junction Hoarding', 'hoarding', ST_SetSRID(ST_MakePoint(76.9496, 8.4980), 4326)::geography, 'Statue', 'Thiruvananthapuram', 'Thiruvananthapuram', 'Kerala', '695001', 'MG Road / Palayam approach', 'owned', 'active'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'H360-HZN-002', 'Marine Drive Unipole', 'unipole', ST_SetSRID(ST_MakePoint(76.2770, 9.9730), 4326)::geography, 'Marine Drive', 'Kochi', 'Ernakulam', 'Kerala', '682031', 'Opposite boat jetty', 'owned', 'active'),
  ('bbbbbbbb-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000001', 'H360-HZN-003', 'Ramanattukara Bypass Gantry', 'gantry', ST_SetSRID(ST_MakePoint(75.8270, 11.1760), 4326)::geography, 'Ramanattukara', 'Kozhikode', 'Kozhikode', 'Kerala', '673633', 'NH bypass', 'leased', 'active'),
  ('bbbbbbbb-0000-4000-8000-000000000004', 'aaaaaaaa-0000-4000-8000-000000000001', 'H360-HZN-004', 'Medical College Junction', 'hoarding', ST_SetSRID(ST_MakePoint(76.5227, 9.5483), 4326)::geography, 'Gandhinagar', 'Kottayam', 'Kottayam', 'Kerala', '686008', 'MC junction signal', 'owned', 'active'),
  ('bbbbbbbb-0000-4000-8000-000000000005', 'aaaaaaaa-0000-4000-8000-000000000001', 'H360-HZN-005', 'Palayam Wall Wrap', 'wall_wrap', ST_SetSRID(ST_MakePoint(76.9489, 8.4875), 4326)::geography, 'Palayam', 'Thiruvananthapuram', 'Thiruvananthapuram', 'Kerala', '695033', 'Palayam bus stand', 'managed', 'active'),
  ('bbbbbbbb-0000-4000-8000-000000000006', 'aaaaaaaa-0000-4000-8000-000000000001', 'H360-HZN-006', 'Edappally Mall Stretch', 'billboard', ST_SetSRID(ST_MakePoint(76.3083, 10.0263), 4326)::geography, 'Edappally', 'Kochi', 'Ernakulam', 'Kerala', '682024', 'Lulu Mall approach', 'owned', 'active'),
  ('bbbbbbbb-0000-4000-8000-000000000007', 'aaaaaaaa-0000-4000-8000-000000000001', 'H360-HZN-007', 'Airport Road LED', 'digital_led', ST_SetSRID(ST_MakePoint(75.9550, 11.1360), 4326)::geography, 'Karipur', 'Malappuram', 'Malappuram', 'Kerala', '673647', 'Airport approach', 'leased', 'active'),
  ('bbbbbbbb-0000-4000-8000-000000000008', 'aaaaaaaa-0000-4000-8000-000000000001', 'H360-TSR-001', 'Thrissur Round Unipole', 'unipole', ST_SetSRID(ST_MakePoint(76.2144, 10.5276), 4326)::geography, 'Swaraj Round', 'Thrissur', 'Thrissur', 'Kerala', '680001', 'South round', 'owned', 'active'),
  ('bbbbbbbb-0000-4000-8000-000000000009', 'aaaaaaaa-0000-4000-8000-000000000001', 'H360-TSR-002', 'Punkunnam Hoarding', 'hoarding', ST_SetSRID(ST_MakePoint(76.2000, 10.5400), 4326)::geography, 'Punkunnam', 'Thrissur', 'Thrissur', 'Kerala', '680002', 'Railway overbridge', 'owned', 'active'),
  ('bbbbbbbb-0000-4000-8000-00000000000a', 'aaaaaaaa-0000-4000-8000-000000000001', 'H360-KNR-001', 'Kannur Fort Road', 'hoarding', ST_SetSRID(ST_MakePoint(75.3704, 11.8745), 4326)::geography, 'Fort Road', 'Kannur', 'Kannur', 'Kerala', '670001', 'Near payyambalam turn', 'owned', 'active'),
  ('bbbbbbbb-0000-4000-8000-00000000000b', 'aaaaaaaa-0000-4000-8000-000000000001', 'H360-KNR-002', 'Thalassery Town Billboard', 'billboard', ST_SetSRID(ST_MakePoint(75.5476, 11.7480), 4326)::geography, 'Thalassery', 'Kannur', 'Kannur', 'Kerala', '670101', 'New bus stand', 'leased', 'active'),
  ('bbbbbbbb-0000-4000-8000-00000000000c', 'aaaaaaaa-0000-4000-8000-000000000001', 'H360-MLP-001', 'Kottakkal Junction', 'hoarding', ST_SetSRID(ST_MakePoint(76.0020, 10.9950), 4326)::geography, 'Kottakkal', 'Malappuram', 'Malappuram', 'Kerala', '676503', 'Arya Vaidya Sala road', 'owned', 'active'),
  ('bbbbbbbb-0000-4000-8000-00000000000d', 'aaaaaaaa-0000-4000-8000-000000000001', 'H360-MLP-002', 'Perinthalmanna Bypass', 'unipole', ST_SetSRID(ST_MakePoint(76.2260, 10.9765), 4326)::geography, 'Perinthalmanna', 'Malappuram', 'Malappuram', 'Kerala', '679322', 'Bypass junction', 'owned', 'active'),
  ('bbbbbbbb-0000-4000-8000-00000000000e', 'aaaaaaaa-0000-4000-8000-000000000001', 'H360-PKD-001', 'Palakkad Town Hoarding', 'hoarding', ST_SetSRID(ST_MakePoint(76.6540, 10.7867), 4326)::geography, 'Shoranur Road', 'Palakkad', 'Palakkad', 'Kerala', '678001', 'Stadium bus stand', 'owned', 'active'),
  ('bbbbbbbb-0000-4000-8000-00000000000f', 'aaaaaaaa-0000-4000-8000-000000000001', 'H360-WYD-001', 'Kalpetta Market Unipole', 'unipole', ST_SetSRID(ST_MakePoint(76.0830, 11.6100), 4326)::geography, 'Kalpetta', 'Wayanad', 'Wayanad', 'Kerala', '673121', 'Main market', 'managed', 'active'),
  ('bbbbbbbb-0000-4000-8000-000000000010', 'aaaaaaaa-0000-4000-8000-000000000001', 'H360-HZN-008', 'Chinnakada Junction Hoarding', 'hoarding', ST_SetSRID(ST_MakePoint(76.5950, 8.8863), 4326)::geography, 'Chinnakada', 'Kollam', 'Kollam', 'Kerala', '691001', 'Town junction', 'owned', 'active'),
  ('bbbbbbbb-0000-4000-8000-000000000011', 'aaaaaaaa-0000-4000-8000-000000000001', 'H360-HZN-009', 'Alappuzha Beach Road', 'hoarding', ST_SetSRID(ST_MakePoint(76.3264, 9.4981), 4326)::geography, 'Alappuzha Beach', 'Alappuzha', 'Alappuzha', 'Kerala', '688001', 'Beach road', 'owned', 'active'),
  ('bbbbbbbb-0000-4000-8000-000000000012', 'aaaaaaaa-0000-4000-8000-000000000001', 'H360-HZN-010', 'Tiruvalla Old Board', 'hoarding', ST_SetSRID(ST_MakePoint(76.5750, 9.3850), 4326)::geography, 'Tiruvalla', 'Tiruvalla', 'Pathanamthitta', 'Kerala', '689101', 'MC road', 'owned', 'retired'),
  ('bbbbbbbb-0000-4000-8000-000000000013', 'aaaaaaaa-0000-4000-8000-000000000001', 'H360-HZN-011', 'Kasaragod Draft Site', 'hoarding', NULL, 'Kasaragod', 'Kasaragod', 'Kasaragod', 'Kerala', '671121', 'Proposed site', 'owned', 'draft'),
  ('bbbbbbbb-0000-4000-8000-000000000014', 'aaaaaaaa-0000-4000-8000-000000000001', 'H360-HZN-012', 'Kattappana Blocked Board', 'billboard', ST_SetSRID(ST_MakePoint(77.1166, 9.7548), 4326)::geography, 'Kattappana', 'Kattappana', 'Idukki', 'Kerala', '685508', 'Town bypass', 'owned', 'blocked'),
  ('bbbbbbbb-0000-4000-8000-000000000015', 'aaaaaaaa-0000-4000-8000-000000000002', 'MLB-KNR-001', 'Payyambalam Isolation Board', 'hoarding', ST_SetSRID(ST_MakePoint(75.3510, 11.8680), 4326)::geography, 'Payyambalam', 'Kannur', 'Kannur', 'Kerala', '670001', 'Beach road', 'owned', 'active');

-- Faces: 2 on most boards, 1 on selected, none on draft Kasaragod
INSERT INTO public.board_faces (
  tenant_id, board_id, face_label, direction, width, height, unit, illumination, card_rate, floor_rate, publishable, marketplace_visible
)
SELECT
  b.tenant_id,
  b.id,
  CASE WHEN gs = 1 THEN 'Face A' ELSE 'Face B' END,
  CASE WHEN gs = 1 THEN 'North' ELSE 'South' END,
  CASE b.board_code
    WHEN 'H360-HZN-007' THEN 20 ELSE 12
  END,
  CASE b.board_code
    WHEN 'H360-HZN-007' THEN 10 ELSE 8
  END,
  'ft',
  CASE b.board_code
    WHEN 'H360-HZN-007' THEN 'digital'::public.illumination_type
    WHEN 'H360-HZN-002' THEN 'led'::public.illumination_type
    ELSE 'front_lit'::public.illumination_type
  END,
  CASE gs WHEN 1 THEN 180000 ELSE 150000 END,
  CASE gs WHEN 1 THEN 140000 ELSE 120000 END,
  b.lifecycle_status = 'active' AND b.board_code NOT IN ('H360-HZN-008', 'H360-HZN-012', 'H360-HZN-010'),
  b.lifecycle_status = 'active' AND b.board_code NOT IN ('H360-HZN-008', 'H360-HZN-012', 'H360-HZN-010', 'H360-HZN-011')
FROM public.boards b
JOIN LATERAL generate_series(
  1,
  CASE
    WHEN b.board_code IN ('H360-MLP-001', 'H360-WYD-001', 'H360-HZN-010') THEN 1
    WHEN b.board_code = 'H360-HZN-011' THEN 0
    ELSE 2
  END
) AS gs ON true
WHERE b.tenant_id = 'aaaaaaaa-0000-4000-8000-000000000001'
   OR b.id = 'bbbbbbbb-0000-4000-8000-000000000015';

-- Mandatory compliance: expired on Kollam Chinnakada, missing none, valid/expiring others
INSERT INTO public.compliance_records (tenant_id, board_id, clearance_type, authority, reference_number, issue_date, expiry_date, is_mandatory)
SELECT
  b.tenant_id,
  b.id,
  'municipal',
  'Municipal Corporation',
  'MCC/' || b.board_code,
  DATE '2025-04-01',
  CASE b.board_code
    WHEN 'H360-HZN-008' THEN DATE '2026-08-01'
    WHEN 'H360-HZN-004' THEN DATE '2026-09-22'
    WHEN 'H360-HZN-006' THEN DATE '2026-10-20'
    ELSE DATE '2027-06-30'
  END,
  true
FROM public.boards b
WHERE b.lifecycle_status IN ('active', 'blocked', 'retired')
  AND b.board_code <> 'H360-HZN-011';

INSERT INTO public.customers (id, tenant_id, name, company_name, email, phone, type)
VALUES
  ('dddddddd-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'Ananya Krishnan', 'Malabar Gold', 'media@malabargold.example', '9876500001', 'advertiser'),
  ('dddddddd-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'Rahul Babu', 'Kalyan Silks', 'rahul@kalyan.example', '9876500002', 'advertiser'),
  ('dddddddd-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000001', 'Sneha Iyer', 'Southbay Media', 'sneha@southbay.example', '9876500003', 'agency');

INSERT INTO public.campaigns (id, tenant_id, customer_id, name, start_date, end_date, status)
VALUES
  ('eeeeeeee-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'dddddddd-0000-4000-8000-000000000001', 'Onam 2026 — Malabar Gold', '2026-08-15', '2026-10-05', 'active');

-- Occupancy: occupied, becoming vacant, vacant, hold, blocked
INSERT INTO public.occupancy_periods (tenant_id, face_id, start_date, end_date, state, source, customer_id, campaign_id)
SELECT f.tenant_id, f.id, DATE '2026-08-01', DATE '2026-10-05', 'occupied', 'campaign',
  'dddddddd-0000-4000-8000-000000000001', 'eeeeeeee-0000-4000-8000-000000000001'
FROM public.board_faces f
JOIN public.boards b ON b.id = f.board_id
WHERE b.board_code = 'H360-HZN-009' AND f.face_label = 'Face A';

INSERT INTO public.occupancy_periods (tenant_id, face_id, start_date, end_date, state, source, customer_id)
SELECT f.tenant_id, f.id, DATE '2026-07-01', DATE '2026-12-31', 'occupied', 'manual',
  'dddddddd-0000-4000-8000-000000000002'
FROM public.board_faces f
JOIN public.boards b ON b.id = f.board_id
WHERE b.board_code = 'H360-HZN-001' AND f.face_label = 'Face A';

INSERT INTO public.occupancy_periods (tenant_id, face_id, start_date, end_date, state, source)
SELECT f.tenant_id, f.id, DATE '2026-11-01', DATE '2027-01-31', 'booked_future', 'manual'
FROM public.board_faces f
JOIN public.boards b ON b.id = f.board_id
WHERE b.board_code = 'H360-HZN-002' AND f.face_label = 'Face A';

INSERT INTO public.occupancy_periods (tenant_id, face_id, start_date, end_date, state, source)
SELECT f.tenant_id, f.id, CURRENT_DATE, CURRENT_DATE + 10, 'on_hold', 'enquiry'
FROM public.board_faces f
JOIN public.boards b ON b.id = f.board_id
WHERE b.board_code = 'H360-TSR-001' AND f.face_label = 'Face A';

INSERT INTO public.occupancy_periods (tenant_id, face_id, start_date, end_date, state, source)
SELECT f.tenant_id, f.id, CURRENT_DATE - 5, CURRENT_DATE + 20, 'blocked', 'manual'
FROM public.board_faces f
JOIN public.boards b ON b.id = f.board_id
WHERE b.board_code = 'H360-HZN-012';

INSERT INTO public.enquiries (tenant_id, face_id, source, name, company_name, email, phone, message, requested_start_date, requested_end_date, status)
SELECT f.tenant_id, f.id, 'marketplace', 'Vivek Nair', 'Nair Associates', 'vivek@nair.example', '9895001122',
  'Need Face A from January for a jewellery launch.', DATE '2027-01-01', DATE '2027-03-31', 'new'
FROM public.board_faces f
JOIN public.boards b ON b.id = f.board_id
WHERE b.board_code = 'H360-HZN-001' AND f.face_label = 'Face B';

INSERT INTO public.field_jobs (id, tenant_id, board_id, face_id, job_type, title, description, assigned_to, scheduled_at, status, priority)
SELECT
  'ffffffff-0000-4000-8000-000000000001',
  b.tenant_id,
  b.id,
  f.id,
  'proof_capture',
  'Proof of display — Malabar Gold',
  'Capture morning and evening proofs.',
  '10000000-0000-4000-8000-000000000005',
  now() + interval '3 hours',
  'assigned',
  'high'
FROM public.boards b
JOIN public.board_faces f ON f.board_id = b.id
WHERE b.board_code = 'H360-HZN-009' AND f.face_label = 'Face A';

INSERT INTO public.notifications (tenant_id, user_id, type, title, message, entity_type, entity_id)
VALUES (
  'aaaaaaaa-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  'VACANCY_APPROACHING',
  'Upcoming vacancy',
  'Alappuzha Beach Road Face A becomes vacant on 6 October 2026.',
  'face',
  (SELECT id FROM public.board_faces WHERE face_label = 'Face A' AND board_id = 'bbbbbbbb-0000-4000-8000-000000000011' LIMIT 1)
);

SELECT public.refresh_operational_alerts();
