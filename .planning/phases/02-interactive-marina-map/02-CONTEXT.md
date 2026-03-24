# Phase 2: Interactive Marina Map - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Interactive SVG marina map displaying 4 docks (A, B, C, D) with 60 total slips, color-coded by status (green=available, blue=occupied, yellow=reserved, red=maintenance). Click any slip to open a detail panel with vessel info, booking history, and role-appropriate actions. Admin/staff can change slip status from the detail panel. Map is responsive and touch-friendly for tablet use. This is the HERO FEATURE — the first thing users see, the LinkedIn screenshot centerpiece.

</domain>

<decisions>
## Implementation Decisions

### SVG Dock Layout
- Top-down marina basin view with 4 parallel finger piers extending from a main walkway at the bottom
- Water rendered as subtle blue gradient background; dock walkways as solid gray/brown rectangles
- Slips rendered as rectangular berths along each pier, sized proportionally to actual slip dimensions
- Dock labels (A, B, C, D) at pier base with slip count badges
- Data-driven rendering: dock and slip positions computed from database data, not hardcoded SVG paths
- Layout: Dock A (20 small slips) and B (15 medium) on left side, C (15 large) and D (10 XL) on right side

### Slip Detail Panel
- Right-side slide-out panel using shadcn/ui Sheet component (already installed from Phase 1)
- Panel content: slip info header (number, dock, dimensions, status badge), current vessel card (if occupied), booking history timeline (last 5 bookings with vessel name/dates/status), action buttons
- Empty slips show dimensions and "Available" badge with a "Book this slip" CTA (placeholder for Phase 3)
- Panel opens on slip click, closes on X or outside click

### Map Interaction Patterns
- Hover tooltip: slip number, status text, vessel name (if occupied) — lightweight info without full panel
- No zoom/pan — fixed viewport showing all 4 docks at once (optimized for screenshots and tablet use)
- Floating legend card in top-right corner with color key for all 4 statuses
- Clickable dock labels to highlight/filter a single dock — dims other docks, clicking again shows all

### Status Change UX
- Admin/staff see a status dropdown in the detail panel with confirmation dialog before changing
- Boaters see read-only status information — no change controls shown
- Optimistic UI: slip color updates immediately on status change, reverts on server error
- Setting status to "maintenance" shows a warning indicator and optional maintenance note field in the panel

### Claude's Discretion
- Exact SVG geometry coordinates and spacing calculations
- Tooltip component implementation (native vs shadcn)
- Animation/transition effects on slip color changes
- Exact responsive breakpoints for map scaling on tablet

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `BRIEF.md` — Marina map requirements in "Core Features > 1. Interactive Visual Marina Map" section
- `.planning/REQUIREMENTS.md` — MAP-01..05, SLIP-03 requirements for this phase
- `.planning/research/STACK.md` — Recommends inline React SVG (no library needed)
- `.planning/research/ARCHITECTURE.md` — SVG map as Client Component receiving data from Server Component parent
- `.planning/research/PITFALLS.md` — SVG map must be data-driven from day one, not hardcoded

### Existing code (from Phase 1)
- `src/db/schema.ts` — Slip and dock table schemas with status enum, dimensions fields
- `src/db/index.ts` — Database connection singleton
- `src/components/ui/sheet.tsx` — shadcn Sheet component for detail panel
- `src/components/ui/badge.tsx` — Badge component for status indicators
- `src/components/ui/card.tsx` — Card component for panel sections
- `src/components/ui/tooltip.tsx` — Tooltip component for hover info
- `src/app/globals.css` — Nautical OKLCH theme variables
- `src/lib/auth.ts` — Session helpers for role-checking in detail panel actions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Sheet` component (shadcn/ui): Perfect for slip detail slide-out panel
- `Badge` component: For status indicators (available/occupied/reserved/maintenance)
- `Card` component: For vessel info cards and booking history items in detail panel
- `Tooltip` component: For hover info on slips
- `Button`, `DropdownMenu`: For status change actions
- `ScrollArea`: For scrollable booking history in detail panel
- Marina logo component: For consistent branding on map view

### Established Patterns
- OKLCH nautical color palette via CSS custom properties — map colors should use theme variables
- Server Components as data loaders, Client Components for interactivity (established in Phase 1 layouts)
- iron-session auth for role checks — detail panel actions conditional on user role

### Integration Points
- Map page goes in `src/app/(admin)/marina-map/page.tsx` and `src/app/(staff)/operations/page.tsx` (or shared)
- Slip data fetched via Drizzle queries joining slips → docks → bookings → vessels
- Status updates via Server Actions calling Drizzle update queries
- Staff landing page currently points to `/operations` — map should be the main view there

</code_context>

<specifics>
## Specific Ideas

- This is the HERO FEATURE — the LinkedIn screenshot moment. It must be visually stunning.
- "Sunset Harbor Marina" branding should appear on or near the map
- The map should feel like looking down at a real marina — water, piers, boats in slips
- Color-coding must be immediately obvious — the 4 colors should be distinct and intuitive
- The detail panel should feel like clicking a pin on Google Maps — informative, actionable

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-interactive-marina-map*
*Context gathered: 2026-03-24*
