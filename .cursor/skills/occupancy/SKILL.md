---
name: occupancy
description: HOARDINGS360 face occupancy, vacancy loop, holds, blocked dates, and booking conflicts. Use when implementing availability, bookings, occupancy calendars, vacancy alerts, or date-range logic on board faces.
---

# HOARDINGS360 OCCUPANCY SKILL

Use this skill whenever implementing:

- availability
- bookings
- holds
- blocked periods
- occupancy calendars
- vacancy
- upcoming vacancies

## Core model

Occupancy belongs to board_faces.

Never implement occupancy against boards directly.

## States

occupied
on_hold
booked_future
blocked

## Database requirement

Overlapping occupied/booked_future periods must be prevented by PostgreSQL.

Never rely solely on frontend checks.

## Vacancy

Upcoming vacancy is derived from occupancy end date and pre-listing configuration.

## Required tests

- overlapping periods
- adjacent periods
- future bookings
- holds
- blocked dates
- cancellation
- concurrent requests
- timezone/date boundaries
