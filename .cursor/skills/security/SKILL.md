---
name: security
description: HOARDINGS360 RBAC, IDOR protection, tenant isolation, audit logging, and public vs private data. Use when adding routes, mutations, RLS, marketplace access, field jobs, or any feature that reads or writes tenant data.
---

# HOARDINGS360 SECURITY SKILL

Use this skill for authorization and tenant isolation.

## Checklist for every mutation

1. User is authenticated (except explicitly public RPCs).
2. User is an active member of the tenant.
3. Role has the required permission (`lib/permissions/catalog.ts` + `role_permissions`).
4. Target row's `tenant_id` is that tenant (RLS, not a client-supplied id).
5. Sensitive changes write an audit log via `write_audit_log`.

## Roles

`OWNER` `ADMIN` `OPS_MANAGER` `SALES` `COMPLIANCE` `TECHNICIAN`

Do not invent new roles without a migration and a docs update.

## Permissions

Do not check `role === 'ADMIN'` in UI or server code for capability.

Check permissions: `has_permission` / `roleHasPermission`.

If you add a permission, update:

- `supabase/migrations` insert into `role_permissions`
- `lib/permissions/catalog.ts`
- `docs/PERMISSIONS.md`

## IDOR

Knowing `/manage/boards/<uuid>` is not access. Server query + RLS must fail closed for the other tenant.

## Public marketplace

Return only columns on `marketplace_listings` / `marketplace_photos`.

Never expose `floor_rate`, customers, documents, contracts, internal notes, tenant ids in public JSON unless product explicitly requires a non-identifying handle.

## Field

Technicians: `field.view` only, assigned jobs only.

QR scan is asset identification, not auth.

## Tests

Every tenant-owned feature needs: Tenant A allowed, Tenant B denied.
