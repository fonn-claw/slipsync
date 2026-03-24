# Phase 2: Interactive Marina Map - Research

**Researched:** 2026-03-24
**Domain:** Interactive SVG rendering, React Client Components, Server Actions
**Confidence:** HIGH

## Summary

This phase builds the HERO FEATURE: an interactive SVG marina map showing 4 docks with 60 color-coded slips, a click-to-inspect detail panel, and role-based status change actions. The foundation (database schema, auth, seed data, UI components) is fully in place from Phase 1.

The approach is inline React SVG -- no external mapping or visualization libraries needed. The marina map is a fixed layout (not geographic), so React's native SVG support with state management is the right tool. Data flows from a Server Component (fetches slips + docks + current bookings via Drizzle) into a Client Component that renders the SVG and manages interaction state (selected slip, hover). Status changes use Server Actions with `revalidatePath` for optimistic updates.

**Primary recommendation:** Build a data-driven SVG map with a component hierarchy of MarinaMap > DockSection > SlipElement. Define dock/slip positions as computed layout data (not hardcoded SVG paths). Use the existing shadcn Sheet for the detail panel, existing Tooltip for hover info, and existing Badge for status indicators.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Top-down marina basin view with 4 parallel finger piers extending from a main walkway at the bottom
- Water rendered as subtle blue gradient background; dock walkways as solid gray/brown rectangles
- Slips rendered as rectangular berths along each pier, sized proportionally to actual slip dimensions
- Dock labels (A, B, C, D) at pier base with slip count badges
- Data-driven rendering: dock and slip positions computed from database data, not hardcoded SVG paths
- Layout: Dock A (20 small slips) and B (15 medium) on left side, C (15 large) and D (10 XL) on right side
- Right-side slide-out panel using shadcn/ui Sheet component
- Panel content: slip info header, current vessel card, booking history timeline (last 5), action buttons
- Empty slips show "Available" badge with "Book this slip" CTA placeholder
- Hover tooltip: slip number, status text, vessel name (if occupied)
- No zoom/pan -- fixed viewport showing all 4 docks at once
- Floating legend card in top-right corner with color key
- Clickable dock labels to highlight/filter a single dock
- Admin/staff see status dropdown with confirmation dialog
- Boaters see read-only status -- no change controls
- Optimistic UI: slip color updates immediately, reverts on server error
- Setting status to "maintenance" shows warning indicator and optional note field

### Claude's Discretion
- Exact SVG geometry coordinates and spacing calculations
- Tooltip component implementation (native vs shadcn)
- Animation/transition effects on slip color changes
- Exact responsive breakpoints for map scaling on tablet

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MAP-01 | Interactive SVG marina map displays 4 docks (A, B, C, D) with 60 total slips | SVG viewBox layout pattern, DockSection + SlipElement component hierarchy, dock data from schema |
| MAP-02 | Slips are color-coded by status: available (green), occupied (blue), reserved (yellow), maintenance (red) | Status color map using CSS custom properties, Tailwind classes for SVG fill |
| MAP-03 | Clicking a slip opens a details panel with vessel info, booking history, and actions | Sheet component (already installed), Drizzle relational query for slip + bookings + vessels |
| MAP-04 | Map is data-driven (dock/slip layout from database, not hardcoded SVG) | Layout computation function that maps dock/slip DB records to SVG coordinates |
| MAP-05 | Map is responsive and works on tablet screens | SVG viewBox with preserveAspectRatio, container query or percentage width |
| SLIP-03 | Slip status can be changed (available, occupied, reserved, maintenance) | Server Action with Drizzle update, role check via getSession(), revalidatePath |
| UX-04 | Marina map is the centerpiece -- large, prominent, interactive | Full-width layout, water gradient background, polished visual treatment |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 + Next.js 16.2 | installed | SVG rendering + Server Actions | Native JSX SVG support, Server Components for data loading |
| shadcn/ui Sheet | installed | Slip detail slide-out panel | Already in project from Phase 1 setup |
| shadcn/ui Tooltip | installed | Hover info on slips | base-ui tooltip with arrow, already installed |
| shadcn/ui Badge | installed | Status indicators | Color-coded badges for slip status |
| shadcn/ui Card | installed | Detail panel sections | Vessel info card, booking history items |
| shadcn/ui DropdownMenu | installed | Status change dropdown | For admin/staff status selection |
| shadcn/ui ScrollArea | installed | Scrollable booking history | For detail panel overflow |
| Drizzle ORM | 0.45.x | Data queries | Relational queries for slips + bookings + vessels |
| Lucide React | installed | Icons | Anchor, Ship, Waves, etc. for marina visual elements |

### New Dependencies Needed
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | -- | -- | No new dependencies required for this phase |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline React SVG | D3.js | D3 is overkill for a fixed layout; React SVG gives full control with simpler mental model |
| Inline React SVG | Canvas API | Canvas loses CSS styling, accessibility, hover events; SVG is better for this use case |
| shadcn Tooltip | Native title attr | shadcn tooltip is already installed and provides better UX with styled popup + arrow |
| CSS transitions | Framer Motion | CSS transitions handle color changes fine; no need for a new dependency |

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    marina-map/
      marina-map.tsx           # Client Component: main SVG container + state
      dock-section.tsx         # SVG <g> for one dock (pier + slips)
      slip-element.tsx         # SVG <g> for one slip (rect + number label)
      slip-detail-panel.tsx    # Sheet-based detail panel
      map-legend.tsx           # Floating legend card
      map-layout.ts            # Pure function: DB data -> SVG coordinates
      map-constants.ts         # viewBox, colors, spacing constants
  lib/
    dal/
      slips.ts                 # Data access: getSlipsWithDetails(), updateSlipStatus()
  app/
    (admin)/
      marina/page.tsx          # Server Component: fetches data, renders <MarinaMap>
    (staff)/
      operations/page.tsx      # Server Component: same map, staff perspective
    actions/
      slip-actions.ts          # Server Action: changeSlipStatus
```

### Pattern 1: Data-Driven SVG Layout Computation
**What:** A pure function that takes dock and slip records from the database and returns an array of positioned elements with SVG coordinates. No SVG geometry is hardcoded in components.
**When to use:** Always -- this is the core architecture decision.
**Example:**
```typescript
// src/components/marina-map/map-layout.ts
interface DockLayout {
  dockId: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  slips: SlipLayout[];
}

interface SlipLayout {
  slipId: number;
  number: string;
  status: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const VIEWBOX = { width: 1200, height: 700 };
const DOCK_GAP = 40;
const SLIP_GAP = 2;

export function computeMarinaLayout(
  docks: DockWithSlips[]
): { viewBox: typeof VIEWBOX; docks: DockLayout[] } {
  // Left side: Dock A, Dock B
  // Right side: Dock C, Dock D
  // Each dock is a vertical pier with slips on both sides
  // Slip width proportional to maxLength relative to dock category
  // Returns positioned rectangles ready for SVG rendering
}
```

### Pattern 2: Server Component Data Loader + Client Island
**What:** The marina page is a Server Component that fetches all slip data with relations, then passes it as props to the Client Component marina map.
**When to use:** Every page that shows the map.
**Example:**
```typescript
// src/app/(admin)/marina/page.tsx (Server Component)
import { getSlipsWithDetails } from '@/lib/dal/slips';
import { MarinaMap } from '@/components/marina-map/marina-map';
import { getSession } from '@/lib/auth';

export default async function MarinaPage() {
  const session = await getSession();
  const slipsData = await getSlipsWithDetails();

  return (
    <div className="space-y-6">
      <h1>Marina Map</h1>
      <MarinaMap
        slips={slipsData}
        userRole={session.role}
      />
    </div>
  );
}
```

### Pattern 3: Optimistic Status Update with Server Action
**What:** When admin/staff changes slip status, update the UI immediately (optimistic), call Server Action, revert on error.
**When to use:** SLIP-03 status change flow.
**Example:**
```typescript
// src/app/actions/slip-actions.ts
'use server';

import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { slips } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function changeSlipStatus(
  slipId: number,
  newStatus: 'available' | 'occupied' | 'reserved' | 'maintenance',
  notes?: string
) {
  const session = await getSession();
  if (!session.isLoggedIn || !['admin', 'dock_staff'].includes(session.role)) {
    throw new Error('Unauthorized');
  }

  await db.update(slips)
    .set({ status: newStatus, notes: notes ?? null })
    .where(eq(slips.id, slipId));

  revalidatePath('/marina');
  revalidatePath('/operations');
}
```

### Pattern 4: SVG Color Mapping from Status
**What:** A single config object maps slip status to fill colors, using the nautical theme palette.
**When to use:** Every slip rendering.
**Example:**
```typescript
// src/components/marina-map/map-constants.ts
export const STATUS_COLORS = {
  available:   { fill: '#22c55e', hover: '#16a34a', label: 'Available' },
  occupied:    { fill: '#3b82f6', hover: '#2563eb', label: 'Occupied' },
  reserved:    { fill: '#eab308', hover: '#ca8a04', label: 'Reserved' },
  maintenance: { fill: '#ef4444', hover: '#dc2626', label: 'Maintenance' },
} as const;
```

### Anti-Patterns to Avoid
- **Hardcoded SVG coordinates:** Never put `<rect x="150" y="200" .../>` directly in components. All positions must come from `computeMarinaLayout()`.
- **Fat Client Component:** Don't make the entire marina page a Client Component. Keep the page as Server Component, only the `<MarinaMap>` interactive piece is `"use client"`.
- **Fetching data in Client Component:** Don't use `useEffect` + `fetch` to load slip data. Pass it as props from the Server Component parent.
- **Global state for selected slip:** Use local `useState` in MarinaMap, not a context/store. The selected slip is ephemeral UI state.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slide-out detail panel | Custom CSS drawer | shadcn Sheet (already installed) | Handles animation, overlay, close-on-outside-click, keyboard escape, focus trap |
| Hover tooltip | Custom positioned div | shadcn Tooltip (already installed) | Handles positioning, arrow, delay, accessibility |
| Status badges | Styled spans | shadcn Badge (already installed) | Consistent with rest of app, variant support |
| Scroll overflow in panel | Custom scroll | shadcn ScrollArea (already installed) | Custom scrollbar styling, consistent UX |
| Confirmation dialog | window.confirm | shadcn AlertDialog (add if needed) | Accessible, themed, professional |

**Key insight:** All interactive UI primitives are already installed from Phase 1. The only custom code needed is the SVG rendering and layout computation.

## Common Pitfalls

### Pitfall 1: SVG viewBox Coordinate Confusion
**What goes wrong:** Mixing SVG viewBox coordinates with pixel coordinates. The SVG renders at wrong sizes or elements appear misplaced on different screen sizes.
**Why it happens:** SVG has its own coordinate system (viewBox) separate from CSS pixels. Developers use pixel values inside the SVG when they should use viewBox-relative values.
**How to avoid:** Set a fixed `viewBox="0 0 1200 700"` (or similar). All internal coordinates are in this 1200x700 space. The SVG scales automatically via CSS `width: 100%`. Never use pixel units inside the SVG.
**Warning signs:** Map looks different size on mobile vs desktop. Elements overlap when window resizes.

### Pitfall 2: SVG Event Handling in React
**What goes wrong:** Click events on SVG `<rect>` elements don't fire, or events bubble incorrectly causing the wrong slip to be selected.
**Why it happens:** SVG event model differs from HTML. `<g>` elements with `pointer-events: none` on children, or overlapping elements intercepting clicks.
**How to avoid:** Put `onClick` on the outermost `<g>` of each slip group. Use `pointer-events="all"` on interactive elements. Use `e.stopPropagation()` if needed to prevent dock-level click from interfering.
**Warning signs:** Clicking a slip doesn't open the panel. Clicking between slips opens the wrong one.

### Pitfall 3: Sheet Component State vs SVG Selection State
**What goes wrong:** The Sheet (detail panel) state and the selected slip state get out of sync. Closing the sheet doesn't clear the selected slip highlight, or selecting a new slip doesn't update the sheet content.
**Why it happens:** Two separate state variables (`selectedSlipId` and `isSheetOpen`) that need to stay synchronized.
**How to avoid:** Derive sheet open state from selected slip: `const isSheetOpen = selectedSlipId !== null`. When Sheet closes (onOpenChange), set `selectedSlipId` to null. Single source of truth.
**Warning signs:** Stale data in panel after clicking a different slip. Panel stays open with no slip highlighted.

### Pitfall 4: Responsive SVG Overflow on Small Screens
**What goes wrong:** The SVG map overflows its container on tablet/mobile, causing horizontal scroll. Or the map shrinks so small that slip labels are unreadable.
**Why it happens:** SVG with `width: 100%` and a landscape viewBox will shrink very small on portrait tablet screens.
**How to avoid:** Use `preserveAspectRatio="xMidYMid meet"` so the SVG maintains aspect ratio. Add a minimum height. On small screens, consider horizontal scroll with `overflow-x: auto` as intentional (the map is inherently landscape). Test at 768px width (iPad portrait).
**Warning signs:** Labels become unreadable below certain widths.

### Pitfall 5: Drizzle Relational Query N+1 for Bookings
**What goes wrong:** Loading 60 slips and then individually querying bookings for each occupied slip, resulting in 60+ database queries.
**Why it happens:** Naively loading slip data then lazy-loading booking details on click.
**How to avoid:** Use a single Drizzle relational query that loads slips with their current booking and vessel info: `db.query.slips.findMany({ with: { dock: true, bookings: { with: { vessel: true, boater: true }, limit: 5, orderBy: desc(bookings.createdAt) } } })`. Load everything upfront in the Server Component.
**Warning signs:** Slow page load, multiple database queries visible in logs.

## Code Examples

### SVG Marina Map Container
```typescript
// src/components/marina-map/marina-map.tsx
'use client';

import { useState, useMemo } from 'react';
import { DockSection } from './dock-section';
import { SlipDetailPanel } from './slip-detail-panel';
import { MapLegend } from './map-legend';
import { computeMarinaLayout } from './map-layout';
import type { SlipWithDetails } from '@/lib/dal/slips';

interface MarinaMapProps {
  slips: SlipWithDetails[];
  userRole: 'admin' | 'dock_staff' | 'boater';
}

export function MarinaMap({ slips, userRole }: MarinaMapProps) {
  const [selectedSlipId, setSelectedSlipId] = useState<number | null>(null);
  const [highlightedDock, setHighlightedDock] = useState<string | null>(null);

  const layout = useMemo(() => computeMarinaLayout(slips), [slips]);
  const selectedSlip = slips.find(s => s.id === selectedSlipId) ?? null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Water background */}
        <defs>
          <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0c4a6e" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#water)" rx="8" />

        {/* Main walkway */}
        <rect x="0" y={layout.viewBox.height - 50}
              width={layout.viewBox.width} height="50"
              fill="#78716c" rx="2" />

        {/* Dock sections */}
        {layout.docks.map(dock => (
          <DockSection
            key={dock.dockId}
            dock={dock}
            selectedSlipId={selectedSlipId}
            highlightedDock={highlightedDock}
            onSlipClick={setSelectedSlipId}
            onDockLabelClick={setHighlightedDock}
          />
        ))}
      </svg>

      <MapLegend />

      <SlipDetailPanel
        slip={selectedSlip}
        userRole={userRole}
        onClose={() => setSelectedSlipId(null)}
      />
    </div>
  );
}
```

### Drizzle Relational Query for Slips
```typescript
// src/lib/dal/slips.ts
import { db } from '@/db';
import { desc } from 'drizzle-orm';
import { bookings } from '@/db/schema';

export async function getSlipsWithDetails() {
  return db.query.slips.findMany({
    with: {
      dock: true,
      bookings: {
        with: { vessel: true, boater: true },
        limit: 5,
        orderBy: [desc(bookings.startDate)],
      },
    },
  });
}

export type SlipWithDetails = Awaited<ReturnType<typeof getSlipsWithDetails>>[number];
```

### SVG Slip Element with Hover + Click
```typescript
// src/components/marina-map/slip-element.tsx
'use client';

import { STATUS_COLORS } from './map-constants';
import type { SlipLayout } from './map-layout';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface SlipElementProps {
  slip: SlipLayout;
  isSelected: boolean;
  isDimmed: boolean;
  onClick: () => void;
}

export function SlipElement({ slip, isSelected, isDimmed, onClick }: SlipElementProps) {
  const colors = STATUS_COLORS[slip.status as keyof typeof STATUS_COLORS];

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <g
            onClick={onClick}
            className="cursor-pointer transition-opacity duration-200"
            style={{ opacity: isDimmed ? 0.3 : 1 }}
          >
            <rect
              x={slip.x}
              y={slip.y}
              width={slip.width}
              height={slip.height}
              fill={colors.fill}
              stroke={isSelected ? '#ffffff' : 'transparent'}
              strokeWidth={isSelected ? 2 : 0}
              rx={2}
              className="transition-colors duration-200 hover:brightness-90"
            />
            <text
              x={slip.x + slip.width / 2}
              y={slip.y + slip.height / 2}
              textAnchor="middle"
              dominantBaseline="central"
              className="pointer-events-none fill-white text-[8px] font-medium"
            >
              {slip.number.split('-')[1]}
            </text>
          </g>
        }
      />
      <TooltipContent>
        <div className="text-xs">
          <div className="font-medium">Slip {slip.number}</div>
          <div>{colors.label}</div>
          {slip.vesselName && <div className="text-muted-foreground">{slip.vesselName}</div>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
```

### Detail Panel with Role-Based Actions
```typescript
// src/components/marina-map/slip-detail-panel.tsx
'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { changeSlipStatus } from '@/app/actions/slip-actions';
import type { SlipWithDetails } from '@/lib/dal/slips';

interface SlipDetailPanelProps {
  slip: SlipWithDetails | null;
  userRole: 'admin' | 'dock_staff' | 'boater';
  onClose: () => void;
}

export function SlipDetailPanel({ slip, userRole, onClose }: SlipDetailPanelProps) {
  const isOpen = slip !== null;
  const canChangeStatus = userRole === 'admin' || userRole === 'dock_staff';

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right">
        {slip && (
          <>
            <SheetHeader>
              <SheetTitle>Slip {slip.number}</SheetTitle>
              <Badge>{slip.status}</Badge>
            </SheetHeader>

            {/* Slip dimensions */}
            <div className="p-4 text-sm">
              {slip.maxLength}ft L x {slip.maxBeam}ft W x {slip.maxDraft}ft D
            </div>

            {/* Current vessel (if occupied) */}
            {slip.bookings[0]?.vessel && (
              <Card>
                <CardHeader><CardTitle>Current Vessel</CardTitle></CardHeader>
                <CardContent>{slip.bookings[0].vessel.name}</CardContent>
              </Card>
            )}

            {/* Booking history */}
            <ScrollArea className="h-48">
              {/* Last 5 bookings */}
            </ScrollArea>

            {/* Status change (admin/staff only) */}
            {canChangeStatus && (
              <div className="p-4">
                {/* DropdownMenu with status options + confirmation dialog */}
              </div>
            )}

            {/* Book this slip CTA (for available slips) */}
            {slip.status === 'available' && (
              <Button disabled className="w-full">
                Book this Slip (Coming in Phase 3)
              </Button>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| External SVG files imported as components | Inline JSX SVG with React state | React 16+ (standard now) | Full interactivity control, no import complexity |
| useEffect + fetch for data | Server Components pass props | Next.js 13+ App Router | Faster load, simpler code, no loading spinners |
| Client-side status updates via API routes | Server Actions with revalidatePath | Next.js 14+ | Direct mutation, automatic cache invalidation |
| Radix UI primitives in shadcn | base-ui primitives in shadcn v4 | 2025 (shadcn v4) | Sheet uses Dialog from @base-ui/react, render prop pattern |

**Note on shadcn v4 + base-ui:** The Sheet component in this project uses `@base-ui/react/dialog` (not Radix). The render prop pattern (`render={<Component />}`) is used for polymorphic components instead of `asChild`. This was established in Phase 1.

## Open Questions

1. **Tooltip inside SVG with shadcn**
   - What we know: shadcn Tooltip uses base-ui Tooltip which renders as HTML portal. Wrapping SVG `<g>` elements with TooltipTrigger requires the render prop pattern.
   - What's unclear: Whether base-ui Tooltip.Trigger properly handles SVG group elements as trigger targets, or if we need a native SVG `<title>` fallback.
   - Recommendation: Try shadcn Tooltip with render prop on SVG `<g>` first. If it doesn't work well (positioning issues), fall back to a custom hover state that shows a positioned HTML div overlay. The render prop approach was successfully used in Phase 1 for other polymorphic components.

2. **Exact dock proportions for visual appeal**
   - What we know: 4 docks with different slip counts (20, 15, 15, 10) and sizes (small to XL). Left side: A+B, right side: C+D.
   - What's unclear: The exact spacing and proportions that look good in a 1200x700 viewBox.
   - Recommendation: Start with proportional sizing (dock width based on slip count, slip rect size based on maxLength range). Iterate visually. The layout function makes this easy to adjust.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (already configured) |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MAP-01 | SVG renders 4 docks with correct slip counts | unit | `npx vitest run src/__tests__/marina-map.test.ts -t "renders 4 docks"` | Wave 0 |
| MAP-02 | Slips color-coded by status | unit | `npx vitest run src/__tests__/marina-map.test.ts -t "status colors"` | Wave 0 |
| MAP-03 | Click slip opens detail panel | unit | `npx vitest run src/__tests__/slip-detail.test.ts -t "opens panel"` | Wave 0 |
| MAP-04 | Layout computed from data, not hardcoded | unit | `npx vitest run src/__tests__/map-layout.test.ts -t "computes layout"` | Wave 0 |
| MAP-05 | SVG has viewBox and preserveAspectRatio | unit | `npx vitest run src/__tests__/marina-map.test.ts -t "responsive"` | Wave 0 |
| SLIP-03 | Status change via Server Action | unit | `npx vitest run src/__tests__/slip-actions.test.ts -t "changes status"` | Wave 0 |
| UX-04 | Map is prominently displayed | manual-only | Visual inspection | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/map-layout.test.ts` -- covers MAP-04 (pure function, most testable)
- [ ] `src/__tests__/slip-actions.test.ts` -- covers SLIP-03 (Server Action with DB)
- [ ] Component tests for MAP-01, MAP-02, MAP-03, MAP-05 may need jsdom environment or React Testing Library -- assess during planning whether unit tests on the pure layout function + integration test on the Server Action provide sufficient Nyquist coverage without the overhead of component rendering tests for SVG.

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/db/schema.ts` -- slip/dock schema with status enum, dimensions, relations
- Project codebase: `src/components/ui/sheet.tsx` -- base-ui Dialog-based Sheet with render prop pattern
- Project codebase: `src/components/ui/tooltip.tsx` -- base-ui Tooltip with Provider, positioned popup
- Project codebase: `src/db/seed.ts` -- deterministic status distribution: 24 occupied, 12 reserved, 18 available, 6 maintenance
- Project codebase: `src/lib/auth.ts` -- iron-session with role in SessionData
- Project codebase: `src/db/index.ts` -- WAL mode enabled, foreign keys on

### Secondary (MEDIUM confidence)
- `.planning/research/ARCHITECTURE.md` -- Server Component + Client Island pattern for map
- `.planning/research/PITFALLS.md` -- Pitfall 3: SVG map must be data-driven from day one
- `.planning/research/STACK.md` -- Inline React SVG recommended over D3/Canvas

### Tertiary (LOW confidence)
- SVG viewBox + preserveAspectRatio responsive behavior -- based on training knowledge of SVG spec, well-established standard

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all components already installed, no new dependencies
- Architecture: HIGH -- patterns established in Phase 1, SVG rendering is well-understood React pattern
- Pitfalls: HIGH -- SVG coordinate confusion and event handling are well-documented issues
- Layout computation: MEDIUM -- exact proportions need visual iteration, but the data-driven approach is sound

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable -- no fast-moving dependencies)
