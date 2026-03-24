# SlipSync — Marina & Boat Slip Management

## What This Is

A full web application for marina operators to manage boat slips, bookings, and boaters. Features an interactive visual marina map as the hero element, a complete booking system with vessel size matching and double-booking prevention, a self-service boater portal, and an admin dashboard with occupancy and revenue analytics. Built as a FonnIT daily showcase targeting LinkedIn — must look impressive with realistic demo data.

## Core Value

Marina operators can visually manage their slips, bookings, and boaters through a stunning interactive map — replacing spreadsheets with a modern, affordable system that prevents double bookings and gives boaters self-service access.

## Requirements

### Validated

- ✓ Role-based auth: admin, dock_staff, boater — Validated in Phase 1
- ✓ Demo accounts with realistic seed data (60 slips, 21 boaters, 3 months history) — Validated in Phase 1
- ✓ Ocean/nautical design palette, responsive, tablet-friendly — Validated in Phase 1

### Active

- [ ] Interactive visual marina map with 4 docks, 60 slips, color-coded by status
- [ ] Click-to-inspect slip details with vessel info, booking history, and actions
- [ ] Booking system with transient (daily/weekly) and seasonal reservations
- [ ] Vessel size matching to slip dimensions (length, beam, draft)
- [ ] Calendar view of slip/dock availability
- [ ] Double-booking prevention
- [ ] Booking lifecycle: pending → confirmed → checked-in → checked-out
- [ ] Boater self-service portal: browse slips, book, manage vessels
- [ ] Vessel registration (name, type, LOA, beam, draft)
- [ ] View current and past reservations
- [ ] Submit maintenance requests for occupied slips
- [ ] Admin dashboard: occupancy rates, revenue overview, arrivals/departures
- [ ] Waitlist management

### Out of Scope

- Weather widget — nice-to-have, not core MVP
- Fuel sales tracking — nice-to-have, defer to v2
- Utility metering per slip — nice-to-have, defer to v2
- Real-time notifications — complexity not justified for showcase
- Payment processing — demo app, no real transactions needed
- Mobile native app — web-first, responsive design covers tablet use

## Context

- 73% of marinas still run on spreadsheets, losing ~$47K/year through booking errors
- 61% of small-to-mid marinas struggle with double bookings
- 78% of recreational boaters expect online booking
- Existing solutions: ancient desktop systems ($2.5-20K) or enterprise SaaS ($200-500/mo)
- Target price point: $79-149/mo — modern, affordable alternative
- Three user roles: Marina Admin (full access), Dock Staff (operations), Boaters (self-service)
- Demo marina: "Sunset Harbor Marina" with 4 docks (A: 20 small, B: 15 medium, C: 15 large, D: 10 XL)
- This is a LinkedIn showcase — design quality is critical

## Constraints

- **Stack**: Next.js + SQLite/Drizzle (or equivalent modern stack) — must build and run locally
- **Design**: Ocean/nautical palette (navy blues, teals, seafoam, whites), shadcn/ui components
- **Data**: Seed script populating all demo data on first run
- **Responsive**: Must work on tablet for dockside use
- **Showcase**: Goes on LinkedIn — must impress business decision-makers

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js + SQLite/Drizzle stack | Brief suggests it, fast local dev, no external DB needed | ✓ Good |
| SVG-based marina map | Better interactivity and styling than Canvas for this use case | — Pending |
| shadcn/ui component library | Professional look, consistent with FonnIT showcase standards | ✓ Good |
| Cookie-based auth with demo accounts | Simple, no external auth provider needed for showcase | ✓ Good |
| iron-session for sessions | httpOnly cookies, works in Server Components and middleware | ✓ Good |
| OKLCH color format | Modern color space, better for nautical palette gradations | ✓ Good |

---
*Last updated: 2026-03-24 after Phase 1 completion*
