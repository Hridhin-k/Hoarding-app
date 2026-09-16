# Permissions

Canonical sources (must stay in sync):

- Database: `public.role_permissions`
- TypeScript: `lib/permissions/catalog.ts`

Do not add a permission in only one place. Do not authorize with `role === "ADMIN"` in application code.

## Roles

| Role | Intent |
| --- | --- |
| OWNER | Full access |
| ADMIN | Same operational surface as owner |
| OPS_MANAGER | Inventory + field + occupancy; no team/settings/delete board/marketplace publish |
| SALES | View inventory, occupancy, enquiries, customers, campaigns, publish |
| COMPLIANCE | Boards/faces view + compliance/documents |
| TECHNICIAN | `field.view` only |

## Permission catalog

```
boards.view | boards.create | boards.update | boards.delete
faces.view | faces.create | faces.update | faces.delete
compliance.view | compliance.manage
occupancy.view | occupancy.manage
enquiries.view | enquiries.manage
field.view | field.manage
documents.view | documents.manage
team.manage
settings.manage
audit.view
marketplace.publish
customers.view | customers.manage
campaigns.view | campaigns.manage
```

## Matrix

| Permission | OWNER | ADMIN | OPS | SALES | COMPLIANCE | TECH |
| --- | --- | --- | --- | --- | --- | --- |
| boards.view | ✓ | ✓ | ✓ | ✓ | ✓ | |
| boards.create | ✓ | ✓ | ✓ | | | |
| boards.update | ✓ | ✓ | ✓ | | | |
| boards.delete | ✓ | ✓ | | | | |
| faces.view | ✓ | ✓ | ✓ | ✓ | ✓ | |
| faces.create | ✓ | ✓ | ✓ | | | |
| faces.update | ✓ | ✓ | ✓ | ✓ | | |
| faces.delete | ✓ | ✓ | | | | |
| compliance.view | ✓ | ✓ | ✓ | | ✓ | |
| compliance.manage | ✓ | ✓ | | | ✓ | |
| occupancy.view | ✓ | ✓ | ✓ | ✓ | | |
| occupancy.manage | ✓ | ✓ | ✓ | ✓ | | |
| enquiries.view | ✓ | ✓ | ✓ | ✓ | | |
| enquiries.manage | ✓ | ✓ | | ✓ | | |
| field.view | ✓ | ✓ | ✓ | | | ✓ |
| field.manage | ✓ | ✓ | ✓ | | | |
| documents.view | ✓ | ✓ | ✓ | ✓ | ✓ | |
| documents.manage | ✓ | ✓ | ✓ | | ✓ | |
| team.manage | ✓ | ✓ | | | | |
| settings.manage | ✓ | ✓ | | | | |
| audit.view | ✓ | ✓ | | | | |
| marketplace.publish | ✓ | ✓ | | ✓ | | |
| customers.view | ✓ | ✓ | ✓ | ✓ | | |
| customers.manage | ✓ | ✓ | | ✓ | | |
| campaigns.view | ✓ | ✓ | ✓ | ✓ | | |
| campaigns.manage | ✓ | ✓ | | ✓ | | |

## RLS extras (not extra permissions)

- Technicians can `SELECT` boards/faces tied to their assigned field jobs.
- Technicians `SELECT`/`UPDATE` only jobs where `assigned_to = auth.uid()`.
- Face `UPDATE` also allowed with `marketplace.publish` (so sales can toggle publish flags without full face admin).
- `enquiry_rate_limits`: no direct client access.
- Notifications: own rows only.
- Public marketplace: views + `submit_marketplace_enquiry`, not table grants.

## Platform staff (not a tenant role)

HOARDINGS360 operators are rows in `platform_staff`, not `organization_members`.

| Role | Surface |
| --- | --- |
| SUPER_ADMIN | `/platform` overview, tenants, inspect, suspend/reactivate |
| SUPPORT | `/platform` overview, tenants, inspect (no status change) |

Inspect is a 30-minute, reason-required, audited session (`platform_start_inspect` + `h360_platform_inspect` cookie). Staff do not impersonate into `/manage`; tenant RLS still hides tenant tables from them. Suspend hides marketplace listings (`organizations.status` must be `active` for `face_is_marketplace_eligible`). Owners can still use Manage.

Seed login (non-production): `platform@hoardings360.com` / `Password123!`.

## Server checks

Every sensitive operation: authenticated → active membership → permission → resource `tenant_id` matches. Route middleware is not enough.
