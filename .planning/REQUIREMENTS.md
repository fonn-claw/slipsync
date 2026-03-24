# Requirements: SlipSync

**Defined:** 2026-03-24
**Core Value:** Marina operators can visually manage slips, bookings, and boaters through a stunning interactive map -- replacing spreadsheets with a modern system that prevents double bookings.

## v1 Requirements

### Authentication & Roles

- [x] **AUTH-01**: User can log in with email and password
- [x] **AUTH-02**: User session persists across browser refresh
- [x] **AUTH-03**: User can log out from any page
- [x] **AUTH-04**: Role-based access control enforced at API/middleware layer (admin, dock_staff, boater)
- [x] **AUTH-05**: Three demo accounts seeded (admin, dock staff, boater)

### Marina Map

- [ ] **MAP-01**: Interactive SVG marina map displays 4 docks (A, B, C, D) with 60 total slips
- [ ] **MAP-02**: Slips are color-coded by status: available (green), occupied (blue), reserved (yellow), maintenance (red)
- [ ] **MAP-03**: Clicking a slip opens a details panel with vessel info, booking history, and actions
- [ ] **MAP-04**: Map is data-driven (dock/slip layout from database, not hardcoded SVG)
- [ ] **MAP-05**: Map is responsive and works on tablet screens

### Slip Management

- [x] **SLIP-01**: Each slip has defined dimensions (length, beam, draft capacity)
- [x] **SLIP-02**: Slips are organized by dock with size categories (small, medium, large, extra-large)
- [ ] **SLIP-03**: Slip status can be changed (available, occupied, reserved, maintenance)

### Booking System

- [ ] **BOOK-01**: Admin/staff can create transient bookings (daily/weekly) for a slip
- [ ] **BOOK-02**: Admin/staff can create seasonal reservations
- [ ] **BOOK-03**: Vessel size is validated against slip dimensions before booking (LOA, beam, draft)
- [ ] **BOOK-04**: Double-booking prevention enforced at database level
- [ ] **BOOK-05**: Booking lifecycle: pending -> confirmed -> checked-in -> checked-out
- [ ] **BOOK-06**: Calendar view shows availability per slip and per dock
- [ ] **BOOK-07**: Upcoming arrivals and departures displayed for staff

### Boater Portal

- [ ] **BOAT-01**: Boater can browse available slips with filtering by size
- [ ] **BOAT-02**: Boater can register vessels (name, type, LOA, beam, draft)
- [ ] **BOAT-03**: Boater can request a booking for an available slip
- [ ] **BOAT-04**: Boater can view current and past reservations
- [ ] **BOAT-05**: Boater can submit maintenance requests for their occupied slip
- [ ] **BOAT-06**: Boater can manage their account and vessels

### Admin Dashboard

- [ ] **DASH-01**: Dashboard shows current occupancy rate with visual indicator
- [ ] **DASH-02**: Revenue overview displayed (monthly, by dock, by slip type)
- [ ] **DASH-03**: Upcoming arrivals and departures list
- [ ] **DASH-04**: Quick stats: total slips, occupied, available, maintenance counts
- [ ] **DASH-05**: Waitlist management: view, add, remove entries

### Maintenance

- [ ] **MAINT-01**: Maintenance requests can be submitted with description and priority
- [ ] **MAINT-02**: Maintenance requests have lifecycle: open -> in-progress -> resolved
- [ ] **MAINT-03**: Staff can view and update maintenance request status

### Demo Data & Seed

- [x] **SEED-01**: Seed script creates "Sunset Harbor Marina" with 4 docks and 60 slips
- [x] **SEED-02**: 15-20 boater accounts with registered vessels seeded
- [x] **SEED-03**: Mix of slip statuses: ~40% occupied, ~20% reserved, ~30% available, ~10% maintenance
- [x] **SEED-04**: Historical bookings going back 3 months (relative dates)
- [x] **SEED-05**: Waitlist entries and maintenance requests in various states seeded

### Design & UX

- [x] **UX-01**: Ocean/nautical color palette (navy blues, teals, seafoam, whites)
- [x] **UX-02**: Clean, modern, professional UI using shadcn/ui components
- [x] **UX-03**: Responsive design -- works on desktop and tablet
- [ ] **UX-04**: Marina map is the centerpiece -- large, prominent, interactive
- [ ] **UX-05**: Role-appropriate navigation and layout for each user type

## v2 Requirements

### Enhanced Features

- **WEATHER-01**: Weather widget showing current conditions at marina
- **FUEL-01**: Fuel sales tracking and reporting
- **UTIL-01**: Utility metering per slip (water, electric)
- **NOTIF-01**: Email notifications for booking confirmations
- **PAY-01**: Online payment processing for bookings

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time chat/messaging | High complexity, not core to marina management |
| Mobile native app | Web-first with responsive design covers tablet use |
| Multi-marina support | Demo is single-marina; multi-tenant adds complexity |
| Payment processing | Demo app -- no real transactions needed |
| Email sending | Demo app -- notifications shown in-app only |
| GPS/location tracking | Not needed for slip management |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| AUTH-05 | Phase 1 | Complete |
| MAP-01 | Phase 2 | Pending |
| MAP-02 | Phase 2 | Pending |
| MAP-03 | Phase 2 | Pending |
| MAP-04 | Phase 2 | Pending |
| MAP-05 | Phase 2 | Pending |
| SLIP-01 | Phase 1 | Complete |
| SLIP-02 | Phase 1 | Complete |
| SLIP-03 | Phase 2 | Pending |
| BOOK-01 | Phase 3 | Pending |
| BOOK-02 | Phase 3 | Pending |
| BOOK-03 | Phase 3 | Pending |
| BOOK-04 | Phase 3 | Pending |
| BOOK-05 | Phase 3 | Pending |
| BOOK-06 | Phase 3 | Pending |
| BOOK-07 | Phase 3 | Pending |
| BOAT-01 | Phase 4 | Pending |
| BOAT-02 | Phase 4 | Pending |
| BOAT-03 | Phase 4 | Pending |
| BOAT-04 | Phase 4 | Pending |
| BOAT-05 | Phase 4 | Pending |
| BOAT-06 | Phase 4 | Pending |
| DASH-01 | Phase 4 | Pending |
| DASH-02 | Phase 4 | Pending |
| DASH-03 | Phase 4 | Pending |
| DASH-04 | Phase 4 | Pending |
| DASH-05 | Phase 4 | Pending |
| MAINT-01 | Phase 4 | Pending |
| MAINT-02 | Phase 4 | Pending |
| MAINT-03 | Phase 4 | Pending |
| SEED-01 | Phase 1 | Complete |
| SEED-02 | Phase 1 | Complete |
| SEED-03 | Phase 1 | Complete |
| SEED-04 | Phase 1 | Complete |
| SEED-05 | Phase 1 | Complete |
| UX-01 | Phase 1 | Complete |
| UX-02 | Phase 1 | Complete |
| UX-03 | Phase 1 | Complete |
| UX-04 | Phase 2 | Pending |
| UX-05 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 40 total
- Mapped to phases: 40 (across 4 phases)
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-24*
*Last updated: 2026-03-24 after roadmap creation*
