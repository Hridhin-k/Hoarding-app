# Testing

A feature is not done when the screen looks right.

## Layers

| Layer | What |
| --- | --- |
| Unit | validation, occupancy/compliance display helpers, permission helpers |
| Integration | migrations, RLS, exclusion constraint, marketplace eligibility, enquiry RPC |
| E2E | critical user journeys once UI exists |

## Mandatory security tests

For every tenant-owned feature:

- Tenant A → Tenant A = allowed
- Tenant A → Tenant B = denied (including known UUIDs)

## Occupancy cases

- overlap rejected
- adjacent inclusive periods allowed (end D, start D+1)
- same-day period allowed if no overlap
- future `booked_future`
- `on_hold` and `blocked` also conflict via the same exclusion
- cancel / delete frees the range
- concurrent inserts: one succeeds
- `becoming_vacant` inside `vacancy_prelisting_days` with no follow-on booking

## Marketplace cases

- unpublished / inactive / blocked / missing compliance not listed
- `floor_rate` absent from public payload
- enquiry rate limit
- enquiry on ineligible face rejected

## Field cases

- complete proof_capture without photo+GPS rejected
- technician cannot read another technician's job
- QR scan without membership grants nothing

## E2E (when routes exist)

Signup → org → board → face → compliance → occupancy → vacancy → publish → marketplace enquiry → manage enquiry → field job → QR → proof.

## Edge cases

empty, invalid, duplicate, expired, unauthorized, wrong tenant, network failure, missing required fields.

## Definition of done

```bash
npx tsc --noEmit
npm run lint
npm run build
```

plus tests for the new logic. Failures, untested RLS, or ignored critical errors mean not done.

```bash
npm test
npx supabase db query --linked -f supabase/tests/invariants.sql
```

Phase 1 RLS tests in `lib/auth/rls.test.ts` sign in as seed users against hosted Supabase and assert Tenant A cannot read Tenant B.

Platform staff tests in `lib/platform/platform.rls.test.ts`: tenant owners cannot call platform RPCs; staff cannot read tenant tables without inspect; suspend hides marketplace listings.
