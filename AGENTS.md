<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# HOARDINGS360 agent instructions

You are building a production product, not a prototype.

Follow `.cursor/rules/` (especially `99-development-protocol.mdc` and `16-mvp-scope.mdc`).

Load the matching skill in `.cursor/skills/` when the task is architecture, supabase, security, database, ui, occupancy, marketplace, field, or testing.

Read `docs/` before changing product behaviour, schema, or permissions.

## Non-negotiables

- Board ≠ face. Occupancy and selling are face-level.
- Lifecycle, compliance, and occupancy stay independent.
- RLS is mandatory. Never trust client `tenant_id`.
- Never expose `SUPABASE_SERVICE_ROLE_KEY`.
- Schema already exists in `supabase/migrations/`. Extend it; do not recreate it.
- Stay inside MVP scope (`docs/MVP_SCOPE.md`). Wait for approval on anything outside.
- Stay inside the requested phase. Do not skip to dashboard UI before tenancy/RLS work is actually used by the app.

## Verify before claiming done

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Plus tests for new business logic and a Tenant A / Tenant B isolation check.

## Report format

Implemented · Files changed · Database changes · Tests · Security · Limitations · Next step
