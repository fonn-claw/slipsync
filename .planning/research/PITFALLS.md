# Domain Pitfalls

**Domain:** Marina & Boat Slip Management Application
**Researched:** 2026-03-24

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Double-Booking Race Conditions at the Database Level

**What goes wrong:** Two users simultaneously request the same slip for overlapping dates. The application checks availability, both see the slip as free, and both bookings are inserted. You now have a double-booking despite having "prevention" code.

**Why it happens:** Application-level availability checks (SELECT then INSERT) are not atomic. Between the check and the insert, another transaction can slip through. This is the classic TOCTOU (time-of-check-to-time-of-use) race condition. SQLite makes this worse because it uses database-level write locks rather than row-level locks, meaning concurrent writes queue up but the application logic can still race.

**Consequences:** Double-booked slips, angry boaters, lost trust, and the core value proposition ("prevents double bookings") is broken. This is the single most damaging bug for a marina management app.

**Prevention:**
- Use database-level constraints, not just application checks. Add a unique constraint or check constraint that prevents overlapping date ranges for the same slip.
- Wrap the availability check and insert in a single transaction with `BEGIN IMMEDIATE` in SQLite (acquires a write lock before the SELECT).
- For SQLite specifically, enable WAL mode (`PRAGMA journal_mode=WAL`) to allow concurrent reads while writes are serialized.
- Validate overlaps using: `NOT (new_end <= existing_start OR new_start >= existing_end)` -- this catches all overlap cases including partial overlaps.

**Detection:** Write a test that fires two concurrent booking requests for the same slip and date range. If both succeed, you have the bug.

**Phase relevance:** Must be addressed in the Booking System phase. Do not defer this.

**Confidence:** HIGH -- well-documented pattern across all booking systems.

### Pitfall 2: Vessel-to-Slip Size Matching That Is Too Loose or Too Strict

**What goes wrong:** Vessel size validation either allows boats that physically cannot fit (unsafe) or rejects boats that would fit fine (lost revenue). The three dimensions -- LOA (length overall), beam (width), and draft (depth below waterline) -- each have different safety margin requirements, and getting the tolerances wrong breaks the system's usefulness.

**Why it happens:** There is no universal standard for slip sizing margins. Real marinas use different rules: some require 2 feet of clearance on length, some require 4 feet. Beam clearance depends on whether slips have finger piers. Draft depends on tidal conditions. Developers either hardcode one set of tolerances or skip validation entirely.

**Consequences:** Too strict means empty slips that could be earning revenue. Too loose means boats getting damaged or not fitting. Either way, marina operators will not trust the system.

**Prevention:**
- Make clearance margins configurable per marina (or at minimum per dock), not hardcoded. Default to reasonable values: LOA + 2ft minimum, beam + 1ft per side, draft must be less than slip depth at low tide.
- Store slip dimensions as `max_length`, `max_beam`, `max_draft` on each slip record. Compare vessel dimensions against these maximums.
- Display a clear warning (not a hard block) when a vessel is close to the maximum -- let the admin override.
- For the demo/showcase: use straightforward comparisons (vessel dimension <= slip max dimension) with realistic slip sizes per the brief's dock categories.

**Detection:** Seed a vessel that is 1 foot shorter than a slip's max length and verify it can book. Seed a vessel that exceeds max length by 1 foot and verify it is rejected.

**Phase relevance:** Data model phase (slip dimensions on the schema) and Booking System phase (validation logic).

**Confidence:** MEDIUM -- based on marina forum discussions and industry practices, no single authoritative standard exists.

### Pitfall 3: SVG Marina Map Becoming Unmaintainable Spaghetti

**What goes wrong:** The interactive marina map -- the hero feature -- starts as a monolithic SVG blob with inline event handlers, hardcoded positions, and tightly coupled state. Adding a dock or changing layout requires editing dozens of coordinates. Hover states, selection states, and status colors all fight each other.

**Why it happens:** SVG maps look simple at first (just draw rectangles for slips), so developers hardcode everything. But 60 slips across 4 docks with 4+ status colors, hover effects, selection states, tooltips, and click handlers means the component quickly becomes unmanageable. The temptation is to build one giant SVG component instead of composing smaller ones.

**Consequences:** The hero feature looks hacky instead of impressive. Bugs in one dock's rendering break another. Adding the click-to-inspect panel becomes a nightmare of prop drilling and state coordination.

**Prevention:**
- Define dock and slip layout as data (JSON/TypeScript objects with x, y, width, height, rotation), not as hardcoded SVG paths. Render the map from this data.
- Component hierarchy: `MarinaMap` > `Dock` > `Slip`. Each slip is a self-contained SVG group (`<g>`) that receives its status as a prop and handles its own color/hover/click.
- Keep SVG viewBox and coordinate system simple. Use a logical coordinate system (e.g., 1000x600 viewBox) and position docks within it.
- Status colors should come from a single theme/config object, not be scattered across components.
- Use CSS classes for hover/active states rather than JavaScript-driven style changes where possible.

**Detection:** Can you add a 5th dock by only adding a data entry? If the answer is "no, I need to edit SVG coordinates by hand," the architecture is wrong.

**Phase relevance:** Must be addressed in the Marina Map phase. Get the data-driven architecture right before adding interactivity.

**Confidence:** HIGH -- standard SVG/React architectural pattern, well-documented.

## Moderate Pitfalls

### Pitfall 4: Seed Data With Hardcoded Absolute Dates That Go Stale

**What goes wrong:** Demo data uses absolute dates like "2026-03-15" for bookings. When someone runs the app a month later, all "current" bookings are in the past, the occupancy map shows everything as empty, and the dashboard shows zero activity. The demo feels broken.

**Why it happens:** It is faster to write `new Date('2026-03-20')` than to compute relative dates. Developers seed the data once, verify it looks good, and ship. Nobody checks what happens when the seed runs on a different date.

**Prevention:**
- All seed dates should be relative to `Date.now()`. Use helper functions: `daysFromNow(-30)`, `daysFromNow(7)`, etc.
- Current bookings should span today's date (check-in in the past, check-out in the future).
- Historical bookings should be N days ago. Future reservations should be N days ahead.
- Verify seed script output by running it and checking the dashboard shows realistic current-state data.

**Detection:** Change your system clock forward 2 months and re-run the seed. Does the app still show a realistic state?

**Phase relevance:** Seed Data phase. Must be designed into the seed script from the start, not patched later.

**Confidence:** HIGH -- extremely common in demo apps, easy to prevent.

### Pitfall 5: Booking Lifecycle State Machine Without Proper Transition Guards

**What goes wrong:** A booking can go from "pending" directly to "checked-out" (skipping confirmation and check-in), or a "checked-out" booking can be moved back to "confirmed." The booking lifecycle (pending -> confirmed -> checked-in -> checked-out) exists as a concept but is not enforced in code.

**Why it happens:** The status field is stored as a string enum, and update endpoints just accept whatever status the client sends. Nobody builds a proper state machine with allowed transitions.

**Prevention:**
- Define allowed transitions explicitly: `{ pending: ['confirmed', 'cancelled'], confirmed: ['checked_in', 'cancelled'], checked_in: ['checked_out'], checked_out: [] }`.
- Validate transitions server-side before updating. Reject invalid transitions with a clear error.
- The UI should only show action buttons for valid next states (e.g., a pending booking shows "Confirm" and "Cancel," never "Check Out").

**Detection:** Try to POST a status change from "pending" to "checked_out" via the API. If it succeeds, the guard is missing.

**Phase relevance:** Booking System phase. Define transitions in the data layer, not the UI layer.

**Confidence:** HIGH -- standard state machine pattern.

### Pitfall 6: Role-Based Access That Only Lives in the UI

**What goes wrong:** A boater cannot see the admin dashboard because the nav link is hidden, but the API endpoint `/api/admin/dashboard` returns data to anyone who calls it. Security is cosmetic, not real.

**Why it happens:** Developers implement RBAC by conditionally rendering UI elements and forget to add middleware/guards on API routes. Next.js App Router makes this especially easy to miss because server components and route handlers have different auth patterns.

**Prevention:**
- Auth middleware that runs on every API route and checks the user's role against required permissions.
- Create a `requireRole('admin')` helper that throws 403 if the current session's role does not match.
- Apply it to every server action and API route, not just the pages.
- Test by logging in as a boater and directly hitting admin API endpoints with fetch/curl.

**Detection:** Log in as `boater@slipsync.app`, then navigate directly to `/admin/dashboard` or call admin API routes. If you see data, RBAC is broken.

**Phase relevance:** Auth phase (foundation), then enforced in every subsequent phase that adds API routes.

**Confidence:** HIGH -- one of the most common security pitfalls in Next.js apps.

### Pitfall 7: Calendar/Date Range Queries That Ignore Timezone and Boundary Conditions

**What goes wrong:** A booking for March 15-20 does not show up when filtering for "March 20" because the query uses `<` instead of `<=`. Or dates shift by a day because the server interprets dates in UTC while the client sends local time. The availability calendar shows incorrect data.

**Why it happens:** Date boundary logic is notoriously tricky. "Check-out on March 20" -- is the slip available on March 20 or not? Convention varies (hotels free the room on checkout day; marinas may not). UTC vs local timezone mismatches silently shift dates.

**Prevention:**
- Decide and document the convention: check-out day IS available for new bookings (like hotels) or is NOT available. Be consistent everywhere.
- Store all dates as date-only strings (YYYY-MM-DD) in SQLite, not timestamps, since slip bookings are day-granularity. This eliminates timezone issues entirely.
- Use inclusive start, exclusive end (`start_date <= date < end_date`) consistently in all queries.
- Write edge case tests: same-day booking, adjacent bookings (one ends March 15, another starts March 15), bookings that span month boundaries.

**Detection:** Create two bookings: one ending March 15, one starting March 15. Do they conflict or not? Is the behavior consistent with what the UI shows?

**Phase relevance:** Data model phase (date storage format) and Booking System phase (query logic).

**Confidence:** HIGH -- universal date handling pitfall.

## Minor Pitfalls

### Pitfall 8: Dashboard Stats Computed on Every Page Load

**What goes wrong:** The admin dashboard runs aggregate queries (COUNT occupied slips, SUM revenue, etc.) across the entire booking and payment history on every page load. With realistic demo data this is fine, but the architecture does not scale and the queries become complex quickly.

**Prevention:**
- For this demo app, direct queries are fine -- 60 slips and a few hundred bookings will be fast.
- Structure queries cleanly so they could be replaced with materialized views or cached computations later.
- Avoid N+1 queries: do not load all slips then query bookings for each one individually.

**Phase relevance:** Admin Dashboard phase.

**Confidence:** HIGH -- standard performance pattern.

### Pitfall 9: Waitlist Without Clear Priority Rules

**What goes wrong:** A waitlist exists but has no defined ordering logic. When a slip opens up, there is no way to determine who should be offered it first. Is it first-come-first-served? By vessel size match? By booking value?

**Prevention:**
- Use simple FIFO (first-come-first-served) ordering with a `created_at` timestamp.
- Waitlist entries should specify desired slip size category, not a specific slip.
- When a slip becomes available, filter the waitlist by compatible vessel size and offer to the oldest entry.

**Phase relevance:** Waitlist feature within the Booking System or Admin Dashboard phase.

**Confidence:** MEDIUM -- domain-specific, FIFO is the most common approach.

### Pitfall 10: Maintenance Status Blocking All Interaction With a Slip

**What goes wrong:** When a slip is marked as "maintenance," it disappears from all booking flows and future reservations cannot be made for it. But maintenance might be scheduled for next week -- a boater should still be able to book the slip for next month.

**Prevention:**
- Maintenance should be a date-ranged status, not a binary flag on the slip.
- A slip can be "in maintenance from March 10-15" while still being bookable for March 20 onward.
- The marina map should show current maintenance status (red) but the booking system should check future availability based on maintenance date ranges.

**Phase relevance:** Data model phase (maintenance as date-ranged records) and Marina Map phase (status display logic).

**Confidence:** MEDIUM -- based on how real marina software handles maintenance windows.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Data Model / Schema | Slip dimensions missing or incomplete | Include max_length, max_beam, max_draft on every slip record from day one |
| Data Model / Schema | Dates stored as timestamps instead of date strings | Use YYYY-MM-DD text format for booking dates to avoid timezone issues |
| Auth & Roles | API routes unprotected | Add role-checking middleware before building any feature routes |
| Marina Map (Hero) | Hardcoded SVG positions | Data-driven layout from the start; slips defined as data, rendered by components |
| Booking System | Race conditions on concurrent bookings | Database-level constraints + transactions with BEGIN IMMEDIATE |
| Booking System | No state transition guards | Define allowed transitions as a map, validate server-side |
| Booking System | Off-by-one date boundaries | Document inclusive/exclusive convention, write edge case tests |
| Seed Data | Absolute dates that go stale | All dates relative to Date.now() |
| Admin Dashboard | N+1 queries for stats | Use aggregate queries, avoid per-slip loops |
| Waitlist | No priority ordering defined | FIFO by created_at, filtered by vessel size compatibility |
| Maintenance | Binary flag instead of date ranges | Model maintenance as date-ranged records |

## Sources

- [How to Solve Race Conditions in a Booking System](https://hackernoon.com/how-to-solve-race-conditions-in-a-booking-system) -- race condition patterns and prevention
- [Non-Overlapping Time Ranges in SQL](https://sqlfordevs.com/non-overlapping-time-ranges) -- database constraint approaches
- [Marina Management Software Features (MarinaMatch)](https://www.marinamatch.org/blog-detail/marina-management-software-top-features) -- industry pain points
- [Rule of Thumb for Boat Slip Size (Trawler Forum)](https://www.trawlerforum.com/threads/rule-of-thumb-for-boat-slip-size.59687/) -- vessel sizing practices
- [LOA: What It Is and Why It Matters (Dockwa)](https://blog.dockwa.com/length-overall-loa) -- vessel measurement standards
- [From SVG to Canvas (Felt)](https://www.felt.com/blog/from-svg-to-canvas-part-1-making-felt-faster) -- SVG performance at scale
- [Mastering React SVG Integration (Strapi)](https://strapi.io/blog/mastering-react-svg-integration-animation-optimization) -- SVG optimization in React
- [Concurrency Conundrum in Booking Systems](https://medium.com/@abhishekranjandev/concurrency-conundrum-in-booking-systems-2e53dc717e8c) -- booking system concurrency
