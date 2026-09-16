# Production deployment

HOARDINGS360 MVP deployment guide. The product is a Next.js modular monolith on hosted Supabase. Do not introduce Docker Compose, Prisma, or a second backend for launch.

## Environment variables

Copy `.env.example` → `.env.local` (local) or set the same keys in the hosting provider.

| Variable | Required | Where | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | public | Anon / publishable key (RLS enforced) |
| `NEXT_PUBLIC_SITE_URL` | yes in prod | public | Canonical site URL (auth redirects, sitemap, OG) |
| `SUPABASE_SERVICE_ROLE_KEY` | yes for cron + signed URLs | **server only** | Never prefix with `NEXT_PUBLIC_` |
| `CRON_SECRET` | yes in prod | server | Bearer token for `/api/cron/operations` |
| `NEXT_PUBLIC_MAP_PROVIDER` | no | public | `maplibre` (default) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | no | public | Optional Maps Embed key for in-app Street View (restrict by HTTP referrer) |
| `GOOGLE_MAPS_API_KEY` | no | server | Reserved; MapLibre is the MVP map |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | no | public | Optional bot protection |
| `TURNSTILE_SECRET_KEY` | no | server | Optional bot protection |

Runtime validation lives in `lib/env.ts`. Missing public Supabase vars fail closed.

### Secrets checklist

- Service role key appears only in server env and `lib/supabase/admin.ts` (`import "server-only"`).
- Cron secret must match the `Authorization: Bearer …` header.
- Never commit `.env.local`.

## Supabase setup

1. Create a hosted Supabase project (region close to users).
2. Enable extensions used by migrations: `postgis`, `pgcrypto`, `btree_gist` (migrations apply these).
3. Link the CLI and push schema:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

4. Optional demo data (non-production):

```bash
npx supabase db query -f supabase/seed.sql
```

5. Auth settings (Dashboard → Authentication):

- Site URL = `NEXT_PUBLIC_SITE_URL`
- Redirect URLs include `{SITE_URL}/auth/callback` and `{SITE_URL}/reset-password`
- Email confirmations as required by your launch policy

6. Confirm PostGIS: boards use `geography(Point, 4326)`.

Do **not** use `supabase start` / local Docker as the primary backend for this project.

## Database migrations

Canonical schema: `supabase/migrations/` (ordered timestamps).

Apply only via:

```bash
npx supabase db push
```

Never edit production tables by hand. Never recreate existing tables from app code.

After push, spot-check:

```bash
npx supabase db query -f supabase/tests/invariants.sql
```

Key invariants: tenant RLS, occupancy exclusion, marketplace eligibility, hardened RPC grants (`expire_holds` / `refresh_operational_alerts` are `service_role` only).

## Storage buckets

Created by migration `20260915120009_storage.sql`. All buckets are **private**.

| Bucket | MIME | Max size | Path pattern |
| --- | --- | --- | --- |
| `board-images` | jpeg/png/webp | 15 MB | `{tenant_id}/boards/...` |
| `documents` | pdf/images/docx | 20 MB | `{tenant_id}/documents/...` |
| `proof-of-display` | jpeg/png/webp | 15 MB | `{tenant_id}/proof/...` |

Access: authenticated RLS on `storage.objects` + short-lived signed URLs from the server (`lib/storage/signed-url.ts`). Marketplace photos use signed URLs; buckets stay private.

## Deployment (Vercel recommended)

1. Import the Git repo into Vercel.
2. Set all environment variables (Production + Preview as needed).
3. Framework: Next.js. Build: `npm run build`. Output: default.
4. `vercel.json` schedules daily cron (`0 0 * * *`, 00:00 UTC) → `GET /api/cron/operations` with `CRON_SECRET`. Vercel Hobby allows at most one run per day; hourly (`0 * * * *`) requires Pro. Holds and vacancy alerts are date-based (`CURRENT_DATE`), so daily is enough for MVP.
5. Deploy. Hit `GET /api/health` — expect `{ ok: true, envConfigured: true }`.
6. Smoke:

- `/market` public list
- `/login` → create org via `/onboarding` (first OWNER)
- `/manage` dashboard
- `/field` as technician invite

### Alternative hosts

Any Node host that runs `next start` works. Schedule an external cron:

```bash
curl -X GET "$SITE_URL/api/cron/operations" \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Admin bootstrap

1. Sign up at `/signup`.
2. Complete `/onboarding` → `create_organization` RPC creates the tenant and OWNER membership.
3. OWNER invites roles from `/manage/team` (`ADMIN`, `OPS_MANAGER`, `SALES`, `COMPLIANCE`, `TECHNICIAN`).
4. Technicians land on `/field` (Manage redirects when they lack `boards.view`).
5. Seed file creates demo tenants for QA only — do not seed production.

## Apps and journeys

| Surface | Prefix | Primary roles |
| --- | --- | --- |
| Manage | `/manage` | OWNER, ADMIN, OPS, SALES, COMPLIANCE |
| Marketplace | `/market` | public advertisers |
| Field PWA | `/field` | TECHNICIAN (+ managers with `field.view`) |
| Platform | `/platform` | HOARDINGS360 `platform_staff` only |

Manifest: `/manifest.webmanifest` (Field installable PWA). Service worker: `public/sw.js`.

## Monitoring and logging

- **Liveness:** `GET /api/health`
- **Ops cron:** daily alerts refresh + hold expiry (00:00 UTC); failures return HTTP 500 (surface in host logs)
- **Audit:** `audit_logs` via `write_audit_log` (membership-gated)
- **Notifications:** vacancy / compliance alerts from `refresh_operational_alerts`
- **App errors:** `app/error.tsx` shows digest; wire host log drain (Vercel → preferred sink) for production

MVP does not ship a third-party APM. Add Sentry/Datadog only if explicitly approved.

## Backup and recovery

| Layer | Recommendation |
| --- | --- |
| Postgres | Enable Supabase PITR / daily backups on the paid plan before real customer data |
| Storage | Supabase Storage is durable; critical compliance PDFs should also be retained by the media owner offline |
| Schema | Migrations in git are the rebuild path — never “fix prod” without a new migration |
| Secrets | Rotate service role + cron secret if leaked; revoke compromised Auth users |
| Restore drill | Quarterly: restore to a staging project, `db push`, smoke Manage + Market + Field |

Recovery order if the app is wiped but Supabase remains:

1. Redeploy Next.js with the same env vars.
2. Confirm migrations are applied (`supabase migration list`).
3. Buckets and RLS policies come from migrations — re-push if a new environment.

If the database is lost:

1. Create a new project.
2. `db push` all migrations.
3. Restore the latest backup / PITR.
4. Re-point env URL/keys and redeploy.

## Known MVP limitations (acceptable for launch)

- Marketplace eligibility is evaluated via SQL functions per row — fine for early inventory volumes; materialize later if listings grow large.
- Public enquiry abuse protection uses IP-hash rate limits in Postgres; Turnstile env keys are reserved but optional.
- Occupancy timeline loads active faces for the tenant (paginate further when fleets exceed ~hundreds of faces).
- Geocode rate limit is in-memory per instance.
- No third-party APM yet — use host logs + `/api/health` + cron HTTP status.

## Pre-launch verify

```bash
npx tsc --noEmit
npm run lint
npm test
npm run test:e2e
npm run build
```

Release blockers: any Tenant A → Tenant B data leak, service-role in the browser, public access to documents/proofs, marketplace exposure of `floor_rate` or ineligible faces.

## Related docs

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DATABASE.md](./DATABASE.md)
- [SECURITY.md](./SECURITY.md)
- [PERMISSIONS.md](./PERMISSIONS.md)
- [TESTING.md](./TESTING.md)
- [MVP_SCOPE.md](./MVP_SCOPE.md)
- [USER_FLOWS.md](./USER_FLOWS.md)
