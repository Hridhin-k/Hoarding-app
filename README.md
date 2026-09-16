# HOARDINGS360

Operating system and marketplace for outdoor advertising in Kerala, with expansion across India later.

The board is the physical asset. Faces are independently sellable inventory. Lifecycle, compliance, and occupancy are tracked as separate dimensions.

## Stack

- Next.js App Router + TypeScript
- Hosted Supabase (Auth, Postgres/PostGIS, Storage, RLS)
- Tailwind CSS + shadcn/ui

## Setup

1. Copy `.env.example` to `.env.local` and fill in the hosted project URL, anon key, and service role key.
2. Link and push schema (one time):

```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
```

3. Run the app:

```bash
npm install
npm run dev
```

Do not use Docker / `supabase start` for this project.

## Apps

- `/manage` — media owner operations
- `/market` — public marketplace
- `/field` — technician PWA

## Tests

```bash
npm test
npm run typecheck
npm run lint
npm run test:e2e
npm run build
```

## Production

See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for environment variables, Supabase setup, migrations, storage buckets, Vercel deploy, admin bootstrap, monitoring, and backup/recovery.

**Using the product:** [docs/USER_GUIDE.md](docs/USER_GUIDE.md)

Health check: `GET /api/health`

Ops cron: `GET|POST /api/cron/operations` (Bearer `CRON_SECRET`)
