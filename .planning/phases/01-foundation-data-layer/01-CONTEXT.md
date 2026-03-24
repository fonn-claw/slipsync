# Phase 1: Foundation & Data Layer - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Database schema (slips, docks, users, vessels, bookings, maintenance requests, waitlist), authentication system with role-based access control (admin, dock_staff, boater), comprehensive seed data with realistic relative dates, and base application layouts with ocean/nautical theme using shadcn/ui. This phase delivers a running app that three demo users can log into with role-appropriate views — no features beyond auth, navigation, and seeded data.

</domain>

<decisions>
## Implementation Decisions

### Authentication
- iron-session with httpOnly cookies for session management — simplest secure approach for demo accounts
- Login via Next.js Server Action with redirect — no client-side auth state management needed
- Middleware-based route protection with role checks — centralized enforcement at the API layer
- Standard login form — no quick-switch UI or magic links needed
- Three demo accounts seeded: admin@slipsync.app, dock@slipsync.app, boater@slipsync.app (all password: demo1234)

### Nautical Theme System
- Navy/teal/seafoam color palette implemented as CSS custom properties extending shadcn/ui theme
- Light mode only — optimized for LinkedIn screenshots and demo presentations
- Inter font for body text, system font stack fallback
- Subtle shadows with rounded corners, seafoam accent highlights on interactive elements
- shadcn/ui components customized via CSS variables, not component overrides

### Layout Structure
- Three Next.js route groups: (admin), (staff), (boater) with shared layout shells per role
- Admin and staff: sidebar navigation with marina branding at top
- Boater portal: top navigation bar with horizontal links
- Collapsible sidebar on tablet, hamburger menu on mobile
- Post-login landing pages: admin → dashboard placeholder, staff → marina map placeholder, boater → my bookings placeholder

### Seed Data Strategy
- All dates relative to Date.now() — demo always looks current whenever seed runs
- Auto-seed on first run if database is empty (check on app startup or via seed script)
- Realistic boater names with nautical-themed vessel names (e.g., "Sea Breeze", "Windward Spirit")
- Revenue data derived from booking history with rate variations by slip size/dock
- Slip dimensions follow realistic marina standards: Dock A (20-30ft), B (30-45ft), C (45-65ft), D (65-100ft)
- Status distribution: ~40% occupied, ~20% reserved upcoming, ~30% available, ~10% maintenance

### Claude's Discretion
- Exact Drizzle schema column types and index choices
- Specific seed data names and vessel details
- Loading state and error boundary implementation
- Exact sidebar width and navigation icon choices

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements are fully captured in BRIEF.md and decisions above.

### Project context
- `BRIEF.md` — Full project brief with business context, target users, feature specs, demo data requirements, design requirements
- `.planning/PROJECT.md` — Synthesized project context with core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — AUTH-01..05, SLIP-01..02, SEED-01..05, UX-01..03 requirements for this phase
- `.planning/research/STACK.md` — Technology stack recommendations with versions
- `.planning/research/ARCHITECTURE.md` — System architecture, component boundaries, data flow
- `.planning/research/PITFALLS.md` — Domain pitfalls including seed date handling and auth middleware placement

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None — this phase establishes all patterns

### Integration Points
- This phase creates the foundation that all subsequent phases build on
- Schema design must anticipate booking system (Phase 3) and portal views (Phase 4)
- Layout shells must have slot/outlet patterns for Phase 2 marina map integration

</code_context>

<specifics>
## Specific Ideas

- Ocean/nautical palette is critical — this goes on LinkedIn and must impress business decision-makers
- "Sunset Harbor Marina" as the demo marina name
- Demo accounts must be memorable: admin@slipsync.app / dock@slipsync.app / boater@slipsync.app all with demo1234
- The boater demo account should have 2 registered vessels and 1 active booking

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-data-layer*
*Context gathered: 2026-03-24*
