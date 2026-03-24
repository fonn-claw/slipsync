# Roadmap: SlipSync

## Overview

SlipSync delivers a complete marina management web application in four phases: foundation (data, auth, theme), the hero marina map, booking system with business logic, and role-specific portals with the admin dashboard. Each phase delivers a verifiable capability that builds on the previous. The nautical design system is established in Phase 1 and refined throughout, not bolted on at the end.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Data Layer** - Database schema, auth, seed data, base layouts with nautical theme
- [x] **Phase 2: Interactive Marina Map** - Hero SVG map with 4 docks, 60 color-coded slips, click-to-inspect (completed 2026-03-24)
- [ ] **Phase 3: Booking System** - Transient/seasonal bookings, size matching, double-booking prevention, calendar view
- [ ] **Phase 4: Portals & Dashboard** - Admin analytics, boater self-service, dock staff operations, maintenance, waitlist

## Phase Details

### Phase 1: Foundation & Data Layer
**Goal**: Users can log in with role-appropriate access to a professionally themed application backed by realistic demo data
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, SLIP-01, SLIP-02, SEED-01, SEED-02, SEED-03, SEED-04, SEED-05, UX-01, UX-02, UX-03
**Success Criteria** (what must be TRUE):
  1. User can log in as admin, dock staff, or boater using demo credentials and sees a role-appropriate layout
  2. User session persists across browser refresh and user can log out from any page
  3. Unauthorized users are redirected -- boater cannot access admin routes, staff cannot access admin-only features
  4. Database contains 60 slips across 4 docks with realistic dimensions, 15-20 boaters with vessels, and 3 months of historical data
  5. Application renders with ocean/nautical color palette using shadcn/ui components and works on tablet screens
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md -- Project scaffolding, Drizzle schema, database setup, and comprehensive seed script
- [ ] 01-02-PLAN.md -- Authentication system with iron-session, login/logout, and middleware route protection
- [ ] 01-03-PLAN.md -- Nautical OKLCH theme, shadcn/ui setup, and role-specific layout shells

### Phase 2: Interactive Marina Map
**Goal**: Users see a stunning, interactive visual marina map as the application centerpiece -- the "wow" moment for LinkedIn
**Depends on**: Phase 1
**Requirements**: MAP-01, MAP-02, MAP-03, MAP-04, MAP-05, SLIP-03, UX-04
**Success Criteria** (what must be TRUE):
  1. Marina map displays all 4 docks with 60 slips rendered as an interactive SVG layout
  2. Slips are color-coded by status: green (available), blue (occupied), yellow (reserved), red (maintenance)
  3. Clicking a slip opens a detail panel showing vessel info, booking history, and role-appropriate actions
  4. Admin/staff can change slip status directly from the map detail panel
  5. Map is responsive and usable on tablet screens with touch interaction
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md -- Data access layer, server action for status change, layout computation engine with unit tests
- [ ] 02-02-PLAN.md -- SVG map components, detail panel with status change UI, admin/staff page wiring

### Phase 3: Booking System
**Goal**: Staff and boaters can create, manage, and track bookings with vessel size validation and zero double-booking risk
**Depends on**: Phase 2
**Requirements**: BOOK-01, BOOK-02, BOOK-03, BOOK-04, BOOK-05, BOOK-06, BOOK-07
**Success Criteria** (what must be TRUE):
  1. Admin/staff can create transient (daily/weekly) and seasonal bookings for any slip
  2. Booking creation validates vessel dimensions against slip capacity and rejects oversized vessels
  3. System prevents double-booking at the database level -- concurrent attempts for the same slip/dates result in one success and one rejection
  4. Bookings progress through lifecycle states (pending, confirmed, checked-in, checked-out) with only valid transitions allowed
  5. Calendar view shows slip/dock availability and staff can see upcoming arrivals and departures
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: Portals & Dashboard
**Goal**: Each user role has a tailored experience -- admin sees analytics, boaters self-serve, staff manages operations
**Depends on**: Phase 3
**Requirements**: BOAT-01, BOAT-02, BOAT-03, BOAT-04, BOAT-05, BOAT-06, DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, MAINT-01, MAINT-02, MAINT-03, UX-05
**Success Criteria** (what must be TRUE):
  1. Admin dashboard displays occupancy rates, revenue overview (monthly/by dock/by type), arrivals/departures, and quick stats
  2. Boater can browse available slips filtered by size, request bookings, register/manage vessels, and view reservation history
  3. Boater can submit maintenance requests for their occupied slip and see request status
  4. Staff can view and update maintenance request status through its lifecycle (open, in-progress, resolved)
  5. Admin can manage the waitlist (view, add, remove entries) and each role sees appropriate navigation
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD
- [ ] 04-03: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Data Layer | 2/3 | In Progress|  |
| 2. Interactive Marina Map | 2/2 | Complete   | 2026-03-24 |
| 3. Booking System | 0/2 | Not started | - |
| 4. Portals & Dashboard | 0/3 | Not started | - |
