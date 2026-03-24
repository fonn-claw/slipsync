# Project Research Summary

**Project:** SlipSync -- Marina & Boat Slip Management
**Domain:** Vertical SaaS / Operations Management (Marina Industry)
**Researched:** 2026-03-24
**Confidence:** HIGH

## Executive Summary

SlipSync is a full-stack marina management web application targeting small-to-mid marina operators who currently rely on spreadsheets. The domain is well-understood: slip inventory, booking management, vessel tracking, and role-based portals for admins, dock staff, and boaters. Every major competitor (DockMaster, Dockwa, MarinaOffice) follows the same core pattern -- visual dock map, booking engine with size matching, and operational dashboards. The technology choices are mature and well-documented. There is no novel technical risk here; the challenge is execution quality and polish for LinkedIn showcase.

The recommended approach is a Next.js 16 App Router monolith with SQLite/Drizzle, server-first rendering, and an interactive SVG marina map as the hero feature. The stack is deliberately simple: no external services, no separate backend, no complex state management. Server Components handle data fetching, Server Actions handle mutations, and Client Components are used only for interactive islands (the map, forms, calendar). Authentication is lightweight cookie-based with three demo accounts. This stack lets a single developer build a production-quality showcase in one session.

The primary risks are: (1) double-booking race conditions at the database level -- must use SQLite transactions with BEGIN IMMEDIATE, not just application-level checks; (2) the SVG marina map becoming unmaintainable spaghetti -- must be data-driven from day one with a clear component hierarchy; and (3) seed data with hardcoded dates going stale -- all dates must be relative to Date.now(). These are all preventable with upfront architecture decisions rather than post-hoc fixes.

## Key Findings

### Recommended Stack

A zero-infrastructure Next.js monolith. Every technology choice prioritizes developer speed and showcase polish over production scalability.

**Core technologies:**
- **Next.js 16.1 + React 19**: Full-stack framework with App Router, Server Components, Server Actions, Turbopack -- the standard choice for React apps in 2026
- **SQLite + better-sqlite3 + Drizzle ORM**: Zero-config file-based database with type-safe queries. Drizzle over Prisma for lighter weight and better SQLite support
- **Tailwind CSS 4.2 + shadcn/ui**: Professional UI out of the box. shadcn/ui copies components into the project (not a dependency), built on Radix primitives
- **Recharts**: Dashboard charts (occupancy trends, revenue). Declarative SVG-based API
- **Inline React SVG**: Marina map is a custom layout, not a geographic map. No mapping library needed
- **Zod + React Hook Form**: End-to-end type-safe validation from forms through server actions to database
- **date-fns 4.x**: Booking date math with timezone support and tree-shaking
- **iron-session**: Encrypted cookie sessions for lightweight demo auth. No session database needed

**Explicitly rejected:** Prisma (too heavy), Redux/Zustand (no complex client state), NextAuth (overkill for 3 demo accounts), D3.js (overkill for fixed dock layout), Canvas API (loses CSS/accessibility), tRPC (unnecessary for monolith).

### Expected Features

**Must have (table stakes):**
- Interactive visual marina map with color-coded slip status (hero feature)
- Slip inventory with dimensions (length, beam, draft) across 4 docks
- Vessel-to-slip size matching enforcement
- Booking system: transient and seasonal, with calendar availability
- Double-booking prevention (server-side date-range overlap checks)
- Booking lifecycle: pending -> confirmed -> checked-in -> checked-out -> cancelled
- Boater/customer database with vessel registration
- Role-based access control (admin, dock staff, boater)
- Admin dashboard with KPIs (occupancy, revenue, arrivals/departures)
- Responsive/tablet design for dockside use

**Should have (differentiators):**
- Boater self-service portal (browse, book, manage vessels) -- most budget tools are admin-only
- Waitlist management with FIFO ordering
- Maintenance request system (boater-submitted, staff-tracked)
- Revenue analytics by dock and slip type
- Historical occupancy trends (charts)
- Arrival/departure board (dock staff operational view)
- Slip detail panel from map clicks (ties hero feature to operations)

**Defer entirely:** Payment processing, fuel management, utility metering, weather widget, push notifications, drag-and-drop slip reassignment, multi-marina, native mobile app, chat/messaging, compliance tracking.

### Architecture Approach

Server-first Next.js monolith. Pages are Server Components that fetch data through a centralized Data Access Layer (DAL) which always verifies auth before returning data. Mutations go through Server Actions with Zod validation. The marina map is the only complex Client Component -- it receives slip data as props from a Server Component parent and manages selection state locally. Route groups separate the three role-based experiences (admin, dock staff, boater) with distinct layouts and navigation.

**Major components:**
1. **Auth Middleware** -- Cookie-based session validation, role-gated route protection, redirects
2. **Data Access Layer (src/lib/dal/)** -- Centralized database access with auth checks. Never call Drizzle directly from components
3. **Domain Logic (src/lib/domain/)** -- Booking rules (vessel fitting, double-booking prevention, lifecycle state machine, pricing)
4. **Marina Map (Client Component)** -- Data-driven SVG: MarinaMap > Dock > Slip component hierarchy with status colors and click-to-inspect
5. **Role-Scoped Route Groups** -- Separate layouts for admin (/admin/*), dock staff (/dock/*), and boater (/boater/*) experiences
6. **Seed Script** -- Generates all demo data with relative dates. Critical for showcase quality

**Database: 7 tables** -- users, docks, slips, vessels, bookings, waitlist, maintenance_requests. All relations are straightforward foreign keys.

### Critical Pitfalls

1. **Double-booking race conditions** -- Application-level SELECT-then-INSERT is not atomic. Use SQLite transactions with `BEGIN IMMEDIATE` to acquire write lock before checking availability. Enable WAL mode. This is non-negotiable for the core value proposition.

2. **SVG map becoming unmaintainable** -- Define dock/slip layout as data (coordinates, dimensions), not hardcoded SVG paths. Component hierarchy: MarinaMap > Dock > Slip. Status colors from a single config. Test: can you add a 5th dock by only adding a data entry?

3. **Stale seed data dates** -- All seed dates must be relative to `Date.now()`. Use helpers like `daysFromNow(-30)`. Current bookings must span today. Historical bookings in the past. Future reservations ahead. Without this, the demo breaks within weeks.

4. **Booking lifecycle without transition guards** -- Define allowed state transitions as a map. Validate server-side. UI only shows valid next-state buttons. Reject invalid transitions with clear errors.

5. **Role-based access only in UI** -- Every server action and API route must check roles, not just hide nav links. Create a `requireRole()` helper. Test by hitting admin endpoints as a boater.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation (Database, Auth, Seed Data)
**Rationale:** Everything depends on data and authentication. The seed script creates the realistic demo data that makes every subsequent feature demonstrable. Auth gates all routes. Must be built first.
**Delivers:** Database schema with all 7 tables, Drizzle ORM setup, cookie-based auth with 3 demo accounts, role middleware, base layouts for all 3 roles, seed script with relative dates populating 60 slips, 4 docks, 15-20 boaters, vessels, and historical bookings.
**Addresses:** Slip inventory management, vessel registration, boater database, role-based access control (all table stakes).
**Avoids:** Stale seed dates (Pitfall 4), UI-only RBAC (Pitfall 6), date storage format issues (Pitfall 7).

### Phase 2: Interactive Marina Map (Hero Feature)
**Rationale:** The hero feature and most visually complex component. Building it second means the data layer is ready. It serves as the visual centerpiece that subsequent features layer onto. Most likely to need iteration, so build early.
**Delivers:** Full SVG marina map showing 4 docks with 60 color-coded slips, click-to-select interaction, slip detail panel with vessel info and booking history, role-aware action buttons.
**Addresses:** Interactive visual marina map (table stakes), slip detail panel from map (differentiator).
**Avoids:** SVG spaghetti (Pitfall 3) -- data-driven layout architecture from the start.

### Phase 3: Booking System
**Rationale:** Core business logic. Depends on slips and vessels existing (Phase 1). The marina map from Phase 2 provides visual context. This phase contains the most critical domain logic and the highest-risk pitfall (double-booking).
**Delivers:** Booking creation with vessel-slip size matching, double-booking prevention with database-level enforcement, booking lifecycle state machine with transition guards, calendar availability view, transient and seasonal booking types.
**Addresses:** Booking system, double-booking prevention, vessel-to-slip matching, booking lifecycle (all table stakes).
**Avoids:** Double-booking race conditions (Pitfall 1), vessel sizing too loose/strict (Pitfall 2), lifecycle without guards (Pitfall 5), date boundary errors (Pitfall 7).

### Phase 4: Role-Specific Portals and Dashboard
**Rationale:** Views and workflows built on top of existing data and booking system. Each role gets a tailored experience. The admin dashboard with charts is the "wow" layer for LinkedIn screenshots.
**Delivers:** Admin dashboard with occupancy/revenue KPIs and charts, dock staff operations view (arrivals/departures, check-in/check-out, maintenance queue), boater self-service portal (browse slips, book, manage vessels, submit maintenance requests), waitlist management.
**Addresses:** Admin dashboard (table stakes), boater portal (differentiator), waitlist (differentiator), maintenance requests (differentiator), arrival/departure board (differentiator), revenue analytics (differentiator), occupancy trends (differentiator).
**Avoids:** N+1 dashboard queries (Pitfall 8), waitlist without priority rules (Pitfall 9).

### Phase 5: Polish and Demo Readiness
**Rationale:** LinkedIn showcase quality. All functionality exists; this phase makes it impressive. Responsive refinement, nautical theme consistency, loading/error states, edge case handling, final seed data tuning.
**Delivers:** Tablet-optimized responsive layouts, polished nautical color palette (navy, teal, seafoam, white), loading skeletons, error boundaries, edge case handling, final demo data verification.
**Addresses:** Responsive/tablet design (table stakes), overall showcase quality.
**Avoids:** Maintenance status blocking future bookings (Pitfall 10).

### Phase Ordering Rationale

- **Data-first**: Cannot build features without data. Schema, seed, and auth must come first.
- **Hero early**: The marina map is the centerpiece and the component most likely to need rework. Building it in Phase 2 gives maximum time for iteration and lets every subsequent phase integrate with it.
- **Business logic before UX**: The booking system (Phase 3) must be solid before building the portals that consume it (Phase 4). Getting domain rules wrong late is costly.
- **Polish last**: Responsive tweaks, theme refinement, and edge cases are best addressed when all features exist and can be evaluated holistically.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Marina Map):** SVG coordinate system design, responsive SVG viewBox scaling, touch interaction on tablets. The data-driven layout approach is well-documented but the specific dock arrangement geometry needs design work.
- **Phase 3 (Booking System):** SQLite transaction semantics with BEGIN IMMEDIATE, date-range overlap query patterns. Well-documented individually but the combination needs careful implementation.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Next.js App Router setup, Drizzle/SQLite, cookie auth -- extremely well-documented, no ambiguity.
- **Phase 4 (Portals/Dashboard):** CRUD views, Recharts integration, role-scoped layouts -- standard patterns, no novelty.
- **Phase 5 (Polish):** Responsive design, theme tuning -- standard frontend work.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Every technology is mature, well-documented, and version-pinned. All sources are official docs or established npm packages. No experimental dependencies. |
| Features | HIGH | Based on 8 industry sources including competitor analysis (DockMaster, Dockwa, MarinaOffice). Clear consensus on table stakes vs. differentiators. |
| Architecture | HIGH | Next.js App Router patterns are well-established. Server-first monolith is the simplest correct architecture for this use case. Database schema is straightforward relational. |
| Pitfalls | HIGH | Top pitfalls (race conditions, SVG maintainability, stale dates) are well-documented across multiple sources. Prevention strategies are concrete and testable. |

**Overall confidence:** HIGH

### Gaps to Address

- **SVG marina map geometry**: The data-driven approach is clear, but the actual coordinate layout for 4 docks with varying slip counts needs to be designed during Phase 2 planning. No research gap, just design work.
- **Vessel sizing tolerances**: No universal industry standard for clearance margins. For the showcase, simple `vessel <= slip` comparisons are sufficient. A production app would need configurable margins per dock.
- **Maintenance as date-ranged records vs. binary flag**: Research suggests date-ranged is better, but for the demo a simple status field on slips with a separate maintenance_requests table is adequate. Flag for v2 if needed.
- **iron-session vs. simpler approach**: iron-session is recommended but a plain signed cookie with jose (JWT) would also work. Either is fine for 3 demo accounts. Decide during Phase 1 implementation.

## Sources

### Primary (HIGH confidence)
- [Next.js 16.1 Release Notes](https://nextjs.org/blog/next-16-1)
- [Drizzle ORM Official Docs](https://orm.drizzle.team/docs/overview)
- [Drizzle SQLite Setup](https://orm.drizzle.team/docs/get-started/sqlite-new)
- [Tailwind CSS v4.2](https://tailwindcss.com/blog/tailwindcss-v4)
- [shadcn/ui Changelog](https://ui.shadcn.com/docs/changelog)
- [Recharts npm](https://www.npmjs.com/package/recharts)
- [Zod v4 Release Notes](https://zod.dev/v4)
- [better-sqlite3 npm](https://www.npmjs.com/package/better-sqlite3)
- [date-fns v4](https://date-fns.org/)
- [Next.js Authentication Guide](https://nextjs.org/docs/app/guides/authentication)

### Secondary (MEDIUM confidence)
- [DockMaster Marina Management Solutions](https://www.dockmaster.com/solutions/marina-management)
- [Dockwa Full Feature List](https://marinas.dockwa.com/marina-software/all-features)
- [MarinaMatch: Marina Management Software Features](https://www.marinamatch.org/blog-detail/marina-management-software-top-features)
- [Boating Industry: Evolving Expectations for Marinas (2026)](https://boatingindustry.com/news/2026/01/02/the-evolving-expectations-for-marinas/)
- [How to Solve Race Conditions in a Booking System (HackerNoon)](https://hackernoon.com/how-to-solve-race-conditions-in-a-booking-system)
- [Non-Overlapping Time Ranges in SQL](https://sqlfordevs.com/non-overlapping-time-ranges)
- [Interactive SVG Map Techniques](https://www.petercollingridge.co.uk/tutorials/svg/interactive/interactive-map/)
- [Trawler Forum: Rule of Thumb for Boat Slip Size](https://www.trawlerforum.com/threads/rule-of-thumb-for-boat-slip-size.59687/)

---
*Research completed: 2026-03-24*
*Ready for roadmap: yes*
