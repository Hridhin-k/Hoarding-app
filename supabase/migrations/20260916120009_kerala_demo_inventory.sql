-- Demo inventory is statewide Kerala, not a single HQ city.

UPDATE public.organizations
SET
  city = NULL,
  phone = '+91 471 400 0360'
WHERE id = 'aaaaaaaa-0000-4000-8000-000000000001';

UPDATE public.boards SET
  name = 'Statue Junction Hoarding',
  location = ST_SetSRID(ST_MakePoint(76.9496, 8.4980), 4326)::geography,
  locality = 'Statue',
  city = 'Thiruvananthapuram',
  district = 'Thiruvananthapuram',
  pincode = '695001',
  landmark = 'MG Road / Palayam approach'
WHERE id = 'bbbbbbbb-0000-4000-8000-000000000001';

UPDATE public.boards SET
  name = 'Marine Drive Unipole',
  location = ST_SetSRID(ST_MakePoint(76.2770, 9.9730), 4326)::geography,
  locality = 'Marine Drive',
  city = 'Kochi',
  district = 'Ernakulam',
  pincode = '682031',
  landmark = 'Opposite boat jetty'
WHERE id = 'bbbbbbbb-0000-4000-8000-000000000002';

UPDATE public.boards SET
  name = 'Ramanattukara Bypass Gantry',
  location = ST_SetSRID(ST_MakePoint(75.8270, 11.1760), 4326)::geography,
  locality = 'Ramanattukara',
  city = 'Kozhikode',
  district = 'Kozhikode',
  pincode = '673633',
  landmark = 'NH bypass'
WHERE id = 'bbbbbbbb-0000-4000-8000-000000000003';

UPDATE public.boards SET
  name = 'Medical College Junction',
  location = ST_SetSRID(ST_MakePoint(76.5227, 9.5483), 4326)::geography,
  locality = 'Gandhinagar',
  city = 'Kottayam',
  district = 'Kottayam',
  pincode = '686008',
  landmark = 'MC junction signal'
WHERE id = 'bbbbbbbb-0000-4000-8000-000000000004';

UPDATE public.boards SET
  name = 'Palayam Wall Wrap',
  location = ST_SetSRID(ST_MakePoint(76.9489, 8.4875), 4326)::geography,
  locality = 'Palayam',
  city = 'Thiruvananthapuram',
  district = 'Thiruvananthapuram',
  pincode = '695033',
  landmark = 'Palayam bus stand'
WHERE id = 'bbbbbbbb-0000-4000-8000-000000000005';

UPDATE public.boards SET
  name = 'Edappally Mall Stretch',
  location = ST_SetSRID(ST_MakePoint(76.3083, 10.0263), 4326)::geography,
  locality = 'Edappally',
  city = 'Kochi',
  district = 'Ernakulam',
  pincode = '682024',
  landmark = 'Lulu Mall approach'
WHERE id = 'bbbbbbbb-0000-4000-8000-000000000006';

UPDATE public.boards SET
  name = 'Airport Road LED',
  location = ST_SetSRID(ST_MakePoint(75.9550, 11.1360), 4326)::geography,
  locality = 'Karipur',
  city = 'Malappuram',
  district = 'Malappuram',
  pincode = '673647',
  landmark = 'Airport approach'
WHERE id = 'bbbbbbbb-0000-4000-8000-000000000007';

UPDATE public.boards SET
  name = 'Chinnakada Junction Hoarding',
  location = ST_SetSRID(ST_MakePoint(76.5950, 8.8863), 4326)::geography,
  locality = 'Chinnakada',
  city = 'Kollam',
  district = 'Kollam',
  pincode = '691001',
  landmark = 'Town junction'
WHERE id = 'bbbbbbbb-0000-4000-8000-000000000010';

UPDATE public.boards SET
  name = 'Alappuzha Beach Road',
  location = ST_SetSRID(ST_MakePoint(76.3264, 9.4981), 4326)::geography,
  locality = 'Alappuzha Beach',
  city = 'Alappuzha',
  district = 'Alappuzha',
  pincode = '688001',
  landmark = 'Beach road'
WHERE id = 'bbbbbbbb-0000-4000-8000-000000000011';

UPDATE public.boards SET
  name = 'Tiruvalla Old Board',
  location = ST_SetSRID(ST_MakePoint(76.5750, 9.3850), 4326)::geography,
  locality = 'Tiruvalla',
  city = 'Tiruvalla',
  district = 'Pathanamthitta',
  pincode = '689101',
  landmark = 'MC road'
WHERE id = 'bbbbbbbb-0000-4000-8000-000000000012';

UPDATE public.boards SET
  name = 'Kasaragod Draft Site',
  location = NULL,
  locality = 'Kasaragod',
  city = 'Kasaragod',
  district = 'Kasaragod',
  pincode = '671121',
  landmark = 'Proposed site'
WHERE id = 'bbbbbbbb-0000-4000-8000-000000000013';

UPDATE public.boards SET
  name = 'Kattappana Blocked Board',
  location = ST_SetSRID(ST_MakePoint(77.1166, 9.7548), 4326)::geography,
  locality = 'Kattappana',
  city = 'Kattappana',
  district = 'Idukki',
  pincode = '685508',
  landmark = 'Town bypass'
WHERE id = 'bbbbbbbb-0000-4000-8000-000000000014';

UPDATE public.notifications
SET message = 'Alappuzha Beach Road Face A becomes vacant on 6 October 2026.'
WHERE tenant_id = 'aaaaaaaa-0000-4000-8000-000000000001'
  AND type = 'VACANCY_APPROACHING'
  AND entity_id = (
    SELECT id FROM public.board_faces
    WHERE face_label = 'Face A'
      AND board_id = 'bbbbbbbb-0000-4000-8000-000000000011'
    LIMIT 1
  );
