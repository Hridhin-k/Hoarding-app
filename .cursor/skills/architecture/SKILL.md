---
name: architecture
description: HOARDINGS360 modular-monolith layout, domain modules, server vs client boundaries, and where business logic belongs. Use when adding features, choosing file locations, creating modules, or deciding between Server Components, Client Components, and domain services.
---

# HOARDINGS360 ARCHITECTURE SKILL

Use this skill when creating or moving application code.

## Layout

```
app/                 routes only — thin
components/          UI (ui/, manage/, market/, field/)
lib/<domain>/        business logic, queries, mutations, validation
lib/supabase/        clients (do not put domain logic here)
lib/permissions/     RBAC catalog
supabase/migrations/ schema source of truth
docs/                product and engineering contracts
```

Domains: auth, organizations, boards, faces, compliance, documents, occupancy, vacancy, customers, enquiries, campaigns, field, proof, marketplace, notifications, audit.

## Rules

1. Keep pages thin. Fetch in server code; render in components; mutate in domain modules / server actions.
2. Prefer Server Components. `"use client"` only for interaction, maps, QR, geolocation, forms, offline.
3. Do not put Supabase queries in random components. Colocate in `lib/<domain>/queries.ts` or `mutations.ts`.
4. Do not create microservices, a generic `lib/utils` dumping ground, or a second backend.
5. Next.js 16 APIs may differ from training data. Read `node_modules/next/dist/docs/` first.
6. Reuse `lib/supabase/{server,client,admin,proxy}.ts`. Never import admin from the browser.

## Existing clients

| File | Use |
| --- | --- |
| `lib/supabase/server.ts` | RSC, actions, route handlers |
| `lib/supabase/client.ts` | browser |
| `lib/supabase/admin.ts` | service role, `server-only` |
| `lib/supabase/proxy.ts` | session + coarse route gates |

## After changing structure

Update `docs/ARCHITECTURE.md` if the layout or a boundary changes.
