# User flows

Implemented MVP route map. Surfaces: `/manage`, `/market`, `/field`, `/platform`.

## Auth and tenancy

1. Signup / login (Supabase Auth) — `/signup`, `/login`
2. Create organization (`create_organization` → OWNER + default settings) or accept invite — `/onboarding`
3. Tenant cookie set for UX (`h360_tenant`)
4. Enter Manage (`/manage`), Field (`/field` for technicians), or Platform (`/platform` for HOARDINGS360 staff)

## OWNER / ops — inventory

1. Create board (draft; district → city dropdowns, satellite pin) — `/manage/boards/new`
2. Add one or more faces — board detail
3. Upload photos / documents
4. Add mandatory compliance + documents — `/manage/compliance`
5. Activate board when location exists
6. Toggle face `publishable` + `marketplace_visible` (Publish)

## OWNER / sales — occupancy and vacancy

1. Create occupancy period on a face — `/manage/occupancy`
2. Database rejects overlaps (inclusive dates)
3. Approaching end → `becoming_vacant` + sales notification (cron + tenant refresh RPC)
4. Upcoming vacancies on dashboard; publish vacancy to marketplace when eligible

## SALES — demand

1. Dashboard upcoming vacancies
2. `/manage/enquiries` — filter, open, assign, change status
3. `/manage/customers` — create customer (including from won enquiry)

## COMPLIANCE

1. `/manage/compliance` — filter expiring / expired
2. Upload renewal document and update clearance status

## TECHNICIAN — field

1. `/field` — assigned jobs
2. Open Google Maps navigation from job
3. Start → Scan QR (`/field/scan`) → Capture proof (photo + GPS) → Complete
4. Offline: queue upload, retry later (`lib/field/offline-queue.ts`)

## PUBLIC advertiser — marketplace

1. `/market` — search / filter (server-side, paginated)
2. Open board — faces, availability, card rate (never `floor_rate`)
3. Submit enquiry (`submit_marketplace_enquiry`)

## HOARDINGS360 staff — platform

1. Sign in as platform staff — `/login` → `/platform`
2. Open a tenant — `/platform/tenants/[id]`
3. Start inspect with a written reason (30 minutes, audited)
4. Super admin may suspend/reactivate (hides marketplace listings; Manage still works)
5. Review `/platform/audit`

## Independent statuses (all flows)

Always display lifecycle, compliance, and occupancy separately. Do not invent a combined status.
