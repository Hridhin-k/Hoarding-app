---
name: ui
description: HOARDINGS360 B2B UI patterns for Manage, Market, Field, and Platform. Use when building pages, tables, forms, status badges, empty/error states, or choosing shadcn components versus custom UI.
---

# HOARDINGS360 UI SKILL

Use this skill for interface work.

## Product surfaces

| Surface | Prefix | Priority |
| --- | --- | --- |
| Manage | `/manage` | desktop-first, operational |
| Market | `/market` | mobile-first, visual, SEO |
| Field | `/field` | mobile-first, few taps, outdoor |
| Platform | `/platform` | desktop-first, internal |

## Visual bar

Light-only operational UI. Warm paper (`#F4F3EF`), white surfaces, charcoal type, quiet borders (`#E2DFD6`), restrained blue (`#1F4B99`). Geist. 6px radius.

No gradients, neon, dark mode, glass, glow, or rounded-full nav pills.

Tokens: `app/globals.css`. Shells: `components/manage/sidebar.tsx`, `components/market/site-header.tsx`, `components/field/field-shell.tsx`, `components/platform/sidebar.tsx`.

## Components

Use `components/ui/*` (shadcn). Do not add another UI kit.

Forms: React Hook Form + Zod. Inline errors. Preserve input after recoverable failures.

Tables: search, filter, paginate when lists can grow. Plan a mobile strategy (cards or priority columns). Do not rely on unbounded horizontal scroll.

## Required states

loading, empty, error, success, permission denied, no results.

## Status

Lifecycle, compliance, and occupancy are independent. Show them as separate badges with labels. Never collapse into one "board status".

## Accessibility

Semantic HTML, labelled inputs, buttons vs links, dialog titles, keyboard access. Do not communicate state by color alone.

## Maps / QR

Load MapLibre and html5-qrcode only on the screens that need them.
