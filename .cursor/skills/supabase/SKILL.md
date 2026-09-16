---
name: supabase
description: HOARDINGS360 Supabase Auth, Postgres, RLS, Storage, migrations, and client usage. Use when writing queries, migrations, RLS policies, storage uploads, RPCs, or anything that touches tenant_id, service role, or signed URLs.
---

# HOARDINGS360 SUPABASE SKILL

Use this skill for all backend work.

## Clients

- Browser: `lib/supabase/client.ts` (anon key only)
- Server: `lib/supabase/server.ts` (user session, RLS applies)
- Admin: `lib/supabase/admin.ts` (service role). Bypass of RLS. Use only when there is no user session and the operation is explicitly server-trusted. Never expose `SUPABASE_SERVICE_ROLE_KEY`.

## Tenancy

- Membership: `is_org_member(tenant_id)`
- Role: `member_role(tenant_id)`
- Permission: `has_permission(tenant_id, permission)`
- Cookie `h360_tenant` is UX context, not authorization
- Never take `tenant_id` from the client as proof of access
- `prevent_tenant_change` blocks tenant_id updates

## Schema changes

1. Read existing migrations in `supabase/migrations/`.
2. Add a new ordered SQL migration. Do not edit applied migrations.
3. Enable RLS on every new tenant-owned table.
4. Add FK, indexes, and `prevent_tenant_change` where `tenant_id` exists.
5. Update `docs/DATABASE.md`.

## Storage

Private buckets: `board-images`, `documents`, `proof-of-display`.

Path: `{tenant_id}/...`

Serve files with signed URLs. Do not make buckets public.

Validate MIME, size, and extension in application code as well as bucket limits.

## Public surface

Anon may:

- `SELECT` `marketplace_listings`, `marketplace_photos`
- `EXECUTE` `submit_marketplace_enquiry`

Anon must not read tenant tables directly.

## Errors

Map Postgres errors (exclusion, unique, FK, check) to user-facing strings. Log the technical error server-side.
