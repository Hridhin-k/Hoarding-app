---
name: ui
description: HOARDINGS360 B2B UI patterns for Manage, Market, and Field. Use when building pages, tables, forms, status badges, empty/error states, or choosing shadcn components versus custom UI.
---

# HOARDINGS360 UI SKILL

Use this skill for interface work.

## Product surfaces

| Surface | Prefix | Priority |
| --- | --- | --- |
| Manage | `/manage` | desktop-first, operational |
| Market | `/market` | mobile-first, visual, SEO |
| Field | `/field` | mobile-first, few taps |

## Visual bar

Chrome / Google web UI: light gray page, white surfaces, `#1a73e8` primary, quiet borders.

Professional, dense, trustworthy. Information hierarchy over decoration.

Do not use loud gradients, glassmorphism, grain, night-city palettes, or inverted black nav pills.

## Components

Use `components/ui/*` (shadcn). Do not add another UI kit.

Forms: React Hook Form + Zod. Inline errors. Preserve input after recoverable failures.

Tables: search, filter, paginate when lists can grow. Plan a mobile strategy (cards or priority columns). Do not rely on unbounded horizontal scroll.

## Required states

loading, empty, error, success, permission denied, no results.

## Status

Lifecycle, compliance, and occupancy are independent. Show them as separate badges. Never collapse into one "board status".

## Accessibility

Semantic HTML, labelled inputs, buttons vs links, dialog titles, keyboard access. Do not communicate state by color alone.

## Maps / QR

Load MapLibre and html5-qrcode only on the screens that need them.
