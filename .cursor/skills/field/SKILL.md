---
name: field
description: HOARDINGS360 Field PWA for technicians — jobs, QR, GPS proof of display, and offline upload. Use when building /field routes, proof capture, job completion, or technician-only access.
---

# HOARDINGS360 FIELD SKILL

Use this skill for technician workflows.

## Objective

Complete assigned work quickly on a phone, including on poor networks.

## Flow

Today's Jobs → Open Job → Navigate → Start → Scan QR → Capture Proof → Complete

## Constraints

- Technicians have `field.view`. They see assigned jobs, not Manage admin.
- QR (`boards.qr_slug`) identifies an asset. It does not grant permission.
- Proof requires: photo, latitude, longitude, accuracy, `captured_at`, `captured_by`.
- `proof_capture` jobs cannot complete without a `proof_records` row.
- Storage bucket: `proof-of-display`, path `{tenant_id}/...`, signed URLs only.

## Offline

Queue proof locally if upload fails. Retry on reconnect. Do not build a generic sync engine.

## UX

Large touch targets, one primary action, no desktop table layouts.
