# Architecture decision log

Record significant decisions here. Newest at the bottom. Status: Proposed | Accepted | Superseded.

---

## ADR-001

Decision: Use Supabase as the backend for MVP.

Reason: Reduce infrastructure complexity and validate the product faster. Auth, Postgres, Storage, and RLS in one platform.

Status: Accepted.

---

## ADR-002

Decision: Use PostgreSQL exclusion constraints for face occupancy conflicts.

Reason: Application-level check-then-insert is not safe under concurrent requests.

Implementation: `occupancy_periods_no_overlap` on `face_id` + inclusive `daterange`.

Status: Accepted.

---

## ADR-003

Decision: Model board faces as independent inventory.

Reason: Each physical face can have different pricing, direction, availability, and advertiser.

Status: Accepted.

---

## ADR-004

Decision: Keep lifecycle, compliance, and occupancy as independent dimensions.

Reason: An active occupied board with expired permits is a real operating state. A single status flag hides it.

Status: Accepted.

---

## ADR-005

Decision: Occupancy date ranges are inclusive on both ends.

Reason: `daterange(start_date, end_date, '[]')` matches how media contracts are sold (start day through end day). Adjacent bookings start the day after the previous end date.

Status: Accepted.

---

## ADR-006

Decision: Marketplace eligibility and vacancy are computed in PostgreSQL (`face_is_marketplace_eligible`, `face_occupancy_dimension`, `refresh_operational_alerts`).

Reason: Public exposure and sales alerts must not depend on which UI happened to render.

Status: Accepted.

---

## ADR-007

Decision: All storage buckets are private; marketplace images use signed URLs, not a public bucket.

Reason: Prevent listing or hotlinking of unpublished or other-tenant objects.

Status: Accepted.

---

## ADR-008

Decision: RBAC is a permission catalog (`role_permissions` + `lib/permissions/catalog.ts`), not scattered role string checks.

Reason: Sales can publish without being admin; technicians are field-only. Role equality checks will drift.

Status: Accepted.

---

## ADR-009

Decision: Build order is foundation / tenancy / RLS before dashboard UI.

Reason: Multi-tenant marketplace leakage is harder to retrofit than a late dashboard.

Status: Accepted.

---

## ADR-010

Decision: Out of MVP — payments, GST, e-sign, AI pricing, native apps, extra datastores.

Reason: Validate board → face → compliance → vacancy → enquiry → proof first.

Status: Accepted.
