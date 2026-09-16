---
name: testing
description: HOARDINGS360 test requirements for unit, integration, RLS, occupancy, and E2E. Use when adding features, writing tests, or deciding whether a feature is done.
---

# HOARDINGS360 TESTING SKILL

A UI that works is not done.

## Required coverage by change type

| Change | Tests |
| --- | --- |
| Validation / state math | unit |
| SQL, RLS, occupancy, marketplace eligibility | integration against Postgres |
| Signup → board → occupancy → enquiry → proof | E2E when the flow exists |

## Mandatory security test

Tenant A can access Tenant A.

Tenant A cannot access Tenant B.

## Occupancy cases

overlap, adjacent inclusive dates, future booking, hold, blocked, cancel, concurrent insert, timezone/date boundary.

## Verify before claiming done

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Plus the relevant test command for the layer you added.

Do not skip RLS tests because "the UI hides the row".
