# HOARDINGS360 — User guide

HOARDINGS360 helps outdoor media owners in Kerala run inventory (boards + faces), compliance, occupancy, marketplace enquiries, and field proof of display. Pan-India expansion comes later.

There are **four apps** in one site:

| App | URL | Who |
| --- | --- | --- |
| **Manage** | `/manage` | Owners, admins, ops, sales, compliance |
| **Marketplace** | `/market` | Public advertisers (no login) |
| **Field** | `/field` | Technicians (mobile PWA) |
| **Platform** | `/platform` | HOARDINGS360 staff only |

Core idea: a **board** is the physical structure. A **face** is what you sell. Lifecycle, compliance, and occupancy are separate statuses.

---

## 1. First-time setup (media owner)

1. Open `/signup` and create an account.
2. Complete `/onboarding` — create your organization. You become **OWNER**.
3. You land on `/manage` (Operations dashboard).

Invite your team from **Team** (`/manage/team`):

| Role | Typical use |
| --- | --- |
| ADMIN | Full ops (almost like owner) |
| OPS_MANAGER | Boards, occupancy, field jobs |
| SALES | Vacancies, enquiries, customers |
| COMPLIANCE | Permits and documents |
| TECHNICIAN | Field PWA only (`/field`) |

---

## 2. Demo accounts (if seed data is loaded)

Password for all seeded users: `Password123!`

| Email | Role |
| --- | --- |
| `owner@horizonoutdoor.com` | OWNER |
| `sales@horizonoutdoor.com` | SALES |
| `ops@horizonoutdoor.com` | OPS |
| `compliance@horizonoutdoor.com` | COMPLIANCE |
| `tech@horizonoutdoor.com` | TECHNICIAN → `/field` |
| `admin@horizonoutdoor.com` | ADMIN |
| `platform@hoardings360.com` | Platform SUPER_ADMIN → `/platform` |

Seed only on non-production environments (`supabase/seed.sql`).

---

## 3. Manage — day-to-day by role

### OWNER / OPS — inventory loop

1. **Boards** → **Add board** (`/manage/boards/new`)
   - Choose **district**, then **city** (cities are listed for that district). Locality / landmark are optional.
   - Drop a pin on the **satellite** map (real buildings). Search or use GPS, then drag the pin onto the structure. Location is required before the board can be **active**.
2. Open the board → add **faces** (label, size, direction, illumination, rates).
3. **Compliance** (`/manage/compliance`) — add mandatory permits; upload documents.
4. Set board lifecycle to **active** when ready.
5. On each face, use **Publish** when:
   - board is active  
   - mandatory compliance is valid  
   - face is marked marketplace-visible / publishable  

### OWNER / SALES — occupancy & vacancy

1. **Occupancy** (`/manage/occupancy`) — book, hold, or block dates on a **face**.
2. Dates are **inclusive** on both ends. Overlaps of occupied/booked periods are rejected by the database.
3. Near end of a booking, the face becomes **becoming vacant** (dashboard + notifications).
4. Publish eligible vacant / becoming-vacant faces to the marketplace.

### SALES — demand

1. Dashboard → **Upcoming Vacancies**.
2. **Enquiries** (`/manage/enquiries`) — open a lead, assign owner, change status (new → contacted → … → won/lost).
3. **Customers** (`/manage/customers`) — add advertisers; convert won enquiries.
4. **Campaigns** (lightweight) — link a customer to faces for a date range.

### COMPLIANCE

1. `/manage/compliance` — filter **expiring** / **expired**.
2. Upload renewal documents and update clearance status.
3. Private files download via short-lived signed URLs (never public links).

### Field job managers

1. **Field jobs** (`/manage/field-jobs`) — create a job, assign a technician, set board/face.
2. Technician completes proof in `/field`.
3. Review proofs from the job / board activity.

Other Manage pages: **Documents**, **Notifications**, **Audit**, **Settings**, **Profile**.

---

## 4. Marketplace (public advertiser)

No login required.

1. Open `/market`.
2. Filter by city, type, illumination, price, availability.
3. Open a board → review faces, dimensions, **card rate**, availability.
4. Submit an **enquiry** on a face.
5. The media owner sees it under **Enquiries** (source: marketplace).

You will never see internal floor rates, contracts, or private documents.

---

## 5. Field PWA (technician)

1. Log in as a technician → you are sent to `/field` (not Manage admin).
2. Open today’s assigned job.
3. **Navigate** (Google Maps link) → **Start** job.
4. **Scan QR** on site (`/field/scan` or on the job) — QR identifies the board; it is **not** a login.
5. **Capture proof**: photo + GPS + timestamp.
6. **Complete** the job (proof-capture jobs require a proof record).
7. **Sign out** from **Profile** (bottom tab or header avatar) when your shift ends.

Poor network: proofs queue offline and retry when connectivity returns. Install Field to the home screen (Profile → install tips) for a full-screen mobile app.

---

## 6. Recommended first walkthrough

Use this once after setup (or with seed data):

1. Login as **owner** → Dashboard.
2. Create or open a board → add a face.
3. Add a compliance permit + document.
4. Activate board → publish face.
5. Open `/market` (incognito) → find the face → submit enquiry.
6. Back in Manage → Enquiries → assign → mark contacted.
7. Occupancy → create a booking on that face.
8. Field jobs → assign technician → login as **tech** → complete proof.

---

## 7. Platform operations (HOARDINGS360 staff)

This is **not** a tenant OWNER screen. Sign in as `platform@hoardings360.com` (seed) → `/platform`.

1. **Overview** — tenant, board, listing, enquiry, and open field-job counts.
2. **Tenants** — every media-owner organization. Open one to inspect or suspend.
3. **Inspect** — write a support reason (≥ 8 characters). Session lasts 30 minutes and is audited. You see members, boards, and recent enquiries. You do **not** sign in as the owner or open `/manage` as them.
4. **Suspend** (super admin) — hides every listing from `/market`. The owner can still use Manage.
5. **Platform audit** — inspect starts and status changes, separate from tenant `audit_logs`.

Billing, verification badges, listing CMS, and impersonating into Manage are later M33 releases.

---

## 8. Important product rules

- Sell and book at **face** level, not board level.
- Do not mix statuses: a board can be **active** + compliance **expired** + face **occupied**.
- Technicians cannot use Manage admin screens.
- Private storage (documents, proofs) is never publicly browsable.

---

## 9. Where to read more

| Doc | Content |
| --- | --- |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Env keys, Supabase, deploy, backup |
| [PERMISSIONS.md](./PERMISSIONS.md) | Role × permission matrix |
| [USER_FLOWS.md](./USER_FLOWS.md) | Short flow map |
| [PRODUCT.md](./PRODUCT.md) | Product principles |
| [MVP_SCOPE.md](./MVP_SCOPE.md) | What is / isn’t in MVP |

Local run: `npm install` → copy `.env.example` to `.env.local` → `npm run dev` → http://localhost:3000
