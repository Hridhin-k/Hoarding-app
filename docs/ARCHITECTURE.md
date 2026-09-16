# Architecture

Modular monolith. Next.js App Router + TypeScript + hosted Supabase. No microservices.

## Current repository state (2026-09-15)

Phase 0 foundation is in place on top of the existing hosted schema:

- Next.js 16 App Router, TypeScript, Tailwind 4, shadcn/ui (base-nova / Base UI)
- ESLint (`eslint-config-next`) and Vitest
- Zod-validated environment (`lib/env.ts`)
- Supabase clients: browser, server (cookie session), proxy, and server-only admin
- Route groups `(auth)` `(manage)` `(market)` `(field)` `(platform)` with application shells
- Domain modules under `lib/` (auth, permissions, validation, storage, maps, occupancy, vacancy, audit, platform)

Later-phase product surfaces already exist (inventory, occupancy, marketplace, field). Do not recreate schema. Extend it.

## Layout

```
app/
  (auth)/              login, signup + auth chrome
  (manage)/manage/     operator console (sidebar shell)
  (market)/market/     public marketplace (site header)
  (field)/field/       technician PWA (field shell)
  (platform)/platform/ HOARDINGS360 staff console (not a tenant role)
  api/                 only when a Route Handler is required
components/
  ui/                  shadcn primitives
  manage/              Manage navigation/shell
  market/              marketplace chrome and forms
  field/               field PWA chrome
  platform/            platform operations chrome
lib/
  env.ts               public vs server env validation
  supabase/            client, server, admin (server-only), proxy
  auth/                session + server actions (types only from index)
  permissions/
  validation/
  storage/             file rules; signed URLs stay server-side
  maps/
  occupancy/
  vacancy/             vacancy copy/dates derived from occupancy
  audit/               write_audit_log RPC wrapper (server-only)
  platform/            M33 V1 staff console (inspect, tenant status)
supabase/migrations/
docs/
```

Public URLs stay `/manage`, `/market`, `/field`, `/platform`. Route groups do not appear in the path.

## Boundaries

| Layer | Allowed | Forbidden |
| --- | --- | --- |
| React components | render, local UI state, interaction | occupancy math, RLS, multi-step DB writes |
| Server actions / domain modules | validation, orchestration, audit | service-role key in client bundles |
| Postgres | invariants, overlap, eligibility, tenancy | business rules that exist only in JS |

Prefer Server Components. Client Components for forms, maps, QR, geolocation, offline.

## Supabase clients

| Module | Key | Runtime |
| --- | --- | --- |
| `lib/supabase/client.ts` | anon / publishable | browser |
| `lib/supabase/server.ts` | anon / publishable + cookies | Server Components, Route Handlers, Server Actions |
| `lib/supabase/proxy.ts` | anon / publishable + request cookies | `proxy.ts` session refresh |
| `lib/supabase/admin.ts` | **service role** via `server-only` | privileged server jobs only |

`SUPABASE_SERVICE_ROLE_KEY` is never prefixed with `NEXT_PUBLIC_`. Admin client throws if it is missing. The tenant cookie is UX context, not authorization — RLS uses `auth.uid()`.

## Data access

Page-level server queries. Reuse `lib/<domain>/` modules. Do not N+1 fetch the same board from three client components.

## Errors

Never show raw Postgres messages. Example: exclusion violation → "This face already has a reservation during the selected dates."

## Types

Generate from Supabase when practical. Avoid `any` and `as unknown as`.

## Next.js 16

Read `node_modules/next/dist/docs/` before using APIs. This repo's `AGENTS.md` Next.js block is auto-maintained by `next dev` — do not delete it. Session gating lives in `proxy.ts`, not `middleware.ts`.

## Related

[DATABASE.md](./DATABASE.md) · [SECURITY.md](./SECURITY.md) · [DECISIONS.md](./DECISIONS.md)
