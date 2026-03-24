# Phase 3: Booking System - Research

**Researched:** 2026-03-24
**Domain:** Booking system with date-range management, state machines, double-booking prevention, calendar UI
**Confidence:** HIGH

## Summary

Phase 3 builds the core booking engine on top of the existing schema (`bookings` table with status enum, type, dates, FKs), DAL pattern (`src/lib/dal/slips.ts`), and Server Action pattern (`src/app/actions/slip-actions.ts`). The schema already has the bookings table with all needed columns (slipId, vesselId, boaterId, type, status, startDate, endDate, totalPrice). No schema migrations are needed.

The critical technical challenges are: (1) double-booking prevention using SQLite's `BEGIN IMMEDIATE` transaction to serialize concurrent writes, (2) a booking lifecycle state machine with server-side transition guards, (3) vessel-to-slip dimension validation, and (4) a calendar/Gantt-style availability view. All date storage uses `YYYY-MM-DD` text format (already established in seed data), which eliminates timezone issues.

**Primary recommendation:** Build domain logic (`src/lib/domain/booking-rules.ts`) first with pure functions for state transitions, vessel fitting, overlap detection, and pricing. Then build DAL and Server Actions that use these rules. Finally build the UI (booking form, calendar view, arrivals/departures). This keeps business rules testable in isolation.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Single-page booking form with sections (slip selection, vessel selection, date range, booking type) -- not a multi-step wizard
- Vessel selection via dropdown showing LOA/beam/draft alongside each option
- Calendar date range picker for start/end dates
- Toggle between transient and seasonal with rate display
- Vessel dimensions validated against slip capacity on submit (LOA <= maxLength, beam <= maxBeam, draft <= maxDraft)
- Form accessible from: slip detail panel "Book this Slip", calendar empty day click, direct navigation
- Monthly calendar grid as primary view, one dock at a time, with dock tabs (A, B, C, D) and month navigation
- Bookings displayed as horizontal bars spanning check-in to check-out (Gantt-style)
- Bars color-coded: pending (yellow), confirmed (blue), checked-in (green), checked-out (gray)
- Vessel name shown on each bar
- Clicking empty day pre-fills booking form; clicking booking bar opens details
- Database-level enforcement using SQLite BEGIN IMMEDIATE transaction
- Server Action validates no overlapping bookings before insert
- Client-side pre-check for fast feedback
- On conflict: inline error with conflicting booking details + suggested alternatives
- Checkout day is available for new bookings (hotel convention)
- Valid transitions enforced server-side: pending->confirmed, pending->cancelled, confirmed->checked_in, confirmed->cancelled, checked_in->checked_out
- Invalid transitions return descriptive error
- Slip status auto-updates: confirmed->reserved, checked_in->occupied, checked_out->available
- Confirmation dialogs for cancel and check-out only
- Today's arrivals (startDate=today, status=confirmed) and departures (endDate=today, status=checked_in) as card lists
- Arrivals/departures on staff operations page and admin dashboard
- Each card shows: slip number, vessel name, boater name, dates, action button

### Claude's Discretion
- Exact calendar grid component implementation (custom vs library)
- Form validation error message styling
- Rate calculation logic for transient vs seasonal
- Loading states during availability checks

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BOOK-01 | Admin/staff can create transient bookings (daily/weekly) for a slip | Booking form with type toggle, Server Action with role check, pricing calculation |
| BOOK-02 | Admin/staff can create seasonal reservations | Same form with seasonal type selected, monthly pricing, longer date ranges |
| BOOK-03 | Vessel size validated against slip dimensions before booking (LOA, beam, draft) | Domain logic `vesselFitsSlip()` function, Zod schema refinement |
| BOOK-04 | Double-booking prevention enforced at database level | BEGIN IMMEDIATE transaction wrapping overlap check + insert in DAL |
| BOOK-05 | Booking lifecycle: pending -> confirmed -> checked-in -> checked-out | State machine transitions map, server-side guard in booking actions |
| BOOK-06 | Calendar view shows availability per slip and per dock | Monthly Gantt-style grid, per-dock tabs, booking bars with status colors |
| BOOK-07 | Upcoming arrivals and departures displayed for staff | DAL queries for today's arrivals/departures, card list components |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| date-fns | 4.1.0 | Date arithmetic, formatting, comparison | Already in project, tree-shakeable, immutable |
| drizzle-orm | 0.45.1 | Type-safe queries, transactions | Already the project ORM |
| zod | 4.3.6 | Form + server validation schemas | Already in project for validation |
| react-hook-form | 7.72.0 | Form state management | Already installed with @hookform/resolvers |
| @hookform/resolvers | 5.2.2 | Zod resolver for react-hook-form | Already installed |

### Supporting (no new installs needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 1.0.1 | Icons for calendar, booking status, actions | Already available |
| shadcn/ui components | 4.1.0 | Card, Badge, Button, Sheet, AlertDialog, Select, Calendar | Already available |

**No new packages needed.** Everything required is already installed. date-fns provides all calendar/date operations. The calendar grid should be built custom (a simple grid of day cells per slip row) rather than using a heavy calendar library -- it is a Gantt chart, not a date picker.

**Installation:** None required.

## Architecture Patterns

### Recommended Project Structure (new files for Phase 3)
```
src/
  lib/
    domain/
      booking-rules.ts       # Pure functions: transitions, vessel fit, overlap, pricing
    dal/
      bookings.ts            # DB queries: create, update status, get by slip/dock/date
    validations/
      booking.ts             # Zod schemas for booking form
  app/
    actions/
      booking-actions.ts     # Server Actions: createBooking, updateBookingStatus
    (admin)/
      bookings/
        page.tsx             # Calendar availability view (primary booking management)
        new/page.tsx         # Booking creation form (or use Sheet/Dialog)
    (staff)/
      operations/page.tsx    # Update: add arrivals/departures cards
  components/
    booking/
      booking-form.tsx       # Client component: single-page booking form
      booking-calendar.tsx   # Client component: monthly Gantt grid per dock
      booking-bar.tsx        # Individual booking bar on calendar
      arrivals-departures.tsx # Card list for today's arrivals/departures
      booking-detail-panel.tsx # Sheet showing booking details + actions
```

### Pattern 1: Domain Logic as Pure Functions
**What:** All booking business rules in `src/lib/domain/booking-rules.ts` as pure, synchronous functions that take data in and return results. No DB access, no async.
**When:** Vessel fitting check, state transition validation, overlap detection logic, price calculation.
**Why:** Testable without database mocking. Reusable in both Server Actions (enforcement) and client components (optimistic feedback).
**Example:**
```typescript
// src/lib/domain/booking-rules.ts

export const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'cancelled'],
  checked_in: ['checked_out'],
  checked_out: [],
  cancelled: [],
};

export function canTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function vesselFitsSlip(
  vessel: { loa: number; beam: number; draft: number },
  slip: { maxLength: number; maxBeam: number; maxDraft: number },
): { fits: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (vessel.loa > slip.maxLength) reasons.push(`LOA ${vessel.loa}' exceeds slip max ${slip.maxLength}'`);
  if (vessel.beam > slip.maxBeam) reasons.push(`Beam ${vessel.beam}' exceeds slip max ${slip.maxBeam}'`);
  if (vessel.draft > slip.maxDraft) reasons.push(`Draft ${vessel.draft}' exceeds slip max ${slip.maxDraft}'`);
  return { fits: reasons.length === 0, reasons };
}

// Overlap check: checkout day IS available (hotel convention)
// Two bookings overlap when: newStart < existingEnd AND newEnd > existingStart
export function datesOverlap(
  newStart: string, newEnd: string,
  existingStart: string, existingEnd: string,
): boolean {
  return newStart < existingEnd && newEnd > existingStart;
}

export function slipStatusForBooking(bookingStatus: string): string | null {
  switch (bookingStatus) {
    case 'confirmed': return 'reserved';
    case 'checked_in': return 'occupied';
    case 'checked_out': return 'available';
    case 'cancelled': return 'available';
    default: return null;
  }
}
```

### Pattern 2: Transactional Double-Booking Prevention in DAL
**What:** The booking creation DAL function wraps the overlap check + insert in a single SQLite transaction using `BEGIN IMMEDIATE`.
**When:** Every booking creation.
**Why:** `BEGIN IMMEDIATE` acquires a write lock before reading, preventing TOCTOU race conditions. Another transaction attempting the same will block until the first completes.
**Example:**
```typescript
// src/lib/dal/bookings.ts
import { db } from '@/db';
import { bookings, slips } from '@/db/schema';
import { and, eq, ne, lt, gt, inArray } from 'drizzle-orm';

export async function createBookingTransaction(data: {
  slipId: number; vesselId: number; boaterId: number;
  type: 'transient' | 'seasonal';
  startDate: string; endDate: string; totalPrice: number;
  notes?: string;
}) {
  // Access the underlying better-sqlite3 instance for BEGIN IMMEDIATE
  const sqlite = (db as any).session.client as import('better-sqlite3').Database;

  const result = sqlite.transaction(() => {
    // Check for overlapping active bookings on this slip
    const conflicts = db.select().from(bookings).where(
      and(
        eq(bookings.slipId, data.slipId),
        ne(bookings.status, 'cancelled'),
        ne(bookings.status, 'checked_out'),
        lt(bookings.startDate, data.endDate),
        gt(bookings.endDate, data.startDate),
      )
    ).all();

    if (conflicts.length > 0) {
      return { success: false as const, conflicts };
    }

    const [booking] = db.insert(bookings).values({
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).returning().all();

    return { success: true as const, booking };
  }).immediate();  // BEGIN IMMEDIATE

  return result;
}
```

### Pattern 3: Server Action Following Existing Pattern
**What:** Server Actions with role checks, input validation, DAL calls, and revalidation -- following the established `slip-actions.ts` pattern.
**Example:**
```typescript
// src/app/actions/booking-actions.ts
'use server';

import { getSession } from '@/lib/auth';
import { createBookingTransaction, updateBookingStatus } from '@/lib/dal/bookings';
import { vesselFitsSlip, canTransition, slipStatusForBooking } from '@/lib/domain/booking-rules';
import { revalidatePath } from 'next/cache';

export async function createBooking(formData: BookingFormData) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error('Unauthorized');

  // Role check: admin, dock_staff, or booking owner (boater for own bookings)
  // ... validate with zod schema
  // ... check vessel fits slip
  // ... call createBookingTransaction
  // ... revalidatePath for affected pages

  revalidatePath('/admin/bookings');
  revalidatePath('/marina');
  revalidatePath('/staff/operations');
}
```

### Pattern 4: Calendar Grid as Custom Component
**What:** Build the Gantt-style calendar as a custom React component, not using a calendar library. It is a grid where rows = slips in a dock, columns = days of the month.
**When:** BOOK-06 calendar view.
**Why:** No standard React calendar library provides a "slip x day" Gantt grid. Date picker libraries (react-day-picker, etc.) solve a different problem. A custom grid with date-fns for date math is simpler and more controllable.
**Structure:**
```
BookingCalendar (client component)
  DockTabs (A, B, C, D)
  MonthNavigation (prev/next arrows, current month label)
  CalendarGrid
    HeaderRow (day numbers 1-31)
    SlipRow (one per slip in selected dock)
      DayCell (clickable if empty, shows booking bar segment if occupied)
    BookingBar (positioned absolutely spanning startDate to endDate)
```

### Anti-Patterns to Avoid
- **Application-only overlap check:** Never check availability in the action without a transaction. Always use `BEGIN IMMEDIATE` wrapping both the check and insert.
- **String status updates without transition guards:** Never accept arbitrary status from client. Always validate `canTransition(currentStatus, newStatus)` server-side.
- **Separate slip status management:** Don't manually manage slip status independently of bookings. Auto-derive slip status from booking status changes.
- **Fat calendar component:** Don't put booking creation, detail viewing, and calendar rendering in one component. Split into BookingCalendar (grid), BookingBar (bars), BookingDetailPanel (sheet).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date arithmetic | Manual Date math | `date-fns` (addDays, subDays, differenceInDays, eachDayOfInterval, format, startOfMonth, endOfMonth, isSameDay) | Off-by-one errors, month boundary bugs |
| Form state management | useState for every field | `react-hook-form` + `@hookform/resolvers/zod` | Validation, error handling, dirty tracking for free |
| Input validation | Manual if/else chains | Zod schemas with `.refine()` for cross-field rules | Type-safe, reusable client+server |
| Transaction management | Manual SQL strings | Drizzle + better-sqlite3 `.transaction().immediate()` | Type-safe, proper lock acquisition |

**Key insight:** The booking system has many interacting rules (dates, dimensions, status, roles). Centralizing these as pure functions in a domain module keeps the complexity manageable and testable.

## Common Pitfalls

### Pitfall 1: TOCTOU Race Condition on Booking Creation
**What goes wrong:** Two concurrent requests both check availability, both see the slip as free, both insert -- double booking.
**Why it happens:** SELECT then INSERT without a write lock.
**How to avoid:** Use `BEGIN IMMEDIATE` which acquires the write lock before the SELECT. The second transaction will wait.
**Warning signs:** Tests that create bookings sequentially pass, but concurrent tests (Promise.all) fail.

### Pitfall 2: Off-by-one on Checkout Day
**What goes wrong:** A booking ending March 15 blocks a new booking starting March 15, or conversely allows overlap.
**Why it happens:** Using `<=` vs `<` inconsistently in overlap queries.
**How to avoid:** Convention: checkout day IS available (hotel convention). Overlap formula: `newStart < existingEnd AND newEnd > existingStart`. This means a booking ending March 15 does NOT conflict with one starting March 15.
**Warning signs:** Adjacent bookings (one ends day X, next starts day X) are rejected or two bookings can share the same night.

### Pitfall 3: Slip Status Desync from Booking Status
**What goes wrong:** A booking is checked-in but the slip still shows "reserved" on the map. Or a booking is checked-out but the slip still shows "occupied."
**Why it happens:** Slip status and booking status are updated independently, and one is forgotten.
**How to avoid:** In the `updateBookingStatus` Server Action, ALWAYS update the slip status as part of the same operation based on the `slipStatusForBooking()` mapping. Wrap both updates in a transaction.
**Warning signs:** Map colors don't match booking state after status changes.

### Pitfall 4: Calendar Month Boundary Rendering
**What goes wrong:** A booking spanning Feb 25 to March 10 doesn't render on the March calendar, or renders incorrectly.
**Why it happens:** Only querying bookings where startDate is in the current month.
**How to avoid:** Query bookings where `startDate < monthEnd AND endDate > monthStart` (same overlap logic as double-booking prevention, but for the month range). Clip the bar rendering to the visible month boundaries.
**Warning signs:** Bookings that started last month are invisible.

### Pitfall 5: Forgetting to Revalidate All Affected Paths
**What goes wrong:** Booking is created/updated but the marina map, calendar, or arrivals list shows stale data.
**Why it happens:** Only calling `revalidatePath` for the current page, not all pages that display booking data.
**How to avoid:** After any booking mutation, revalidate: `/admin/bookings`, `/marina`, `/staff/operations`, `/admin/dashboard`.

## Code Examples

### Zod Schema for Booking Form
```typescript
// src/lib/validations/booking.ts
import { z } from 'zod';

export const createBookingSchema = z.object({
  slipId: z.number().int().positive(),
  vesselId: z.number().int().positive(),
  boaterId: z.number().int().positive(),
  type: z.enum(['transient', 'seasonal']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional(),
}).refine(
  (data) => data.startDate < data.endDate,
  { message: 'End date must be after start date', path: ['endDate'] },
);

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
```

### Arrivals/Departures Query
```typescript
// src/lib/dal/bookings.ts
import { format } from 'date-fns';

export async function getTodayArrivals() {
  const today = format(new Date(), 'yyyy-MM-dd');
  return db.query.bookings.findMany({
    where: and(
      eq(bookings.startDate, today),
      eq(bookings.status, 'confirmed'),
    ),
    with: { slip: { with: { dock: true } }, vessel: true, boater: true },
  });
}

export async function getTodayDepartures() {
  const today = format(new Date(), 'yyyy-MM-dd');
  return db.query.bookings.findMany({
    where: and(
      eq(bookings.endDate, today),
      eq(bookings.status, 'checked_in'),
    ),
    with: { slip: { with: { dock: true } }, vessel: true, boater: true },
  });
}
```

### Rate Calculation (Claude's Discretion)
```typescript
// src/lib/domain/booking-rules.ts
import { differenceInDays, differenceInMonths } from 'date-fns';

export function calculateBookingPrice(
  type: 'transient' | 'seasonal',
  startDate: string,
  endDate: string,
  slip: { priceDaily: number; priceMonthly: number },
): number {
  if (type === 'transient') {
    const days = differenceInDays(new Date(endDate), new Date(startDate));
    return days * slip.priceDaily;
  } else {
    // Seasonal: charge per month, minimum 1 month
    const months = Math.max(1, differenceInMonths(new Date(endDate), new Date(startDate)));
    return months * slip.priceMonthly;
  }
}
```

### Accessing better-sqlite3 for BEGIN IMMEDIATE
```typescript
// The Drizzle better-sqlite3 driver exposes the raw sqlite handle
// Pattern from existing db/index.ts: uses better-sqlite3 directly
// For transactions, access it via: (db as any)._.session.client
// Verify this path by checking drizzle-orm/better-sqlite3 internals

// Alternative: import the sqlite instance directly from db/index.ts
// by exporting it alongside the drizzle instance
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Application-level availability checks | DB transaction with write lock (BEGIN IMMEDIATE) | Always best practice | Eliminates race conditions |
| Manual date math with JS Date | date-fns v4 with tree-shaking | date-fns v4 (2024) | Smaller bundles, ESM-native |
| Redux for form state | react-hook-form v7 + zod | RHF v7 (2023) | Less boilerplate, better DX |
| Separate calendar library | Custom grid + date-fns | N/A (domain-specific) | Full control over Gantt layout |

## Open Questions

1. **Accessing better-sqlite3 raw handle from Drizzle**
   - What we know: `db/index.ts` creates the Database instance and passes it to drizzle(). The Drizzle API for better-sqlite3 should expose `.transaction()` but the `immediate()` modifier requires the raw better-sqlite3 handle.
   - What's unclear: Exact internal path to access the raw sqlite handle from the drizzle instance at runtime (e.g., `db._.session.client` or similar).
   - Recommendation: Export the raw `sqlite` instance from `db/index.ts` alongside the `db` drizzle instance. Use `sqlite.transaction(() => { ... }).immediate()` with drizzle queries inside. This is the cleanest approach and avoids reaching into drizzle internals.

2. **Calendar grid component: custom vs library**
   - What we know: This is a Gantt-style grid (slip rows x day columns), not a standard calendar. No React library provides this exact layout.
   - Recommendation: Build custom. Use date-fns for month day generation (`eachDayOfInterval`, `startOfMonth`, `endOfMonth`). Render as CSS grid or HTML table. Booking bars use absolute positioning within cells.

3. **Booking form entry from map**
   - What we know: Slip detail panel has a "Book this Slip (Coming Soon)" button. Need to wire it to the booking form with pre-filled slip.
   - Recommendation: Use URL query params (`/admin/bookings/new?slipId=5`) or open a Sheet/Dialog directly from the map. Query params are simpler and allow direct linking.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.1 |
| Config file | `vitest.config.ts` (exists, node environment, @/ alias) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BOOK-01 | Create transient booking via server action | unit | `npx vitest run src/__tests__/booking-actions.test.ts -t "transient" -x` | Wave 0 |
| BOOK-02 | Create seasonal booking via server action | unit | `npx vitest run src/__tests__/booking-actions.test.ts -t "seasonal" -x` | Wave 0 |
| BOOK-03 | Vessel size validation rejects oversized vessel | unit | `npx vitest run src/__tests__/booking-rules.test.ts -t "vessel" -x` | Wave 0 |
| BOOK-04 | Double-booking prevented with overlapping dates | unit | `npx vitest run src/__tests__/booking-actions.test.ts -t "double" -x` | Wave 0 |
| BOOK-05 | State transitions enforced (valid + invalid) | unit | `npx vitest run src/__tests__/booking-rules.test.ts -t "transition" -x` | Wave 0 |
| BOOK-06 | Calendar queries return bookings for month range | unit | `npx vitest run src/__tests__/booking-dal.test.ts -t "calendar" -x` | Wave 0 |
| BOOK-07 | Arrivals/departures query for today | unit | `npx vitest run src/__tests__/booking-dal.test.ts -t "arrivals" -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/booking-rules.test.ts` -- covers BOOK-03, BOOK-05 (pure function tests, no DB needed)
- [ ] `src/__tests__/booking-actions.test.ts` -- covers BOOK-01, BOOK-02, BOOK-04 (in-memory SQLite, follows slip-actions.test.ts pattern)
- [ ] `src/__tests__/booking-dal.test.ts` -- covers BOOK-06, BOOK-07 (in-memory SQLite for DAL queries)

## Sources

### Primary (HIGH confidence)
- `src/db/schema.ts` -- Existing bookings table schema with all needed columns
- `src/lib/dal/slips.ts` -- Established DAL pattern with Drizzle relational queries
- `src/app/actions/slip-actions.ts` -- Established Server Action pattern with role checks
- `src/__tests__/slip-actions.test.ts` -- Established test pattern with in-memory SQLite mocking
- `src/db/index.ts` -- WAL mode already enabled, better-sqlite3 driver confirmed
- `.planning/research/PITFALLS.md` -- Double-booking race conditions, state machine, date boundaries
- `.planning/research/ARCHITECTURE.md` -- DAL pattern, domain logic isolation, file structure

### Secondary (MEDIUM confidence)
- date-fns v4 API (differenceInDays, eachDayOfInterval, format, etc.) -- verified via installed version 4.1.0
- better-sqlite3 transaction API with `.immediate()` -- documented in better-sqlite3 README
- Drizzle ORM relational queries with `and`, `eq`, `lt`, `gt` -- used successfully in existing code

### Tertiary (LOW confidence)
- Exact Drizzle internal path to access raw better-sqlite3 handle -- needs runtime verification. Recommendation: export raw handle from db/index.ts instead.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and proven in Phases 1-2
- Architecture: HIGH -- follows established patterns from existing codebase
- Pitfalls: HIGH -- well-documented booking system patterns, project-specific pitfalls research exists
- Calendar UI: MEDIUM -- custom build recommended but exact CSS grid approach needs iteration

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable stack, no fast-moving dependencies)
