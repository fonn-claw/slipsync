# Architecture Patterns

**Domain:** Marina & Boat Slip Management (Full-Stack Web Application)
**Researched:** 2026-03-24

## Recommended Architecture

Next.js App Router with a server-first architecture. React Server Components handle data fetching and rendering by default. Client Components are used only for interactive elements (the marina map, booking calendar, form interactions). SQLite via Drizzle ORM provides the data layer with zero external dependencies. Cookie-based session auth with role middleware handles access control.

This is a monolithic full-stack application -- appropriate for a showcase/demo app that runs locally. No microservices, no external APIs, no separate backend.

### High-Level Structure

```
Browser
  |
  v
Next.js App Router (src/app/)
  |
  +-- Middleware (auth check, role gating, redirects)
  |
  +-- Layouts (role-specific shells: admin, dock staff, boater)
  |     |
  |     +-- Server Components (data fetching, rendering)
  |     |
  |     +-- Client Components (interactivity islands)
  |           |
  |           +-- Marina Map (SVG, state management)
  |           +-- Booking Calendar (date picking, availability)
  |           +-- Forms (booking, vessel registration, maintenance)
  |
  +-- Server Actions (mutations: create booking, update slip, etc.)
  |
  +-- Data Access Layer (src/lib/dal/)
  |     |
  |     +-- Auth functions (session read, role check)
  |     +-- Query functions (slips, bookings, vessels, etc.)
  |
  +-- Drizzle ORM (src/db/)
        |
        +-- Schema definitions (tables, relations)
        +-- SQLite database file (local)
        +-- Seed script
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Middleware** (`middleware.ts`) | Route protection, role-based redirects, session validation | Reads session cookie; redirects unauthenticated/unauthorized users |
| **Admin Layout** (`/admin/*`) | Dashboard, slip management, booking oversight, waitlist | Server Actions, Data Access Layer |
| **Dock Staff Layout** (`/dock/*`) | Check-in/out operations, maintenance tracking, daily view | Server Actions, Data Access Layer |
| **Boater Layout** (`/boater/*`) | Self-service portal: browse slips, book, manage vessels | Server Actions, Data Access Layer |
| **Marina Map** (Client Component) | SVG rendering of docks/slips, color-coded status, click interactions | Receives slip data as props from Server Component parent; emits slip selection events |
| **Booking Engine** (Server Actions + Client UI) | Availability checking, vessel-slip matching, double-booking prevention, lifecycle management | Data Access Layer for validation and persistence |
| **Data Access Layer** (`src/lib/dal/`) | All database queries centralized, auth-checked | Drizzle ORM, session utilities |
| **Drizzle Schema** (`src/db/schema.ts`) | Single source of truth for data model, TypeScript types | SQLite via better-sqlite3 driver |
| **Seed Script** (`src/db/seed.ts`) | Populates demo data: marina, docks, slips, boaters, vessels, bookings, maintenance requests | Drizzle ORM directly |

### Data Flow

**Read Path (Server Components):**
```
Page (Server Component)
  -> Data Access Layer (checks auth, queries DB)
    -> Drizzle ORM (type-safe SQL)
      -> SQLite
  <- Returns typed data
  -> Renders HTML on server
  -> Ships to browser (zero JS for static content)
```

**Write Path (Server Actions):**
```
Client Form/Button
  -> Server Action (form data or arguments)
    -> Validate input (zod schema)
    -> Data Access Layer (auth check + business logic)
      -> Drizzle ORM (insert/update/delete)
        -> SQLite
    -> revalidatePath() to refresh affected pages
  <- Return result to client
```

**Marina Map Interaction:**
```
Server Component loads all slips with current status
  -> Passes slip data as props to Client Component <MarinaMap>
    -> SVG renders docks and slips with color coding
    -> User clicks slip
      -> Client state updates (selected slip)
      -> Slip detail panel shows (vessel info, booking history)
      -> Actions available based on role (book, check-in, mark maintenance)
        -> Server Action triggered on action click
```

## Patterns to Follow

### Pattern 1: Data Access Layer (DAL)
**What:** Centralize all database access in `src/lib/dal/` functions that always verify the session before returning data. Never call Drizzle directly from components or actions.
**When:** Every data read and write.
**Why:** Single place to enforce auth, consistent error handling, keeps components clean.
**Example:**
```typescript
// src/lib/dal/bookings.ts
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { bookings, slips } from '@/db/schema';

export async function getActiveBookings() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  return db.query.bookings.findMany({
    where: eq(bookings.status, 'confirmed'),
    with: { slip: true, vessel: true, boater: true },
  });
}
```

### Pattern 2: Role-Scoped Route Groups
**What:** Use Next.js route groups to create separate layout shells per role.
**When:** Structuring the `app/` directory.
**Why:** Each role sees a different navigation, different dashboard, different available actions. Route groups keep this clean without URL impact.
**Structure:**
```
src/app/
  (auth)/
    login/page.tsx
  (admin)/
    layout.tsx          -- Admin sidebar nav
    dashboard/page.tsx
    slips/page.tsx
    bookings/page.tsx
    waitlist/page.tsx
  (dock)/
    layout.tsx          -- Dock staff nav
    operations/page.tsx
    maintenance/page.tsx
  (boater)/
    layout.tsx          -- Boater nav
    browse/page.tsx
    my-bookings/page.tsx
    my-vessels/page.tsx
  (shared)/
    marina-map/         -- Shared map component used across roles
```

### Pattern 3: Server Component + Client Island for Map
**What:** The marina map page is a Server Component that fetches all slip data, then passes it to a Client Component that handles SVG rendering and interactivity.
**When:** Any page with the interactive map.
**Why:** Keeps data fetching on the server (fast, secure), while interactivity runs client-side. The map SVG structure is deterministic from slip data, so initial render can be server-side with hydration for click handlers.

### Pattern 4: Booking Validation as Domain Logic
**What:** All booking rules (vessel fits slip, no double-booking, valid date range) live in a shared validation module (`src/lib/domain/booking-rules.ts`), not scattered across actions or components.
**When:** Creating or modifying bookings.
**Why:** Business rules in one place. Testable in isolation. Used by both Server Actions (enforcement) and Client Components (optimistic UI feedback).

### Pattern 5: Zod Schemas for Shared Validation
**What:** Define Zod schemas for each entity that serve triple duty: form validation (client), Server Action validation (server), and Drizzle insert types.
**When:** Any form submission or data mutation.
**Why:** Single schema definition, type-safe end to end, catches errors early on client before round-tripping.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Fat Client Components
**What:** Making entire pages Client Components to use hooks or state.
**Why bad:** Ships unnecessary JS, loses server-side data fetching benefits, slower initial load.
**Instead:** Keep pages as Server Components. Extract only the interactive piece as a small Client Component island. Pass data down as props.

### Anti-Pattern 2: API Routes for Internal Data
**What:** Creating `/api/*` routes and fetching them from Server Components.
**Why bad:** Unnecessary HTTP round-trip. Server Components can call the database directly through the DAL.
**Instead:** Use the Data Access Layer directly in Server Components. Use Server Actions for mutations. Only create API routes if you genuinely need an external API endpoint (you do not for this app).

### Anti-Pattern 3: Global State for Slip Data
**What:** Putting all slip/booking data in a client-side store (Redux, Zustand) and syncing with the server.
**Why bad:** Stale data, complex sync logic, duplicates what the server already knows.
**Instead:** Let Server Components fetch fresh data on each render. Use React's `revalidatePath` after mutations. Only use client state for ephemeral UI state (selected slip, open panels, form drafts).

### Anti-Pattern 4: Inline SQL or Raw Queries
**What:** Writing raw SQL strings instead of using Drizzle's query builder.
**Why bad:** Loses type safety, prone to injection if mishandled, harder to refactor.
**Instead:** Use Drizzle's relational query API and typed schema throughout.

## Database Schema Design

### Core Tables

```
users
  id, email, password_hash, name, role (admin|dock_staff|boater), phone, created_at

docks
  id, name (A/B/C/D), description, slip_count, min_length, max_length

slips
  id, dock_id (FK->docks), number (e.g. "A-01"), length, width, depth,
  status (available|occupied|reserved|maintenance), price_daily, price_monthly,
  has_electric, has_water, notes

vessels
  id, owner_id (FK->users), name, type, loa (length overall), beam, draft,
  registration_number, year, created_at

bookings
  id, slip_id (FK->slips), vessel_id (FK->vessels), boater_id (FK->users),
  type (transient|seasonal), status (pending|confirmed|checked_in|checked_out|cancelled),
  start_date, end_date, total_price, notes, created_at, updated_at

waitlist
  id, boater_id (FK->users), vessel_id (FK->vessels), preferred_dock,
  min_length, requested_start, requested_end, status (waiting|offered|accepted|expired),
  priority, created_at

maintenance_requests
  id, slip_id (FK->slips), reported_by (FK->users), assigned_to (FK->users, nullable),
  title, description, priority (low|medium|high|urgent),
  status (open|in_progress|completed|cancelled), created_at, resolved_at
```

### Key Relations
```
docks 1->N slips
users 1->N vessels (boater owns vessels)
users 1->N bookings (boater makes bookings)
slips 1->N bookings (slip has booking history)
vessels 1->N bookings (vessel is booked into slips)
users 1->N waitlist (boater waits for slips)
slips 1->N maintenance_requests
users 1->N maintenance_requests (reported_by, assigned_to)
```

### Vessel-Slip Matching Logic
A vessel fits a slip when: `vessel.loa <= slip.length AND vessel.beam <= slip.width AND vessel.draft <= slip.depth`. This is enforced at booking creation time in the domain logic layer.

### Double-Booking Prevention
At booking creation: query for any existing booking on the same slip where date ranges overlap and status is not `cancelled` or `checked_out`. If found, reject. This is a database-level check in the DAL, not a UI-only guard.

## File Structure

```
src/
  app/
    layout.tsx                  -- Root layout (fonts, theme provider)
    page.tsx                    -- Landing/login redirect
    globals.css                 -- Tailwind + nautical theme tokens
    middleware.ts               -- Auth + role routing
    (auth)/
      login/page.tsx
    (admin)/
      layout.tsx
      dashboard/page.tsx        -- Stats, charts, quick actions
      marina/page.tsx           -- Full marina map view
      bookings/page.tsx         -- All bookings list + management
      bookings/[id]/page.tsx    -- Single booking detail
      slips/page.tsx            -- Slip management table
      waitlist/page.tsx         -- Waitlist management
    (dock)/
      layout.tsx
      operations/page.tsx       -- Today's arrivals/departures, check-in/out
      marina/page.tsx           -- Map view (dock staff perspective)
      maintenance/page.tsx      -- Maintenance request queue
    (boater)/
      layout.tsx
      browse/page.tsx           -- Browse available slips + map
      my-bookings/page.tsx      -- Current and past bookings
      my-vessels/page.tsx       -- Vessel management
      maintenance/page.tsx      -- Submit/track maintenance requests
  components/
    ui/                         -- shadcn/ui components
    marina-map/
      marina-map.tsx            -- Main SVG map (Client Component)
      dock-section.tsx          -- Individual dock rendering
      slip-element.tsx          -- Individual slip SVG element
      slip-detail-panel.tsx     -- Slide-out detail panel
    booking/
      booking-form.tsx          -- Create/edit booking
      booking-calendar.tsx      -- Calendar availability view
      availability-checker.tsx  -- Vessel-slip matching UI
    dashboard/
      stats-cards.tsx           -- Occupancy, revenue, etc.
      occupancy-chart.tsx       -- Trend chart
      arrivals-departures.tsx   -- Upcoming activity list
    shared/
      nav-sidebar.tsx           -- Role-aware navigation
      data-table.tsx            -- Reusable table with sorting/filtering
      status-badge.tsx          -- Color-coded status indicators
  lib/
    auth.ts                     -- Session management (encrypt/decrypt cookie)
    dal/                        -- Data Access Layer
      users.ts
      slips.ts
      bookings.ts
      vessels.ts
      waitlist.ts
      maintenance.ts
    domain/
      booking-rules.ts          -- Vessel fitting, double-booking, lifecycle
      pricing.ts                -- Rate calculations
    validations/
      booking.ts                -- Zod schemas
      vessel.ts
      maintenance.ts
  db/
    index.ts                    -- Database connection (better-sqlite3 + Drizzle)
    schema.ts                   -- All table definitions
    seed.ts                     -- Demo data generation
    migrations/                 -- Drizzle migration files
```

## Suggested Build Order

The build order follows data dependencies -- you cannot build features that depend on data that does not exist yet.

### Phase 1: Foundation
**Build:** Database schema, Drizzle setup, seed script, auth system, base layouts.
**Rationale:** Everything depends on having data and authentication. The seed script is critical because it creates the realistic demo data that makes every subsequent feature demonstrable. Auth gates all routes.
**Dependencies:** None (greenfield).

### Phase 2: Marina Map (Hero Feature)
**Build:** SVG marina map component, dock rendering, slip elements, click interaction, detail panel.
**Rationale:** This is the hero feature and the most visually complex component. Building it second means the data layer is ready, and it serves as the visual centerpiece that ties everything together. It is also the component most likely to need iteration.
**Dependencies:** Phase 1 (needs slips data, auth for role-aware actions).

### Phase 3: Booking System
**Build:** Booking form, vessel-slip matching, double-booking prevention, booking lifecycle management, calendar view.
**Rationale:** Core business logic. Depends on slips and vessels existing (Phase 1 seed data). The marina map from Phase 2 provides visual context for where bookings happen.
**Dependencies:** Phase 1 (data layer), Phase 2 (map integration points).

### Phase 4: Role-Specific Portals
**Build:** Admin dashboard with stats/charts, dock staff operations view, boater self-service portal, maintenance requests.
**Rationale:** These are views and workflows built on top of the existing data and booking system. Each role gets a tailored experience using the same underlying components and data.
**Dependencies:** Phase 1 (auth/roles), Phase 2 (map reuse), Phase 3 (booking data).

### Phase 5: Polish and Demo Readiness
**Build:** Responsive refinement, nautical theme polish, loading states, error handling, edge cases, final seed data tuning.
**Rationale:** LinkedIn showcase quality. Everything functional exists; this phase makes it impressive.
**Dependencies:** All previous phases.

## Scalability Considerations

| Concern | Demo (1 user) | Small Marina (5-10 concurrent) | Production (100+ concurrent) |
|---------|---------------|-------------------------------|------------------------------|
| Database | SQLite file, zero config | SQLite handles this fine | Migrate to PostgreSQL |
| Sessions | Cookie-based, stateless | Same approach works | Add Redis session store |
| Map rendering | Client SVG, no issues | Same, data is small | Consider virtualization for 500+ slips |
| Booking conflicts | DAL check sufficient | Add DB-level unique constraint | Add optimistic locking or DB transactions |
| Search/filtering | In-memory filtering | SQLite indexes sufficient | Full-text search, pagination |

For this showcase app, SQLite is the right choice. It eliminates infrastructure complexity and the data volume (60 slips, 20 boaters) is trivially small.

## Sources

- [Next.js Official Authentication Guide](https://nextjs.org/docs/app/guides/authentication) -- MEDIUM confidence, official docs
- [Next.js App Router Patterns 2026](https://dev.to/teguh_coding/nextjs-app-router-the-patterns-that-actually-matter-in-2026-146) -- MEDIUM confidence, community guide
- [Drizzle ORM Official Docs](https://orm.drizzle.team/docs/overview) -- HIGH confidence, official source
- [Drizzle ORM SQLite Setup](https://orm.drizzle.team/docs/get-started/sqlite-new) -- HIGH confidence, official source
- [Interactive SVG Map Techniques](https://www.petercollingridge.co.uk/tutorials/svg/interactive/interactive-map/) -- MEDIUM confidence, established tutorial
- [Auth.js Role-Based Access Control](https://authjs.dev/guides/role-based-access-control) -- MEDIUM confidence, official docs (not directly used but pattern reference)
- [Next.js Full-Stack Architecture Patterns](https://softwaremill.com/modern-full-stack-application-architecture-using-next-js-15/) -- MEDIUM confidence, technical article
