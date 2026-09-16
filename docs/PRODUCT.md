# HOARDINGS360 product

HOARDINGS360 is an operating system and marketplace for India's outdoor advertising (OOH) industry. The MVP serves Kerala statewide, with expansion across India later.

> THE BOARD IS THE CORE ASSET.

A **board** is a physical structure. A board has one or more independently sellable **faces**. Selling, occupancy, pricing, and marketplace visibility always operate at face level. Never treat a board as a single inventory SKU.

## Hierarchy

Organization → Board → Face → Compliance → Documents → Occupancy → Enquiries / Campaigns → Field jobs → Proof

## Three independent dimensions

Do not collapse these into one "board status".

| Dimension | Values | Owner |
| --- | --- | --- |
| Lifecycle | draft, active, maintenance, blocked, retired | board |
| Compliance | valid, expiring, expired, missing | board (derived from mandatory records) |
| Occupancy | vacant, occupied, on_hold, booked_future, becoming_vacant, blocked | face (derived from periods) |

A board can be `active`, `expired` on permits, and `occupied` at the same time. That is valid and must remain visible in the UI.

## Vacancy loop

When a face is approaching the end of occupancy (tenant `vacancy_prelisting_days`, default 30):

1. Detect (`becoming_vacant`)
2. Notify sales
3. Show upcoming availability
4. Accept enquiry
5. Convert toward the next booking

Vacancy is a database-derived state, not a CSS calculation.

## Marketplace

A face is public only when eligibility is true server-side (`face_is_marketplace_eligible`). Public users see photos, location, dimensions, public rate, and availability — not customers, contracts, floor rates, or tenant internals.

## Field proof

Proof of display requires photo, GPS (lat/lng/accuracy), timestamp, and technician identity. QR identifies the asset; it is not authentication.

## Surfaces

| App | Audience | Priority |
| --- | --- | --- |
| Manage (`/manage`) | operators, sales, compliance | desktop-first |
| Market (`/market`) | public buyers | mobile-first, SEO |
| Field (`/field`) | technicians | mobile-first, few taps |
| Platform (`/platform`) | HOARDINGS360 staff | desktop-first operations |

Scope: [MVP_SCOPE.md](./MVP_SCOPE.md).
