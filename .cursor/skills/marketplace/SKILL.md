---
name: marketplace
description: HOARDINGS360 public marketplace eligibility, listings, search, photos, and enquiries. Use when building /market pages, publishing faces, or exposing inventory to anonymous users.
---

# HOARDINGS360 MARKETPLACE SKILL

Use this skill for public inventory and enquiries.

## Eligibility (server-side only)

Reuse `face_is_marketplace_eligible(face_id)`:

- board `lifecycle_status = active`
- face `marketplace_visible` and `publishable`
- mandatory compliance not `expired` or `missing`
- occupancy dimension is not `blocked`

Do not reimplement this in React.

## Reads

Query `marketplace_listings` and `marketplace_photos`.

Do not select from `boards` / `board_faces` in public routes.

Public rate is `card_rate`. Never return `floor_rate`.

## Writes

Create enquiries only through `submit_marketplace_enquiry`.

That RPC validates input, rate-limits by IP hash (5/hour), checks eligibility, inserts a tenant enquiry, notifies sales, and writes an audit row.

Do not expose tenant name, members, or internal ids beyond what the listing view already returns.

## Search

Server-side filters + pagination. Never download the full inventory to the client.
