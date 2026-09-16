# Security

Security is release-blocking. Frontend hiding is not security.

## Trust boundaries

Never trust:

- route params
- request body `tenant_id`
- hidden fields
- client role checks
- the `h360_tenant` cookie (UX only)

Trust:

- `auth.uid()`
- `organization_members` (active)
- RLS policies
- `has_permission(tenant_id, permission)`

## Service role

`SUPABASE_SERVICE_ROLE_KEY` must not appear in Client Components, `NEXT_PUBLIC_*`, or public responses.

Only `lib/supabase/admin.ts` (`import "server-only"`).

## IDOR

A guessed UUID must fail closed via RLS. Always query as the user, not as service role, for tenant CRUD.

## Public marketplace

Anon may read `marketplace_listings` / `marketplace_photos` and call `submit_marketplace_enquiry`.

Must not leak: customers, contracts, documents, internal notes, `floor_rate`, tenant internals, member lists.

Enquiries are rate-limited (5/hour per IP hash) inside the RPC.

## Storage

All buckets private. Paths `{tenant_id}/...`. Signed URLs. Validate MIME, size, ownership.

## Audit

Use `write_audit_log` for create/update/delete, publish/unpublish, occupancy, compliance, enquiry, field completion, proof upload. Do not store secrets or full document contents in `old_data`/`new_data`.

## Field

QR is not login. Technicians cannot use Manage admin. Proof insert requires `captured_by = auth.uid()` and an assigned in-progress/assigned job (or `field.manage`).

## Platform staff

HOARDINGS360 staff are `platform_staff` rows, not tenant members. They use `/platform` only.

- Inspect requires a reason (≥ 8 characters), lasts 30 minutes, and writes `platform_audit_logs`.
- Staff cannot `SELECT` tenant tables through RLS. Inspect data comes from `platform_tenant_detail`.
- Only `SUPER_ADMIN` can suspend/reactivate. Suspend sets `organizations.status` and removes marketplace eligibility.
- Tenant owners cannot call platform RPCs.

## Testing

Every tenant-owned feature: Tenant A allowed on A, denied on B.

See [PERMISSIONS.md](./PERMISSIONS.md) and [TESTING.md](./TESTING.md).

## Operations

- Health: `GET /api/health`
- Cron (service role): `GET|POST /api/cron/operations` with `Authorization: Bearer $CRON_SECRET`
- Deploy runbook: [DEPLOYMENT.md](./DEPLOYMENT.md)
