# MVP scope

The MVP exists to validate the inventory graph, compliance, vacancy loop, marketplace enquiry, and field proof. Feature count is not the goal.

## In scope

- Authentication (Supabase Auth)
- Organizations, membership, invites
- Roles and permissions
- Boards, faces, locations (PostGIS)
- Board photos
- Compliance records and documents
- Occupancy periods and vacancy loop
- Dashboard (operational, not analytics suite)
- Customers
- Enquiries
- Lightweight campaigns (name, dates, customer, status — not a full media planner)
- Public marketplace (list, filter, detail, enquiry)
- Field PWA, QR, proof of display
- In-app notifications
- Audit logs
- Platform operations console (M33 V1.0: tenant list, inspect, suspend)

## Out of scope (do not implement unless explicitly requested)

- Payments, GST invoicing, marketplace commissions, complex billing
- E-signatures
- AI pricing or recommendations
- Audience measurement / DOOH programmatic
- Enterprise accounting or profitability suites
- Advanced CRM, WhatsApp/SMS automation
- Native iOS/Android apps
- Microservices, Redis, Kafka, RabbitMQ
- Custom auth, Prisma, Firebase, Nest, Express

## Scope control for agents

If a request is outside this list:

1. Say why it is outside MVP.
2. Say whether it blocks an in-scope workflow.
3. Offer the smallest in-scope alternative.
4. Wait for explicit approval.

Do not add "easy" extras.

## Build order

Stay on the requested phase. Do not skip ahead.

```
FOUNDATION (Supabase + architecture)
  → AUTH + TENANCY
    → RLS + PERMISSIONS
      → BOARD
        → FACES
          → COMPLIANCE          OCCUPANCY
                \              /
                 VACANCY LOOP
                /              \
          DASHBOARD          MARKETPLACE
                                  → ENQUIRY
                                    → FIELD PWA
                                      → PROOF OF DISPLAY
```

Schema, RLS, storage, and RPCs already exist in `supabase/migrations/`. Do not recreate them. Application UI and domain modules are the remaining work.
