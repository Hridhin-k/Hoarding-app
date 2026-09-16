---
name: database
description: HOARDINGS360 PostgreSQL schema, constraints, PostGIS, occupancy exclusion, migrations, and naming. Use when adding tables, columns, indexes, functions, views, or changing occupancy, compliance, or marketplace SQL.
---

# HOARDINGS360 DATABASE SKILL

Use this skill before any schema change.

## Source of truth

`supabase/migrations/` — never invent a parallel schema.

Read `docs/DATABASE.md` first.

## Required on tenant tables

- `tenant_id uuid NOT NULL REFERENCES organizations(id)`
- RLS enabled
- index on `tenant_id`
- `prevent_tenant_change` trigger
- explicit FKs

## Naming

snake_case for tables, columns, indexes, constraints, functions.

## Occupancy

`occupancy_periods` uses:

```sql
EXCLUDE USING gist (
  face_id WITH =,
  daterange(start_date, end_date, '[]') WITH &&
) WHERE (state IN ('occupied', 'on_hold', 'booked_future', 'blocked'))
```

Dates are inclusive on both ends. Do not change this without an ADR.

Derived states come from `face_occupancy_dimension`, not extra rows.

## PostGIS

`boards.location geography(Point, 4326)` + GIST.

An `active` board must have a location.

## Soft delete

Retire boards (`lifecycle_status = retired`). Do not hard-delete inventory needed for audit/history.

## Functions to reuse

| Function | Purpose |
| --- | --- |
| `face_occupancy_dimension` | derived occupancy |
| `board_compliance_dimension` | derived compliance |
| `face_is_marketplace_eligible` | public eligibility |
| `face_available_from` | next free date |
| `refresh_operational_alerts` | vacancy + compliance notifications |
| `submit_marketplace_enquiry` | public enquiry + rate limit |
| `write_audit_log` | audit |
| `create_organization` | org + owner membership + settings |
