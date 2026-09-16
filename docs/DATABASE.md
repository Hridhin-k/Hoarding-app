# Database

PostgreSQL (Supabase) is the source of truth. All changes go through `supabase/migrations/`.

## Conventions

- snake_case
- Tenant-owned tables: `tenant_id uuid NOT NULL` → `organizations(id)`
- `tenant_id` cannot be updated (`prevent_tenant_change`)
- RLS on every tenant table
- Inclusive occupancy dates: `daterange(start_date, end_date, '[]')`
- Default org timezone: `Asia/Kolkata`

## Entity map

```
organizations
  ├── organization_members → profiles (auth.users)
  ├── organization_settings
  ├── organization_invites
  ├── boards
  │     ├── board_faces
  │     │     ├── occupancy_periods → customers, campaigns
  │     │     └── enquiries → customers
  │     ├── board_images
  │     ├── compliance_records → documents
  │     ├── agreements → documents, customers
  │     └── field_jobs → proof_records
  ├── customers
  ├── campaigns
  ├── documents
  ├── notifications
  └── audit_logs

platform_staff → profiles
platform_audit_logs
platform_inspect_sessions
```

`profiles.id` = `auth.users.id`.

## Core tables

| Table | Notes |
| --- | --- |
| `organizations` | Tenant. Unique `slug`. `status`: `active` / `suspended` / `pending` (platform-controlled). |
| `organization_members` | Unique `(organization_id, user_id)`. Roles: `app_role`. |
| `platform_staff` | HOARDINGS360 operators. Not tenant members. Roles: `SUPER_ADMIN`, `SUPPORT`. |
| `platform_inspect_sessions` | Time-boxed (30 min) inspect with required reason. |
| `platform_audit_logs` | Staff actions (inspect, suspend). Separate from tenant `audit_logs`. |
| `organization_settings` | `vacancy_prelisting_days` (1–365, default 30). |
| `boards` | `board_code` unique per tenant. `location geography(Point, 4326)`. Active boards require location. Unique `qr_slug`. |
| `board_faces` | Sellable unit. Size > 0. Generated `area_sqft`. `publishable` + `marketplace_visible`. |
| `board_images` | MIME jpeg/png/webp, ≤ 15MB. |
| `compliance_records` | Status synced from `expiry_date` via trigger. |
| `occupancy_periods` | Face-level. Exclusion constraint blocks overlapping blocking states. |
| `enquiries` | Face-level. Marketplace inserts go through RPC. |
| `field_jobs` / `proof_records` | Proof requires GPS + photo path + `captured_by`. |
| `enquiry_rate_limits` | No client policies (deny all). Written by RPC. |

## Occupancy

Stored `occupancy_state`: `occupied | on_hold | booked_future | blocked`.

Derived `face_occupancy_dimension(face_id, as_of)`:

- current blocked → `blocked`
- current hold → `on_hold`
- current occupied/booked in pre-listing window with no follow-on → `becoming_vacant`
- else current occupied/booked → `occupied`
- else future occupied/booked → `booked_future`
- else `vacant`

`vacant` and `becoming_vacant` are never stored as period rows.

Overlap: same `face_id`, inclusive ranges, for all four stored states.

Adjacent example: 1–10 Jan and 11–20 Jan are allowed. 1–10 Jan and 10–20 Jan conflict.

## Compliance

`compute_compliance_status`: null expiry → `missing`; past → `expired`; within 90 days → `expiring`; else `valid`.

`board_compliance_dimension`: if no mandatory records → `missing`; else worst of expired > missing > expiring > valid.

## Marketplace

`face_is_marketplace_eligible`: organization `status = active`, active board, both flags true, compliance not expired/missing, occupancy not blocked.

Public views (security barrier, invoker off): `marketplace_listings`, `marketplace_photos`.

## Storage paths

Buckets (all private): `board-images`, `documents`, `proof-of-display`.

Object name must start with `tenant_id/`. Policies parse that UUID.

## Helpers (do not reimplement in JS)

`create_organization`, `is_org_member`, `member_role`, `has_permission`, `write_audit_log`, `refresh_operational_alerts`, `submit_marketplace_enquiry`, `face_available_from`, `is_platform_staff`, `platform_overview`, `platform_list_tenants`, `platform_start_inspect`, `platform_tenant_detail`, `platform_set_tenant_status`.

## Migrations

Inspect columns, constraints, indexes, policies, and dependents before altering. No destructive changes without explicit approval. Never delete migration files.
