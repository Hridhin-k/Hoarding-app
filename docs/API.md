# API

The MVP has no custom Nest/Express API. The browser and server talk to Supabase under RLS. Next.js Route Handlers exist only when a secret or non-RLS step is required (signed URLs, IP hashing for enquiries, webhooks).

## Clients

| Client | Key | RLS |
| --- | --- | --- |
| `lib/supabase/client.ts` | anon | yes |
| `lib/supabase/server.ts` | anon + user cookies | yes |
| `lib/supabase/admin.ts` | service role | bypass — server only |

## RPCs (application should call these, not reimplement)

| Function | Who | Purpose |
| --- | --- | --- |
| `create_organization(name, slug, ...)` | authenticated | tenant bootstrap |
| `is_org_member(tenant_id)` | authenticated / anon | membership |
| `member_role(tenant_id)` | authenticated | role |
| `has_permission(tenant_id, permission)` | authenticated / anon | RBAC |
| `write_audit_log(...)` | authenticated | audit |
| `face_occupancy_dimension(face_id, as_of)` | authenticated / anon | derived occupancy |
| `board_compliance_dimension(board_id)` | authenticated / anon | derived compliance |
| `face_is_marketplace_eligible(face_id)` | authenticated / anon | publish gate |
| `face_available_from(face_id)` | authenticated / anon | next free date |
| `refresh_operational_alerts()` | **service_role only** | vacancy + compliance notifies (cron) |
| `refresh_tenant_operational_alerts(tenant)` | authenticated + permission | tenant-scoped alert refresh after occupancy mutations |
| `expire_holds(as_of?)` | **service_role only** | expire holds (cron) |
| `submit_marketplace_enquiry(...)` | anon / authenticated | public lead capture |
| `is_platform_staff()` | authenticated | platform operator check |
| `platform_overview()` | platform staff | cross-tenant counts |
| `platform_list_tenants()` | platform staff | tenant directory |
| `platform_start_inspect(tenant, reason)` | platform staff | start 30-minute inspect |
| `platform_tenant_detail(session)` | platform staff | inspect payload |
| `platform_set_tenant_status(...)` | platform SUPER_ADMIN | suspend / reactivate |

## Public views

- `marketplace_listings`
- `marketplace_photos`

## Server actions convention

When UI mutations are added, colocate in `lib/<domain>/mutations.ts` (or `app/.../actions.ts` that delegates there).

Validate with Zod. Resolve tenant from session membership, not from the form. Write audit logs. Translate DB errors.

## Do not

- Expose service role
- Return `floor_rate` on public endpoints
- Insert `enquiries` as anon except via `submit_marketplace_enquiry`
- Fetch entire tables for client-side filter
