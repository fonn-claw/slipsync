# Phase 3: Booking System - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete booking system: transient (daily/weekly) and seasonal reservations, vessel size matching against slip dimensions, double-booking prevention enforced at the database level, booking lifecycle state machine (pending → confirmed → checked-in → checked-out), calendar availability view per dock, and arrivals/departures display for staff. This connects the marina map to actual business operations.

</domain>

<decisions>
## Implementation Decisions

### Booking Creation Flow
- Single-page form with sections: slip selection, vessel selection, date range, booking type — not a multi-step wizard
- Vessel selection via dropdown of boater's registered vessels, showing LOA/beam/draft dimensions alongside each option
- Calendar date range picker for start/end dates
- Toggle between "transient" (daily/weekly) and "seasonal" booking types with rate display per type
- Vessel dimensions validated against slip capacity on form submit — LOA must fit maxLength, beam must fit maxBeam, draft must fit maxDraft
- Form accessible from: slip detail panel "Book this Slip" button (map), calendar empty day click, and direct navigation

### Calendar Availability View
- Monthly calendar grid as the primary view — one dock at a time
- Per-dock tabs (A, B, C, D) with month navigation arrows (prev/next month)
- Bookings displayed as horizontal bars spanning check-in to check-out dates
- Bars color-coded by booking status: pending (yellow), confirmed (blue), checked-in (green), checked-out (gray)
- Vessel name shown on each bar (truncated if needed)
- Clicking an empty day on a slip row pre-fills the booking form with that slip and date
- Clicking a booking bar opens booking details (similar to slip detail panel)

### Double-Booking Prevention
- Database-level enforcement using SQLite BEGIN IMMEDIATE transaction — prevents race conditions
- Server Action validates no overlapping bookings for the same slip and date range before insert
- Client-side pre-check: availability query before form submit for fast feedback
- On conflict: inline error showing conflicting booking details (vessel name, dates, boater) with link to view it
- Suggested alternatives: show available slips of matching size for the requested dates
- Checkout day is available for new bookings (hotel convention — checkout day = next available day)

### Booking Lifecycle State Machine
- Valid transitions enforced server-side:
  - pending → confirmed (admin/staff only)
  - pending → cancelled (admin/staff or booking owner)
  - confirmed → checked_in (admin/staff only)
  - confirmed → cancelled (admin/staff or booking owner)
  - checked_in → checked_out (admin/staff only)
- Invalid transition attempts return a descriptive error message
- Slip status auto-updates: confirmed → slip stays "reserved", checked_in → slip becomes "occupied", checked_out → slip becomes "available"
- Confirmation dialogs required for: cancel and check-out only (check-in and confirm are low-risk)

### Arrivals & Departures
- Today's arrivals (bookings with startDate = today, status = confirmed) and departures (endDate = today, status = checked_in) shown as card lists
- Displayed on staff operations page and admin dashboard
- Each card shows: slip number, vessel name, boater name, booking dates, action button (check-in or check-out)

### Claude's Discretion
- Exact calendar grid component implementation (custom vs library)
- Form validation error message styling
- Rate calculation logic for transient vs seasonal
- Loading states during availability checks

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `BRIEF.md` — Booking system requirements in "Core Features > 2. Booking System" section
- `.planning/REQUIREMENTS.md` — BOOK-01..07 requirements for this phase
- `.planning/research/PITFALLS.md` — Double-booking race conditions, state machine enforcement, date boundary handling
- `.planning/research/ARCHITECTURE.md` — Domain logic isolation for booking rules

### Existing code (from Phase 1 & 2)
- `src/db/schema.ts` — Bookings table with status enum, type, startDate/endDate, vessel/slip/boater FKs
- `src/db/seed.ts` — Existing booking seed data patterns (relative dates, status distribution)
- `src/lib/dal/slips.ts` — DAL pattern for Drizzle queries with relations
- `src/app/actions/slip-actions.ts` — Server Action pattern with role checking
- `src/lib/auth.ts` — Session helpers for role-based action guards
- `src/components/marina-map/slip-detail-panel.tsx` — "Book this Slip" CTA placeholder to wire up

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `slip-actions.ts`: Pattern for Server Actions with role checks — booking actions follow same pattern
- `slips.ts` DAL: Pattern for Drizzle relational queries — booking DAL follows same approach
- `Sheet` component: Reusable for booking detail side panel
- `Card`, `Badge`, `Button`, `DropdownMenu`: All available for booking UI
- `AlertDialog`: For confirmation dialogs on cancel/check-out
- Slip detail panel: Already has "Book this Slip" placeholder button

### Established Patterns
- Server Component (data fetch) → Client Component (interactivity) — same pattern for booking pages
- Server Actions with `revalidatePath` for mutations — booking CRUD follows same
- OKLCH nautical theme with CSS variables — booking UI inherits theme automatically
- Role-based middleware — booking routes auto-protected

### Integration Points
- Slip detail panel "Book this Slip" button needs to link to booking form with pre-filled slip
- Calendar view is a new page under admin/staff route groups
- Arrivals/departures cards go on staff operations page and admin dashboard (placeholder pages exist)
- Booking status changes should trigger slip status sync (occupied ↔ available)
- Map slip colors should reflect booking-driven status changes in real time

</code_context>

<specifics>
## Specific Ideas

- Double-booking prevention is the #1 pain point (61% of marinas struggle with it) — must be bulletproof
- Calendar view should feel like a Gantt chart — horizontal bars per slip showing booking timelines
- The booking form should be accessible from multiple entry points (map, calendar, direct nav)
- Arrivals/departures cards should feel actionable — one click to check-in or check-out

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-booking-system*
*Context gathered: 2026-03-24*
