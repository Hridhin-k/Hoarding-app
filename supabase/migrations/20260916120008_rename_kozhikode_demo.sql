-- Remove Kozhikode from demo tenant strings (org, boards, compliance, auth emails).

UPDATE public.organizations
SET
  name = CASE WHEN name = 'Kozhikode Outdoor Media' THEN 'Horizon Outdoor Media' ELSE name END,
  slug = CASE WHEN slug = 'kozhikode-outdoor' THEN 'horizon-outdoor' ELSE slug END,
  email = replace(coalesce(email, ''), 'kozhikodeoutdoor.com', 'horizonoutdoor.com'),
  city = CASE WHEN city = 'Kozhikode' THEN 'Kochi' ELSE city END
WHERE name ILIKE '%Kozhikode%'
   OR slug ILIKE '%kozhikode%'
   OR coalesce(email, '') ILIKE '%kozhikode%'
   OR city ILIKE 'Kozhikode';

UPDATE public.boards
SET
  board_code = replace(board_code, 'H360-KKD-', 'H360-HZN-'),
  city = CASE WHEN city = 'Kozhikode' THEN 'Kochi' ELSE city END,
  district = CASE WHEN district = 'Kozhikode' THEN 'Kochi' ELSE district END
WHERE board_code LIKE 'H360-KKD-%'
   OR city = 'Kozhikode'
   OR district = 'Kozhikode';

UPDATE public.compliance_records
SET
  authority = CASE
    WHEN authority = 'Kozhikode Corporation' THEN 'Municipal Corporation'
    ELSE replace(authority, 'Kozhikode', 'Kochi')
  END,
  reference_number = replace(coalesce(reference_number, ''), 'KCC/', 'MCC/')
WHERE authority ILIKE '%Kozhikode%'
   OR coalesce(reference_number, '') LIKE 'KCC/%';

UPDATE auth.users
SET
  email = replace(email, 'kozhikodeoutdoor.com', 'horizonoutdoor.com'),
  updated_at = now()
WHERE email LIKE '%kozhikodeoutdoor.com';

UPDATE auth.identities
SET
  identity_data = identity_data || jsonb_build_object(
    'email',
    replace(identity_data->>'email', 'kozhikodeoutdoor.com', 'horizonoutdoor.com')
  ),
  updated_at = now()
WHERE identity_data->>'email' LIKE '%kozhikodeoutdoor.com';
